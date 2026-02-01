import { Request, Response } from 'express';
import { db } from '../database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createUserSchema } from '../validators/user.validator';

export class UserController {
    // Login (POST /api/login)
    static async login(req: Request, res: Response): Promise<void> {
        const { username, password } = req.body;

        if (!username || !password) {
            res.status(400).json({ success: false, error: 'Usuário e senha são obrigatórios' });
            return;
        }

        db.get(
            'SELECT id, name, username, password, role FROM users WHERE username = ?',
            [username],
            async (err, row: any) => {
                if (err) {
                    console.error('❌ Erro no login:', err.message);
                    res.status(500).json({ success: false, error: 'Erro no servidor' });
                    return;
                }

                if (row) {
                    // Verificar senha com bcrypt
                    const isPasswordValid = await bcrypt.compare(password, row.password);

                    if (isPasswordValid) {
                        console.log(`✅ Login bem-sucedido: ${row.username} (${row.role})`);

                        // Gerar JWT token
                        const token = jwt.sign(
                            {
                                userId: row.id,
                                username: row.username,
                                name: row.name,
                                role: row.role,
                                clinicId: row.clinic_id || 1,
                            },
                            process.env.JWT_SECRET as string,
                            { expiresIn: '24h' }
                        );

                        res.json({
                            success: true,
                            token,
                            user: {
                                id: row.id,
                                name: row.name,
                                username: row.username,
                                role: row.role,
                            },
                        });
                    } else {
                        console.log(`❌ Senha inválida para usuário: ${username}`);
                        res.status(401).json({ success: false, error: 'Credenciais inválidas' });
                    }
                } else {
                    console.log(`❌ Usuário não encontrado: ${username}`);
                    res.status(401).json({ success: false, error: 'Credenciais inválidas' });
                }
            }
        );
    }

    // Listar Usuários (GET /api/users)
    static index(_req: Request, res: Response): void {
        db.all(
            'SELECT id, name, username, role, created_at FROM users ORDER BY created_at DESC',
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
    static async store(req: Request, res: Response): Promise<void> {
        // Validar com Zod
        const result = createUserSchema.safeParse(req.body);
        if (!result.success) {
            const formatted = result.error.format();
            const firstError =
                Object.keys(formatted)
                    .filter((k) => k !== '_errors')
                    .map((k) => (formatted as any)[k]._errors?.[0])
                    .find((e) => e) || 'Erro de validação';
            res.status(400).json({ error: firstError });
            return;
        }

        const { name, username, password, role } = result.data;

        // Hash da senha com bcrypt
        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
            'INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)',
            [name, username, hashedPassword, role],
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        res.status(409).json({ error: 'Nome de usuário já existe' });
                    } else {
                        res.status(500).json({ error: err.message });
                    }
                    return;
                }

                res.status(201).json({
                    message: 'Usuário criado com sucesso',
                    id: this.lastID,
                    user: { name, username, role },
                });
            }
        );
    }

    // Deletar Usuário (DELETE /api/users/:id)
    static delete(req: Request, res: Response): void {
        const { id } = req.params;

        // Impedir deleção do admin padrão (id = 1)
        if (id === '1') {
            res.status(403).json({
                error: 'Não é possível deletar o usuário administrador padrão',
            });
            return;
        }

        db.run('DELETE FROM users WHERE id = ?', [id], function (err) {
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

    // Atualizar perfil do médico (PATCH /api/users/profile)
    static updateProfile(req: Request, res: Response): void {
        const user = (req as any).user;
        const { crm, crm_state, signature_url } = req.body || {};

        if (!user) {
            res.status(401).json({ error: 'Não autenticado' });
            return;
        }

        if (crm_state && String(crm_state).length !== 2) {
            res.status(400).json({ error: 'UF do CRM inválida' });
            return;
        }

        db.run(
            `UPDATE users 
             SET crm = COALESCE(?, crm),
                 crm_state = COALESCE(?, crm_state),
                 signature_url = COALESCE(?, signature_url)
             WHERE id = ?`,
            [
                crm || null,
                crm_state ? String(crm_state).toUpperCase() : null,
                signature_url || null,
                user.userId,
            ],
            function (err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }

                res.json({
                    success: true,
                    userId: user.userId,
                    crm: crm || null,
                    crm_state: crm_state ? String(crm_state).toUpperCase() : null,
                    signature_url: signature_url || null,
                });
            }
        );
    }
}
