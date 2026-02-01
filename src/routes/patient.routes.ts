import { Router } from 'express';
import { PatientController } from '../controllers/PatientController';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { auditLogger } from '../middleware/audit.middleware';

const router = Router();

router.patch('/:id/status', tenantMiddleware, auditLogger, PatientController.updateStatus);
router.get('/:id/history', tenantMiddleware, auditLogger, PatientController.getHistory);
router.post('/:id/finish', tenantMiddleware, auditLogger, PatientController.finishAppointment);

export default router;
