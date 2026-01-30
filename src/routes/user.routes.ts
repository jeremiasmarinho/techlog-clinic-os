import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { tenantMiddleware, ensureClinicAdmin } from '../middleware/tenant.middleware';

const router = Router();

// Login (Público)
router.post('/login', UserController.login);

// CRUD de Usuários (Requer autenticação JWT + Admin)
router.get('/users', tenantMiddleware, ensureClinicAdmin, UserController.index);
router.post('/users', tenantMiddleware, ensureClinicAdmin, UserController.store);
router.delete('/users/:id', tenantMiddleware, ensureClinicAdmin, UserController.delete);

export default router;
