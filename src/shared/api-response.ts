/**
 * ============================================================================
 * API RESPONSE HELPERS - TechLog Clinic OS
 * ============================================================================
 *
 * Funções helper para padronizar respostas da API.
 * Garante consistência em todas as rotas.
 *
 * @usage
 * import { ApiResponse, success, error, paginated } from '../shared/api-response';
 * res.json(success(data));
 * res.json(error('Mensagem de erro', 'ERROR_CODE'));
 */

import { Response } from 'express';

// ============================================================================
// TYPES
// ============================================================================

export interface ApiSuccessResponse<T> {
    success: true;
    data: T;
    meta?: {
        total?: number;
        page?: number;
        limit?: number;
        hasMore?: boolean;
    };
}

export interface ApiErrorResponse {
    success: false;
    error: string;
    code: string;
    errors?: Record<string, string[]>;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginationMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
}

// ============================================================================
// RESPONSE BUILDERS
// ============================================================================

/**
 * Cria uma resposta de sucesso padronizada
 */
export function success<T>(data: T, meta?: ApiSuccessResponse<T>['meta']): ApiSuccessResponse<T> {
    const response: ApiSuccessResponse<T> = {
        success: true,
        data,
    };

    if (meta) {
        response.meta = meta;
    }

    return response;
}

/**
 * Cria uma resposta de erro padronizada
 */
export function error(
    message: string,
    code: string = 'ERROR',
    errors?: Record<string, string[]>
): ApiErrorResponse {
    const response: ApiErrorResponse = {
        success: false,
        error: message,
        code,
    };

    if (errors) {
        response.errors = errors;
    }

    return response;
}

/**
 * Cria uma resposta paginada
 */
export function paginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
): ApiSuccessResponse<T[]> {
    const totalPages = Math.ceil(total / limit);
    return success(data, {
        total,
        page,
        limit,
        hasMore: page < totalPages,
    });
}

// ============================================================================
// RESPONSE SENDERS (Express Helpers)
// ============================================================================

/**
 * Envia resposta de sucesso
 */
export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200): void {
    res.status(statusCode).json(success(data));
}

/**
 * Envia resposta de criação bem-sucedida
 */
export function sendCreated<T>(res: Response, data: T): void {
    res.status(201).json(success(data));
}

/**
 * Envia resposta de erro
 */
export function sendError(
    res: Response,
    message: string,
    code: string,
    statusCode: number = 500,
    errors?: Record<string, string[]>
): void {
    res.status(statusCode).json(error(message, code, errors));
}

/**
 * Envia erro de validação (400)
 */
export function sendValidationError(
    res: Response,
    message: string,
    errors?: Record<string, string[]>
): void {
    sendError(res, message, 'VALIDATION_ERROR', 400, errors);
}

/**
 * Envia erro não encontrado (404)
 */
export function sendNotFound(res: Response, message: string = 'Recurso não encontrado'): void {
    sendError(res, message, 'NOT_FOUND', 404);
}

/**
 * Envia erro não autorizado (401)
 */
export function sendUnauthorized(res: Response, message: string = 'Não autorizado'): void {
    sendError(res, message, 'UNAUTHORIZED', 401);
}

/**
 * Envia erro proibido (403)
 */
export function sendForbidden(res: Response, message: string = 'Acesso negado'): void {
    sendError(res, message, 'FORBIDDEN', 403);
}

/**
 * Envia erro interno (500)
 */
export function sendInternalError(
    res: Response,
    message: string = 'Erro interno do servidor'
): void {
    sendError(res, message, 'INTERNAL_ERROR', 500);
}

/**
 * Envia resposta paginada
 */
export function sendPaginated<T>(
    res: Response,
    data: T[],
    total: number,
    page: number,
    limit: number
): void {
    res.json(paginated(data, total, page, limit));
}

// ============================================================================
// COMMON RESPONSES
// ============================================================================

export const CommonResponses = {
    CLINIC_NOT_IDENTIFIED: error('Clínica não identificada', 'CLINIC_NOT_IDENTIFIED'),
    INVALID_ID: error('ID inválido', 'INVALID_ID'),
    NOT_FOUND: error('Recurso não encontrado', 'NOT_FOUND'),
    UNAUTHORIZED: error('Não autorizado', 'UNAUTHORIZED'),
    FORBIDDEN: error('Acesso negado', 'FORBIDDEN'),
    NO_FIELDS_TO_UPDATE: error('Nenhum campo para atualizar', 'NO_FIELDS_TO_UPDATE'),
};
