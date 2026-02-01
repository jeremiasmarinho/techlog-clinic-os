import { Router } from 'express';
import { CalendarController } from '../controllers/CalendarController';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { auditLogger } from '../middleware/audit.middleware';

const router = Router();

router.get('/', tenantMiddleware, auditLogger, CalendarController.listAppointments);
router.patch('/:id', tenantMiddleware, auditLogger, CalendarController.updateAppointment);

export default router;
