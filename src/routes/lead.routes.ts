import { Router } from 'express';
import { LeadController } from '../controllers/LeadController';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

// Definição das Rotas
router.post('/', LeadController.create); // Público (widget)
router.get('/', tenantMiddleware, LeadController.index);

// CRITICAL: Dashboard route BEFORE /:id routes to avoid Express treating 'dashboard' as an ID
router.get('/dashboard', tenantMiddleware, LeadController.metrics);

// Archive routes must come BEFORE generic /:id routes
router.put('/:id/archive', tenantMiddleware, LeadController.archive);
router.put('/:id/unarchive', tenantMiddleware, LeadController.unarchive);

// Generic CRUD routes
router.patch('/:id', tenantMiddleware, LeadController.update);
router.delete('/:id', tenantMiddleware, LeadController.delete);

// ATENÇÃO: Exportação Default (É isso que o server.ts espera)
export default router;