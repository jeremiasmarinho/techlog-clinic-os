import { Router } from 'express';
import { ClinicController } from '../controllers/ClinicController';
import { tenantMiddleware, ensureClinicAdmin } from '../middleware/tenant.middleware';

const router = Router();

// Clinic Settings (Requer autenticação JWT + Clinic Admin)
router.get('/clinic/settings', tenantMiddleware, ensureClinicAdmin, ClinicController.getSettings);
router.put('/clinic/settings', tenantMiddleware, ensureClinicAdmin, ClinicController.updateSettings);

export default router;
