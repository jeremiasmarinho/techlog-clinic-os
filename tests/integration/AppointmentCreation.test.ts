/**
 * Teste de Integração - Criação de Agendamento (POST /appointments)
 *
 * Este teste verifica:
 * 1. Criação bem-sucedida de agendamento com dados válidos
 * 2. Persistência correta no banco SQLite
 * 3. Validação de campos obrigatórios (retorno 400)
 * 4. Retorno de erros apropriados quando dados estão faltando
 *
 * @author QA Senior Engineer
 * @date 2026-02-01
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';
import leadRoutes from '../../src/routes/lead.routes';
import { db } from '../../src/database';

describe('Integration Test - POST /api/leads (Criação de Agendamento)', () => {
    let app: Express;
    let createdLeadIds: number[] = [];

    /**
     * Setup: Configura o Express app antes de todos os testes
     */
    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use('/api/leads', leadRoutes);

        console.log('🧪 Iniciando testes de integração - Criação de Agendamento');
    });

    /**
     * Cleanup: Limpa os registros criados após cada teste
     */
    beforeEach(() => {
        createdLeadIds = [];
    });

    /**
     * Teardown: Limpa o banco de dados e fecha a conexão
     */
    afterAll(async () => {
        // Remove todos os leads criados durante os testes
        if (createdLeadIds.length > 0) {
            const placeholders = createdLeadIds.map(() => '?').join(',');
            await new Promise<void>((resolve, reject) => {
                db.run(`DELETE FROM leads WHERE id IN (${placeholders})`, createdLeadIds, (err) => {
                    if (err) {
                        console.error('❌ Erro ao limpar dados de teste:', err.message);
                        reject(err);
                        return;
                    }
                    console.log(`🧹 Limpeza: ${createdLeadIds.length} registros removidos`);
                    resolve();
                });
            });
        }

        // Fecha a conexão com o banco de dados
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

    /**
     * Helper function: Verifica se um lead existe no banco de dados
     */
    const verifyLeadInDatabase = async (leadId: number): Promise<any> => {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM leads WHERE id = ?', [leadId], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(row);
            });
        });
    };

    // ========================================
    // CASOS DE SUCESSO
    // ========================================

    describe('✅ Cenários de Sucesso', () => {
        it('deve criar um agendamento com todos os dados válidos', async () => {
            const novoAgendamento = {
                name: 'João Silva Santos',
                phone: '63991234567',
                type: 'primeira_consulta',
            };

            const response = await request(app)
                .post('/api/leads')
                .send(novoAgendamento)
                .expect('Content-Type', /json/)
                .expect(201);

            // Verifica a resposta da API (nova estrutura com data wrapper)
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            expect(response.body.data).toHaveProperty('message', 'Lead salvo com sucesso!');
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.id).toBeGreaterThan(0);

            const leadId = response.body.data.id;
            createdLeadIds.push(leadId);

            // Verifica se o lead foi realmente salvo no SQLite
            const leadNoBanco = await verifyLeadInDatabase(leadId);

            expect(leadNoBanco).toBeDefined();
            expect(leadNoBanco.name).toBe(novoAgendamento.name);
            expect(leadNoBanco.phone).toBe(novoAgendamento.phone);
            expect(leadNoBanco.type).toBe(novoAgendamento.type);
            expect(leadNoBanco.status).toBe('novo'); // Status padrão
            expect(leadNoBanco.created_at).toBeDefined();
        });

        it('deve criar agendamento com tipo padrão quando não especificado', async () => {
            const novoAgendamento = {
                name: 'Maria Oliveira Costa',
                phone: '63992345678',
            };

            const response = await request(app)
                .post('/api/leads')
                .send(novoAgendamento)
                .expect(201);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body.data).toHaveProperty('message', 'Lead salvo com sucesso!');
            expect(response.body.data).toHaveProperty('id');

            const leadId = response.body.data.id;
            createdLeadIds.push(leadId);

            // Verifica tipo padrão no banco
            const leadNoBanco = await verifyLeadInDatabase(leadId);

            expect(leadNoBanco).toBeDefined();
            expect(leadNoBanco.type).toBe('geral'); // Tipo padrão conforme schema
        });

        it('deve criar múltiplos agendamentos sequencialmente', async () => {
            const agendamentos = [
                { name: 'Pedro Alves', phone: '63993456789', type: 'retorno' },
                { name: 'Ana Paula', phone: '63994567890', type: 'consulta' },
                { name: 'Carlos Eduardo', phone: '63995678901', type: 'primeira_consulta' },
            ];

            for (const agendamento of agendamentos) {
                const response = await request(app)
                    .post('/api/leads')
                    .send(agendamento)
                    .expect(201);

                expect(response.body.data).toHaveProperty('id');
                createdLeadIds.push(response.body.data.id);

                // Verifica persistência individual
                const leadNoBanco = await verifyLeadInDatabase(response.body.data.id);
                expect(leadNoBanco.name).toBe(agendamento.name);
                expect(leadNoBanco.phone).toBe(agendamento.phone);
            }

            // Verifica que todos foram criados
            expect(createdLeadIds).toHaveLength(3);
        });

        it('deve criar agendamento com caracteres especiais no nome', async () => {
            const novoAgendamento = {
                name: 'José Antônio Peña Ñoño',
                phone: '63996789012',
                type: 'consulta',
            };

            const response = await request(app)
                .post('/api/leads')
                .send(novoAgendamento)
                .expect(201);

            const leadId = response.body.data.id;
            createdLeadIds.push(leadId);

            const leadNoBanco = await verifyLeadInDatabase(leadId);
            expect(leadNoBanco.name).toBe(novoAgendamento.name);
        });
    });

    // ========================================
    // CASOS DE VALIDAÇÃO (Erros 400)
    // ========================================

    describe('❌ Cenários de Validação - Erro 400', () => {
        it('deve retornar erro 400 quando o nome está faltando', async () => {
            const agendamentoInvalido = {
                phone: '63991234567',
                type: 'consulta',
            };

            const response = await request(app)
                .post('/api/leads')
                .send(agendamentoInvalido)
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBeTruthy();
        });

        it('deve retornar erro 400 quando o telefone está faltando', async () => {
            const agendamentoInvalido = {
                name: 'João Silva',
                type: 'consulta',
            };

            const response = await request(app)
                .post('/api/leads')
                .send(agendamentoInvalido)
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBeTruthy();
        });

        it('deve retornar erro 400 quando nome e telefone estão faltando', async () => {
            const agendamentoInvalido = {
                type: 'consulta',
            };

            const response = await request(app)
                .post('/api/leads')
                .send(agendamentoInvalido)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('deve retornar erro 400 quando o nome está vazio', async () => {
            const agendamentoInvalido = {
                name: '',
                phone: '63991234567',
                type: 'consulta',
            };

            const response = await request(app)
                .post('/api/leads')
                .send(agendamentoInvalido)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('deve retornar erro 400 quando o telefone está vazio', async () => {
            const agendamentoInvalido = {
                name: 'João Silva',
                phone: '',
                type: 'consulta',
            };

            const response = await request(app)
                .post('/api/leads')
                .send(agendamentoInvalido)
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('deve retornar erro 400 quando o body está vazio', async () => {
            const response = await request(app).post('/api/leads').send({}).expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('deve retornar erro 400 quando enviado null como body', async () => {
            const response = await request(app).post('/api/leads').send(null).expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });

    // ========================================
    // CASOS DE EDGE CASES
    // ========================================

    describe('🔍 Edge Cases e Validações Avançadas', () => {
        it('deve aceitar telefone com apenas números', async () => {
            const novoAgendamento = {
                name: 'Teste Números',
                phone: '63991234567',
                type: 'consulta',
            };

            const response = await request(app)
                .post('/api/leads')
                .send(novoAgendamento)
                .expect(201);

            createdLeadIds.push(response.body.data.id);

            const leadNoBanco = await verifyLeadInDatabase(response.body.data.id);
            expect(leadNoBanco.phone).toBe('63991234567');
        });

        it('deve aceitar nome com múltiplas palavras', async () => {
            const novoAgendamento = {
                name: 'João Pedro Silva Santos de Oliveira',
                phone: '63991234567',
                type: 'consulta',
            };

            const response = await request(app)
                .post('/api/leads')
                .send(novoAgendamento)
                .expect(201);

            createdLeadIds.push(response.body.data.id);

            const leadNoBanco = await verifyLeadInDatabase(response.body.data.id);
            expect(leadNoBanco.name).toBe(novoAgendamento.name);
        });

        it('deve aceitar diferentes tipos de consulta', async () => {
            const tipos = ['primeira_consulta', 'retorno', 'consulta', 'emergencia', 'avaliacao'];

            for (const tipo of tipos) {
                const agendamento = {
                    name: `Paciente ${tipo}`,
                    phone: '63991234567',
                    type: tipo,
                };

                const response = await request(app)
                    .post('/api/leads')
                    .send(agendamento)
                    .expect(201);

                createdLeadIds.push(response.body.data.id);

                const leadNoBanco = await verifyLeadInDatabase(response.body.data.id);
                expect(leadNoBanco.type).toBe(tipo);
            }
        });

        it('deve garantir timestamps automáticos de criação', async () => {
            const novoAgendamento = {
                name: 'Teste Timestamp',
                phone: '63991234567',
                type: 'consulta',
            };

            const response = await request(app)
                .post('/api/leads')
                .send(novoAgendamento)
                .expect(201);

            createdLeadIds.push(response.body.data.id);

            const leadNoBanco = await verifyLeadInDatabase(response.body.data.id);

            // Verifica que o timestamp foi criado automaticamente
            expect(leadNoBanco.created_at).toBeDefined();
            expect(leadNoBanco.created_at).toBeTruthy();

            // Verifica formato do timestamp (SQLite retorna string)
            expect(typeof leadNoBanco.created_at).toBe('string');

            // Verifica que o timestamp é recente (últimos 10 segundos)
            const timestampDate = new Date(leadNoBanco.created_at);
            const agora = new Date();
            const diferencaSegundos = (agora.getTime() - timestampDate.getTime()) / 1000;

            expect(diferencaSegundos).toBeLessThan(10);
            expect(diferencaSegundos).toBeGreaterThanOrEqual(0);
        });
    });

    // ========================================
    // CASOS DE INTEGRIDADE DE DADOS
    // ========================================

    describe('🔐 Integridade e Consistência de Dados', () => {
        it('deve verificar que IDs são únicos e incrementais', async () => {
            const ids: number[] = [];

            for (let i = 0; i < 3; i++) {
                const response = await request(app)
                    .post('/api/leads')
                    .send({
                        name: `Teste ${i}`,
                        phone: `6399000000${i}`,
                        type: 'consulta',
                    })
                    .expect(201);

                ids.push(response.body.data.id);
                createdLeadIds.push(response.body.data.id);
            }

            // Verifica unicidade
            const uniqueIds = new Set(ids);
            expect(uniqueIds.size).toBe(ids.length);

            // Verifica que são incrementais
            for (let i = 1; i < ids.length; i++) {
                expect(ids[i]).toBeGreaterThan(ids[i - 1]);
            }
        });

        it('deve manter dados íntegros após múltiplas inserções', async () => {
            const agendamentos = [
                { name: 'Paciente 1', phone: '63991111111', type: 'consulta' },
                { name: 'Paciente 2', phone: '63992222222', type: 'retorno' },
                { name: 'Paciente 3', phone: '63993333333', type: 'emergencia' },
            ];

            // Cria todos os agendamentos
            for (const ag of agendamentos) {
                const response = await request(app).post('/api/leads').send(ag).expect(201);

                createdLeadIds.push(response.body.data.id);
            }

            // Verifica integridade de cada um no banco
            for (let i = 0; i < createdLeadIds.length; i++) {
                const leadNoBanco = await verifyLeadInDatabase(createdLeadIds[i]);

                expect(leadNoBanco).toBeDefined();
                expect(leadNoBanco.name).toBe(agendamentos[i].name);
                expect(leadNoBanco.phone).toBe(agendamentos[i].phone);
                expect(leadNoBanco.type).toBe(agendamentos[i].type);
            }
        });
    });

    // ========================================
    // CASOS DE PERFORMANCE
    // ========================================

    describe('⚡ Performance e Concorrência', () => {
        it('deve processar criação de agendamento em tempo aceitável', async () => {
            const inicio = Date.now();

            const response = await request(app)
                .post('/api/leads')
                .send({
                    name: 'Teste Performance',
                    phone: '63991234567',
                    type: 'consulta',
                })
                .expect(201);

            const tempoDecorrido = Date.now() - inicio;

            createdLeadIds.push(response.body.data.id);

            // Operação deve completar em menos de 1 segundo
            expect(tempoDecorrido).toBeLessThan(1000);
        });
    });
});
