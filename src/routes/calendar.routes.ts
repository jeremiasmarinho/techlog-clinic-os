import { Router } from 'express';
import { CalendarController } from '../controllers/CalendarController';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { auditLogger } from '../middleware/audit.middleware';

const router = Router();

router.get('/appointments', tenantMiddleware, auditLogger, CalendarController.listAppointments);
router.patch(
    '/appointments/:id',
    tenantMiddleware,
    auditLogger,
    CalendarController.updateAppointment
);
router.delete(
    '/appointments/:id',
    tenantMiddleware,
    auditLogger,
    CalendarController.deleteAppointment
);

export default router;
