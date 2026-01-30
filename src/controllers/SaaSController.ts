import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { db } from '../database';

export class SaaSController {
    
    /**
     * List all clinics (Super Admin only)
     * GET /api/saas/clinics
     */
    static listClinics(_req: Request, res: Response): void {
        db.all(
            `SELECT 
                id, name, slug, status, plan_tier, 
                owner_email, owner_phone, created_at, updated_at
             FROM clinics 
             ORDER BY created_at DESC`,
            [],
            (err, rows) => {
                if (err) {
                    console.error('❌ Erro ao listar clínicas:', err.message);
                    res.status(500).json({ error: err.message });
                    return;
                }
                
                console.log(`✅ Listando ${rows.length} clínicas para Super Admin`);
                res.json(rows);
            }
        );
    }

    /**
     * Create new clinic with admin user
     * POST /api/saas/clinics
     */
    static async createClinic(req: Request, res: Response): Promise<void> {
        const { name, slug, plan_tier, status, owner_email, owner_phone, admin } = req.body;

        // Validation
        if (!name || !slug || !admin?.name || !admin?.username || !admin?.password) {
            res.status(400).json({ error: 'Campos obrigatórios faltando' });
            return;
        }

        // Check if slug already exists
        db.get('SELECT id FROM clinics WHERE slug = ?', [slug], async (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            if (row) {
                res.status(409).json({ error: 'Este slug já está em uso' });
                return;
            }

            try {
                // Hash admin password
                const hashedPassword = await bcrypt.hash(admin.password, 10);

                // Start transaction: Create clinic + admin user
                db.serialize(() => {
                    // 1. Create clinic
                    db.run(
                        `INSERT INTO clinics (name, slug, status, plan_tier, owner_email, owner_phone) 
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [name, slug, status || 'active', plan_tier || 'free', owner_email, owner_phone],
                        function(clinicErr: Error | null) {
                            if (clinicErr) {
                                res.status(500).json({ error: clinicErr.message });
                                return;
                            }

                            const clinicId = this.lastID;

                            // 2. Create admin user for this clinic
                            db.run(
                                `INSERT INTO users (name, username, password, role, clinic_id, is_owner) 
                                 VALUES (?, ?, ?, 'clinic_admin', ?, 1)`,
                                [admin.name, admin.username, hashedPassword, clinicId],
                                function(userErr: Error | null) {
                                    if (userErr) {
                                        // Rollback: Delete clinic if user creation fails
                                        db.run('DELETE FROM clinics WHERE id = ?', [clinicId]);
                                        res.status(500).json({ error: 'Erro ao criar usuário admin: ' + userErr.message });
                                        return;
                                    }

                                    console.log(`✅ Clínica "${name}" criada (ID: ${clinicId}) com admin "${admin.username}"`);
                                    
                                    res.status(201).json({
                                        message: 'Clínica criada com sucesso',
                                        clinic: {
                                            id: clinicId,
                                            name,
                                            slug,
                                            status: status || 'active',
                                            plan_tier: plan_tier || 'free'
                                        },
                                        admin: {
                                            id: this.lastID,
                                            username: admin.username,
                                            name: admin.name
                                        }
                                    });
                                }
                            );
                        }
                    );
                });

            } catch (error: any) {
                console.error('❌ Erro ao criar clínica:', error.message);
                res.status(500).json({ error: error.message });
            }
        });
    }

    /**
     * Update clinic status
     * PATCH /api/saas/clinics/:id/status
     */
    static updateClinicStatus(req: Request, res: Response): void {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'inactive', 'suspended'].includes(status)) {
            res.status(400).json({ error: 'Status inválido' });
            return;
        }

        db.run(
            'UPDATE clinics SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, id],
            function(err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }

                if (this.changes === 0) {
                    res.status(404).json({ error: 'Clínica não encontrada' });
                    return;
                }

                console.log(`✅ Status da clínica #${id} atualizado para "${status}"`);
                res.json({ message: 'Status atualizado com sucesso', changes: this.changes });
            }
        );
    }

    /**
     * Get clinic details
     * GET /api/saas/clinics/:id
     */
    static getClinic(req: Request, res: Response): void {
        const { id } = req.params;

        db.get(
            `SELECT * FROM clinics WHERE id = ?`,
            [id],
            (err, row) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }

                if (!row) {
                    res.status(404).json({ error: 'Clínica não encontrada' });
                    return;
                }

                res.json(row);
            }
        );
    }

    /**
     * Update clinic details
     * PATCH /api/saas/clinics/:id
     */
    static updateClinic(req: Request, res: Response): void {
        const { id } = req.params;
        const { name, plan_tier, owner_email, owner_phone } = req.body;

        db.run(
            `UPDATE clinics 
             SET name = COALESCE(?, name),
                 plan_tier = COALESCE(?, plan_tier),
                 owner_email = COALESCE(?, owner_email),
                 owner_phone = COALESCE(?, owner_phone),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
            [name, plan_tier, owner_email, owner_phone, id],
            function(err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }

                if (this.changes === 0) {
                    res.status(404).json({ error: 'Clínica não encontrada' });
                    return;
                }

                res.json({ message: 'Clínica atualizada com sucesso', changes: this.changes });
            }
        );
    }

    /**
     * Delete clinic (dangerous - use with caution)
     * DELETE /api/saas/clinics/:id
     */
    static deleteClinic(req: Request, res: Response): void {
        const { id } = req.params;

        // Prevent deletion of default clinic
        if (id === '1') {
            res.status(403).json({ error: 'Não é possível deletar a clínica padrão' });
            return;
        }

        db.run('DELETE FROM clinics WHERE id = ?', [id], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            if (this.changes === 0) {
                res.status(404).json({ error: 'Clínica não encontrada' });
                return;
            }

            console.log(`⚠️  Clínica #${id} deletada`);
            res.json({ message: 'Clínica deletada com sucesso' });
        });
    }

    /**
     * Get system statistics
     * GET /api/saas/stats
     */
    static getStats(_req: Request, res: Response): void {
        db.get(
            `SELECT 
                COUNT(*) as total_clinics,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_clinics,
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM leads) as total_leads
             FROM clinics`,
            [],
            (err, row) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json(row);
            }
        );
    }
}
