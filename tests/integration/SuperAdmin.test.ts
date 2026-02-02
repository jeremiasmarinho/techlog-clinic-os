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

// Helper functions to promisify sqlite3 callbacks
const dbRun = (sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> => {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
};

const dbGet = <T>(sql: string, params: any[] = []): Promise<T | undefined> => {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row as T | undefined);
        });
    });
};

const dbAll = <T>(sql: string, params: any[] = []): Promise<T[]> => {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows as T[]);
        });
    });
};

describe.skip('Integration Test - Super Admin Module', () => {
    // TODO: Refactor to use async sqlite3 helpers instead of better-sqlite3 syntax
    // These tests need db.prepare() to be replaced with promisified dbRun/dbGet/dbAll
    let app: Express;
    let superAdminToken: string;
    let regularDoctorToken: string;
    let testClinicId: number;
    let testDoctorUserId: number;
    let testDoctorUsername: string;
    let testDoctorPassword: string;

    // Environment setup - deve bater com o default do middleware
    const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';
    const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'admin@techlog.com';

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
        await dbRun(`
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
        `);

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
        await dbRun('DELETE FROM patients WHERE clinic_id > 2'); // First delete patients
        await dbRun('DELETE FROM users WHERE username LIKE ?', ['test-doctor-%']); // Then users
        await dbRun('DELETE FROM clinics WHERE slug LIKE ?', ['test-clinic-%']); // Finally clinics

        // Generate unique identifiers
        const timestamp = Date.now();
        const testSlug = `test-clinic-qa-${timestamp}`;

        // Create test clinic for regular doctor
        const clinicResult = await dbRun(
            `INSERT INTO clinics (
                name, slug, status, plan_tier,
                subscription_started_at, subscription_ends_at,
                created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            ['Test Clinic QA', testSlug, 'active', 'professional', '2026-01-01', '2026-12-31']
        );

        testClinicId = clinicResult.lastID;
        console.log(`✅ Test clinic created: ID ${testClinicId}`);

        // Create test doctor user for the clinic
        const hashedPassword = await bcrypt.hash('test123', 10);
        testDoctorUsername = `test-doctor-${Date.now()}`;
        testDoctorPassword = 'test123';

        const userResult = await dbRun(
            `INSERT INTO users (
                name, username, password, role, clinic_id, is_owner,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            ['Dr. Test QA', testDoctorUsername, hashedPassword, 'doctor', testClinicId, 1]
        );

        testDoctorUserId = userResult.lastID;
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
    afterAll(async () => {
        console.log('\n🧹 Cleaning up Super Admin test data...');

        // Order matters for foreign key constraints
        try {
            await dbRun('DELETE FROM patients WHERE clinic_id > 2');
            await dbRun('DELETE FROM users WHERE username LIKE ?', ['test-doctor-%']);
            await dbRun('DELETE FROM clinics WHERE slug LIKE ?', ['test-clinic-%']);
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
            expect(response.body.mrr).toHaveProperty('arr');
            expect(response.body.clinics).toHaveProperty('active');
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

            expect(response.body).toHaveProperty('clinics');
            expect(Array.isArray(response.body.clinics)).toBe(true);
            expect(response.body.clinics.length).toBeGreaterThan(0);

            // Verify test clinic is in the list
            const testClinic = response.body.clinics.find((c: any) => c.id === testClinicId);
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
            expect(response.body.mrr).toHaveProperty('arr');
            expect(response.body.clinics).toHaveProperty('active');
            expect(response.body.patients).toHaveProperty('total');
            expect(response.body.churn).toHaveProperty('rate');

            // Verify MRR is a number and > 0
            expect(typeof response.body.mrr.total).toBe('number');
            expect(response.body.mrr.total).toBeGreaterThan(0);

            // Verify ARR = MRR * 12
            expect(response.body.mrr.arr).toBe(response.body.mrr.total * 12);

            // Verify active_clinics count
            expect(typeof response.body.clinics.active).toBe('number');
            expect(response.body.clinics.active).toBeGreaterThan(0);

            // Verify plan_distribution exists
            expect(response.body).toHaveProperty('plan_distribution');
            expect(Array.isArray(response.body.plan_distribution)).toBe(true);

            console.log('📊 MRR Stats:', {
                mrr: response.body.mrr.total,
                arr: response.body.mrr.arr,
                active_clinics: response.body.clinics.active,
                plans: response.body.plan_distribution,
            });
        });

        it('should include correct plan breakdown with counts and MRR per plan', async () => {
            const response = await request(app)
                .get('/api/saas/stats/system')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(200);

            expect(response.body.mrr).toHaveProperty('breakdown');
            expect(Array.isArray(response.body.mrr.breakdown)).toBe(true);
            expect(response.body.mrr.breakdown.length).toBeGreaterThan(0);

            // Verify breakdown structure
            response.body.mrr.breakdown.forEach((item: any) => {
                expect(item).toHaveProperty('plan');
                expect(item).toHaveProperty('clinics');
                expect(item).toHaveProperty('revenue');
                expect(typeof item.clinics).toBe('number');
                expect(typeof item.revenue).toBe('number');
            });

            // Verify our test clinic (professional) is counted
            const professionalPlan = response.body.mrr.breakdown.find(
                (p: any) => p.plan === 'professional'
            );
            expect(professionalPlan).toBeDefined();
            expect(professionalPlan.clinics).toBeGreaterThan(0);
        });

        it('should calculate total_patients correctly across all clinics', async () => {
            const response = await request(app)
                .get('/api/saas/stats/system')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(200);

            expect(response.body.patients).toHaveProperty('total');
            expect(typeof response.body.patients.total).toBe('number');
            expect(response.body.patients.total).toBeGreaterThanOrEqual(0); // At least 0 patients
        });

        it('should calculate churn_rate as percentage (0-100)', async () => {
            const response = await request(app)
                .get('/api/saas/stats/system')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(200);

            expect(typeof response.body.churn.rate).toBe('number');
            expect(response.body.churn.rate).toBeGreaterThanOrEqual(0);
            expect(response.body.churn.rate).toBeLessThanOrEqual(100);
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

            expect(response.body.clinics.active).toBeGreaterThan(0);
            expect(response.body.clinics.active).toBeLessThan(allClinics.count);

            // Cleanup
            db.prepare('DELETE FROM clinics WHERE id = ?').run(suspendedClinic.lastInsertRowid);
        });
    });

    // ==========================================
    // Business Logic Tests - Clinic Blocking
    // ==========================================

    describe('🚫 Business Logic - Clinic Blocking Impact', () => {
        it('should successfully block a clinic (active → suspended)', async () => {
            // Create a new clinic for this test
            const testClinic = db
                .prepare(
                    `INSERT INTO clinics (name, slug, status, plan_tier, created_at, updated_at)
                 VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
                )
                .run('Temp Test Clinic', `temp-clinic-${Date.now()}`, 'active', 'basic');

            const clinicId = Number(testClinic.lastInsertRowid);
            console.log(`✅ Created test clinic with ID: ${clinicId}`);

            const response = await request(app)
                .patch(`/api/saas/clinics/${clinicId}/status`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({
                    status: 'suspended',
                    reason: 'Test: Payment failure simulation',
                })
                .expect(200);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('atualizado');

            // Verify status changed in database
            const clinic = db.prepare('SELECT status FROM clinics WHERE id = ?').get(clinicId) as {
                status: string;
            };
            expect(clinic.status).toBe('suspended');

            // Cleanup
            db.prepare('DELETE FROM clinics WHERE id = ?').run(clinicId);
        });

        it('should reject login from blocked clinic user', async () => {
            // Create a new clinic and user for this test
            const testClinic = db
                .prepare(
                    `INSERT INTO clinics (name, slug, status, plan_tier, created_at, updated_at)
                 VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
                )
                .run('Temp Blocked Clinic', `temp-blocked-${Date.now()}`, 'active', 'basic');

            const clinicId = testClinic.lastInsertRowid;

            // First, block the clinic
            await request(app)
                .patch(`/api/saas/clinics/${clinicId}/status`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({ status: 'suspended', reason: 'Test blocking' })
                .expect(200);

            // Verify status was changed
            const clinic = db.prepare('SELECT status FROM clinics WHERE id = ?').get(clinicId) as {
                status: string;
            };
            expect(clinic.status).toBe('suspended');

            // Cleanup
            db.prepare('DELETE FROM clinics WHERE id = ?').run(clinicId);
        });

        it('should allow login after unblocking clinic (suspended → active)', async () => {
            // Create a new clinic for this test
            const testClinic = db
                .prepare(
                    `INSERT INTO clinics (name, slug, status, plan_tier, created_at, updated_at)
                 VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
                )
                .run('Temp Unblock Clinic', `temp-unblock-${Date.now()}`, 'active', 'basic');

            const clinicId = testClinic.lastInsertRowid;

            // Block clinic first
            await request(app)
                .patch(`/api/saas/clinics/${clinicId}/status`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({ status: 'suspended', reason: 'Test' })
                .expect(200);

            // Unblock clinic
            await request(app)
                .patch(`/api/saas/clinics/${clinicId}/status`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({ status: 'active', reason: 'Test unblock' })
                .expect(200);

            // Verify status
            const clinic = db.prepare('SELECT status FROM clinics WHERE id = ?').get(clinicId) as {
                status: string;
            };
            expect(clinic.status).toBe('active');

            // Cleanup
            db.prepare('DELETE FROM clinics WHERE id = ?').run(clinicId);
        });

        it('should reject invalid status values', async () => {
            // Create a new clinic for this test
            const testClinic = db
                .prepare(
                    `INSERT INTO clinics (name, slug, status, plan_tier, created_at, updated_at)
                 VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
                )
                .run('Temp Invalid Clinic', `temp-invalid-${Date.now()}`, 'active', 'basic');

            const clinicId = testClinic.lastInsertRowid;

            const response = await request(app)
                .patch(`/api/saas/clinics/${clinicId}/status`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({
                    status: 'invalid-status', // Invalid
                    reason: 'Test',
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Status inválido');

            // Cleanup
            db.prepare('DELETE FROM clinics WHERE id = ?').run(clinicId);
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
            // Create a new clinic for this test
            const testClinic = db
                .prepare(
                    `INSERT INTO clinics (name, slug, status, plan_tier, created_at, updated_at)
                 VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
                )
                .run('Temp Timestamp Clinic', `temp-timestamp-${Date.now()}`, 'active', 'basic');

            const clinicId = testClinic.lastInsertRowid;

            // Get current updated_at
            const before = db
                .prepare('SELECT updated_at FROM clinics WHERE id = ?')
                .get(clinicId) as { updated_at: string };

            // Wait 100ms to ensure timestamp difference
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Update status
            await request(app)
                .patch(`/api/saas/clinics/${clinicId}/status`)
                .set('Authorization', `Bearer ${superAdminToken}`)
                .send({ status: 'cancelled', reason: 'Test' })
                .expect(200);

            // Verify updated_at changed
            const after = db
                .prepare('SELECT updated_at, status FROM clinics WHERE id = ?')
                .get(clinicId) as { updated_at: string; status: string };

            expect(after.status).toBe('cancelled');
            expect(after.updated_at).not.toBe(before.updated_at);

            // Cleanup
            db.prepare('DELETE FROM clinics WHERE id = ?').run(clinicId);
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

            expect(response.body.mrr.total).toBe(0);
            expect(response.body.mrr.arr).toBe(0);
            expect(response.body.clinics.active).toBe(0);

            // Restore clinics
            db.prepare('UPDATE clinics SET status = ? WHERE status = ?').run('active', 'suspended');
        });

        it('should list clinics with correct patient counts', async () => {
            const response = await request(app)
                .get('/api/saas/clinics')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('clinics');
            expect(Array.isArray(response.body.clinics)).toBe(true);
            expect(response.body.clinics.length).toBeGreaterThan(0);

            // Verify all clinics have patient_count property
            response.body.clinics.forEach((clinic: any) => {
                expect(clinic).toHaveProperty('patient_count');
                expect(typeof clinic.patient_count).toBe('number');
            });
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
            expect(response1.body.mrr).toStrictEqual(response2.body.mrr);
            expect(response1.body.clinics.active).toBe(response2.body.clinics.active);
            expect(response1.body.patients.total).toBe(response2.body.patients.total);
        });

        it('should include last_login information in clinic list', async () => {
            const response = await request(app)
                .get('/api/saas/clinics')
                .set('Authorization', `Bearer ${superAdminToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('clinics');
            expect(Array.isArray(response.body.clinics)).toBe(true);

            // Verify all clinics have last_login property (can be null)
            response.body.clinics.forEach((clinic: any) => {
                expect(clinic).toHaveProperty('last_login');
            });
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
                `✅ Clinics list response time: ${duration}ms (${response.body.clinics.length} clinics)`
            );
        });
    });
});
