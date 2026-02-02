/**
 * ============================================================================
 * ERROR HANDLER MIDDLEWARE - TechLog Clinic OS
 * ============================================================================
 *
 * Middleware centralizado para tratamento de erros.
 * Garante que TODAS as respostas de erro sigam o mesmo formato.
 *
 * @usage Adicionar como ÚLTIMO middleware no Express:
 * app.use(errorHandler);
 */

import { Request, Response, NextFunction } from 'express';
import { AppError, isOperationalError, ValidationError } from '../shared/errors';

/**
 * Interface padrão de resposta de erro
 */
interface ErrorResponse {
    success: false;
    error: string;
    code: string;
    errors?: Record<string, string[]>;
    stack?: string;
}

/**
 * Middleware de tratamento de erros
 *
 * Converte todos os erros em uma resposta JSON padronizada
 */
export function errorHandler(error: Error, req: Request, res: Response, _next: NextFunction): void {
    // Log do erro (sempre, para debug)
    const timestamp = new Date().toISOString();
    const logPrefix = `[${timestamp}] ERROR ${req.method} ${req.path}`;

    if (isOperationalError(error)) {
        // Erros esperados (validação, not found, etc) - log simples
        console.error(`${logPrefix}: ${error.message}`);
    } else {
        // Erros inesperados (bugs) - log completo
        console.error(`${logPrefix}:`, error);
    }

    // Construir resposta
    const response: ErrorResponse = {
        success: false,
        error: error.message,
        code: 'INTERNAL_ERROR',
    };

    let statusCode = 500;

    // Se é um AppError, usar suas propriedades
    if (error instanceof AppError) {
        statusCode = error.statusCode;
        response.code = error.code;

        // Se é ValidationError, incluir detalhes
        if (error instanceof ValidationError && error.errors) {
            response.errors = error.errors;
        }
    } else {
        // Erro não tratado - não expor mensagem interna em produção
        if (process.env.NODE_ENV === 'production') {
            response.error = 'Erro interno do servidor';
        }
    }

    // Incluir stack trace apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
        response.stack = error.stack;
    }

    res.status(statusCode).json(response);
}

/**
 * Middleware para rotas não encontradas
 * Deve ser adicionado ANTES do errorHandler
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
    const error = new AppError(
        `Rota não encontrada: ${req.method} ${req.path}`,
        404,
        'ROUTE_NOT_FOUND'
    );
    next(error);
}

/**
 * Wrapper para async handlers
 * Captura erros de funções async e passa para o errorHandler
 *
 * @usage
 * router.get('/users', asyncHandler(async (req, res) => {
 *     const users = await UserService.findAll();
 *     res.json({ success: true, data: users });
 * }));
 */
export function asyncHandler(
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
