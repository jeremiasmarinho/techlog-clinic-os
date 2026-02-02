/**
 * ============================================================================
 * FINANCIAL CONTROLLER - TechLog Clinic OS (Refatorado)
 * ============================================================================
 *
 * Controller de Transações Financeiras usando:
 * - TransactionRepository para acesso ao banco
 * - Validators Zod para validação
 * - Respostas padronizadas
 * - Async/Await (sem callbacks)
 *
 * @usage Rotas em routes/financial.routes.ts
 */

import { Request, Response } from 'express';
import { TransactionRepository, TransactionFilters } from '../repositories/transaction.repository';
import {
    createTransactionSchema,
    updateTransactionSchema,
    transactionFiltersSchema,
    getFirstZodError,
} from '../validators/transaction.validator';
import { sendSuccess, sendValidationError, sendNotFound, sendError } from '../shared/api-response';
import { asyncHandler } from '../middleware/error.middleware';

// Helper para extrair ID de params de forma segura
const getParamId = (id: string | string[]): number => parseInt(Array.isArray(id) ? id[0] : id, 10);

export class FinancialController {
    /**
     * GET /api/financial/transactions
     * Lista transações com filtros
     */
    static listTransactions = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const clinicId = req.clinicId;

        if (!clinicId) {
            sendError(res, 'Clínica não identificada', 'CLINIC_NOT_IDENTIFIED', 401);
            return;
        }

        // Validar filtros
        const filtersResult = transactionFiltersSchema.safeParse(req.query);
        const filters: TransactionFilters = filtersResult.success ? filtersResult.data : {};

        const transactions = await TransactionRepository.findAll(clinicId, filters);

        // Manter compatibilidade - retorna array direto
        res.json(transactions);
    });

    /**
     * GET /api/financial/transactions/:id
     * Busca transação por ID
     */
    static getTransaction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const clinicId = req.clinicId;
        const { id } = req.params;

        if (!clinicId) {
            sendError(res, 'Clínica não identificada', 'CLINIC_NOT_IDENTIFIED', 401);
            return;
        }

        const transaction = await TransactionRepository.findById(getParamId(id), clinicId);

        if (!transaction) {
            sendNotFound(res, 'Transação não encontrada');
            return;
        }

        res.json(transaction);
    });

    /**
     * POST /api/financial/transactions
     * Cria nova transação
     */
    static createTransaction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const clinicId = req.clinicId;

        if (!clinicId) {
            sendError(res, 'Clínica não identificada', 'CLINIC_NOT_IDENTIFIED', 401);
            return;
        }

        // Validar com Zod
        const result = createTransactionSchema.safeParse(req.body);
        if (!result.success) {
            sendValidationError(res, getFirstZodError(result.error));
            return;
        }

        const id = await TransactionRepository.create({
            ...result.data,
            clinic_id: clinicId,
            category: result.data.category as any,
            payment_method: result.data.payment_method as any,
        });

        // Buscar transação criada para retornar completa
        const transaction = await TransactionRepository.findById(id, clinicId);

        res.status(201).json(transaction);
    });

    /**
     * PATCH /api/financial/transactions/:id
     * Atualiza transação
     */
    static updateTransaction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const clinicId = req.clinicId;
        const { id } = req.params;

        if (!clinicId) {
            sendError(res, 'Clínica não identificada', 'CLINIC_NOT_IDENTIFIED', 401);
            return;
        }

        // Validar com Zod
        const result = updateTransactionSchema.safeParse(req.body);
        if (!result.success) {
            sendValidationError(res, getFirstZodError(result.error));
            return;
        }

        const changes = await TransactionRepository.update(
            getParamId(id),
            clinicId,
            result.data as any
        );

        if (changes === 0) {
            sendNotFound(res, 'Transação não encontrada');
            return;
        }

        sendSuccess(res, { success: true, id: getParamId(id) });
    });

    /**
     * DELETE /api/financial/transactions/:id
     * Remove transação
     */
    static deleteTransaction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const clinicId = req.clinicId;
        const { id } = req.params;

        if (!clinicId) {
            sendError(res, 'Clínica não identificada', 'CLINIC_NOT_IDENTIFIED', 401);
            return;
        }

        const changes = await TransactionRepository.delete(getParamId(id), clinicId);

        if (changes === 0) {
            sendNotFound(res, 'Transação não encontrada');
            return;
        }

        sendSuccess(res, { success: true, deleted: true });
    });

    /**
     * PATCH /api/financial/transactions/:id/pay
     * Marca transação como paga
     */
    static markAsPaid = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const clinicId = req.clinicId;
        const { id } = req.params;
        const { paid_at } = req.body || {};

        if (!clinicId) {
            sendError(res, 'Clínica não identificada', 'CLINIC_NOT_IDENTIFIED', 401);
            return;
        }

        const changes = await TransactionRepository.markAsPaid(getParamId(id), clinicId, paid_at);

        if (changes === 0) {
            sendNotFound(res, 'Transação não encontrada');
            return;
        }

        sendSuccess(res, { success: true, status: 'paid' });
    });

    /**
     * PATCH /api/financial/transactions/:id/cancel
     * Cancela transação
     */
    static cancelTransaction = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const clinicId = req.clinicId;
        const { id } = req.params;

        if (!clinicId) {
            sendError(res, 'Clínica não identificada', 'CLINIC_NOT_IDENTIFIED', 401);
            return;
        }

        const changes = await TransactionRepository.cancel(getParamId(id), clinicId);

        if (changes === 0) {
            sendNotFound(res, 'Transação não encontrada');
            return;
        }

        sendSuccess(res, { success: true, status: 'cancelled' });
    });

    /**
     * GET /api/financial/summary
     * Retorna resumo financeiro
     */
    static getSummary = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const clinicId = req.clinicId;
        const { startDate, endDate } = req.query;

        if (!clinicId) {
            sendError(res, 'Clínica não identificada', 'CLINIC_NOT_IDENTIFIED', 401);
            return;
        }

        const summary = await TransactionRepository.getSummary(
            clinicId,
            startDate as string,
            endDate as string
        );

        res.json(summary);
    });

    /**
     * GET /api/financial/patient/:patientId
     * Busca transações de um paciente
     */
    static getPatientTransactions = asyncHandler(
        async (req: Request, res: Response): Promise<void> => {
            const clinicId = req.clinicId;
            const { patientId } = req.params;

            if (!clinicId) {
                sendError(res, 'Clínica não identificada', 'CLINIC_NOT_IDENTIFIED', 401);
                return;
            }

            const transactions = await TransactionRepository.findByPatient(
                getParamId(patientId),
                clinicId
            );

            res.json(transactions);
        }
    );
}

export default FinancialController;
