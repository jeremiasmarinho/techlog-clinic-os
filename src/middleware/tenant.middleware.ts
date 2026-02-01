import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
    userId: number;
    username: string;
    name: string;
    role: 'super_admin' | 'clinic_admin' | 'staff';
    clinicId: number;
}

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
            clinicId?: number;
        }
    }
}

/**
 * Middleware: Authenticate user and inject clinic context
 * Usage: Apply to all protected routes
 */
export function tenantMiddleware(req: Request, res: Response, next: NextFunction): void {
    const token =
        (req.headers['x-access-token'] as string) ||
        req.headers['authorization']?.replace('Bearer ', '');

    if (!token) {
        res.status(401).json({ error: 'Token de autenticação não fornecido' });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
        req.user = decoded;

        // Inject clinic ID for easy access
        req.clinicId = decoded.clinicId;

        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido ou expirado' });
    }
}

/**
 * Middleware: Ensure user is Super Admin
 * Usage: Protect system-level management routes
 */
export function ensureSuperAdmin(req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
        res.status(401).json({ error: 'Não autenticado' });
        return;
    }

    if (req.user.role !== 'super_admin') {
        res.status(403).json({
            error: 'Acesso negado. Apenas Super Admins podem acessar esta rota.',
            requiredRole: 'super_admin',
            currentRole: req.user.role,
        });
        return;
    }

    next();
}

/**
 * Middleware: Ensure user is Clinic Admin or Super Admin
 * Usage: Protect clinic-level management routes
 */
export function ensureClinicAdmin(req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
        res.status(401).json({ error: 'Não autenticado' });
        return;
    }

    const allowedRoles = ['clinic_admin', 'super_admin'];

    if (!allowedRoles.includes(req.user.role)) {
        res.status(403).json({
            error: 'Acesso negado. Apenas administradores podem acessar esta rota.',
            requiredRoles: allowedRoles,
            currentRole: req.user.role,
        });
        return;
    }

    next();
}

/**
 * Middleware: Enforce clinic data isolation (Row-Level Security)
 * Usage: Apply to data query routes to ensure users only see their clinic's data
 *
 * Super Admins can bypass this (see all clinics)
 * Regular users only see their clinic's data
 */
export function enforceClinicIsolation(req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
        res.status(401).json({ error: 'Não autenticado' });
        return;
    }

    // Super Admins can see all clinics - skip isolation
    if (req.user.role === 'super_admin') {
        console.log(`🔓 Super Admin ${req.user.username} - Acesso multi-tenant permitido`);
        return next();
    }

    // Inject clinic_id into request for database queries
    req.clinicId = req.user.clinicId;

    console.log(
        `🔒 Clinic Isolation: User ${req.user.username} (Role: ${req.user.role}) -> Clinic ID: ${req.clinicId}`
    );

    next();
}

/**
 * Helper: Extract user from token (for optional auth routes)
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
    const token =
        (req.headers['x-access-token'] as string) ||
        req.headers['authorization']?.replace('Bearer ', '');

    if (!token) {
        // No token provided, continue without user context
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
        req.user = decoded;
        req.clinicId = decoded.clinicId;
    } catch (error) {
        // Invalid token, but don't block request
        console.warn('⚠️  Token inválido em rota opcional:', error);
    }

    next();
}

// Alias to match route naming conventions
export const tenantGuard = tenantMiddleware;
