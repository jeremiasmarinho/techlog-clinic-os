import { Router } from 'express';
import { LeadController } from '../controllers/LeadController';
import { tenantMiddleware } from '../middleware/tenant.middleware';
import { auditLogger } from '../middleware/audit.middleware';

const router = Router();

// Definição das Rotas
router.post('/', LeadController.create); // Público (widget)
router.get('/', tenantMiddleware, auditLogger, LeadController.index);

// CRITICAL: Dashboard route BEFORE /:id routes to avoid Express treating 'dashboard' as an ID
router.get('/dashboard', tenantMiddleware, auditLogger, LeadController.metrics);

// Archive routes must come BEFORE generic /:id routes
router.put('/:id/archive', tenantMiddleware, auditLogger, LeadController.archive);
router.put('/:id/unarchive', tenantMiddleware, auditLogger, LeadController.unarchive);

// Generic CRUD routes
router.patch('/:id', tenantMiddleware, auditLogger, LeadController.update);
router.delete('/:id', tenantMiddleware, auditLogger, LeadController.delete);

// ATENÇÃO: Exportação Default (É isso que o server.ts espera)
export default router;
