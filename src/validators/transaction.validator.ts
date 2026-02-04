/**
 * ============================================================================
 * TRANSACTION VALIDATOR - TechLog Clinic OS
 * ============================================================================
 *
 * Validação de dados de transações financeiras usando Zod.
 * Centraliza todas as regras de validação em um único lugar.
 *
 * @usage
 * import { createTransactionSchema } from '../validators/transaction.validator';
 * const result = createTransactionSchema.safeParse(req.body);
 */

import { z } from 'zod';

// ============================================================================
// ENUMS E CONSTANTES
// ============================================================================

export const TRANSACTION_TYPES = ['income', 'expense'] as const;
export const TRANSACTION_STATUSES = ['pending', 'paid', 'cancelled', 'refunded'] as const;
export const PAYMENT_METHODS = ['pix', 'credit', 'debit', 'cash', 'boleto', 'transfer'] as const;
export const TRANSACTION_CATEGORIES = [
    'Consulta',
    'Procedimento',
    'Aluguel',
    'Material',
    'Outros',
] as const;

// ============================================================================
// SCHEMAS
// ============================================================================

/**
 * Schema para criação de transação
 */
export const createTransactionSchema = z.object({
    patient_id: z
        .number({ message: 'ID do paciente deve ser um número' })
        .int()
        .positive()
        .optional()
        .nullable(),

    appointment_id: z
        .number({ message: 'ID do agendamento deve ser um número' })
        .int()
        .positive()
        .optional()
        .nullable(),

    type: z.enum(TRANSACTION_TYPES, {
        message: `Tipo deve ser: ${TRANSACTION_TYPES.join(', ')}`,
    }),

    amount: z
        .number({ message: 'Valor deve ser um número' })
        .positive({ message: 'Valor deve ser positivo' })
        .max(999999999, { message: 'Valor máximo excedido' }),

    category: z
        .enum(TRANSACTION_CATEGORIES, {
            message: `Categoria deve ser: ${TRANSACTION_CATEGORIES.join(', ')}`,
        })
        .or(
            z
                .string()
                .min(1, 'Categoria é obrigatória')
                .max(50, 'Categoria deve ter no máximo 50 caracteres')
                .transform((val) => {
                    // Normaliza para aceitar variações de case
                    const normalized = val.trim();
                    const found = TRANSACTION_CATEGORIES.find(
                        (c) => c.toLowerCase() === normalized.toLowerCase()
                    );
                    return found || normalized;
                })
        ),

    payment_method: z
        .string()
        .min(1, 'Método de pagamento é obrigatório')
        .transform((val) => val.toLowerCase())
        .refine((val) => PAYMENT_METHODS.includes(val as any), {
            message: `Forma de pagamento inválida. Valores aceitos: ${PAYMENT_METHODS.join(', ')}`,
        }),

    status: z
        .enum(TRANSACTION_STATUSES, {
            message: `Status deve ser: ${TRANSACTION_STATUSES.join(', ')}`,
        })
        .optional()
        .default('pending'),

    description: z
        .string()
        .max(500, 'Descrição deve ter no máximo 500 caracteres')
        .optional()
        .nullable(),

    due_date: z
        .string()
        .refine((val) => !val || /^\d{4}-\d{2}-\d{2}(T|\s)\d{2}:\d{2}:\d{2}/.test(val), {
            message:
                'Data de vencimento deve estar no formato válido (YYYY-MM-DD HH:mm:ss ou ISO 8601)',
        })
        .optional()
        .nullable()
        .or(z.null()),

    paid_at: z
        .string()
        .refine((val) => !val || /^\d{4}-\d{2}-\d{2}(T|\s)\d{2}:\d{2}:\d{2}/.test(val), {
            message:
                'Data de pagamento deve estar no formato válido (YYYY-MM-DD HH:mm:ss ou ISO 8601)',
        })
        .optional()
        .nullable()
        .or(z.null()),
});

/**
 * Schema para atualização de transação
 */
export const updateTransactionSchema = z
    .object({
        patient_id: z.number().int().positive().optional().nullable().or(z.null()),

        appointment_id: z.number().int().positive().optional().nullable().or(z.null()),

        type: z
            .enum(TRANSACTION_TYPES, {
                message: `Tipo deve ser: ${TRANSACTION_TYPES.join(', ')}`,
            })
            .optional(),

        amount: z
            .number({ message: 'Valor deve ser um número' })
            .positive({ message: 'Valor deve ser positivo' })
            .optional(),

        category: z
            .enum(TRANSACTION_CATEGORIES, {
                message: `Categoria deve ser: ${TRANSACTION_CATEGORIES.join(', ')}`,
            })
            .or(z.string().min(1).max(50))
            .optional(),

        payment_method: z
            .enum(PAYMENT_METHODS, {
                message: `Método de pagamento deve ser: ${PAYMENT_METHODS.join(', ')}`,
            })
            .or(
                z
                    .string()
                    .min(1)
                    .transform((val) => val.toLowerCase())
            )
            .optional(),

        status: z
            .enum(TRANSACTION_STATUSES, {
                message: `Status deve ser: ${TRANSACTION_STATUSES.join(', ')}`,
            })
            .optional(),

        description: z.string().max(500).optional().nullable().or(z.null()),

        due_date: z.string().datetime().optional().nullable().or(z.null()),

        paid_at: z.string().datetime().optional().nullable().or(z.null()),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: 'Pelo menos um campo deve ser fornecido para atualização',
    });

/**
 * Schema para filtros de listagem
 */
export const transactionFiltersSchema = z.object({
    type: z.enum(TRANSACTION_TYPES).optional(),
    status: z.enum(TRANSACTION_STATUSES).optional(),
    category: z.string().optional(),
    payment_method: z.enum(PAYMENT_METHODS).optional(),
    patient_id: z.coerce.number().int().positive().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    offset: z.coerce.number().int().min(0).optional(),
});

// ============================================================================
// TYPES
// ============================================================================

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type TransactionFiltersInput = z.infer<typeof transactionFiltersSchema>;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Extrai a primeira mensagem de erro do resultado de validação Zod
 */
export function getFirstZodError(error: z.ZodError): string {
    const formatted = error.format();
    const firstError = Object.keys(formatted)
        .filter((k) => k !== '_errors')
        .map((k) => (formatted as any)[k]._errors?.[0])
        .find((e) => e);
    return firstError || 'Erro de validação';
}

/**
 * Valida se o payment_method é válido
 */
export function isValidPaymentMethod(method: string): boolean {
    return PAYMENT_METHODS.includes(method.toLowerCase() as any);
}

/**
 * Valida se a category é válida
 */
export function isValidCategory(category: string): boolean {
    return TRANSACTION_CATEGORIES.some((c) => c.toLowerCase() === category.toLowerCase());
}
