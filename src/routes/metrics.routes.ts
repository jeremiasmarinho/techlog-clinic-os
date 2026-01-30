import { Router } from 'express';
import { MetricsController } from '../controllers/MetricsController';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

// Todas as rotas protegidas por autenticação multi-tenant
router.use(tenantMiddleware);

// GET /api/metrics/resumo - Dashboard summary
router.get('/resumo', MetricsController.summary);

export default router;
