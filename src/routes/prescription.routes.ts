import { Router } from 'express';
import { PrescriptionController } from '../controllers/PrescriptionController';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { auditLogger } from '../middleware/audit.middleware';

const router = Router();

router.get('/:id/pdf', tenantMiddleware, auditLogger, PrescriptionController.downloadPdf);

export default router;
