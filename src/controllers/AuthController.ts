/**
 * ============================================================================
 * AUTH CONTROLLER - Guardião Único de Autenticação
 * ============================================================================
 *
 * Este é o ÚNICO controller responsável por autenticação.
 * NÃO criar métodos de login em outros controllers.
 *
 * Funcionalidades:
 * - Login com email/username + password
 * - Rate limiting (produção)
 * - Verificação de status da clínica
 * - Atualização de last_login_at
 * - Geração de JWT com contexto de clínica
 */

import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../database';
import bcrypt from 'bcrypt';
import { APP_CONFIG, ERROR_MESSAGES, HTTP_STATUS } from '../config/constants';

// ============================================================================
// RATE LIMITING (in-memory)
// ============================================================================

interface LoginAttempt {
    count: number;
    lastAttempt: number;
}

const loginAttempts = new Map<string, LoginAttempt>();
const MAX_ATTEMPTS =
    process.env.NODE_ENV === 'production' ? APP_CONFIG.RATE_LIMIT.MAX_ATTEMPTS : 100; // Mais permissivo em dev/test
const LOCKOUT_TIME = APP_CONFIG.RATE_LIMIT.LOCKOUT_TIME_MS;

// ============================================================================
// CONTROLLER
// ============================================================================

export class AuthController {
    /**
     * POST /api/auth/login
     * POST /api/login (alias)
     *
     * Autentica usuário e retorna JWT token
     *
     * @body { email?: string, username?: string, password: string }
     * @returns { success: true, token: string, user: UserInfo }
     */
    static async login(req: Request, res: Response): Promise<void> {
        // Aceita tanto 'email' quanto 'username' como campo de login
        const { email, username, password } = req.body;
        const loginField = (email || username || '').trim();
        const trimmedPassword = (password || '').trim();

        // Validação básica
        if (!loginField || !trimmedPassword) {
            res.status(HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                error: ERROR_MESSAGES.AUTH.EMAIL_PASSWORD_REQUIRED,
                code: 'MISSING_CREDENTIALS',
            });
            return;
        }

        // Rate limiting (apenas em produção)
        if (process.env.NODE_ENV === 'production') {
            const rateLimitResult = AuthController.checkRateLimit(loginField);
            if (!rateLimitResult.allowed) {
                res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
                    success: false,
                    error: rateLimitResult.message,
                    code: 'RATE_LIMIT_EXCEEDED',
                });
                return;
            }
        }

        // Buscar usuário com informações da clínica
        db.get(
            `SELECT u.id, u.name, u.username, u.password, u.role, u.clinic_id, u.is_owner,
                    c.name as clinic_name, c.slug as clinic_slug, c.status as clinic_status, c.plan_tier
             FROM users u
             LEFT JOIN clinics c ON u.clinic_id = c.id
             WHERE u.username = ?`,
            [loginField],
            async (err, row: any) => {
                if (err) {
                    console.error('[AuthController] Database error:', err.message);
                    res.status(HTTP_STATUS.SERVER_ERROR).json({
                        success: false,
                        error: ERROR_MESSAGES.GENERAL.SERVER_ERROR,
                        code: 'DATABASE_ERROR',
                    });
                    return;
                }

                // Usuário não encontrado
                if (!row) {
                    AuthController.trackFailedAttempt(loginField);
                    res.status(HTTP_STATUS.UNAUTHORIZED).json({
                        success: false,
                        error: ERROR_MESSAGES.AUTH.CREDENTIALS_INVALID,
                        code: 'INVALID_CREDENTIALS',
                    });
                    return;
                }

                // Verificar se clínica está ativa (exceto super_admin)
                if (row.role !== 'super_admin' && row.clinic_status !== 'active') {
                    res.status(HTTP_STATUS.FORBIDDEN).json({
                        success: false,
                        error: ERROR_MESSAGES.CLINIC.SUSPENDED,
                        code: 'CLINIC_INACTIVE',
                        clinic_status: row.clinic_status,
                    });
                    return;
                }

                // Verificar senha
                const isPasswordValid = await bcrypt.compare(trimmedPassword, row.password);

                if (!isPasswordValid) {
                    AuthController.trackFailedAttempt(loginField);
                    res.status(HTTP_STATUS.UNAUTHORIZED).json({
                        success: false,
                        error: ERROR_MESSAGES.AUTH.CREDENTIALS_INVALID,
                        code: 'INVALID_CREDENTIALS',
                    });
                    return;
                }

                // Login bem-sucedido - limpar tentativas
                loginAttempts.delete(loginField);

                // Atualizar last_login_at (regra de negócio da auditoria)
                db.run(
                    'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [row.id],
                    (updateErr) => {
                        if (updateErr) {
                            console.warn(
                                '[AuthController] Failed to update last_login_at:',
                                updateErr.message
                            );
                        }
                    }
                );

                // Gerar JWT com contexto de clínica
                const token = jwt.sign(
                    {
                        userId: row.id,
                        username: row.username,
                        name: row.name,
                        role: row.role,
                        clinicId: row.clinic_id,
                        isOwner: row.is_owner === 1,
                    },
                    process.env.JWT_SECRET as string,
                    { expiresIn: APP_CONFIG.TOKEN_EXPIRY }
                );

                // Log de sucesso (sem dados sensíveis)
                console.log(
                    `[Auth] Login: ${row.username} (${row.role}) - Clinic: ${row.clinic_name || 'N/A'}`
                );

                // Resposta padronizada
                res.json({
                    success: true,
                    token,
                    user: {
                        id: row.id,
                        name: row.name,
                        username: row.username,
                        email: row.username, // Alias para compatibilidade
                        role: row.role,
                        clinic_id: row.clinic_id,
                        isOwner: row.is_owner === 1,
                        clinic: row.clinic_id
                            ? {
                                  id: row.clinic_id,
                                  name: row.clinic_name,
                                  slug: row.clinic_slug,
                                  status: row.clinic_status,
                                  plan: row.plan_tier,
                              }
                            : null,
                    },
                });
            }
        );
    }

    /**
     * GET /api/auth/verify
     *
     * Verifica se o token JWT é válido
     * Útil para o frontend verificar sessão
     */
    static verifyToken(req: Request, res: Response): void {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                valid: false,
                error: ERROR_MESSAGES.AUTH.TOKEN_MISSING,
                code: 'TOKEN_MISSING',
            });
            return;
        }

        const token = authHeader.replace('Bearer ', '');

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
            res.json({
                success: true,
                valid: true,
                user: decoded,
            });
        } catch (error) {
            res.status(HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                valid: false,
                error: ERROR_MESSAGES.AUTH.TOKEN_INVALID,
                code: 'TOKEN_INVALID',
            });
        }
    }

    // ========================================================================
    // PRIVATE HELPERS
    // ========================================================================

    /**
     * Verifica rate limiting para um usuário
     */
    private static checkRateLimit(identifier: string): { allowed: boolean; message?: string } {
        const attempts = loginAttempts.get(identifier);

        if (!attempts) {
            return { allowed: true };
        }

        const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;

        // Se passou o tempo de lockout, resetar
        if (timeSinceLastAttempt >= LOCKOUT_TIME) {
            loginAttempts.delete(identifier);
            return { allowed: true };
        }

        // Se ainda está em lockout
        if (attempts.count >= MAX_ATTEMPTS) {
            const remainingMinutes = Math.ceil((LOCKOUT_TIME - timeSinceLastAttempt) / 60000);
            return {
                allowed: false,
                message: `Muitas tentativas de login. Tente novamente em ${remainingMinutes} minutos.`,
            };
        }

        return { allowed: true };
    }

    /**
     * Registra tentativa de login falha
     */
    private static trackFailedAttempt(identifier: string): void {
        if (process.env.NODE_ENV !== 'production') {
            return; // Não rastrear em dev/test
        }

        const current = loginAttempts.get(identifier) || { count: 0, lastAttempt: 0 };
        loginAttempts.set(identifier, {
            count: current.count + 1,
            lastAttempt: Date.now(),
        });
    }
}
