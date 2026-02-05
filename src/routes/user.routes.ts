import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { UserPreferencesController } from '../controllers/UserPreferencesController';
import { tenantMiddleware, ensureClinicAdmin } from '../middleware/tenant.middleware';
import { auditLogger } from '../middleware/audit.middleware';

const router = Router();

// ⚠️ NOTA: A rota POST /login foi movida para auth.routes.ts
// Use AuthController.login como ponto único de autenticação

// CRUD de Usuários (Requer autenticação JWT + Admin)
router.get('/users', tenantMiddleware, auditLogger, ensureClinicAdmin, UserController.index);
router.post('/users', tenantMiddleware, auditLogger, ensureClinicAdmin, UserController.store);
router.delete(
    '/users/:id',
    tenantMiddleware,
    auditLogger,
    ensureClinicAdmin,
    UserController.delete
);

// Perfil do usuário logado
router.patch('/users/profile', tenantMiddleware, auditLogger, UserController.updateProfile);

// Preferências do usuário logado (tema, etc.)
router.get('/user/preferences', tenantMiddleware, UserPreferencesController.getPreferences);
router.patch('/user/preferences', tenantMiddleware, UserPreferencesController.updatePreferences);

export default router;
