/**
 * ============================================================================
 * TRANSACTION REPOSITORY - TechLog Clinic OS
 * ============================================================================
 *
 * ÚNICO lugar onde queries SQL de transações financeiras devem existir.
 * Controllers e Services NUNCA devem escrever SQL diretamente.
 *
 * @usage
 * import { TransactionRepository } from '../repositories/transaction.repository';
 * const transaction = await TransactionRepository.findById(1, clinicId);
 */

import { dbAsync } from '../config/database.config';

// ============================================================================
// TYPES
// ============================================================================

export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'pending' | 'paid' | 'cancelled' | 'refunded';
export type PaymentMethod = 'pix' | 'credit' | 'debit' | 'cash' | 'boleto' | 'transfer';
export type TransactionCategory = 'Consulta' | 'Procedimento' | 'Aluguel' | 'Material' | 'Outros';

export interface Transaction {
    id: number;
    clinic_id: number;
    patient_id?: number;
    appointment_id?: number;
    type: TransactionType;
    amount: number;
    category: TransactionCategory;
    payment_method: PaymentMethod;
    status: TransactionStatus;
    description?: string;
    due_date?: string;
    paid_at?: string;
    created_at: string;
    updated_at?: string;
}

export interface CreateTransactionDTO {
    clinic_id: number;
    patient_id?: number | null;
    appointment_id?: number | null;
    type: TransactionType;
    amount: number;
    category: TransactionCategory | string;
    payment_method: PaymentMethod | string;
    status?: TransactionStatus;
    description?: string | null;
    due_date?: string | null;
    paid_at?: string | null;
}

export interface UpdateTransactionDTO {
    patient_id?: number | null;
    appointment_id?: number | null;
    type?: TransactionType;
    amount?: number;
    category?: TransactionCategory;
    payment_method?: PaymentMethod;
    status?: TransactionStatus;
    description?: string | null;
    due_date?: string | null;
    paid_at?: string | null;
}

export interface TransactionFilters {
    type?: TransactionType;
    status?: TransactionStatus;
    category?: TransactionCategory | string;
    payment_method?: PaymentMethod | string;
    patient_id?: number;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
}

export interface TransactionSummary {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    pendingIncome: number;
    pendingExpense: number;
    byCategory: { category: string; total: number; count: number }[];
    byPaymentMethod: { payment_method: string; total: number; count: number }[];
}

// ============================================================================
// REPOSITORY
// ============================================================================

export class TransactionRepository {
    /**
     * Busca transação por ID
     */
    static async findById(id: number, clinicId: number): Promise<Transaction | null> {
        return dbAsync.get<Transaction>(
            `SELECT * FROM transactions WHERE id = ? AND clinic_id = ?`,
            [id, clinicId]
        );
    }

    /**
     * Busca todas as transações da clínica
     */
    static async findAll(
        clinicId: number,
        filters: TransactionFilters = {}
    ): Promise<Transaction[]> {
        let sql = `SELECT * FROM transactions WHERE clinic_id = ?`;
        const params: any[] = [clinicId];

        if (filters.type) {
            sql += ` AND type = ?`;
            params.push(filters.type);
        }

        if (filters.status) {
            sql += ` AND status = ?`;
            params.push(filters.status);
        }

        if (filters.category) {
            sql += ` AND LOWER(category) = LOWER(?)`;
            params.push(filters.category);
        }

        if (filters.payment_method) {
            sql += ` AND payment_method = ?`;
            params.push(filters.payment_method);
        }

        if (filters.patient_id) {
            sql += ` AND patient_id = ?`;
            params.push(filters.patient_id);
        }

        if (filters.startDate) {
            sql += ` AND date(COALESCE(paid_at, due_date, created_at)) >= date(?)`;
            params.push(filters.startDate);
        }

        if (filters.endDate) {
            sql += ` AND date(COALESCE(paid_at, due_date, created_at)) <= date(?)`;
            params.push(filters.endDate);
        }

        sql += ` ORDER BY COALESCE(paid_at, due_date, created_at) DESC`;

        if (filters.limit) {
            sql += ` LIMIT ?`;
            params.push(filters.limit);
            if (filters.offset) {
                sql += ` OFFSET ?`;
                params.push(filters.offset);
            }
        }

        return dbAsync.all<Transaction>(sql, params);
    }

    /**
     * Cria uma nova transação
     */
    static async create(data: CreateTransactionDTO): Promise<number> {
        const sql = `
            INSERT INTO transactions (
                clinic_id, patient_id, appointment_id, type, amount, 
                category, payment_method, status, description, due_date, paid_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            data.clinic_id,
            data.patient_id || null,
            data.appointment_id || null,
            data.type,
            data.amount,
            data.category,
            data.payment_method,
            data.status || 'pending',
            data.description || null,
            data.due_date || null,
            data.paid_at || null,
        ];

        const result = await dbAsync.run(sql, params);
        return result.lastID;
    }

    /**
     * Atualiza uma transação
     */
    static async update(id: number, clinicId: number, data: UpdateTransactionDTO): Promise<number> {
        const fields: string[] = [];
        const params: any[] = [];

        if (data.patient_id !== undefined) {
            fields.push('patient_id = ?');
            params.push(data.patient_id);
        }
        if (data.appointment_id !== undefined) {
            fields.push('appointment_id = ?');
            params.push(data.appointment_id);
        }
        if (data.type !== undefined) {
            fields.push('type = ?');
            params.push(data.type);
        }
        if (data.amount !== undefined) {
            fields.push('amount = ?');
            params.push(data.amount);
        }
        if (data.category !== undefined) {
            fields.push('category = ?');
            params.push(data.category);
        }
        if (data.payment_method !== undefined) {
            fields.push('payment_method = ?');
            params.push(data.payment_method);
        }
        if (data.status !== undefined) {
            fields.push('status = ?');
            params.push(data.status);
        }
        if (data.description !== undefined) {
            fields.push('description = ?');
            params.push(data.description);
        }
        if (data.due_date !== undefined) {
            fields.push('due_date = ?');
            params.push(data.due_date);
        }
        if (data.paid_at !== undefined) {
            fields.push('paid_at = ?');
            params.push(data.paid_at);
        }

        if (fields.length === 0) {
            return 0;
        }

        fields.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id, clinicId);

        const sql = `
            UPDATE transactions 
            SET ${fields.join(', ')}
            WHERE id = ? AND clinic_id = ?
        `;

        const result = await dbAsync.run(sql, params);
        return result.changes;
    }

    /**
     * Deleta uma transação
     */
    static async delete(id: number, clinicId: number): Promise<number> {
        const result = await dbAsync.run(
            `DELETE FROM transactions WHERE id = ? AND clinic_id = ?`,
            [id, clinicId]
        );
        return result.changes;
    }

    /**
     * Marca transação como paga
     */
    static async markAsPaid(id: number, clinicId: number, paidAt?: string): Promise<number> {
        const result = await dbAsync.run(
            `UPDATE transactions 
             SET status = 'paid', paid_at = COALESCE(?, CURRENT_TIMESTAMP), updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND clinic_id = ?`,
            [paidAt || null, id, clinicId]
        );
        return result.changes;
    }

    /**
     * Cancela uma transação
     */
    static async cancel(id: number, clinicId: number): Promise<number> {
        const result = await dbAsync.run(
            `UPDATE transactions 
             SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND clinic_id = ?`,
            [id, clinicId]
        );
        return result.changes;
    }

    /**
     * Retorna resumo financeiro da clínica
     */
    static async getSummary(
        clinicId: number,
        startDate?: string,
        endDate?: string
    ): Promise<TransactionSummary> {
        let dateFilter = '';
        const params: any[] = [clinicId];

        if (startDate && endDate) {
            dateFilter = ` AND date(COALESCE(paid_at, due_date, created_at)) BETWEEN date(?) AND date(?)`;
            params.push(startDate, endDate);
        }

        // Totais gerais
        const totalsQuery = `
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' AND status = 'paid' THEN amount ELSE 0 END), 0) as totalIncome,
                COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'paid' THEN amount ELSE 0 END), 0) as totalExpense,
                COALESCE(SUM(CASE WHEN type = 'income' AND status = 'pending' THEN amount ELSE 0 END), 0) as pendingIncome,
                COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'pending' THEN amount ELSE 0 END), 0) as pendingExpense
            FROM transactions
            WHERE clinic_id = ? AND status != 'cancelled'${dateFilter}
        `;

        const totals = await dbAsync.get<{
            totalIncome: number;
            totalExpense: number;
            pendingIncome: number;
            pendingExpense: number;
        }>(totalsQuery, params);

        // Por categoria
        const byCategory = await dbAsync.all<{ category: string; total: number; count: number }>(
            `SELECT category, SUM(amount) as total, COUNT(*) as count
             FROM transactions
             WHERE clinic_id = ? AND status = 'paid'${dateFilter}
             GROUP BY category`,
            params
        );

        // Por método de pagamento
        const byPaymentMethod = await dbAsync.all<{
            payment_method: string;
            total: number;
            count: number;
        }>(
            `SELECT payment_method, SUM(amount) as total, COUNT(*) as count
             FROM transactions
             WHERE clinic_id = ? AND status = 'paid'${dateFilter}
             GROUP BY payment_method`,
            params
        );

        return {
            totalIncome: totals?.totalIncome || 0,
            totalExpense: totals?.totalExpense || 0,
            balance: (totals?.totalIncome || 0) - (totals?.totalExpense || 0),
            pendingIncome: totals?.pendingIncome || 0,
            pendingExpense: totals?.pendingExpense || 0,
            byCategory,
            byPaymentMethod,
        };
    }

    /**
     * Busca transações de um paciente
     */
    static async findByPatient(patientId: number, clinicId: number): Promise<Transaction[]> {
        return dbAsync.all<Transaction>(
            `SELECT * FROM transactions 
             WHERE patient_id = ? AND clinic_id = ?
             ORDER BY created_at DESC`,
            [patientId, clinicId]
        );
    }

    /**
     * Conta transações por filtro
     */
    static async count(clinicId: number, filters: TransactionFilters = {}): Promise<number> {
        let sql = `SELECT COUNT(*) as count FROM transactions WHERE clinic_id = ?`;
        const params: any[] = [clinicId];

        if (filters.type) {
            sql += ` AND type = ?`;
            params.push(filters.type);
        }

        if (filters.status) {
            sql += ` AND status = ?`;
            params.push(filters.status);
        }

        const result = await dbAsync.get<{ count: number }>(sql, params);
        return result?.count || 0;
    }
}
