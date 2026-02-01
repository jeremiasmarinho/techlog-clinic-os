import { Request, Response, NextFunction } from 'express';
import { db } from '../database';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function shouldLog(req: Request): boolean {
    if (MUTATING_METHODS.has(req.method)) return true;
    if (req.originalUrl.startsWith('/api/saas')) return true;
    return false;
}

export function auditLogger(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();

    res.on('finish', () => {
        if (!req.user || !shouldLog(req)) {
            return;
        }

        const details = {
            duration_ms: Date.now() - start,
        };

        db.run(
            `INSERT INTO audit_logs (
                clinic_id,
                user_id,
                user_role,
                action,
                path,
                method,
                status_code,
                ip_address,
                details
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.clinicId || null,
                req.user.userId,
                req.user.role,
                `${req.method} ${req.originalUrl}`,
                req.originalUrl,
                req.method,
                res.statusCode,
                req.ip,
                JSON.stringify(details),
            ],
            (err) => {
                if (err) {
                    console.error('❌ Erro ao registrar auditoria:', err.message);
                }
            }
        );
    });

    next();
}
