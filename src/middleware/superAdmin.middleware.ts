import { Request, Response, NextFunction } from 'express';

/**
 * Middleware: Super Admin Protection
 *
 * Verifica se o usuário autenticado é o Super Admin do sistema.
 * Usa o email configurado em SUPER_ADMIN_EMAIL (.env) para validação.
 *
 * Uso: Proteger rotas críticas de gerenciamento (SaaS, billing, system stats)
 */
export function superAdminMiddleware(req: Request, res: Response, next: NextFunction): void {
    const user = req.user;

    if (!user) {
        res.status(401).json({
            error: 'Autenticação necessária',
            message: 'Token não fornecido ou inválido',
        });
        return;
    }

    // Super Admin email from environment
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@techlog.com';

    // Check if user role is super_admin
    if (user.role !== 'super_admin') {
        res.status(403).json({
            error: 'Acesso negado',
            message: 'Esta rota requer permissões de Super Admin',
            requiredRole: 'super_admin',
            yourRole: user.role,
        });
        return;
    }

    // Additional check: Verify email matches super admin email
    // This adds an extra layer of security for critical operations
    const userIdentifier = (user as any).username || (user as any).email || user.username;

    if (userIdentifier !== superAdminEmail) {
        res.status(403).json({
            error: 'Acesso negado',
            message: 'Super Admin não autorizado',
            hint: 'Apenas o proprietário do sistema pode acessar esta rota',
        });
        return;
    }

    console.log(`✅ Super Admin autorizado: ${userIdentifier}`);
    next();
}

/**
 * Alias for consistency with other middleware naming
 */
export const verifySuperAdmin = superAdminMiddleware;

/**
 * Middleware: Log Super Admin Actions
 *
 * Registra todas as ações do Super Admin para auditoria
 */
export function logSuperAdminAction(req: Request, _res: Response, next: NextFunction): void {
    const user = req.user;
    const action = `${req.method} ${req.originalUrl}`;
    const timestamp = new Date().toISOString();
    const userIdentifier = (user as any)?.username || (user as any)?.email || 'Unknown';

    console.log(`🔐 [SUPER ADMIN] ${timestamp} | ${userIdentifier} | ${action}`);

    // Could be extended to save to audit table
    next();
}
