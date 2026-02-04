import { Request, Response } from 'express';
import { db } from '../database';

export class FinancialController {
    private static readonly ALLOWED_PAYMENT_METHODS = ['pix', 'credit', 'debit', 'cash'];
    private static readonly ALLOWED_CATEGORIES = [
        'Consulta',
        'Procedimento',
        'Aluguel',
        'Material',
        'Outros',
    ];
    /**
     * GET /api/financial/transactions
     */
    static listTransactions(req: Request, res: Response): void {
        const clinicId = req.clinicId;

        if (!clinicId) {
            res.status(401).json({ error: 'Clínica não identificada' });
            return;
        }

        db.all(
            `SELECT * FROM transactions
             WHERE clinic_id = ?
             ORDER BY COALESCE(paid_at, due_date, created_at) DESC`,
            [clinicId],
            (err, rows) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }

                res.json(rows || []);
            }
        );
    }

    /**
     * GET /api/financial/transactions/:id
     */
    static getTransaction(req: Request, res: Response): void {
        const clinicId = req.clinicId;
        const { id } = req.params;

        if (!clinicId) {
            res.status(401).json({ error: 'Clínica não identificada' });
            return;
        }

        db.get(
            `SELECT * FROM transactions WHERE id = ? AND clinic_id = ?`,
            [id, clinicId],
            (err, row) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }

                if (!row) {
                    res.status(404).json({ error: 'Transação não encontrada' });
                    return;
                }

                res.json(row);
            }
        );
    }

    /**
     * POST /api/financial/transactions
     */
    static createTransaction(req: Request, res: Response): void {
        const clinicId = req.clinicId;
        const {
            patient_id,
            appointment_id,
            type,
            amount,
            category,
            payment_method,
            status = 'pending',
            due_date,
            paid_at,
        } = req.body || {};

        if (!clinicId) {
            res.status(401).json({ error: 'Clínica não identificada' });
            return;
        }

        // ========== VALIDAÇÃO CRÍTICA: Campos Obrigatórios ==========
        if (!type || amount === undefined || amount === null || !category || !payment_method) {
            res.status(400).json({
                error: 'Campos obrigatórios: type, amount, category, payment_method',
            });
            return;
        }

        // ========== VALIDAÇÃO CRÍTICA: Tipo de Transaction ==========
        const validTypes = ['income', 'expense'];
        if (!validTypes.includes(type)) {
            res.status(400).json({
                error: `Tipo inválido. Use: ${validTypes.join(', ')}`,
            });
            return;
        }

        // ========== VALIDAÇÃO CRÍTICA: Amount (Tipo Number) ==========
        if (typeof amount !== 'number' || isNaN(amount)) {
            res.status(400).json({
                error: 'O campo "amount" deve ser um número válido',
            });
            return;
        }

        // ========== VALIDAÇÃO CRÍTICA: Amount Positivo ==========
        if (amount <= 0) {
            res.status(400).json({
                error: 'O valor deve ser positivo',
            });
            return;
        }

        const normalizedPayment = String(payment_method).toLowerCase();
        const normalizedCategory = String(category).trim();
        const allowedCategories = FinancialController.ALLOWED_CATEGORIES.map((item) =>
            item.toLowerCase()
        );

        if (!FinancialController.ALLOWED_PAYMENT_METHODS.includes(normalizedPayment)) {
            res.status(400).json({ error: 'Forma de pagamento inválida' });
            return;
        }

        if (!allowedCategories.includes(normalizedCategory.toLowerCase())) {
            res.status(400).json({ error: 'Categoria inválida' });
            return;
        }

        db.run(
            `INSERT INTO transactions (
                clinic_id, patient_id, appointment_id, type, amount, category, payment_method, status, due_date, paid_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                clinicId,
                patient_id || null,
                appointment_id || null,
                type,
                amount,
                normalizedCategory,
                normalizedPayment,
                status,
                due_date || null,
                paid_at || null,
            ],
            function (err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }

                res.status(201).json({
                    id: this.lastID,
                    clinic_id: clinicId,
                    patient_id: patient_id || null,
                    appointment_id: appointment_id || null,
                    type,
                    amount,
                    category: normalizedCategory,
                    payment_method: normalizedPayment,
                    status,
                    due_date: due_date || null,
                    paid_at: paid_at || null,
                });
            }
        );
    }

    /**
     * PATCH /api/financial/transactions/:id
     */
    static updateTransaction(req: Request, res: Response): void {
        const clinicId = req.clinicId;
        const { id } = req.params;
        const {
            patient_id,
            appointment_id,
            type,
            amount,
            category,
            payment_method,
            status,
            due_date,
            paid_at,
        } = req.body || {};

        if (!clinicId) {
            res.status(401).json({ error: 'Clínica não identificada' });
            return;
        }

        const fields: string[] = [];
        const params: Array<string | number | null> = [];

        if (patient_id !== undefined) {
            fields.push('patient_id = ?');
            params.push(patient_id || null);
        }
        if (appointment_id !== undefined) {
            fields.push('appointment_id = ?');
            params.push(appointment_id || null);
        }
        if (type !== undefined) {
            fields.push('type = ?');
            params.push(type);
        }
        if (amount !== undefined) {
            fields.push('amount = ?');
            params.push(amount);
        }
        if (category !== undefined) {
            fields.push('category = ?');
            params.push(category);
        }
        if (payment_method !== undefined) {
            fields.push('payment_method = ?');
            params.push(payment_method);
        }
        if (status !== undefined) {
            fields.push('status = ?');
            params.push(status);
        }
        if (due_date !== undefined) {
            fields.push('due_date = ?');
            params.push(due_date || null);
        }
        if (paid_at !== undefined) {
            fields.push('paid_at = ?');
            params.push(paid_at || null);
        }

        if (!fields.length) {
            res.status(400).json({ error: 'Nenhum campo para atualizar' });
            return;
        }

        params.push(String(id), clinicId);

        db.run(
            `UPDATE transactions
             SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
             WHERE id = ? AND clinic_id = ?`,
            params,
            function (err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }

                if (this.changes === 0) {
                    res.status(404).json({ error: 'Transação não encontrada' });
                    return;
                }

                res.json({ success: true, id });
            }
        );
    }

    /**
     * DELETE /api/financial/transactions/:id
     */
    static deleteTransaction(req: Request, res: Response): void {
        const clinicId = req.clinicId;
        const { id } = req.params;

        if (!clinicId) {
            res.status(401).json({ error: 'Clínica não identificada' });
            return;
        }

        db.run(
            `DELETE FROM transactions WHERE id = ? AND clinic_id = ?`,
            [id, clinicId],
            function (err) {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }

                if (this.changes === 0) {
                    res.status(404).json({ error: 'Transação não encontrada' });
                    return;
                }

                res.json({ success: true, id });
            }
        );
    }

    /**
     * GET /api/financial/dashboard
     */
    static dashboard(req: Request, res: Response): void {
        const clinicId = req.clinicId;

        if (!clinicId) {
            res.status(401).json({ error: 'Clínica não identificada' });
            return;
        }

        const query = `
            SELECT
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS daily_balance,
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS monthly_income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS monthly_expense
            FROM transactions
            WHERE clinic_id = ?
              AND status = 'paid'
              AND paid_at IS NOT NULL
              AND strftime('%Y-%m', paid_at) = strftime('%Y-%m', 'now')
        `;

        const dailyQuery = `
            SELECT
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS daily_balance
            FROM transactions
            WHERE clinic_id = ?
              AND status = 'paid'
              AND paid_at IS NOT NULL
              AND date(paid_at) = date('now')
        `;

        db.get(dailyQuery, [clinicId], (dailyErr, dailyRow) => {
            if (dailyErr) {
                res.status(500).json({ error: dailyErr.message });
                return;
            }

            db.get(query, [clinicId], (err, row) => {
                if (err) {
                    res.status(500).json({ error: err.message });
                    return;
                }

                res.json({
                    daily_balance: (dailyRow as any)?.daily_balance ?? 0,
                    monthly_income: (row as any)?.monthly_income ?? 0,
                    monthly_expense: (row as any)?.monthly_expense ?? 0,
                });
            });
        });
    }

    /**
     * GET /api/financial/report?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
     */
    static getFinancialReport(req: Request, res: Response): void {
        const clinicId = req.clinicId;
        const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

        if (!clinicId) {
            res.status(401).json({ error: 'Clínica não identificada' });
            return;
        }

        if (!startDate || !endDate) {
            res.status(400).json({ error: 'startDate e endDate são obrigatórios' });
            return;
        }

        const dateFilter = `date(COALESCE(paid_at, due_date, created_at)) BETWEEN date(?) AND date(?)`;
        const baseParams = [clinicId, startDate, endDate];

        const summaryQuery = `
            SELECT
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense,
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) -
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS balance
            FROM transactions
            WHERE clinic_id = ?
              AND ${dateFilter}
        `;

        const categoryQuery = `
            SELECT category, type, COALESCE(SUM(amount), 0) AS amount
            FROM transactions
            WHERE clinic_id = ?
              AND ${dateFilter}
            GROUP BY category, type
            ORDER BY type ASC, amount DESC
        `;

        const paymentQuery = `
            SELECT payment_method, COALESCE(SUM(amount), 0) AS amount
            FROM transactions
            WHERE clinic_id = ?
              AND ${dateFilter}
              AND type = 'income'
            GROUP BY payment_method
            ORDER BY amount DESC
        `;

        db.get(summaryQuery, baseParams, (summaryErr, summaryRow) => {
            if (summaryErr) {
                res.status(500).json({ error: summaryErr.message });
                return;
            }

            db.all(categoryQuery, baseParams, (categoryErr, categoryRows) => {
                if (categoryErr) {
                    res.status(500).json({ error: categoryErr.message });
                    return;
                }

                db.all(paymentQuery, baseParams, (paymentErr, paymentRows) => {
                    if (paymentErr) {
                        res.status(500).json({ error: paymentErr.message });
                        return;
                    }

                    res.json({
                        summary: {
                            total_income: (summaryRow as any)?.total_income ?? 0,
                            total_expense: (summaryRow as any)?.total_expense ?? 0,
                            balance: (summaryRow as any)?.balance ?? 0,
                        },
                        by_category: categoryRows || [],
                        by_payment_method: paymentRows || [],
                    });
                });
            });
        });
    }
}
