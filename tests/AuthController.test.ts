import { describe, it, expect, beforeAll, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express, { Express } from 'express';
import bcrypt from 'bcrypt';
import authRoutes from '../src/routes/auth.routes';
import { db } from '../src/database';

describe('AuthController', () => {
    let app: Express;
    const baseUserRow = {
        id: 1,
        name: 'Administrador',
        username: 'admin',
        password: 'hashed-password',
        role: 'super_admin',
        clinic_id: 1,
        is_owner: 1,
        clinic_name: 'Techlog Clinic',
        clinic_slug: 'techlog-clinic',
        clinic_status: 'active',
        plan_tier: 'basic',
    };

    beforeAll(() => {
        // Setup Express app for testing
        app = express();
        app.use(express.json());
        app.use('/api/auth', authRoutes);
    });

    beforeEach(() => {
        jest.restoreAllMocks();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('POST /api/auth/login - JWT Login', () => {
        it('should login successfully with valid credentials', async () => {
            jest.spyOn(db, 'get').mockImplementation((_sql, _params, callback) => {
                callback(null, baseUserRow);
                return db as any;
            });
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin',
                    password: 'Mudar123!',
                })
                .expect(200);

            expect(response.body).toHaveProperty('user');
            expect(response.body).toHaveProperty('token');
            expect(response.body.user).toHaveProperty('name', 'Administrador');
            expect(response.body.user).toHaveProperty('email', 'admin');
            expect(typeof response.body.token).toBe('string');
        });

        it('should fail with missing email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    password: 'Mudar123!',
                })
                .expect(400);

            expect(response.body).toHaveProperty('error', 'E-mail e senha são obrigatórios');
        });

        it('should fail with missing password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin@test.com',
                })
                .expect(400);

            expect(response.body).toHaveProperty('error', 'E-mail e senha são obrigatórios');
        });

        it('should fail with invalid email', async () => {
            jest.spyOn(db, 'get').mockImplementation((_sql, _params, callback) => {
                callback(null, null);
                return db as any;
            });

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'wrong',
                    password: 'Mudar123!',
                })
                .expect(401);

            expect(response.body).toHaveProperty('error', 'Credenciais inválidas');
        });

        it('should fail with invalid password', async () => {
            jest.spyOn(db, 'get').mockImplementation((_sql, _params, callback) => {
                callback(null, baseUserRow);
                return db as any;
            });
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin',
                    password: 'WrongPassword123!',
                })
                .expect(401);

            expect(response.body).toHaveProperty('error', 'Credenciais inválidas');
        });

        it('should return valid JWT token', async () => {
            jest.spyOn(db, 'get').mockImplementation((_sql, _params, callback) => {
                callback(null, baseUserRow);
                return db as any;
            });
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin',
                    password: 'Mudar123!',
                })
                .expect(200);

            // Verify JWT token format (should have 3 parts separated by dots)
            const token = response.body.token;
            expect(token).toBeDefined();
            expect(token.split('.').length).toBe(3);
        });

        it('should include user information in response', async () => {
            jest.spyOn(db, 'get').mockImplementation((_sql, _params, callback) => {
                callback(null, baseUserRow);
                return db as any;
            });
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin',
                    password: 'Mudar123!',
                })
                .expect(200);

            expect(response.body.user).toMatchObject({
                id: 1,
                name: 'Administrador',
                username: 'admin',
                email: 'admin',
                role: 'super_admin',
            });
        });

        it('should handle bcrypt comparison correctly', async () => {
            const password = 'TestPassword123!';
            jest.spyOn(db, 'get').mockImplementation((_sql, _params, callback) => {
                callback(null, baseUserRow);
                return db as any;
            });

            // Should succeed with correct password
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
            const successResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin',
                    password: password,
                })
                .expect(200);

            expect(successResponse.body).toHaveProperty('token');

            // Should fail with incorrect password
            (bcrypt.compare as jest.Mock).mockResolvedValue(false as never);
            const failResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin',
                    password: 'WrongPassword',
                })
                .expect(401);

            expect(failResponse.body).toHaveProperty('error');
        });

        it('should not leak information about which credential is wrong', async () => {
            jest.spyOn(db, 'get').mockImplementation((_sql, params, callback) => {
                const [username] = params as string[];
                if (username === 'admin') {
                    callback(null, baseUserRow);
                } else {
                    callback(null, null);
                }
                return db as any;
            });
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

            // Wrong email
            const wrongEmailResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'wrong',
                    password: 'Mudar123!',
                })
                .expect(401);

            // Wrong password
            const wrongPasswordResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin',
                    password: 'WrongPassword',
                })
                .expect(401);

            // Both should return the same generic error message
            expect(wrongEmailResponse.body.error).toBe(wrongPasswordResponse.body.error);
            expect(wrongEmailResponse.body.error).toBe('Credenciais inválidas');
        });
    });

    describe('JWT Token Security', () => {
        it('should create token with expiration', async () => {
            jest.spyOn(db, 'get').mockImplementation((_sql, _params, callback) => {
                callback(null, baseUserRow);
                return db as any;
            });
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin',
                    password: 'Mudar123!',
                })
                .expect(200);

            const token = response.body.token;

            // Decode token to verify it has expiration
            const jwt = require('jsonwebtoken');
            const decoded: any = jwt.decode(token);

            expect(decoded).toHaveProperty('exp');
            expect(decoded).toHaveProperty('iat');
            expect(decoded.exp).toBeGreaterThan(decoded.iat);
        });

        it('should include user id in token payload', async () => {
            jest.spyOn(db, 'get').mockImplementation((_sql, _params, callback) => {
                callback(null, baseUserRow);
                return db as any;
            });
            jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'admin',
                    password: 'Mudar123!',
                })
                .expect(200);

            const token = response.body.token;
            const jwt = require('jsonwebtoken');
            const decoded: any = jwt.decode(token);

            expect(decoded).toHaveProperty('userId', 1);
            expect(decoded).toHaveProperty('username', 'admin');
            expect(decoded).toHaveProperty('name', 'Administrador');
        });
    });

    describe('Input Validation', () => {
        it('should handle empty request body', async () => {
            const response = await request(app).post('/api/auth/login').send({}).expect(400);

            expect(response.body).toHaveProperty('error', 'E-mail e senha são obrigatórios');
        });

        it('should handle null values', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: null,
                    password: null,
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should handle empty strings', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: '',
                    password: '',
                })
                .expect(400);

            expect(response.body).toHaveProperty('error', 'E-mail e senha são obrigatórios');
        });

        it('should handle whitespace-only strings', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: '   ',
                    password: '   ',
                })
                .expect(400); // Whitespace-only é tratado como vazio após trim()

            expect(response.body).toHaveProperty('error', 'E-mail e senha são obrigatórios');
        });
    });
});
