import { Router } from 'express';
import { SaaSController } from '../controllers/SaaSController';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { superAdminMiddleware, logSuperAdminAction } from '../middleware/superAdmin.middleware';
import { auditLogger } from '../middleware/audit.middleware';

const router = Router();

// All routes require authentication + Super Admin role
router.use(tenantMiddleware, auditLogger);

// Apply Super Admin middleware for extra protection
router.use(superAdminMiddleware, logSuperAdminAction);

// System Statistics (Enhanced)
router.get('/stats/system', SaaSController.getSystemStats); // NEW: MRR, churn, patients
router.get('/stats', SaaSController.getStats); // Legacy endpoint

// Clinic Management Routes
router.get('/clinics', SaaSController.listClinics); // Enhanced with last_login
router.post('/clinics', SaaSController.createClinic);
router.get('/clinics/:id', SaaSController.getClinic);
router.patch('/clinics/:id', SaaSController.updateClinic);
router.patch('/clinics/:id/status', SaaSController.toggleClinicStatus); // NEW: Block/unblock
router.delete('/clinics/:id', SaaSController.deleteClinic);

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
