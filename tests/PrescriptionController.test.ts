import request from 'supertest';
import express from 'express';
import { PrescriptionController } from '../src/controllers/PrescriptionController';

const app = express();
app.use(express.json());

// Mock tenant middleware that sets clinicId
const mockTenantMiddleware = (clinicId: number) => (req: any, _res: any, next: any) => {
    req.clinicId = clinicId;
    req.user = { userId: 1, clinicId, role: 'doctor' };
    next();
};

// Routes for Clinic A (id: 1)
app.get('/api/prescriptions/:id/pdf', mockTenantMiddleware(1), PrescriptionController.downloadPdf);

// Routes for Clinic B (id: 2) - for multi-tenant tests
const appB = express();
appB.use(express.json());
appB.get('/api/prescriptions/:id/pdf', mockTenantMiddleware(2), PrescriptionController.downloadPdf);

// Route without clinicId (unauthenticated)
const appUnauth = express();
appUnauth.use(express.json());
appUnauth.get(
    '/api/prescriptions/:id/pdf',
    (req: any, _res: any, next: any) => {
        // No clinicId set
        next();
    },
    PrescriptionController.downloadPdf
);

describe('PrescriptionController', () => {
    beforeAll(() => {
        process.env.JWT_SECRET = 'test-secret-for-prescriptions';
    });

    describe('GET /api/prescriptions/:id/pdf - Download PDF', () => {
        it('should require clinic identification (401 without clinicId)', async () => {
            const response = await request(appUnauth).get('/api/prescriptions/1/pdf').expect(401);

            expect(response.body).toHaveProperty('error', 'Clínica não identificada');
        });

        it('should return 400 for invalid prescription ID (non-numeric)', async () => {
            const response = await request(app).get('/api/prescriptions/invalid/pdf').expect(400);

            expect(response.body).toHaveProperty('error', 'ID inválido');
        });

        it('should return 400 for NaN prescription ID', async () => {
            const response = await request(app).get('/api/prescriptions/abc123/pdf').expect(400);

            expect(response.body).toHaveProperty('error', 'ID inválido');
        });

        it('should return 400 for Infinity prescription ID', async () => {
            const response = await request(app).get('/api/prescriptions/Infinity/pdf').expect(400);

            expect(response.body).toHaveProperty('error', 'ID inválido');
        });

        // Note: Tests that require the prescriptions table are skipped
        // as they need database setup which is tested in integration tests
    });

    describe('Input Validation', () => {
        it('should validate prescription ID is a number', async () => {
            // Non-numeric should fail fast
            const response = await request(app)
                .get('/api/prescriptions/not-a-number/pdf')
                .expect(400);

            expect(response.body.error).toBe('ID inválido');
        });

        it('should validate prescription ID format with special chars', async () => {
            const response = await request(app).get('/api/prescriptions/1;DROP/pdf').expect(400);

            expect(response.body.error).toBe('ID inválido');
        });
    });

    describe('Authentication', () => {
        it('should require clinicId to be set', async () => {
            const response = await request(appUnauth).get('/api/prescriptions/123/pdf');

            expect(response.status).toBe(401);
            expect(response.body.error).toBe('Clínica não identificada');
        });
    });
});
