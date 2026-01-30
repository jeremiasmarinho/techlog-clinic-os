import { Router } from 'express';
import { SaaSController } from '../controllers/SaaSController';
import { tenantMiddleware, ensureSuperAdmin } from '../middleware/tenant.middleware';

const router = Router();

// All routes require Super Admin access
router.use(tenantMiddleware, ensureSuperAdmin);

// Clinic Management Routes
router.get('/clinics', SaaSController.listClinics);
router.post('/clinics', SaaSController.createClinic);
router.get('/clinics/:id', SaaSController.getClinic);
router.patch('/clinics/:id', SaaSController.updateClinic);
router.patch('/clinics/:id/status', SaaSController.updateClinicStatus);
router.delete('/clinics/:id', SaaSController.deleteClinic);

// Statistics
router.get('/stats', SaaSController.getStats);

export default router;
