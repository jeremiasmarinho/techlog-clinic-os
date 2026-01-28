import { Router } from 'express';
import { MetricsController } from '../controllers/MetricsController';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Todas as rotas protegidas por autenticação
router.use(authMiddleware);

// GET /api/metrics/resumo - Dashboard summary
router.get('/resumo', MetricsController.summary);

export default router;
