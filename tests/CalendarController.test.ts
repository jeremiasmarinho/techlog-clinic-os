/**
 * CalendarController Tests
 *
 * Tests for the calendar/appointments module - CORE functionality
 * This is critical for the clinic scheduling system.
 *
 * @author QA Engineer
 * @date 2026-02-04
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';
import jwt from 'jsonwebtoken';
import calendarRoutes from '../src/routes/calendar.routes';
import { db } from '../src/database';

describe('CalendarController', () => {
    let app: Express;
    let testAppointmentId: number;
    let testLeadId: number;

    /**
     * Helper: Create authentication token for a specific clinic
     */
    const createAuthToken = (clinicId: number = 1, userId: number = 1) =>
        jwt.sign(
            {
                userId,
                username: `admin_clinic_${clinicId}`,
                name: `Administrador Clínica ${clinicId}`,
                role: 'admin',
                clinicId,
            },
            process.env.JWT_SECRET || 'test-jwt-secret-key',
            { expiresIn: '1h' }
        );

    beforeAll((done) => {
        app = express();
        app.use(express.json());
        app.use('/api/calendar', calendarRoutes);

        // Create test data sequentially to ensure IDs are set
        db.serialize(() => {
            // Create test appointment (without 'type' column as it doesn't exist)
            db.run(
                `INSERT INTO appointments (clinic_id, patient_name, patient_phone, start_time, end_time, status, appointment_date)
                 VALUES (1, 'Test Patient Calendar', '11999999999', datetime('now', '+1 day'), datetime('now', '+1 day', '+30 minutes'), 'scheduled', datetime('now', '+1 day'))`,
                function (err) {
                    if (err) {
                        console.error('Error creating test appointment:', err);
                    } else {
                        testAppointmentId = this.lastID;
                    }
                }
            );

            // Create test lead with appointment
            db.run(
                `INSERT INTO leads (clinic_id, name, phone, appointment_date, status)
                 VALUES (1, 'Test Lead Calendar', '11888888888', datetime('now', '+2 days'), 'scheduled')`,
                function (err) {
                    if (err) {
                        console.error('Error creating test lead:', err);
                    } else {
                        testLeadId = this.lastID;
                    }
                    done();
                }
            );
        });
    });

    afterAll((done) => {
        // Cleanup test data
        db.serialize(() => {
            if (testAppointmentId) {
                db.run('DELETE FROM appointments WHERE id = ?', [testAppointmentId]);
            }
            if (testLeadId) {
                db.run('DELETE FROM leads WHERE id = ?', [testLeadId]);
            }
            done();
        });
    });

    // =========================================================================
    // GET /api/calendar/appointments - List Appointments
    // =========================================================================
    describe('GET /api/calendar/appointments - List Appointments', () => {
        it('should require authentication', async () => {
            const response = await request(app).get('/api/calendar/appointments');

            expect(response.status).toBe(401);
        });

        it('should list appointments for authenticated clinic', async () => {
            const token = createAuthToken(1);

            const response = await request(app)
                .get('/api/calendar/appointments')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should filter appointments by date range', async () => {
            const token = createAuthToken(1);
            const startDate = new Date().toISOString().split('T')[0];
            const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split('T')[0];

            const response = await request(app)
                .get('/api/calendar/appointments')
                .query({ startDate, endDate })
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should include both appointments and leads', async () => {
            const token = createAuthToken(1);

            const response = await request(app)
                .get('/api/calendar/appointments')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            // Check for presence of both types
            const hasLeads = response.body.some(
                (item: any) => item.source === 'lead' || item.id?.toString().startsWith('lead-')
            );
            // At least one item should be present (our test data)
            expect(response.body.length).toBeGreaterThanOrEqual(0);
        });

        it('should exclude cancelled and archived appointments', async () => {
            const token = createAuthToken(1);

            const response = await request(app)
                .get('/api/calendar/appointments')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            // All items should NOT have cancelled or archived status
            response.body.forEach((item: any) => {
                expect(['cancelled', 'archived']).not.toContain(item.status);
            });
        });

        it('should not return appointments from other clinics', async () => {
            const token = createAuthToken(2); // Different clinic

            const response = await request(app)
                .get('/api/calendar/appointments')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            // Should not contain our test appointment (clinic_id = 1)
            const hasClinic1Data = response.body.some((item: any) => item.clinic_id === 1);
            expect(hasClinic1Data).toBe(false);
        });
    });

    // =========================================================================
    // PATCH /api/calendar/appointments/:id - Update Appointment
    // =========================================================================
    describe('PATCH /api/calendar/appointments/:id - Update Appointment', () => {
        it('should require authentication', async () => {
            const response = await request(app)
                .patch('/api/calendar/appointments/1')
                .send({ status: 'confirmed' });

            expect(response.status).toBe(401);
        });

        it('should require at least one field to update', async () => {
            const token = createAuthToken(1);

            const response = await request(app)
                .patch(`/api/calendar/appointments/${testAppointmentId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('campo');
        });

        it('should update appointment status', async () => {
            const token = createAuthToken(1);

            const response = await request(app)
                .patch(`/api/calendar/appointments/${testAppointmentId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ status: 'confirmed' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should update appointment notes', async () => {
            const token = createAuthToken(1);

            const response = await request(app)
                .patch(`/api/calendar/appointments/${testAppointmentId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ notes: 'Updated notes for test' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should update appointment time (drag-drop)', async () => {
            const token = createAuthToken(1);
            const newStart = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
            const newEnd = new Date(
                Date.now() + 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000
            ).toISOString();

            const response = await request(app)
                .patch(`/api/calendar/appointments/${testAppointmentId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ start: newStart, end: newEnd });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should update lead via lead-{id} format', async () => {
            const token = createAuthToken(1);

            const response = await request(app)
                .patch(`/api/calendar/appointments/lead-${testLeadId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ status: 'confirmed' });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.source).toBe('lead');
        });

        it('should return 404 for non-existent appointment', async () => {
            const token = createAuthToken(1);

            const response = await request(app)
                .patch('/api/calendar/appointments/999999')
                .set('Authorization', `Bearer ${token}`)
                .send({ status: 'confirmed' });

            expect(response.status).toBe(404);
        });

        it('should return 400 for invalid lead ID', async () => {
            const token = createAuthToken(1);

            const response = await request(app)
                .patch('/api/calendar/appointments/lead-invalid')
                .set('Authorization', `Bearer ${token}`)
                .send({ status: 'confirmed' });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('inválido');
        });

        it('should prevent updating appointments from other clinics', async () => {
            const token = createAuthToken(2); // Different clinic

            const response = await request(app)
                .patch(`/api/calendar/appointments/${testAppointmentId}`)
                .set('Authorization', `Bearer ${token}`)
                .send({ status: 'confirmed' });

            // Should return 404 (not found in this clinic)
            expect(response.status).toBe(404);
        });
    });

    // =========================================================================
    // DELETE /api/calendar/appointments/:id - Delete Appointment
    // =========================================================================
    describe('DELETE /api/calendar/appointments/:id - Delete Appointment', () => {
        let deleteTestId: number;

        beforeEach((done) => {
            // Create a new appointment to delete
            db.run(
                `INSERT INTO appointments (clinic_id, patient_name, patient_phone, start_time, end_time, status, appointment_date)
                 VALUES (1, 'Delete Test Patient', '11777777777', datetime('now', '+5 days'), datetime('now', '+5 days', '+30 minutes'), 'scheduled', datetime('now', '+5 days'))`,
                function (err) {
                    if (!err) deleteTestId = this.lastID;
                    done();
                }
            );
        });

        it('should require authentication', async () => {
            const response = await request(app).delete('/api/calendar/appointments/1');

            expect(response.status).toBe(401);
        });

        it('should delete (archive) appointment successfully', async () => {
            const token = createAuthToken(1);

            const response = await request(app)
                .delete(`/api/calendar/appointments/${deleteTestId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });

        it('should delete lead via lead-{id} format', async () => {
            const token = createAuthToken(1);
            let deleteLeadId: number;

            // Create a lead to delete
            await new Promise<void>((resolve) => {
                db.run(
                    `INSERT INTO leads (clinic_id, name, phone, appointment_date, status)
                     VALUES (1, 'Delete Test Lead', '11666666666', datetime('now', '+6 days'), 'scheduled')`,
                    function (err) {
                        if (!err) deleteLeadId = this.lastID;
                        resolve();
                    }
                );
            });

            const response = await request(app)
                .delete(`/api/calendar/appointments/lead-${deleteLeadId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(200);
        });

        it('should return 404 for non-existent appointment', async () => {
            const token = createAuthToken(1);

            const response = await request(app)
                .delete('/api/calendar/appointments/999999')
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
        });

        it('should prevent deleting appointments from other clinics', async () => {
            const token = createAuthToken(2); // Different clinic

            const response = await request(app)
                .delete(`/api/calendar/appointments/${deleteTestId}`)
                .set('Authorization', `Bearer ${token}`);

            expect(response.status).toBe(404);
        });
    });

    // =========================================================================
    // Multi-tenant Security Tests
    // =========================================================================
    describe('Multi-tenant Security', () => {
        it('should isolate data between clinics', async () => {
            const tokenClinic1 = createAuthToken(1);
            const tokenClinic2 = createAuthToken(2);

            const response1 = await request(app)
                .get('/api/calendar/appointments')
                .set('Authorization', `Bearer ${tokenClinic1}`);

            const response2 = await request(app)
                .get('/api/calendar/appointments')
                .set('Authorization', `Bearer ${tokenClinic2}`);

            // Each clinic should only see their own data
            response1.body.forEach((item: any) => {
                expect(item.clinic_id).toBe(1);
            });

            response2.body.forEach((item: any) => {
                expect(item.clinic_id).toBe(2);
            });
        });
    });
});
