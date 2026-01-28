import { Request, Response } from 'express';
import sqlite3 from 'sqlite3';
import { db } from '../database';
import { updateLeadSchema } from '../validators/lead.validator';

export class LeadController {
    
    // Listar (GET) - Protegido por authMiddleware
    static index(req: Request, res: Response): void {
        const view = req.query.view as string;
        const showArchived = req.query.show_archived === 'true';
        const date = req.query.date as string; // Para agenda: YYYY-MM-DD
        const doctor = req.query.doctor as string; // Filtro por profissional

        let query = "SELECT * FROM leads WHERE status != 'archived' ORDER BY created_at DESC";
        const params: any[] = [];
        
        // If show_archived=true: Return ONLY archived leads
        if (showArchived) {
            query = "SELECT * FROM leads WHERE status = 'archived' ORDER BY created_at DESC";
        }
        // If view=agenda: Return leads with appointment_date for specific date or today
        else if (view === 'agenda') {
            const targetDate = date || new Date().toISOString().split('T')[0];
            query = `
                SELECT * FROM leads 
                WHERE date(appointment_date) = date(?)
                  AND status != 'archived'
                ${doctor ? "AND doctor = ?" : ""}
                ORDER BY appointment_date ASC
            `;
            params.push(targetDate);
            if (doctor) params.push(doctor);
        }
        // If view=kanban: Return active leads + finalized leads from last 24 hours only (exclude archived)
        else if (view === 'kanban') {
            query = `
                SELECT * FROM leads 
                WHERE status != 'archived'
                  AND (status != 'Finalizado' 
                   OR (status = 'Finalizado' AND datetime(created_at) >= datetime('now', '-1 day')))
                ORDER BY created_at DESC
            `;
        }
        
        db.all(query, params, (err, rows) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json(rows);
        });
    }

    // Atualizar Status (PATCH) - Protegido por authMiddleware
    static update(req: Request, res: Response): void {
        const { id } = req.params;
        
        // Validar com Joi
        const { error, value } = updateLeadSchema.validate(req.body);
        if (error) {
            res.status(400).json({ error: error.details[0].message });
            return;
        }

        const { status, appointment_date, doctor, notes, type, attendance_status, archive_reason } = value;

        // Construir query dinâmica baseada nos campos enviados
        const updates: string[] = [];
        const values: any[] = [];

        if (status !== undefined) {
            updates.push('status = ?');
            values.push(status);
        }
        if (appointment_date !== undefined) {
            updates.push('appointment_date = ?');
            values.push(appointment_date);
        }
        if (doctor !== undefined) {
            updates.push('doctor = ?');
            values.push(doctor);
        }
        if (notes !== undefined) {
            updates.push('notes = ?');
            values.push(notes);
        }
        if (type !== undefined) {
            updates.push('type = ?');
            values.push(type);
        }
        if (attendance_status !== undefined) {
            updates.push('attendance_status = ?');
            values.push(attendance_status);
        }
        if (archive_reason !== undefined) {
            updates.push('archive_reason = ?');
            values.push(archive_reason);
        }

        if (updates.length === 0) {
            res.status(400).json({ error: 'Nenhum campo para atualizar' });
            return;
        }

        values.push(id);
        const query = `UPDATE leads SET ${updates.join(', ')} WHERE id = ?`;

        db.run(query, values, function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Lead atualizado!', changes: this.changes });
        });
    }

    // Deletar (DELETE) - Protegido por authMiddleware
    static delete(req: Request, res: Response): void {
        const { id } = req.params;

        db.run("DELETE FROM leads WHERE id = ?", [id], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Lead removido.', changes: this.changes });
        });
    }

    // Dashboard Métricas (GET) - Protegido por authMiddleware
    static metrics(_req: Request, res: Response): void {

        // Total de leads
        db.get("SELECT COUNT(*) as total FROM leads", [], (err, totalRow: any) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            // Leads por status
            db.all("SELECT status, COUNT(*) as count FROM leads GROUP BY status", [], (err, statusRows: any[]) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }

                // Leads por tipo
                db.all("SELECT type, COUNT(*) as count FROM leads GROUP BY type", [], (err, typeRows: any[]) => {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }

                    // Histórico dos últimos 7 dias
                    db.all("SELECT date(created_at) as date, COUNT(*) as count FROM leads GROUP BY date(created_at) ORDER BY date(created_at) DESC LIMIT 7", [], (err, historyRows: any[]) => {
                        if (err) {
                            res.status(500).json({ error: err.message });
                            return;
                        }

                        // Leads por resultado de atendimento (attendance_status)
                        db.all("SELECT attendance_status, COUNT(*) as count FROM leads WHERE attendance_status IS NOT NULL GROUP BY attendance_status", [], (err, attendanceRows: any[]) => {
                            if (err) {
                                res.status(500).json({ error: err.message });
                                return;
                            }

                            res.json({
                                total: totalRow.total,
                                byStatus: statusRows,
                                byType: typeRows,
                                byAttendanceStatus: attendanceRows,
                                history: historyRows.reverse() // Inverter para ordem cronológica
                            });
                        });
                    });
                });
            });
        });
    }

    // Criar (POST) - Público
    static create(req: Request, res: Response): void {
        const { name, phone, type } = req.body;
        
        if (!name || !phone) {
            res.status(400).json({ error: 'Nome e Telefone são obrigatórios' });
            return;
        }

        const stmt = db.prepare("INSERT INTO leads (name, phone, type) VALUES (?, ?, ?)");
        stmt.run(name, phone, type || 'geral', function(this: sqlite3.RunResult, err: Error | null) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ 
                id: this.lastID, 
                message: 'Lead salvo com sucesso!'
            });
        });
        stmt.finalize();
    }

    // Arquivar (PUT) - Protegido por authMiddleware
    static archive(req: Request, res: Response): void {
        const { id } = req.params;
        const { archive_reason } = req.body;

        let query = "UPDATE leads SET status = 'archived'";
        const params: any[] = [];
        
        if (archive_reason) {
            query += ", archive_reason = ?";
            params.push(archive_reason);
        }
        
        query += " WHERE id = ?";
        params.push(id);

        db.run(query, params, function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Lead arquivado com sucesso!', changes: this.changes });
        });
    }

    // Desarquivar (PUT) - Protegido por authMiddleware
    static unarchive(req: Request, res: Response): void {
        const { id } = req.params;

        db.run("UPDATE leads SET status = 'novo' WHERE id = ?", [id], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Lead restaurado com sucesso!', changes: this.changes });
        });
    }
}