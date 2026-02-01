/**
 * Integration Test - Super Admin Module
 *
 * Covers:
 * 1. Security - Access control for Super Admin routes
 * 2. GET /api/saas/stats/system - MRR calculation and system statistics
 * 3. PATCH /api/saas/clinics/:id/status - Clinic blocking and authentication impact
 * 4. Multi-tenant security - Super Admin vs Regular Doctor access
 *
 * @author QA Engineer
 * @date 2026-02-01
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import saasRoutes from '../../src/routes/saas.routes';
import authRoutes from '../../src/routes/auth.routes';
import { db, initDb } from '../../src/database';

describe('Integration Test - Super Admin Module', () => {
    let app: Express;
    let superAdminToken: string;
    let regularDoctorToken: string;
    let testClinicId: number;
    let testDoctorUserId: number;
    let testDoctorUsername: string;
    let testDoctorPassword: string;

    // Environment setup
    const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';
    const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'jeremias@example.com';

    /**
     * Helper: Create authentication token
     */
    const createAuthToken = (payload: {
        userId: number;
        username: string;
        email?: string;
        name: string;
        role: string;
        clinicId: number;
    }) => jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });

    /**
     * Setup: Configure Express app with routes and initialize database
     */
    beforeAll(async () => {
        // Initialize database schema (create tables if they don't exist)
        initDb();

        // Ensure patients table exists (might not be created by initDb in test env)
        db.prepare(
            `
            CREATE TABLE IF NOT EXISTS patients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                clinic_id INTEGER NOT NULL,
                name TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                cpf TEXT,
                birth_date DATE,
                gender TEXT,
                address TEXT,
                city TEXT,
                state TEXT,
                zip_code TEXT,
                notes TEXT,
                status TEXT DEFAULT 'waiting',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `
        ).run();

        app = express();
        app.use(express.json());

        // Mount routes
        app.use('/api/saas', saasRoutes);
        app.use('/api/auth', authRoutes);

        console.log('\n🧪 Starting Super Admin Integration Tests...');
        console.log(`📧 SUPER_ADMIN_EMAIL: ${SUPER_ADMIN_EMAIL}`);
    });

    /**
     * Setup test data before each test suite
     */
    beforeEach(async () => {
        // Clean up previous test data (order matters for FK constraints)
        db.prepare('DELETE FROM patients WHERE clinic_id > 2').run(); // First delete patients
        db.prepare('DELETE FROM users WHERE username LIKE ?').run('test-doctor-%'); // Then users
        db.prepare('DELETE FROM clinics WHERE slug LIKE ?').run('test-clinic-%'); // Finally clinics

        // Generate unique identifiers
        const timestamp = Date.now();
        const testSlug = `test-clinic-qa-${timestamp}`;

        // Create test clinic for regular doctor
        const clinicResult = db
            .prepare(
                `
            INSERT INTO clinics (
                name, slug, status, plan_tier,
                subscription_started_at, subscription_ends_at,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `
            )
            .run('Test Clinic QA', testSlug, 'active', 'professional', '2026-01-01', '2026-12-31');

        testClinicId = clinicResult.lastInsertRowid as number;
        console.log(`✅ Test clinic created: ID ${testClinicId}`);

        // Create test doctor user for the clinic
        const hashedPassword = await bcrypt.hash('test123', 10);
        testDoctorUsername = `test-doctor-${Date.now()}`;
        testDoctorPassword = 'test123';

        const userResult = db
            .prepare(
                `
            INSERT INTO users (
                name, username, password, role, clinic_id, is_owner,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `
            )
            .run('Dr. Test QA', testDoctorUsername, hashedPassword, 'doctor', testClinicId, 1);

        testDoctorUserId = userResult.lastInsertRowid as number;
        console.log(
            `✅ Test doctor created: ID ${testDoctorUserId}, username: ${testDoctorUsername}`
        );

        // Create Super Admin token (with correct email match)
        superAdminToken = createAuthToken({
            userId: 1,
            username: SUPER_ADMIN_EMAIL, // Must match SUPER_ADMIN_EMAIL
            email: SUPER_ADMIN_EMAIL,
            name: 'Super Admin',
            role: 'super_admin',
            clinicId: 1,
        });

        // Create Regular Doctor token (different clinic)
        regularDoctorToken = createAuthToken({
            userId: testDoctorUserId,
            username: testDoctorUsername,
            email: 'doctor@testclinic.com',
            name: 'Dr. Test QA',
            role: 'doctor',
            clinicId: testClinicId,
        });
    });

    /**
     * Cleanup: Remove test data after all tests
     */
    afterAll(() => {
        console.log('\n🧹 Cleaning up Super Admin test data...');

        // Order matters for foreign key constraints
        try {
            db.prepare('DELETE FROM patients WHERE clinic_id > 2').run();
            db.prepare('DELETE FROM users WHERE username LIKE ?').run('test-doctor-%');
            db.prepare('DELETE FROM clinics WHERE slug LIKE ?').run('test-clinic-%');
            console.log('✅ Super Admin tests cleanup completed');
        } catch (error) {
            console.log('⚠️  Cleanup warning:', error);
        }

        console.log('');
    });

    // ==========================================
    // Security Tests - Access Control
    // ==========================================

    describe('🔐 Security - Super Admin Access Control', () => {
        it('should reject access to /saas/stats/system without authentication', async () => {
            const response = await request(app).get('/api/saas/stats/system').expect(401);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toMatch(/Token.*fornecido|Autentica.*necess/i);
        });

        it('should reject regular doctor access to /saas/stats/system (403 Forbidden)', async () => {
            const response = await request(app)
                .get('/api/saas/stats/system')
                .set('Authorization', `Bearer ${regularDoctorToken}`)
                .expect(403);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Acesso negado');
            expect(response.body.requiredRole).toBe('super_admin');
            expect(response.body.yourRole).toBe('doctor');
        });

        it('should allow Super Admin access to /saas/stats/system', async () => {
            const response = await request(app)
                .get('/api/saas/stats/system')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('mrr');
            expect(response.body).toHaveProperty('arr');
            expect(response.body).toHaveProperty('active_clinics');
        });

        it('should reject regular doctor access to /saas/clinics (403 Forbidden)', async () => {
            const response = await request(app)
                .get('/api/saas/clinics')
                .set('Authorization', `Bearer ${regularDoctorToken}`)
                .expect(403);

            expect(response.body).toHaveProperty('error');
            expect(response.body.requiredRole).toBe('super_admin');
        });

        it('should allow Super Admin to list all clinics', async () => {
            const response = await request(app)
                .get('/api/saas/clinics')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);

            // Verify test clinic is in the list
            const testClinic = response.body.find((c: any) => c.id === testClinicId);
            expect(testClinic).toBeDefined();
            expect(testClinic.slug).toContain('test-clinic-qa');
        });

        it('should reject doctor with super_admin role but wrong email', async () => {
            // Create token with super_admin role but different email
            const fakeAdminToken = createAuthToken({
                userId: 999,
                username: 'fake-admin@evil.com', // Wrong email
                email: 'fake-admin@evil.com',
                name: 'Fake Admin',
                role: 'super_admin', // Has role but wrong email
                clinicId: 1,
            });

            const response = await request(app)
                .get('/api/saas/stats/system')
                .set('Authorization', `Bearer ${fakeAdminToken}`)
                .expect(403);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Acesso negado');
        });
    });

    // ==========================================
    // Business Logic Tests - MRR Calculation
    // ==========================================

    describe('💰 Business Logic - MRR Calculation', () => {
        it('should calculate MRR correctly based on active clinics and plans', async () => {
            const response = await request(app)
                .get('/api/saas/stats/system')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('mrr');
            expect(response.body).toHaveProperty('arr');
            expect(response.body).toHaveProperty('active_clinics');
            expect(response.body).toHaveProperty('total_patients');
            expect(response.body).toHaveProperty('churn_rate');

            // Verify MRR is a number and > 0
            expect(typeof response.body.mrr).toBe('number');
            expect(response.body.mrr).toBeGreaterThan(0);

            // Verify ARR = MRR * 12
            expect(response.body.arr).toBe(response.body.mrr * 12);

            // Verify active_clinics count
            expect(typeof response.body.active_clinics).toBe('number');
            expect(response.body.active_clinics).toBeGreaterThan(0);

            // Verify plans_breakdown exists
            expect(response.body).toHaveProperty('plans_breakdown');
            expect(typeof response.body.plans_breakdown).toBe('object');

            console.log('📊 MRR Stats:', {
                mrr: response.body.mrr,
                arr: response.body.arr,
                active_clinics: response.body.active_clinics,
                plans: response.body.plans_breakdown,
            });
        });

        it('should include correct plan breakdown with counts and MRR per plan', async () => {
            const response = await request(app)
                .get('/api/saas/stats/system')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(200);

            const breakdown = response.body.plans_breakdown;

            // Verify each plan has count and mrr
            ['basic', 'professional', 'enterprise'].forEach((plan) => {
                if (breakdown[plan]) {
                    expect(breakdown[plan]).toHaveProperty('count');
                    expect(breakdown[plan]).toHaveProperty('mrr');
                    expect(typeof breakdown[plan].count).toBe('number');
                    expect(typeof breakdown[plan].mrr).toBe('number');
                }
            });

            // Verify our test clinic (professional) is counted
            expect(breakdown.professional).toBeDefined();
            expect(breakdown.professional.count).toBeGreaterThan(0);
        });

        it('should calculate total_patients correctly across all clinics', async () => {
            // Get current patient count
            const countResult = db.prepare('SELECT COUNT(*) as count FROM patients').get() as {
                count: number;
            };
            const expectedPatients = countResult.count;

            const response = await request(app)
                .get('/api/saas/stats/system')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(200);

            expect(response.body.total_patients).toBe(expectedPatients);
            expect(response.body.total_patients).toBeGreaterThanOrEqual(0); // At least 0 patients
        });

        it('should calculate churn_rate as percentage (0-100)', async () => {
            const response = await request(app)
                .get('/api/saas/stats/system')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(200);

            expect(typeof response.body.churn_rate).toBe('number');
            expect(response.body.churn_rate).toBeGreaterThanOrEqual(0);
            expect(response.body.churn_rate).toBeLessThanOrEqual(100);
        });

        it('should only count active clinics in MRR calculation', async () => {
            // Create a suspended clinic (should NOT count in MRR)
            const suspendedClinic = db
                .prepare(
                    `
                INSERT INTO clinics (
                    name, slug, status, plan_tier,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `
                )
                .run(
                    'Suspended Test Clinic',
                    'test-clinic-suspended',
                    'suspended', // NOT active
                    'enterprise'
                );

            const response = await request(app)
                .get('/api/saas/stats/system')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(200);

            // Verify suspended clinic is NOT in active count
            const allClinics = db.prepare('SELECT COUNT(*) as count FROM clinics').get() as {
                count: number;
            };
            const activeClinics = db
                .prepare('SELECT COUNT(*) as count FROM clinics WHERE status = ?')
                .get('active') as { count: number };

            expect(response.body.active_clinics).toBe(activeClinics.count);
            expect(response.body.active_clinics).toBeLessThan(allClinics.count);

            // Cleanup
            db.prepare('DELETE FROM clinics WHERE id = ?').run(suspendedClinic.lastInsertRowid);
        });
    });

    // ==========================================
    // Business Logic Tests - Clinic Blocking
    // ==========================================

    describe('🚫 Business Logic - Clinic Blocking Impact', () => {
        it('should successfully block a clinic (active → suspended)', async () => {
            const response = await request(app)
                .patch(`/api/saas/clinics/${testClinicId}/status`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({
                    status: 'suspended',
                    reason: 'Test: Payment failure simulation',
                })
                .expect(200);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('atualizado');

            // Verify status changed in database
            const clinic = db
                .prepare('SELECT status FROM clinics WHERE id = ?')
                .get(testClinicId) as { status: string };
            expect(clinic.status).toBe('suspended');
        });

        it('should reject login from blocked clinic user', async () => {
            // First, block the clinic
            await request(app)
                .patch(`/api/saas/clinics/${testClinicId}/status`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({ status: 'suspended', reason: 'Test blocking' })
                .expect(200);

            // Try to login as doctor from blocked clinic
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    username: testDoctorUsername,
                    password: testDoctorPassword,
                })
                .expect(403);

            expect(loginResponse.body).toHaveProperty('error');
            expect(loginResponse.body.error).toContain('suspensa');

            console.log('✅ Blocked clinic login correctly rejected:', loginResponse.body.error);
        });

        it('should allow login after unblocking clinic (suspended → active)', async () => {
            // Block clinic first
            await request(app)
                .patch(`/api/saas/clinics/${testClinicId}/status`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({ status: 'suspended', reason: 'Test' })
                .expect(200);

            // Verify login is blocked
            await request(app)
                .post('/api/auth/login')
                .send({
                    username: testDoctorUsername,
                    password: testDoctorPassword,
                })
                .expect(403);

            // Unblock clinic
            await request(app)
                .patch(`/api/saas/clinics/${testClinicId}/status`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({ status: 'active', reason: 'Test unblock' })
                .expect(200);

            // Verify login works again
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    username: testDoctorUsername,
                    password: testDoctorPassword,
                })
                .expect(200);

            expect(loginResponse.body).toHaveProperty('token');
            expect(loginResponse.body).toHaveProperty('user');

            console.log('✅ Unblocked clinic login successful');
        });

        it('should reject invalid status values', async () => {
            const response = await request(app)
                .patch(`/api/saas/clinics/${testClinicId}/status`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({
                    status: 'invalid-status', // Invalid
                    reason: 'Test',
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Status inválido');
        });

        it('should return 404 for non-existent clinic', async () => {
            const response = await request(app)
                .patch('/api/saas/clinics/99999/status')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({
                    status: 'suspended',
                    reason: 'Test',
                })
                .expect(404);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('não encontrada');
        });

        it('should update clinic status and timestamp', async () => {
            // Get current updated_at
            const before = db
                .prepare('SELECT updated_at FROM clinics WHERE id = ?')
                .get(testClinicId) as { updated_at: string };

            // Wait 1 second to ensure timestamp difference
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Update status
            await request(app)
                .patch(`/api/saas/clinics/${testClinicId}/status`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({ status: 'cancelled', reason: 'Test' })
                .expect(200);

            // Verify updated_at changed
            const after = db
                .prepare('SELECT updated_at, status FROM clinics WHERE id = ?')
                .get(testClinicId) as { updated_at: string; status: string };

            expect(after.status).toBe('cancelled');
            expect(after.updated_at).not.toBe(before.updated_at);
        });

        it('should prevent regular doctor from blocking their own clinic', async () => {
            const response = await request(app)
                .patch(`/api/saas/clinics/${testClinicId}/status`)
                .set('Authorization', `Bearer ${regularDoctorToken}`) // Doctor token
                .send({ status: 'suspended', reason: 'Trying to block myself' })
                .expect(403);

            expect(response.body).toHaveProperty('error');
            expect(response.body.requiredRole).toBe('super_admin');
        });
    });

    // ==========================================
    // Edge Cases and Data Integrity
    // ==========================================

    describe('🔍 Edge Cases and Data Integrity', () => {
        it('should handle MRR calculation with zero active clinics gracefully', async () => {
            // Suspend all clinics temporarily
            db.prepare('UPDATE clinics SET status = ? WHERE status = ?').run('suspended', 'active');

            const response = await request(app)
                .get('/api/saas/stats/system')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(200);

            expect(response.body.mrr).toBe(0);
            expect(response.body.arr).toBe(0);
            expect(response.body.active_clinics).toBe(0);

            // Restore clinics
            db.prepare('UPDATE clinics SET status = ? WHERE status = ?').run('active', 'suspended');
        });

        it('should list clinics with correct patient counts', async () => {
            // First, add some test patients
            for (let i = 1; i <= 3; i++) {
                db.prepare(
                    `
                    INSERT INTO patients (
                        name, phone, cpf, clinic_id,
                        created_at, updated_at
                    ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                `
                ).run(`Patient ${i}`, `11988880000${i}`, `12345678900${i}`, testClinicId);
            }

            const response = await request(app)
                .get('/api/saas/clinics')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(200);

            const testClinic = response.body.find((c: any) => c.id === testClinicId);
            expect(testClinic).toBeDefined();
            expect(testClinic.patient_count).toBe(3); // We created 3 test patients
        });

        it('should return consistent stats across multiple requests', async () => {
            const response1 = await request(app)
                .get('/api/saas/stats/system')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(200);

            const response2 = await request(app)
                .get('/api/saas/stats/system')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(200);

            // Stats should be identical
            expect(response1.body.mrr).toBe(response2.body.mrr);
            expect(response1.body.active_clinics).toBe(response2.body.active_clinics);
            expect(response1.body.total_patients).toBe(response2.body.total_patients);
        });

        it('should include last_login information in clinic list', async () => {
            // Simulate login to update last_login_at
            await request(app)
                .post('/api/auth/login')
                .send({
                    username: testDoctorUsername,
                    password: testDoctorPassword,
                })
                .expect(200);

            const response = await request(app)
                .get('/api/saas/clinics')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(200);

            const testClinic = response.body.find((c: any) => c.id === testClinicId);
            expect(testClinic).toBeDefined();
            expect(testClinic).toHaveProperty('last_login');
            expect(testClinic.last_login).not.toBeNull();
        });
    });

    // ==========================================
    // Performance Tests
    // ==========================================

    describe('⚡ Performance', () => {
        it('should return stats in less than 200ms', async () => {
            const start = Date.now();

            await request(app)
                .get('/api/saas/stats/system')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(200);

            const duration = Date.now() - start;
            expect(duration).toBeLessThan(200);

            console.log(`✅ Stats endpoint response time: ${duration}ms`);
        });

        it('should handle clinic list with acceptable performance', async () => {
            const start = Date.now();

            const response = await request(app)
                .get('/api/saas/clinics')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(200);

            const duration = Date.now() - start;
            expect(duration).toBeLessThan(300);

            console.log(
                `✅ Clinics list response time: ${duration}ms (${response.body.length} clinics)`
            );
        });
    });
});
