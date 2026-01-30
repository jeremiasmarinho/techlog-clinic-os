import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../database';
import bcrypt from 'bcrypt';

// Rate limiting storage (in-memory, simple implementation)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = process.env.NODE_ENV === 'production' ? 5 : 100; // 100 attempts in development for E2E tests
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

export class AuthController {
    static async login(req: Request, res: Response): Promise<void> {
        const { email, password } = req.body;
        
        // Validação básica
        if (!email || !password) {
            res.status(400).json({ error: 'E-mail e senha são obrigatórios' });
            return;
        }

        // Check rate limiting (disabled in development for E2E tests)
        if (process.env.NODE_ENV === 'production') {
            const attempts = loginAttempts.get(email);
            if (attempts) {
                const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
                
                if (attempts.count >= MAX_ATTEMPTS && timeSinceLastAttempt < LOCKOUT_TIME) {
                    const remainingTime = Math.ceil((LOCKOUT_TIME - timeSinceLastAttempt) / 60000);
                    res.status(429).json({ 
                        error: `Muitas tentativas de login. Tente novamente em ${remainingTime} minutos.` 
                    });
                    return;
                }
                
                // Reset if lockout time has passed
                if (timeSinceLastAttempt >= LOCKOUT_TIME) {
                    loginAttempts.delete(email);
                }
            }
        }
        
        // Query database for user with clinic info
        db.get(
            `SELECT u.id, u.name, u.username, u.password, u.role, u.clinic_id, u.is_owner,
                    c.name as clinic_name, c.slug as clinic_slug, c.status as clinic_status, c.plan_tier
             FROM users u
             LEFT JOIN clinics c ON u.clinic_id = c.id
             WHERE u.username = ?`,
            [email],
            async (err, row: any) => {
                if (err) {
                    console.error('❌ Erro no login:', err.message);
                    res.status(500).json({ error: 'Erro no servidor' });
                    return;
                }

                if (!row) {
                    // Track failed attempt (only in production)
                    if (process.env.NODE_ENV === 'production') {
                        const current = loginAttempts.get(email) || { count: 0, lastAttempt: 0 };
                        loginAttempts.set(email, { 
                            count: current.count + 1, 
                            lastAttempt: Date.now() 
                        });
                    }
                    
                    res.status(401).json({ error: 'Credenciais inválidas' });
                    return;
                }

                // Check if clinic is active (except for super_admin)
                if (row.role !== 'super_admin' && row.clinic_status !== 'active') {
                    res.status(403).json({ 
                        error: 'Clínica suspensa ou inativa. Entre em contato com o suporte.',
                        clinic_status: row.clinic_status
                    });
                    return;
                }

                // Verify password
                const isPasswordValid = await bcrypt.compare(password, row.password);
                
                if (!isPasswordValid) {
                    // Track failed attempt (only in production)
                    if (process.env.NODE_ENV === 'production') {
                        const current = loginAttempts.get(email) || { count: 0, lastAttempt: 0 };
                        loginAttempts.set(email, { 
                            count: current.count + 1, 
                            lastAttempt: Date.now() 
                        });
                    }
                    
                    res.status(401).json({ error: 'Credenciais inválidas' });
                    return;
                }

                // Clear failed attempts on successful login
                loginAttempts.delete(email);

                // Generate JWT with clinic context
                const token = jwt.sign(
                    {
                        userId: row.id,
                        username: row.username,
                        name: row.name,
                        role: row.role,
                        clinicId: row.clinic_id,
                        isOwner: row.is_owner === 1
                    },
                    process.env.JWT_SECRET as string,
                    { expiresIn: '8h' }
                );

                console.log(`✅ Login: ${row.username} (${row.role}) - Clínica: ${row.clinic_name || 'N/A'}`);
                
                res.json({
                    success: true,
                    token,
                    user: {
                        id: row.id,
                        name: row.name,
                        username: row.username,
                        email: row.username, // For backwards compatibility
                        role: row.role,
                        isOwner: row.is_owner === 1,
                        clinic: {
                            id: row.clinic_id,
                            name: row.clinic_name,
                            slug: row.clinic_slug,
                            status: row.clinic_status,
                            plan: row.plan_tier
                        }
                    }
                });
            }
        );
    }
}
