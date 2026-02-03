import { Router } from 'express';
import { CalendarController } from '../controllers/CalendarController';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { auditLogger } from '../middleware/audit.middleware';

const router = Router();

router.get('/', tenantMiddleware, auditLogger, CalendarController.listAppointments);
router.get('/:id', tenantMiddleware, auditLogger, CalendarController.getAppointment);
router.post('/', tenantMiddleware, auditLogger, CalendarController.createAppointment);
router.patch('/:id', tenantMiddleware, auditLogger, CalendarController.updateAppointment);
router.delete('/:id', tenantMiddleware, auditLogger, CalendarController.deleteAppointment);

export default router;
