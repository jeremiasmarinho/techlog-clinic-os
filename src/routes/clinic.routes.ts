import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ClinicController } from '../controllers/ClinicController';
import { ClinicInfoController } from '../controllers/ClinicInfoController';
import { tenantMiddleware, ensureClinicAdmin } from '../middleware/tenant.middleware';
import { auditLogger } from '../middleware/audit.middleware';

const router = Router();

const uploadDir = path.join(__dirname, '../../uploads/logos');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req: any, _file: any, cb: any) => cb(null, uploadDir),
    filename: (_req: any, file: any, cb: any) => {
        const ext = path.extname(file.originalname) || '.png';
        const filename = `logo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
        cb(null, filename);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_req: any, file: any, cb: any) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Formato de arquivo inválido'));
        }
        cb(null, true);
    },
});

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

router.patch(
    '/clinic/settings',
    tenantMiddleware,
    auditLogger,
    ensureClinicAdmin,
    upload.single('logo'),
    ClinicController.updateIdentitySettings
);

export default router;
