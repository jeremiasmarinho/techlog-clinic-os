/**
 * ClinicController Tests
 *
 * Tests for clinic settings management
 * Critical for multi-tenant configuration
 */

import request from 'supertest';
import express from 'express';
import { ClinicController } from '../src/controllers/ClinicController';
import { db } from '../src/database';

const app = express();
app.use(express.json());

// Mock tenant middleware
const mockTenantMiddleware = (clinicId: number) => (req: any, _res: any, next: any) => {
    req.clinicId = clinicId;
    req.user = { userId: 1, clinicId, role: 'admin' };
    next();
};

// Routes for Clinic A (id: 1)
app.get('/api/clinic/settings', mockTenantMiddleware(1), ClinicController.getSettings);
app.put('/api/clinic/settings', mockTenantMiddleware(1), ClinicController.updateSettings);
app.patch('/api/clinic/settings', mockTenantMiddleware(1), ClinicController.updateIdentitySettings);

// Routes for Clinic B (id: 2)
const appB = express();
appB.use(express.json());
appB.get('/api/clinic/settings', mockTenantMiddleware(2), ClinicController.getSettings);
appB.put('/api/clinic/settings', mockTenantMiddleware(2), ClinicController.updateSettings);

describe('ClinicController', () => {
    beforeAll((done) => {
        process.env.JWT_SECRET = 'test-secret-for-clinic';
        // Wait for db
        db.run('SELECT 1', done);
    });

    beforeEach((done) => {
        // Clean up clinic_settings
        db.serialize(() => {
            db.run('DELETE FROM clinic_settings WHERE clinic_id IN (1, 2)');
            // Ensure clinics exist (use only columns that exist in test db)
            db.run(
                `INSERT OR IGNORE INTO clinics (id, name, status) VALUES (1, 'Clinic A', 'active')`
            );
            db.run(
                `INSERT OR IGNORE INTO clinics (id, name, status) VALUES (2, 'Clinic B', 'active')`,
                done
            );
        });
    });

    afterAll((done) => {
        done();
    });

    describe('GET /api/clinic/settings - Get Settings', () => {
        it('should return default settings when none exist', async () => {
            const response = await request(app).get('/api/clinic/settings').expect(200);

            expect(response.body).toHaveProperty('identity');
            expect(response.body).toHaveProperty('hours');
            expect(response.body).toHaveProperty('insurancePlans');
            expect(response.body).toHaveProperty('chatbot');

            // Check default values
            expect(response.body.identity.primaryColor).toBe('#06b6d4');
            expect(response.body.hours.opening).toBe('08:00');
            expect(response.body.hours.closing).toBe('18:00');
            expect(response.body.insurancePlans).toEqual([]);
        });

        it('should return existing settings', async () => {
            // Create settings first
            const settings = {
                identity: {
                    name: 'Test Clinic',
                    phone: '11999999999',
                    address: 'Rua Test, 123',
                    primaryColor: '#ff0000',
                    logo: null,
                },
                hours: {
                    opening: '09:00',
                    closing: '20:00',
                    lunchStart: '12:00',
                    lunchEnd: '13:00',
                    workingDays: ['Seg', 'Ter', 'Qua'],
                },
                insurancePlans: ['Unimed', 'Bradesco'],
                chatbot: {
                    greeting: 'Olá!',
                    awayMessage: 'Estamos ausentes',
                    instructions: 'Instrucoes',
                },
            };

            await new Promise<void>((resolve, reject) => {
                db.run(
                    `INSERT INTO clinic_settings (clinic_id, identity, hours, insurance_plans, chatbot)
                     VALUES (?, ?, ?, ?, ?)`,
                    [
                        1,
                        JSON.stringify(settings.identity),
                        JSON.stringify(settings.hours),
                        JSON.stringify(settings.insurancePlans),
                        JSON.stringify(settings.chatbot),
                    ],
                    (err) => (err ? reject(err) : resolve())
                );
            });

            const response = await request(app).get('/api/clinic/settings').expect(200);

            expect(response.body.identity.name).toBe('Test Clinic');
            expect(response.body.identity.primaryColor).toBe('#ff0000');
            expect(response.body.hours.opening).toBe('09:00');
            expect(response.body.hours.closing).toBe('20:00');
            expect(response.body.insurancePlans).toContain('Unimed');
            expect(response.body.chatbot.greeting).toBe('Olá!');
        });
    });

    describe('PUT /api/clinic/settings - Update Settings', () => {
        const validSettings = {
            identity: {
                name: 'Nova Clínica',
                phone: '11888888888',
                address: 'Av. Nova, 456',
                primaryColor: '#00ff00',
                logo: null,
            },
            hours: {
                opening: '07:00',
                closing: '19:00',
                lunchStart: '',
                lunchEnd: '',
                workingDays: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
            },
            insurancePlans: ['SulAmérica', 'Amil'],
            chatbot: {
                greeting: 'Bem-vindo!',
                awayMessage: 'Voltamos logo',
                instructions: 'Agende sua consulta',
            },
        };

        it('should create new settings when none exist', async () => {
            const response = await request(app)
                .put('/api/clinic/settings')
                .send(validSettings)
                .expect(201);

            expect(response.body).toHaveProperty('message', 'Configurações criadas com sucesso');
            expect(response.body).toHaveProperty('clinicId', 1);
            expect(response.body).toHaveProperty('id');
        });

        it('should update existing settings', async () => {
            // Create settings first
            await new Promise<void>((resolve, reject) => {
                db.run(
                    `INSERT INTO clinic_settings (clinic_id, identity, hours, insurance_plans, chatbot)
                     VALUES (?, ?, ?, ?, ?)`,
                    [1, '{}', '{}', '[]', '{}'],
                    (err) => (err ? reject(err) : resolve())
                );
            });

            const response = await request(app)
                .put('/api/clinic/settings')
                .send(validSettings)
                .expect(200);

            expect(response.body).toHaveProperty(
                'message',
                'Configurações atualizadas com sucesso'
            );
            expect(response.body).toHaveProperty('clinicId', 1);
        });

        it('should fail when identity is missing', async () => {
            const response = await request(app)
                .put('/api/clinic/settings')
                .send({
                    hours: validSettings.hours,
                    insurancePlans: validSettings.insurancePlans,
                    chatbot: validSettings.chatbot,
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('identity');
        });

        it('should fail when hours is missing', async () => {
            const response = await request(app)
                .put('/api/clinic/settings')
                .send({
                    identity: validSettings.identity,
                    insurancePlans: validSettings.insurancePlans,
                    chatbot: validSettings.chatbot,
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('hours');
        });

        it('should fail when insurancePlans is missing', async () => {
            const response = await request(app)
                .put('/api/clinic/settings')
                .send({
                    identity: validSettings.identity,
                    hours: validSettings.hours,
                    chatbot: validSettings.chatbot,
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('insurancePlans');
        });

        it('should fail when chatbot is missing', async () => {
            const response = await request(app)
                .put('/api/clinic/settings')
                .send({
                    identity: validSettings.identity,
                    hours: validSettings.hours,
                    insurancePlans: validSettings.insurancePlans,
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('chatbot');
        });

        it('should handle complex insurance plans array', async () => {
            const settingsWithManyPlans = {
                ...validSettings,
                insurancePlans: [
                    'Unimed',
                    'Bradesco',
                    'SulAmérica',
                    'Amil',
                    'Porto Seguro',
                    'NotreDame',
                    'Hapvida',
                ],
            };

            const response = await request(app)
                .put('/api/clinic/settings')
                .send(settingsWithManyPlans)
                .expect(201);

            expect(response.body).toHaveProperty('message');

            // Verify stored correctly
            const getResponse = await request(app).get('/api/clinic/settings').expect(200);

            expect(getResponse.body.insurancePlans).toHaveLength(7);
            expect(getResponse.body.insurancePlans).toContain('Hapvida');
        });

        it('should handle empty arrays', async () => {
            const settingsWithEmptyArrays = {
                identity: { name: '', phone: '', address: '', primaryColor: '#06b6d4', logo: null },
                hours: { opening: '', closing: '', lunchStart: '', lunchEnd: '', workingDays: [] },
                insurancePlans: [],
                chatbot: { greeting: '', awayMessage: '', instructions: '' },
            };

            const response = await request(app)
                .put('/api/clinic/settings')
                .send(settingsWithEmptyArrays)
                .expect(201);

            expect(response.body).toHaveProperty('message');
        });
    });

    describe('PATCH /api/clinic/settings - Update Identity', () => {
        it('should update clinic name', async () => {
            const response = await request(app)
                .patch('/api/clinic/settings')
                .send({ name: 'Updated Clinic Name' });

            // 200 if settings exist, 201 if created
            expect([200, 201]).toContain(response.status);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('name', 'Updated Clinic Name');
        });

        it('should update primary color', async () => {
            const response = await request(app)
                .patch('/api/clinic/settings')
                .send({ primaryColor: '#ff5500' });

            expect([200, 201]).toContain(response.status);
            expect(response.body).toHaveProperty('primary_color', '#ff5500');
        });

        it('should update address', async () => {
            const response = await request(app)
                .patch('/api/clinic/settings')
                .send({ address: 'Rua Nova, 789, Centro' });

            expect([200, 201]).toContain(response.status);
            expect(response.body).toHaveProperty('address_full', 'Rua Nova, 789, Centro');
        });

        it('should update multiple fields at once', async () => {
            const response = await request(app).patch('/api/clinic/settings').send({
                name: 'Multi Update Clinic',
                primaryColor: '#123456',
                address: 'Av. Teste, 100',
            });

            expect([200, 201]).toContain(response.status);
            expect(response.body.name).toBe('Multi Update Clinic');
            expect(response.body.primary_color).toBe('#123456');
            expect(response.body.address_full).toBe('Av. Teste, 100');
        });

        it('should create clinic_settings if not exists', async () => {
            // Ensure no settings exist
            await new Promise<void>((resolve, reject) => {
                db.run('DELETE FROM clinic_settings WHERE clinic_id = 1', (err) =>
                    err ? reject(err) : resolve()
                );
            });

            const response = await request(app)
                .patch('/api/clinic/settings')
                .send({ name: 'New Clinic Via Patch' })
                .expect(201);

            expect(response.body).toHaveProperty('message', 'Identidade visual atualizada');
        });
    });

    describe('Multi-tenant Isolation', () => {
        it('should isolate settings between clinics', async () => {
            // Create settings for Clinic A
            const clinicASettings = {
                identity: {
                    name: 'Clinic A Settings',
                    phone: '111',
                    address: 'A',
                    primaryColor: '#aaaaaa',
                    logo: null,
                },
                hours: {
                    opening: '08:00',
                    closing: '18:00',
                    lunchStart: '',
                    lunchEnd: '',
                    workingDays: [],
                },
                insurancePlans: ['Plan A'],
                chatbot: { greeting: 'A', awayMessage: '', instructions: '' },
            };

            await request(app).put('/api/clinic/settings').send(clinicASettings).expect(201);

            // Create settings for Clinic B
            const clinicBSettings = {
                identity: {
                    name: 'Clinic B Settings',
                    phone: '222',
                    address: 'B',
                    primaryColor: '#bbbbbb',
                    logo: null,
                },
                hours: {
                    opening: '09:00',
                    closing: '19:00',
                    lunchStart: '',
                    lunchEnd: '',
                    workingDays: [],
                },
                insurancePlans: ['Plan B'],
                chatbot: { greeting: 'B', awayMessage: '', instructions: '' },
            };

            await request(appB).put('/api/clinic/settings').send(clinicBSettings).expect(201);

            // Verify Clinic A sees only its settings
            const responseA = await request(app).get('/api/clinic/settings').expect(200);

            expect(responseA.body.identity.name).toBe('Clinic A Settings');
            expect(responseA.body.identity.primaryColor).toBe('#aaaaaa');

            // Verify Clinic B sees only its settings
            const responseB = await request(appB).get('/api/clinic/settings').expect(200);

            expect(responseB.body.identity.name).toBe('Clinic B Settings');
            expect(responseB.body.identity.primaryColor).toBe('#bbbbbb');
        });

        it('should not allow Clinic A to modify Clinic B settings', async () => {
            // Clinic B creates settings
            const clinicBSettings = {
                identity: {
                    name: 'Clinic B Original',
                    phone: '',
                    address: '',
                    primaryColor: '#000000',
                    logo: null,
                },
                hours: { opening: '', closing: '', lunchStart: '', lunchEnd: '', workingDays: [] },
                insurancePlans: [],
                chatbot: { greeting: '', awayMessage: '', instructions: '' },
            };

            await request(appB).put('/api/clinic/settings').send(clinicBSettings).expect(201);

            // Clinic A tries to update (will create its own, not modify B's)
            const clinicASettings = {
                identity: {
                    name: 'Clinic A Trying',
                    phone: '',
                    address: '',
                    primaryColor: '#ffffff',
                    logo: null,
                },
                hours: { opening: '', closing: '', lunchStart: '', lunchEnd: '', workingDays: [] },
                insurancePlans: [],
                chatbot: { greeting: '', awayMessage: '', instructions: '' },
            };

            await request(app).put('/api/clinic/settings').send(clinicASettings).expect(201);

            // Verify Clinic B settings are unchanged
            const responseB = await request(appB).get('/api/clinic/settings').expect(200);

            expect(responseB.body.identity.name).toBe('Clinic B Original');
            expect(responseB.body.identity.primaryColor).toBe('#000000');
        });
    });

    describe('Edge Cases', () => {
        it('should handle special characters in settings', async () => {
            const settingsWithSpecialChars = {
                identity: {
                    name: 'Clínica São José & Filhos',
                    phone: '+55 (11) 99999-9999',
                    address: 'Rua "Teste" #123',
                    primaryColor: '#06b6d4',
                    logo: null,
                },
                hours: {
                    opening: '08:00',
                    closing: '18:00',
                    lunchStart: '',
                    lunchEnd: '',
                    workingDays: ['Seg'],
                },
                insurancePlans: ["Plano D'ouro", 'Saúde & Vida'],
                chatbot: {
                    greeting: 'Olá! Como posso ajudá-lo?',
                    awayMessage: '',
                    instructions: '',
                },
            };

            await request(app)
                .put('/api/clinic/settings')
                .send(settingsWithSpecialChars)
                .expect(201);

            const response = await request(app).get('/api/clinic/settings').expect(200);

            expect(response.body.identity.name).toBe('Clínica São José & Filhos');
            expect(response.body.insurancePlans).toContain("Plano D'ouro");
        });

        it('should handle very long text fields', async () => {
            const longText = 'A'.repeat(1000);
            const settingsWithLongText = {
                identity: {
                    name: longText,
                    phone: '',
                    address: longText,
                    primaryColor: '#06b6d4',
                    logo: null,
                },
                hours: { opening: '', closing: '', lunchStart: '', lunchEnd: '', workingDays: [] },
                insurancePlans: [],
                chatbot: { greeting: longText, awayMessage: longText, instructions: longText },
            };

            const response = await request(app)
                .put('/api/clinic/settings')
                .send(settingsWithLongText)
                .expect(201);

            expect(response.body).toHaveProperty('message');
        });

        it('should handle empty body gracefully', async () => {
            const response = await request(app).put('/api/clinic/settings').send({}).expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });
});
