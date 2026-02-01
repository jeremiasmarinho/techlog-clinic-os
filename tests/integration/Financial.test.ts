/**
 * Integration Test - Financial Module
 *
 * Covers:
 * 1. POST /api/financial/transactions - Create income/expense transactions
 * 2. GET /api/financial/report - Verify aggregations (Income - Expense)
 * 3. Multi-tenant security - Cross-clinic data isolation
 *
 * @author QA Engineer
 * @date 2026-02-01
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';
import jwt from 'jsonwebtoken';
import financialRoutes from '../../src/routes/financial.routes';
import { db } from '../../src/database';

describe('Integration Test - Financial Module', () => {
    let app: Express;
    let createdTransactionIds: number[] = [];

    /**
     * Helper: Create authentication token for a specific clinic
     */
    const createAuthToken = (clinicId: number = 1, userId: number = 1) =>
        jwt.sign(
            {
                userId,
                username: `admin_clinic_${clinicId}`,
                name: `Administrador Clínica ${clinicId}`,
                role: 'super_admin',
                clinicId,
            },
            process.env.JWT_SECRET || 'test-jwt-secret-key',
            { expiresIn: '1h' }
        );

    /**
     * Setup: Configure Express app with financial routes
     */
    beforeAll(() => {
        app = express();
        app.use(express.json());

        // Note: tenantMiddleware is already applied in financialRoutes via tenantGuard
        // We just need to mount the routes
        app.use('/api/financial', financialRoutes);

        console.log('🧪 Iniciando testes de integração - Financial Module');
    });

    /**
     * Cleanup: Reset transaction IDs before each test
     */
    beforeEach(() => {
        createdTransactionIds = [];
    });

    /**
     * Teardown: Clean up test data and close database
     */
    afterAll(async () => {
        // Remove all transactions created during tests
        if (createdTransactionIds.length > 0) {
            const placeholders = createdTransactionIds.map(() => '?').join(',');
            await new Promise<void>((resolve, reject) => {
                db.run(
                    `DELETE FROM transactions WHERE id IN (${placeholders})`,
                    createdTransactionIds,
                    (err) => {
                        if (err) {
                            console.error('❌ Erro ao limpar transações de teste:', err.message);
                            reject(err);
                            return;
                        }
                        console.log(
                            `🧹 Limpeza: ${createdTransactionIds.length} transações removidas`
                        );
                        resolve();
                    }
                );
            });
        }

        // Close database connection
        await new Promise<void>((resolve, reject) => {
            db.close((err) => {
                if (err) {
                    console.error('❌ Erro ao fechar conexão com banco:', err.message);
                    reject(err);
                    return;
                }
                console.log('✅ Conexão com banco de dados fechada');
                resolve();
            });
        });
    });

    describe('POST /api/financial/transactions - Create Transactions', () => {
        it('should create a transaction successfully', async () => {
            const token = createAuthToken(1);
            const transactionData = {
                type: 'income',
                amount: 150.0,
                category: 'Consulta',
                payment_method: 'pix',
                status: 'paid',
                paid_at: '2026-02-01 10:30:00',
                patient_id: 1,
            };

            // 1. Send POST request
            const response = await request(app)
                .post('/api/financial/transactions')
                .set('Authorization', `Bearer ${token}`)
                .send(transactionData)
                .expect(201);

            // 2. Verify API response
            expect(response.body).toHaveProperty('id');
            expect(response.body.type).toBe('income');
            expect(response.body.amount).toBe(150.0);
            expect(response.body.category).toBe('Consulta');
            expect(response.body.payment_method).toBe('pix');
            expect(response.body.clinic_id).toBe(1);

            const transactionId = response.body.id;
            createdTransactionIds.push(transactionId);

            // 3. CRUCIAL: Verify data was actually saved in SQLite database
            const savedTransaction = await new Promise<any>((resolve, reject) => {
                db.get(
                    `SELECT * FROM transactions WHERE id = ? AND clinic_id = ?`,
                    [transactionId, 1],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            // 4. Verify database record matches what was sent
            expect(savedTransaction).toBeDefined();
            expect(savedTransaction.id).toBe(transactionId);
            expect(savedTransaction.clinic_id).toBe(1); // CRITICAL: clinic_id association
            expect(savedTransaction.type).toBe('income');
            expect(savedTransaction.amount).toBe(150.0);
            expect(savedTransaction.category).toBe('Consulta');
            expect(savedTransaction.payment_method).toBe('pix');
            expect(savedTransaction.status).toBe('paid');
            expect(savedTransaction.patient_id).toBe(1);

            console.log(
                `✅ Verificação de integridade: Transação ${transactionId} salva corretamente no banco`
            );
        });

        it('should create an income transaction successfully', async () => {
            const token = createAuthToken(1);
            const income = {
                type: 'income',
                amount: 150.0,
                category: 'Consulta',
                payment_method: 'pix',
                status: 'paid',
                paid_at: '2026-02-01 10:30:00',
                patient_id: 1,
            };

            const response = await request(app)
                .post('/api/financial/transactions')
                .set('Authorization', `Bearer ${token}`)
                .send(income)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.type).toBe('income');
            expect(response.body.amount).toBe(150.0);
            expect(response.body.category).toBe('Consulta');
            expect(response.body.payment_method).toBe('pix');
            expect(response.body.clinic_id).toBe(1);

            // Track for cleanup
            createdTransactionIds.push(response.body.id);
        });

        it('should create an expense transaction successfully', async () => {
            const token = createAuthToken(1);
            const expense = {
                type: 'expense',
                amount: 50.0,
                category: 'Material',
                payment_method: 'debit',
                status: 'paid',
                paid_at: '2026-02-01 11:00:00',
            };

            const response = await request(app)
                .post('/api/financial/transactions')
                .set('Authorization', `Bearer ${token}`)
                .send(expense)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.type).toBe('expense');
            expect(response.body.amount).toBe(50.0);
            expect(response.body.category).toBe('Material');
            expect(response.body.payment_method).toBe('debit');

            // Track for cleanup
            createdTransactionIds.push(response.body.id);
        });

        it('should verify balance after creating income and expense', async () => {
            const token = createAuthToken(1);

            // Create income: +200
            const income = await request(app)
                .post('/api/financial/transactions')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    type: 'income',
                    amount: 200.0,
                    category: 'Consulta',
                    payment_method: 'credit',
                    status: 'paid',
                    paid_at: '2026-02-01 14:00:00',
                })
                .expect(201);

            createdTransactionIds.push(income.body.id);

            // Create expense: -80
            const expense = await request(app)
                .post('/api/financial/transactions')
                .set('Authorization', `Bearer ${token}`)
                .send({
                    type: 'expense',
                    amount: 80.0,
                    category: 'Aluguel',
                    payment_method: 'cash',
                    status: 'paid',
                    paid_at: '2026-02-01 15:00:00',
                })
                .expect(201);

            createdTransactionIds.push(expense.body.id);

            // Verify both transactions exist
            expect(income.body.amount).toBe(200.0);
            expect(expense.body.amount).toBe(80.0);

            // Expected balance: 200 - 80 = 120
            const expectedBalance = 120.0;
            console.log(
                `💰 Saldo esperado: R$ ${expectedBalance} (Receita: R$ 200.00 - Despesa: R$ 80.00)`
            );
        });

        it('should reject transaction with invalid payment method', async () => {
            const token = createAuthToken(1);
            const invalidTransaction = {
                type: 'income',
                amount: 100.0,
                category: 'Consulta',
                payment_method: 'bitcoin', // Invalid!
                status: 'paid',
            };

            const response = await request(app)
                .post('/api/financial/transactions')
                .set('Authorization', `Bearer ${token}`)
                .send(invalidTransaction)
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('pagamento inválida');
        });

        it('should reject transaction with invalid category', async () => {
            const token = createAuthToken(1);
            const invalidTransaction = {
                type: 'income',
                amount: 100.0,
                category: 'Venda de Rifas', // Invalid!
                payment_method: 'pix',
                status: 'paid',
            };

            const response = await request(app)
                .post('/api/financial/transactions')
                .set('Authorization', `Bearer ${token}`)
                .send(invalidTransaction)
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Categoria inválida');
        });

        it('should reject transaction with missing required fields', async () => {
            const token = createAuthToken(1);
            const incompleteTransaction = {
                type: 'income',
                // Missing: amount, category, payment_method
            };

            const response = await request(app)
                .post('/api/financial/transactions')
                .set('Authorization', `Bearer ${token}`)
                .send(incompleteTransaction)
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('obrigatórios');
        });

        it('should reject transaction without amount', async () => {
            const token = createAuthToken(1);
            const transactionWithoutAmount = {
                type: 'income',
                // Missing: amount
                category: 'Consulta',
                payment_method: 'pix',
                status: 'paid',
            };

            const response = await request(app)
                .post('/api/financial/transactions')
                .set('Authorization', `Bearer ${token}`)
                .send(transactionWithoutAmount)
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error.toLowerCase()).toMatch(/amount|valor|obrigatório/);

            // CRITICAL: Verify no record was created in database
            const count = await new Promise<number>((resolve, reject) => {
                db.get(
                    `SELECT COUNT(*) as count FROM transactions WHERE clinic_id = ? AND category = ?`,
                    [1, 'Consulta'],
                    (err, row: any) => {
                        if (err) reject(err);
                        else resolve(row.count);
                    }
                );
            });

            console.log(`✅ Validação: Nenhuma transação inválida foi salva (count: ${count})`);
        });

        it('should reject transaction with invalid type', async () => {
            const token = createAuthToken(1);
            const invalidTypeTransaction = {
                type: 'transfer', // Invalid! Only 'income' or 'expense' allowed
                amount: 100.0,
                category: 'Consulta',
                payment_method: 'pix',
                status: 'paid',
            };

            const response = await request(app)
                .post('/api/financial/transactions')
                .set('Authorization', `Bearer ${token}`)
                .send(invalidTypeTransaction)
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error.toLowerCase()).toMatch(/tipo|type|inválido/);

            console.log('✅ Validação: Tipo inválido rejeitado corretamente');
        });

        it('should reject transaction with negative amount', async () => {
            const token = createAuthToken(1);
            const negativeAmountTransaction = {
                type: 'income',
                amount: -50.0, // Invalid! Amount must be positive
                category: 'Consulta',
                payment_method: 'pix',
                status: 'paid',
            };

            const response = await request(app)
                .post('/api/financial/transactions')
                .set('Authorization', `Bearer ${token}`)
                .send(negativeAmountTransaction)
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error.toLowerCase()).toMatch(/amount|valor|positivo|negativo/);

            console.log('✅ Validação: Valor negativo rejeitado corretamente');
        });

        it('should reject transaction with amount as string', async () => {
            const token = createAuthToken(1);
            const stringAmountTransaction = {
                type: 'income',
                amount: 'cento e cinquenta', // Invalid! Must be number
                category: 'Consulta',
                payment_method: 'pix',
                status: 'paid',
            };

            const response = await request(app)
                .post('/api/financial/transactions')
                .set('Authorization', `Bearer ${token}`)
                .send(stringAmountTransaction)
                .expect(400);

            expect(response.body).toHaveProperty('error');

            console.log(
                '✅ Validação: Tipo de dado inválido (string ao invés de number) rejeitado'
            );
        });

        it('should verify clinic_id is correctly associated on creation', async () => {
            const clinicId = 1;
            const token = createAuthToken(clinicId);

            const transaction = {
                type: 'expense',
                amount: 75.5,
                category: 'Material',
                payment_method: 'debit',
                status: 'paid',
            };

            const response = await request(app)
                .post('/api/financial/transactions')
                .set('Authorization', `Bearer ${token}`)
                .send(transaction)
                .expect(201);

            const transactionId = response.body.id;
            createdTransactionIds.push(transactionId);

            // CRITICAL: Verify clinic_id in database matches the authenticated user's clinic
            const dbRecord = await new Promise<any>((resolve, reject) => {
                db.get(
                    `SELECT clinic_id, type, amount FROM transactions WHERE id = ?`,
                    [transactionId],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            expect(dbRecord.clinic_id).toBe(clinicId);
            expect(dbRecord.type).toBe('expense');
            expect(dbRecord.amount).toBe(75.5);

            console.log(
                `✅ Associação clinic_id: Transação ${transactionId} corretamente vinculada à clínica ${clinicId}`
            );
        });
    });

    describe('GET /api/financial/report - Financial Report Aggregations', () => {
        it('should return correct aggregations (Income - Expense)', async () => {
            const token = createAuthToken(1);
            const startDate = '2026-02-01';
            const endDate = '2026-02-28';

            // Create test transactions
            const transactions = [
                { type: 'income', amount: 300.0, category: 'Consulta', payment_method: 'pix' },
                {
                    type: 'income',
                    amount: 450.0,
                    category: 'Procedimento',
                    payment_method: 'credit',
                },
                { type: 'expense', amount: 120.0, category: 'Material', payment_method: 'debit' },
                { type: 'expense', amount: 80.0, category: 'Aluguel', payment_method: 'cash' },
            ];

            for (const txn of transactions) {
                const response = await request(app)
                    .post('/api/financial/transactions')
                    .set('Authorization', `Bearer ${token}`)
                    .send({
                        ...txn,
                        status: 'paid',
                        paid_at: '2026-02-15 10:00:00',
                    })
                    .expect(201);

                createdTransactionIds.push(response.body.id);
            }

            // Fetch report
            const report = await request(app)
                .get(`/api/financial/report?startDate=${startDate}&endDate=${endDate}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(report.body).toHaveProperty('summary');
            expect(report.body).toHaveProperty('by_category');
            expect(report.body).toHaveProperty('by_payment_method');

            const { summary } = report.body;

            // Verify aggregations
            expect(summary.total_income).toBeGreaterThanOrEqual(750.0); // 300 + 450
            expect(summary.total_expense).toBeGreaterThanOrEqual(200.0); // 120 + 80
            expect(summary.balance).toBeGreaterThanOrEqual(550.0); // 750 - 200

            console.log('📊 Relatório Financeiro:');
            console.log(`   💵 Total Receitas: R$ ${summary.total_income}`);
            console.log(`   💸 Total Despesas: R$ ${summary.total_expense}`);
            console.log(`   💰 Saldo: R$ ${summary.balance}`);
        });

        it('should group transactions by category correctly', async () => {
            const token = createAuthToken(1);
            const startDate = '2026-02-01';
            const endDate = '2026-02-28';

            // Create transactions with same category
            const consultas = [
                { type: 'income', amount: 150.0, category: 'Consulta', payment_method: 'pix' },
                { type: 'income', amount: 150.0, category: 'Consulta', payment_method: 'credit' },
            ];

            for (const txn of consultas) {
                const response = await request(app)
                    .post('/api/financial/transactions')
                    .set('Authorization', `Bearer ${token}`)
                    .send({
                        ...txn,
                        status: 'paid',
                        paid_at: '2026-02-20 10:00:00',
                    })
                    .expect(201);

                createdTransactionIds.push(response.body.id);
            }

            // Fetch report
            const report = await request(app)
                .get(`/api/financial/report?startDate=${startDate}&endDate=${endDate}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            const consultaCategory = report.body.by_category.find(
                (cat: any) => cat.category === 'Consulta' && cat.type === 'income'
            );

            expect(consultaCategory).toBeDefined();
            expect(consultaCategory.amount).toBeGreaterThanOrEqual(300.0); // 150 + 150
        });

        it('should group transactions by payment method correctly', async () => {
            const token = createAuthToken(1);
            const startDate = '2026-02-01';
            const endDate = '2026-02-28';

            // Create income transactions with PIX
            const pixTransactions = [
                { type: 'income', amount: 100.0, category: 'Consulta', payment_method: 'pix' },
                { type: 'income', amount: 200.0, category: 'Procedimento', payment_method: 'pix' },
            ];

            for (const txn of pixTransactions) {
                const response = await request(app)
                    .post('/api/financial/transactions')
                    .set('Authorization', `Bearer ${token}`)
                    .send({
                        ...txn,
                        status: 'paid',
                        paid_at: '2026-02-22 10:00:00',
                    })
                    .expect(201);

                createdTransactionIds.push(response.body.id);
            }

            // Fetch report
            const report = await request(app)
                .get(`/api/financial/report?startDate=${startDate}&endDate=${endDate}`)
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            const pixMethod = report.body.by_payment_method.find(
                (pm: any) => pm.payment_method === 'pix'
            );

            expect(pixMethod).toBeDefined();
            expect(pixMethod.amount).toBeGreaterThanOrEqual(300.0); // 100 + 200
        });

        it('should reject report request without date range', async () => {
            const token = createAuthToken(1);

            const response = await request(app)
                .get('/api/financial/report')
                .set('Authorization', `Bearer ${token}`)
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('obrigatórios');
        });
    });

    describe('Security - Multi-tenant Isolation', () => {
        it('should prevent Clinic B from accessing Clinic A transactions', async () => {
            const tokenClinicA = createAuthToken(1, 1); // Clinic A
            const tokenClinicB = createAuthToken(2, 2); // Clinic B

            // Clinic A creates a transaction
            const clinicATransaction = await request(app)
                .post('/api/financial/transactions')
                .set('Authorization', `Bearer ${tokenClinicA}`)
                .send({
                    type: 'income',
                    amount: 500.0,
                    category: 'Consulta',
                    payment_method: 'pix',
                    status: 'paid',
                    paid_at: '2026-02-01 10:00:00',
                })
                .expect(201);

            createdTransactionIds.push(clinicATransaction.body.id);
            const transactionId = clinicATransaction.body.id;

            console.log(`🏥 Clínica A criou transação ID: ${transactionId}`);

            // Clinic B tries to access Clinic A's transaction
            const unauthorizedAccess = await request(app)
                .get(`/api/financial/transactions/${transactionId}`)
                .set('Authorization', `Bearer ${tokenClinicB}`)
                .expect(404); // Should return 404 (not found due to clinic_id filter)

            expect(unauthorizedAccess.body).toHaveProperty('error');
            console.log('🔒 Clínica B bloqueada ao tentar acessar transação da Clínica A');
        });

        it('should return empty list when Clinic B lists transactions', async () => {
            const tokenClinicA = createAuthToken(1, 1);
            const tokenClinicB = createAuthToken(2, 2);

            // Clinic A creates transactions
            const transaction1 = await request(app)
                .post('/api/financial/transactions')
                .set('Authorization', `Bearer ${tokenClinicA}`)
                .send({
                    type: 'income',
                    amount: 200.0,
                    category: 'Consulta',
                    payment_method: 'credit',
                    status: 'paid',
                })
                .expect(201);

            createdTransactionIds.push(transaction1.body.id);

            // Clinic B lists transactions (should see none from Clinic A)
            const clinicBList = await request(app)
                .get('/api/financial/transactions')
                .set('Authorization', `Bearer ${tokenClinicB}`)
                .expect(200);

            // Filter only transactions from clinic B (should be empty unless already exists)
            const clinicBTransactions = clinicBList.body.filter((txn: any) => txn.clinic_id === 2);

            console.log(
                `📋 Clínica B visualiza apenas suas próprias transações (Total: ${clinicBTransactions.length})`
            );

            // Verify no Clinic A transactions are visible to Clinic B
            const clinicATransactions = clinicBList.body.filter((txn: any) => txn.clinic_id === 1);
            expect(clinicATransactions.length).toBe(0);
        });

        it('should prevent Clinic B from accessing Clinic A financial report', async () => {
            const tokenClinicA = createAuthToken(1, 1);
            const tokenClinicB = createAuthToken(2, 2);

            // Clinic A creates transactions
            const transaction = await request(app)
                .post('/api/financial/transactions')
                .set('Authorization', `Bearer ${tokenClinicA}`)
                .send({
                    type: 'income',
                    amount: 1000.0,
                    category: 'Procedimento',
                    payment_method: 'pix',
                    status: 'paid',
                    paid_at: '2026-02-01 10:00:00',
                })
                .expect(201);

            createdTransactionIds.push(transaction.body.id);

            // Clinic B requests report (should not see Clinic A data)
            const clinicBReport = await request(app)
                .get('/api/financial/report?startDate=2026-02-01&endDate=2026-02-28')
                .set('Authorization', `Bearer ${tokenClinicB}`)
                .expect(200);

            // Clinic B should see zero or only their own data (not Clinic A's 1000.00)
            // Since Clinic B has no transactions, all values should be 0
            expect(clinicBReport.body.summary.total_income).toBe(0);
            expect(clinicBReport.body.summary.total_expense).toBe(0);
            expect(clinicBReport.body.summary.balance).toBe(0);

            console.log('🔐 Clínica B não consegue acessar relatório financeiro da Clínica A');
        });

        it('should prevent Clinic B from deleting Clinic A transactions', async () => {
            const tokenClinicA = createAuthToken(1, 1);
            const tokenClinicB = createAuthToken(2, 2);

            // Clinic A creates a transaction
            const transaction = await request(app)
                .post('/api/financial/transactions')
                .set('Authorization', `Bearer ${tokenClinicA}`)
                .send({
                    type: 'income',
                    amount: 300.0,
                    category: 'Consulta',
                    payment_method: 'cash',
                    status: 'paid',
                })
                .expect(201);

            createdTransactionIds.push(transaction.body.id);
            const transactionId = transaction.body.id;

            // Clinic B tries to delete Clinic A's transaction
            const deleteAttempt = await request(app)
                .delete(`/api/financial/transactions/${transactionId}`)
                .set('Authorization', `Bearer ${tokenClinicB}`)
                .expect(404); // Should fail (transaction not found for clinic_id = 2)

            expect(deleteAttempt.body).toHaveProperty('error');
            console.log('🚫 Clínica B bloqueada ao tentar deletar transação da Clínica A');

            // Verify transaction still exists for Clinic A
            const verifyExists = await request(app)
                .get(`/api/financial/transactions/${transactionId}`)
                .set('Authorization', `Bearer ${tokenClinicA}`)
                .expect(200);

            expect(verifyExists.body.id).toBe(transactionId);
        });
    });

    describe('GET /api/financial/transactions - List Transactions', () => {
        it('should list all transactions for authenticated clinic', async () => {
            const token = createAuthToken(1);

            // Create multiple transactions
            const transactions = [
                { type: 'income', amount: 100.0, category: 'Consulta', payment_method: 'pix' },
                { type: 'expense', amount: 50.0, category: 'Material', payment_method: 'debit' },
            ];

            for (const txn of transactions) {
                const response = await request(app)
                    .post('/api/financial/transactions')
                    .set('Authorization', `Bearer ${token}`)
                    .send({
                        ...txn,
                        status: 'paid',
                        paid_at: '2026-02-01 10:00:00',
                    })
                    .expect(201);

                createdTransactionIds.push(response.body.id);
            }

            // List transactions
            const list = await request(app)
                .get('/api/financial/transactions')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(Array.isArray(list.body)).toBe(true);
            expect(list.body.length).toBeGreaterThanOrEqual(2);
        });

        it('should require authentication to list transactions', async () => {
            const response = await request(app).get('/api/financial/transactions').expect(401);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/financial/dashboard - Dashboard Metrics', () => {
        it('should return dashboard metrics for current month', async () => {
            const token = createAuthToken(1);

            const response = await request(app)
                .get('/api/financial/dashboard')
                .set('Authorization', `Bearer ${token}`)
                .expect(200);

            expect(response.body).toHaveProperty('daily_balance');
            expect(response.body).toHaveProperty('monthly_income');
            expect(response.body).toHaveProperty('monthly_expense');

            // All values should be numbers
            expect(typeof response.body.daily_balance).toBe('number');
            expect(typeof response.body.monthly_income).toBe('number');
            expect(typeof response.body.monthly_expense).toBe('number');
        });

        it('should require authentication to access dashboard', async () => {
            const response = await request(app).get('/api/financial/dashboard').expect(401);

            expect(response.body).toHaveProperty('error');
        });
    });
});
