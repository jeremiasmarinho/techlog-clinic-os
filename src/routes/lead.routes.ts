import { Router } from 'express';
import { LeadController } from '../controllers/LeadController';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Definição das Rotas
router.post('/', LeadController.create); // Público (widget)
router.get('/', authMiddleware, LeadController.index);

// CRITICAL: Dashboard route BEFORE /:id routes to avoid Express treating 'dashboard' as an ID
router.get('/dashboard', authMiddleware, LeadController.metrics);

router.patch('/:id', authMiddleware, LeadController.update);
router.delete('/:id', authMiddleware, LeadController.delete);
router.put('/:id/archive', authMiddleware, LeadController.archive);
router.put('/:id/unarchive', authMiddleware, LeadController.unarchive);

// ATENÇÃO: Exportação Default (É isso que o server.ts espera)
export default router;