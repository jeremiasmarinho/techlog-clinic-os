import { Router } from 'express';
import { ClinicController } from '../controllers/ClinicController';
import { ClinicInfoController } from '../controllers/ClinicInfoController';
import { tenantMiddleware, ensureClinicAdmin } from '../middleware/tenant.middleware';
import { auditLogger } from '../middleware/audit.middleware';

const router = Router();

// Clinic Info (Todos os usuários autenticados)
router.get('/clinic/info', tenantMiddleware, auditLogger, ClinicInfoController.getClinicInfo);
router.get('/clinic/stats', tenantMiddleware, auditLogger, ClinicInfoController.getClinicStats);
router.post(
    '/clinic/upgrade-request',
    tenantMiddleware,
    auditLogger,
    ClinicInfoController.createUpgradeRequest
);
router.get('/clinic/audit-logs', tenantMiddleware, auditLogger, ClinicInfoController.getAuditLogs);

// Clinic Settings (Requer autenticação JWT + Clinic Admin)
router.get(
    '/clinic/settings',
    tenantMiddleware,
    auditLogger,
    ensureClinicAdmin,
    ClinicController.getSettings
);
router.put(
    '/clinic/settings',
    tenantMiddleware,
    auditLogger,
    ensureClinicAdmin,
    ClinicController.updateSettings
);

export default router;
