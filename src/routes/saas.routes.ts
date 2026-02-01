import { Router } from 'express';
import { SaaSController } from '../controllers/SaaSController';
import { tenantMiddleware, ensureSuperAdmin } from '../middleware/tenant.middleware';
import { auditLogger } from '../middleware/audit.middleware';

const router = Router();

// All routes require Super Admin access
router.use(tenantMiddleware, auditLogger, ensureSuperAdmin);

// Clinic Management Routes
router.get('/clinics', SaaSController.listClinics);
router.post('/clinics', SaaSController.createClinic);
router.get('/clinics/:id', SaaSController.getClinic);
router.patch('/clinics/:id', SaaSController.updateClinic);
router.patch('/clinics/:id/status', SaaSController.updateClinicStatus);
router.delete('/clinics/:id', SaaSController.deleteClinic);

// Statistics
router.get('/stats', SaaSController.getStats);

// Cross-tenant analytics
router.get('/analytics', SaaSController.getAnalytics);
router.get('/analytics/export', SaaSController.exportAnalyticsCsv);

// Upgrade Requests
router.get('/upgrade-requests', SaaSController.listUpgradeRequests);
router.patch('/upgrade-requests/:id', SaaSController.updateUpgradeRequest);

// Audit Logs
router.get('/audit-logs', SaaSController.listAuditLogs);
router.get('/audit-logs/export', SaaSController.exportAuditLogsCsv);

export default router;
