import { Request, Response } from 'express';
import { db } from '../database';

export class UserController {
    
    // Login (POST /api/login)
    static login(req: Request, res: Response): void {
        const { username, password } = req.body;

        if (!username || !password) {
            res.status(400).json({ success: false, error: 'Usuário e senha são obrigatórios' });
            return;
        }

        db.get(
            "SELECT id, name, username, role FROM users WHERE username = ? AND password = ?",
            [username, password],
            (err, row: any) => {
                if (err) {
                    console.error('❌ Erro no login:', err.message);
                    res.status(500).json({ success: false, error: 'Erro no servidor' });
                    return;
                }

                if (row) {
                    console.log(`✅ Login bem-sucedido: ${row.username} (${row.role})`);
                    res.json({
                        success: true,
                        user: {
                            id: row.id,
                            name: row.name,
                            username: row.username,
                            role: row.role
                        }
                    });
                } else {
                    console.log(`❌ Credenciais inválidas: ${username}`);
                    res.status(401).json({ success: false, error: 'Credenciais inválidas' });
                }
            }
        );
    }

    // Listar Usuários (GET /api/users)
    static index(_req: Request, res: Response): void {
        db.all(
            "SELECT id, name, username, role, created_at FROM users ORDER BY created_at DESC",
            [],
            (err, rows) => {
                if (err) {
                    console.error('❌ Erro ao listar usuários:', err.message);
                    res.status(500).json({ error: err.message });
                    return;
                }
                res.json(rows);
            }
        );
    }

    // Criar Usuário (POST /api/users)
    static store(req: Request, res: Response): void {
        const { name, username, password, role } = req.body;

        if (!name || !username || !password || !role) {
            res.status(400).json({ error: 'Todos os campos são obrigatórios' });
            return;
        }

        // Validar role
        const validRoles = ['admin', 'medico', 'recepcao'];
        if (!validRoles.includes(role)) {
            res.status(400).json({ error: 'Role inválido. Use: admin, medico ou recepcao' });
            return;
        }

        db.run(
            "INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)",
            [name, username, password, role],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        res.status(409).json({ error: 'Nome de usuário já existe' });
                    } else {
                        console.error('❌ Erro ao criar usuário:', err.message);
                        res.status(500).json({ error: err.message });
                    }
                    return;
                }
                
                console.log(`✅ Usuário criado: ${username} (${role})`);
                res.status(201).json({
                    message: 'Usuário criado com sucesso',
                    id: this.lastID,
                    user: { name, username, role }
                });
            }
        );
    }

    // Deletar Usuário (DELETE /api/users/:id)
    static delete(req: Request, res: Response): void {
        const { id } = req.params;

        // Impedir deleção do admin padrão (id = 1)
        if (id === '1') {
            res.status(403).json({ error: 'Não é possível deletar o usuário administrador padrão' });
            return;
        }

        db.run("DELETE FROM users WHERE id = ?", [id], function(err) {
            if (err) {
                console.error('❌ Erro ao deletar usuário:', err.message);
                res.status(500).json({ error: err.message });
                return;
            }

            if (this.changes === 0) {
                res.status(404).json({ error: 'Usuário não encontrado' });
            } else {
                console.log(`✅ Usuário deletado: ID ${id}`);
                res.json({ message: 'Usuário removido com sucesso', changes: this.changes });
            }
        });
    }
}
