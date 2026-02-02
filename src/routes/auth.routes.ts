/**
 * ============================================================================
 * AUTH ROUTES - Guardião Único de Autenticação
 * ============================================================================
 *
 * TODAS as rotas de autenticação devem estar aqui.
 * NÃO criar rotas de login em outros arquivos.
 *
 * Endpoints:
 * - POST /api/auth/login - Login principal
 * - POST /api/login      - Alias para compatibilidade (redireciona para /api/auth/login)
 */

import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();

// Rota principal de login
router.post('/login', AuthController.login);

// Rota de verificação de token (útil para frontend)
router.get('/verify', AuthController.verifyToken);

// Rota de refresh token (futuro)
// router.post('/refresh', AuthController.refreshToken);

export default router;
