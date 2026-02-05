import { Request, Response } from 'express';
import { db } from '../database';

export class UserPreferencesController {
    /**
     * GET /api/user/preferences
     * Retorna as preferências do usuário logado
     */
    static getPreferences(req: Request, res: Response): void {
        const userId = (req as any).user?.userId;

        if (!userId) {
            res.status(401).json({ error: 'Não autenticado' });
            return;
        }

        db.get('SELECT preferences FROM users WHERE id = ?', [userId], (err, row: any) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            if (!row) {
                res.status(404).json({ error: 'Usuário não encontrado' });
                return;
            }

            let preferences = {};
            try {
                preferences = JSON.parse(row.preferences || '{}');
            } catch (e) {
                preferences = {};
            }

            res.json(preferences);
        });
    }

    /**
     * PATCH /api/user/preferences
     * Atualiza as preferências do usuário logado
     */
    static updatePreferences(req: Request, res: Response): void {
        const userId = (req as any).user?.userId;
        const updates = req.body;

        if (!userId) {
            res.status(401).json({ error: 'Não autenticado' });
            return;
        }

        // Buscar preferências atuais
        db.get('SELECT preferences FROM users WHERE id = ?', [userId], (err, row: any) => {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }

            if (!row) {
                res.status(404).json({ error: 'Usuário não encontrado' });
                return;
            }

            let currentPrefs = {};
            try {
                currentPrefs = JSON.parse(row.preferences || '{}');
            } catch (e) {
                currentPrefs = {};
            }

            // Merge com novas preferências
            const newPrefs = { ...currentPrefs, ...updates };

            // Salvar
            db.run(
                'UPDATE users SET preferences = ? WHERE id = ?',
                [JSON.stringify(newPrefs), userId],
                function (updateErr) {
                    if (updateErr) {
                        res.status(500).json({ error: updateErr.message });
                        return;
                    }

                    res.json({
                        success: true,
                        preferences: newPrefs,
                    });
                }
            );
        });
    }
}
