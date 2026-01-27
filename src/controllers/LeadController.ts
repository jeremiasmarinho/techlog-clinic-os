import { Request, Response } from 'express';
import sqlite3 from 'sqlite3';
import { db } from '../database';

export class LeadController {
    
    // Listar (GET) - Protegido por authMiddleware
    static index(req: Request, res: Response): void {
        const view = req.query.view as string;
        const showArchived = req.query.show_archived === 'true';

        let query = "SELECT * FROM leads WHERE status != 'archived' ORDER BY created_at DESC";
        
        // If show_archived=true: Return ONLY archived leads
        if (showArchived) {
            query = "SELECT * FROM leads WHERE status = 'archived' ORDER BY created_at DESC";
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
        
        db.all(query, [], (err, rows) => {
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
        const { status, appointment_date, doctor, notes } = req.body;

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

                        res.json({
                            total: totalRow.total,
                            byStatus: statusRows,
                            byType: typeRows,
                            history: historyRows.reverse() // Inverter para ordem cronológica
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

        db.run("UPDATE leads SET status = 'archived' WHERE id = ?", [id], function(err) {
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