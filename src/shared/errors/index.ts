/**
 * ============================================================================
 * CUSTOM ERROR CLASSES - TechLog Clinic OS
 * ============================================================================
 *
 * Classes de erro padronizadas para toda a aplicação.
 * Use estas classes ao invés de throw new Error().
 *
 * @usage
 * import { NotFoundError, ValidationError } from '../shared/errors';
 * throw new NotFoundError('Paciente não encontrado');
 */

import { HTTP_STATUS } from '../../config/constants';

/**
 * Classe base para erros da aplicação
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly isOperational: boolean;

    constructor(
        message: string,
        statusCode: number = HTTP_STATUS.SERVER_ERROR,
        code: string = 'INTERNAL_ERROR'
    ) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true; // Indica que é um erro esperado, não um bug

        // Mantém o stack trace correto
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Erro 400 - Requisição inválida
 */
export class BadRequestError extends AppError {
    constructor(message: string = 'Requisição inválida') {
        super(message, HTTP_STATUS.BAD_REQUEST, 'BAD_REQUEST');
    }
}

/**
 * Erro 401 - Não autorizado (falha de autenticação)
 */
export class UnauthorizedError extends AppError {
    constructor(message: string = 'Não autorizado') {
        super(message, HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED');
    }
}

/**
 * Erro 403 - Proibido (autenticado, mas sem permissão)
 */
export class ForbiddenError extends AppError {
    constructor(message: string = 'Acesso negado') {
        super(message, HTTP_STATUS.FORBIDDEN, 'FORBIDDEN');
    }
}

/**
 * Erro 404 - Recurso não encontrado
 */
export class NotFoundError extends AppError {
    constructor(message: string = 'Recurso não encontrado') {
        super(message, HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
    }
}

/**
 * Erro 409 - Conflito (ex: registro duplicado)
 */
export class ConflictError extends AppError {
    constructor(message: string = 'Conflito de dados') {
        super(message, HTTP_STATUS.CONFLICT, 'CONFLICT');
    }
}

/**
 * Erro 422 - Entidade não processável (validação de negócio)
 */
export class ValidationError extends AppError {
    public readonly errors?: Record<string, string[]>;

    constructor(message: string = 'Erro de validação', errors?: Record<string, string[]>) {
        super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR');
        this.errors = errors;
    }
}

/**
 * Erro 429 - Muitas requisições (rate limit)
 */
export class TooManyRequestsError extends AppError {
    public readonly retryAfter?: number;

    constructor(message: string = 'Muitas requisições', retryAfterMinutes?: number) {
        super(message, HTTP_STATUS.TOO_MANY_REQUESTS, 'TOO_MANY_REQUESTS');
        this.retryAfter = retryAfterMinutes;
    }
}

/**
 * Erro 500 - Erro interno do servidor
 */
export class InternalError extends AppError {
    constructor(message: string = 'Erro interno do servidor') {
        super(message, HTTP_STATUS.SERVER_ERROR, 'INTERNAL_ERROR');
    }
}

/**
 * Erro de banco de dados
 */
export class DatabaseError extends AppError {
    constructor(message: string = 'Erro no banco de dados') {
        super(message, HTTP_STATUS.SERVER_ERROR, 'DATABASE_ERROR');
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Verifica se um erro é um AppError operacional
 */
export function isOperationalError(error: Error): error is AppError {
    return error instanceof AppError && error.isOperational;
}

/**
 * Cria um erro a partir de um erro do Zod
 */
export function fromZodError(zodError: any): ValidationError {
    const errors: Record<string, string[]> = {};

    if (zodError.errors) {
        for (const err of zodError.errors) {
            const path = err.path.join('.');
            if (!errors[path]) {
                errors[path] = [];
            }
            errors[path].push(err.message);
        }
    }

    const firstError = Object.values(errors).flat()[0] || 'Erro de validação';
    return new ValidationError(firstError, errors);
}
