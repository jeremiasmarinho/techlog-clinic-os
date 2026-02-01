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
                        [
                            name,
                            slug,
                            status || 'active',
                            plan_tier || 'basic',
                            owner_email,
                            owner_phone,
                        ],
                        function (clinicErr: Error | null) {
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
                                function (userErr: Error | null) {
                                    if (userErr) {
                                        // Rollback: Delete clinic if user creation fails
                                        db.run('DELETE FROM clinics WHERE id = ?', [clinicId]);
                                        res.status(500).json({
                                            error:
                                                'Erro ao criar usuário admin: ' + userErr.message,
                                        });
                                        return;
                                    }

                                    console.log(
                                        `✅ Clínica "${name}" criada (ID: ${clinicId}) com admin "${admin.username}"`
                                    );

                                    res.status(201).json({
                                        message: 'Clínica criada com sucesso',
                                        clinic: {
                                            id: clinicId,
                                            name,
                                            slug,
                                            status: status || 'active',
                                            plan_tier: plan_tier || 'basic',
                                        },
                                        admin: {
                                            id: this.lastID,
                                            username: admin.username,
                                            name: admin.name,
                                        },
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

        if (!['active', 'trial', 'inactive', 'suspended', 'cancelled'].includes(status)) {
            res.status(400).json({ error: 'Status inválido' });
            return;
        }

        db.run(
            'UPDATE clinics SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, id],
            function (err) {
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

        db.get(`SELECT * FROM clinics WHERE id = ?`, [id], (err, row) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            if (!row) {
                res.status(404).json({ error: 'Clínica não encontrada' });
                return;
            }

            res.json(row);
        });
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
            function (err) {
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

        db.run('DELETE FROM clinics WHERE id = ?', [id], function (err) {
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

    /**
     * List upgrade requests
     * GET /api/saas/upgrade-requests
     */
    static listUpgradeRequests(_req: Request, res: Response): void {
        db.all(
            `SELECT 
                ur.id,
                ur.clinic_id,
                c.name as clinic_name,
                ur.current_plan,
                ur.requested_plan,
                ur.status,
                ur.notes,
                ur.created_at
             FROM upgrade_requests ur
             LEFT JOIN clinics c ON c.id = ur.clinic_id
             ORDER BY ur.created_at DESC`,
            [],
            (err, rows) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json(rows || []);
            }
        );
    }

    /**
     * Update upgrade request status
     * PATCH /api/saas/upgrade-requests/:id
     */
    static updateUpgradeRequest(req: Request, res: Response): void {
        const { id } = req.params;
        const { status } = req.body;

        if (!['approved', 'rejected'].includes(status)) {
            res.status(400).json({ error: 'Status inválido' });
            return;
        }

        db.get(
            'SELECT id, clinic_id, requested_plan FROM upgrade_requests WHERE id = ?',
            [id],
            (err, row: any) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }

                if (!row) {
                    res.status(404).json({ error: 'Solicitação não encontrada' });
                    return;
                }

                const applyPlan = status === 'approved';

                const finalize = () => {
                    db.run(
                        'UPDATE upgrade_requests SET status = ? WHERE id = ?',
                        [status, id],
                        function (updateErr) {
                            if (updateErr) {
                                res.status(500).json({ error: updateErr.message });
                                return;
                            }
                            res.json({ message: 'Solicitação atualizada', status });
                        }
                    );
                };

                if (!applyPlan) {
                    finalize();
                    return;
                }

                db.run(
                    'UPDATE clinics SET plan_tier = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [row.requested_plan, row.clinic_id],
                    function (planErr) {
                        if (planErr) {
                            res.status(500).json({ error: planErr.message });
                            return;
                        }
                        finalize();
                    }
                );
            }
        );
    }

    /**
     * List audit logs (Super Admin)
     * GET /api/saas/audit-logs
     */
    static listAuditLogs(req: Request, res: Response): void {
        const clinicId = req.query.clinicId ? Number(req.query.clinicId) : null;
        const userId = req.query.userId ? Number(req.query.userId) : null;
        const limit = req.query.limit ? Number(req.query.limit) : 100;

        const where: string[] = [];
        const params: Array<number> = [];

        if (clinicId) {
            where.push('clinic_id = ?');
            params.push(clinicId);
        }

        if (userId) {
            where.push('user_id = ?');
            params.push(userId);
        }

        const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

        db.all(
            `SELECT * FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT ?`,
            [...params, limit],
            (err, rows) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json(rows || []);
            }
        );
    }

    /**
     * Export audit logs as CSV
     * GET /api/saas/audit-logs/export
     */
    static exportAuditLogsCsv(req: Request, res: Response): void {
        const clinicId = req.query.clinicId ? Number(req.query.clinicId) : null;
        const userId = req.query.userId ? Number(req.query.userId) : null;
        const limit = req.query.limit ? Number(req.query.limit) : 1000;

        const where: string[] = [];
        const params: Array<number> = [];

        if (clinicId) {
            where.push('clinic_id = ?');
            params.push(clinicId);
        }

        if (userId) {
            where.push('user_id = ?');
            params.push(userId);
        }

        const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

        db.all(
            `SELECT * FROM audit_logs ${whereClause} ORDER BY created_at DESC LIMIT ?`,
            [...params, limit],
            (err, rows: any[]) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }

                const headers = [
                    'id',
                    'clinic_id',
                    'user_id',
                    'user_role',
                    'action',
                    'path',
                    'method',
                    'status_code',
                    'ip_address',
                    'details',
                    'created_at',
                ];

                const escapeCsv = (value: any) => {
                    if (value === null || value === undefined) return '';
                    const str = String(value).replace(/\r?\n/g, ' ');
                    if (/[",]/.test(str)) {
                        return `"${str.replace(/"/g, '""')}"`;
                    }
                    return str;
                };

                const lines = [headers.join(',')].concat(
                    (rows || []).map((row) => headers.map((h) => escapeCsv(row[h])).join(','))
                );

                const csv = lines.join('\n');
                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Content-Disposition', 'attachment; filename="audit_logs.csv"');
                res.send(csv);
            }
        );
    }

    /**
     * Cross-tenant analytics
     * GET /api/saas/analytics
     */
    static getAnalytics(_req: Request, res: Response): void {
        db.get(
            `SELECT 
                (SELECT COUNT(*) FROM clinics) as total_clinics,
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM leads) as total_leads,
                (SELECT COUNT(*) FROM patients) as total_patients,
                (SELECT COUNT(*) FROM appointments) as total_appointments`,
            [],
            (err, totals: any) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }

                db.all(
                    `SELECT plan_tier, COUNT(*) as count FROM clinics GROUP BY plan_tier`,
                    [],
                    (planErr, planRows) => {
                        if (planErr) {
                            res.status(500).json({ error: planErr.message });
                            return;
                        }

                        db.all(
                            `SELECT status, COUNT(*) as count FROM clinics GROUP BY status`,
                            [],
                            (statusErr, statusRows) => {
                                if (statusErr) {
                                    res.status(500).json({ error: statusErr.message });
                                    return;
                                }

                                db.all(
                                    `SELECT 
                                        c.id,
                                        c.name,
                                        c.slug,
                                        c.plan_tier,
                                        c.status,
                                        (SELECT COUNT(*) FROM leads WHERE clinic_id = c.id) as lead_count,
                                        (SELECT COUNT(*) FROM users WHERE clinic_id = c.id) as user_count
                                     FROM clinics c
                                     ORDER BY lead_count DESC
                                     LIMIT 10`,
                                    [],
                                    (topErr, topRows) => {
                                        if (topErr) {
                                            res.status(500).json({ error: topErr.message });
                                            return;
                                        }

                                        res.json({
                                            totals: totals || {},
                                            plans: planRows || [],
                                            statuses: statusRows || [],
                                            top_clinics: topRows || [],
                                        });
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    }

    /**
     * Export analytics as CSV
     * GET /api/saas/analytics/export
     */
    static exportAnalyticsCsv(_req: Request, res: Response): void {
        this.getAnalytics(_req, {
            ...res,
            json: (data: any) => {
                const escapeCsv = (value: any) => {
                    if (value === null || value === undefined) return '';
                    const str = String(value).replace(/\r?\n/g, ' ');
                    if (/[",]/.test(str)) {
                        return `"${str.replace(/"/g, '""')}"`;
                    }
                    return str;
                };

                const lines: string[] = [];

                lines.push('SECTION,KEY,VALUE');
                Object.entries(data.totals || {}).forEach(([key, value]) => {
                    lines.push(['totals', key, escapeCsv(value)].join(','));
                });

                lines.push('');
                lines.push('SECTION,PLAN_TIER,COUNT');
                (data.plans || []).forEach((row: any) => {
                    lines.push(['plans', escapeCsv(row.plan_tier), escapeCsv(row.count)].join(','));
                });

                lines.push('');
                lines.push('SECTION,STATUS,COUNT');
                (data.statuses || []).forEach((row: any) => {
                    lines.push(['statuses', escapeCsv(row.status), escapeCsv(row.count)].join(','));
                });

                lines.push('');
                lines.push('SECTION,CLINIC_ID,NAME,SLUG,PLAN_TIER,STATUS,LEAD_COUNT,USER_COUNT');
                (data.top_clinics || []).forEach((row: any) => {
                    lines.push(
                        [
                            'top_clinics',
                            escapeCsv(row.id),
                            escapeCsv(row.name),
                            escapeCsv(row.slug),
                            escapeCsv(row.plan_tier),
                            escapeCsv(row.status),
                            escapeCsv(row.lead_count),
                            escapeCsv(row.user_count),
                        ].join(',')
                    );
                });

                const csv = lines.join('\n');
                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Content-Disposition', 'attachment; filename="analytics.csv"');
                return res.send(csv);
            },
        } as Response);
    }
}
