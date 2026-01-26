import { Request, Response } from 'express';
import sqlite3 from 'sqlite3';
import { db } from '../database';

const SENHA_MESTRA = "eviva2026";

export class LeadController {
    
    // Listar (GET)
    static index(req: Request, res: Response): void {
        const token = req.headers['x-access-token'];
        
        if (token !== SENHA_MESTRA) {
            console.log(`❌ Acesso Negado. Token: ${token}`);
            res.status(403).json({ error: 'Acesso Negado.' });
            return;
        }

        db.all("SELECT * FROM leads ORDER BY created_at DESC", [], (err, rows) => {
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
        const { status } = req.body;

        if (token !== SENHA_MESTRA) {
            res.status(403).json({ error: 'Acesso Negado.' });
            return;
        }

        db.run("UPDATE leads SET status = ? WHERE id = ?", [status, id], function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Status atualizado!', changes: this.changes });
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