import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Login (Público)
router.post('/login', UserController.login);

// CRUD de Usuários (Requer autenticação JWT)
router.get('/users', authMiddleware, UserController.index);
router.post('/users', authMiddleware, UserController.store);
router.delete('/users/:id', authMiddleware, UserController.delete);

export default router;
