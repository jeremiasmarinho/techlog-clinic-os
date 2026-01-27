import { Request, Response } from 'express';
import sqlite3 from 'sqlite3';
import { db } from '../database';

const SENHA_MESTRA = "eviva2026";

export class LeadController {
    
    // Listar (GET)
    static index(req: Request, res: Response): void {
        const token = req.headers['x-access-token'];
        const view = req.query.view as string;
        
        if (token !== SENHA_MESTRA) {
            console.log(`❌ Acesso Negado. Token: ${token}`);
            res.status(403).json({ error: 'Acesso Negado.' });
            return;
        }

        let query = "SELECT * FROM leads ORDER BY created_at DESC";
        
        // If view=kanban: Return active leads + finalized leads from last 24 hours only
        if (view === 'kanban') {
            query = `
                SELECT * FROM leads 
                WHERE status != 'Finalizado' 
                   OR (status = 'Finalizado' AND datetime(created_at) >= datetime('now', '-1 day'))
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

    // Atualizar Status (PATCH)
    static update(req: Request, res: Response): void {
        const token = req.headers['x-access-token'];
        const { id } = req.params;
        const { status, appointment_date, doctor, notes } = req.body;

        if (token !== SENHA_MESTRA) {
            res.status(403).json({ error: 'Acesso Negado.' });
            return;
        }

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

    // Deletar (DELETE)
    static delete(req: Request, res: Response): void {
        const token = req.headers['x-access-token'];
        const { id } = req.params;

        if (token !== SENHA_MESTRA) {
            res.status(403).json({ error: 'Acesso Negado.' });
            return;
        }

        db.run("DELETE FROM leads WHERE id = ?", [id], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Lead removido.', changes: this.changes });
        });
    }

    // Dashboard Métricas (GET)
    static metrics(req: Request, res: Response): void {
        const token = req.headers['x-access-token'];
        
        if (token !== SENHA_MESTRA) {
            res.status(403).json({ error: 'Acesso Negado.' });
            return;
        }

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
}