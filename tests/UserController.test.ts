import request from 'supertest';
import express from 'express';
import { UserController } from '../src/controllers/UserController';
import { db } from '../src/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();
app.use(express.json());

// Mock auth middleware
const mockAuthMiddleware = (req: any, _res: any, next: any) => {
    req.user = { userId: 1, clinicId: 1, role: 'admin' };
    next();
};

// Routes
app.get('/api/users', UserController.index);
app.post('/api/users', UserController.store);
app.delete('/api/users/:id', UserController.delete);
app.patch('/api/users/profile', mockAuthMiddleware, UserController.updateProfile);
app.post('/api/login-legacy', UserController.login); // Legacy login

describe('UserController', () => {
    beforeAll((done) => {
        process.env.JWT_SECRET = 'test-secret-key-for-users';
        // Wait for db to be ready
        db.run('SELECT 1', done);
    });

    beforeEach((done) => {
        // Clear users table except admin
        db.run('DELETE FROM users WHERE id > 1', done);
    });

    afterAll((done) => {
        // Don't close db - other tests may use it
        done();
    });

    describe('GET /api/users - List Users', () => {
        it('should list all users', async () => {
            const response = await request(app).get('/api/users').expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            // List might be empty in test env
        });

        it('should return users with correct fields', async () => {
            // First create a user to ensure list isn't empty
            const hashedPw = await bcrypt.hash('test123pass', 10);
            await new Promise<void>((resolve, reject) => {
                db.run(
                    'INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)',
                    ['Test Fields User', 'testfieldsuser', hashedPw, 'staff'],
                    (err) => (err ? reject(err) : resolve())
                );
            });

            const response = await request(app).get('/api/users').expect(200);

            expect(response.body.length).toBeGreaterThanOrEqual(1);
            const user = response.body[0];
            expect(user).toHaveProperty('id');
            expect(user).toHaveProperty('name');
            expect(user).toHaveProperty('username');
            expect(user).toHaveProperty('role');
            expect(user).toHaveProperty('created_at');
            // Password should NOT be returned
            expect(user).not.toHaveProperty('password');
        });

        it('should return users ordered by created_at DESC', async () => {
            // Create two users with different timestamps
            const hashedPw = await bcrypt.hash('test123pass', 10);
            await new Promise<void>((resolve, reject) => {
                db.run(
                    'INSERT INTO users (name, username, password, role, created_at) VALUES (?, ?, ?, ?, datetime("now", "-1 minute"))',
                    ['First User', 'firstuser', hashedPw, 'staff'],
                    (err) => (err ? reject(err) : resolve())
                );
            });

            await new Promise<void>((resolve, reject) => {
                db.run(
                    'INSERT INTO users (name, username, password, role, created_at) VALUES (?, ?, ?, ?, datetime("now"))',
                    ['Second User', 'seconduser', hashedPw, 'staff'],
                    (err) => (err ? reject(err) : resolve())
                );
            });

            const response = await request(app).get('/api/users').expect(200);

            // Most recent user should be first
            const names = response.body.map((u: any) => u.name);
            const secondIdx = names.indexOf('Second User');
            const firstIdx = names.indexOf('First User');

            if (secondIdx !== -1 && firstIdx !== -1) {
                expect(secondIdx).toBeLessThan(firstIdx);
            }
        });
    });

    describe('POST /api/users - Create User', () => {
        it('should create a new user successfully', async () => {
            const newUser = {
                name: 'Test Doctor',
                username: 'testdoc',
                password: 'SecurePass123',
                role: 'medico', // Valid role from schema
            };

            const response = await request(app).post('/api/users').send(newUser).expect(201);

            expect(response.body).toHaveProperty('message', 'Usuário criado com sucesso');
            expect(response.body).toHaveProperty('id');
            expect(response.body.user).toMatchObject({
                name: 'Test Doctor',
                username: 'testdoc',
                role: 'medico',
            });
        });

        it('should hash password before storing', async () => {
            const newUser = {
                name: 'Hash Test User',
                username: 'hashtest',
                password: 'PlainPassword123',
                role: 'staff',
            };

            await request(app).post('/api/users').send(newUser).expect(201);

            // Verify password is hashed in database
            const user = await new Promise<any>((resolve, reject) => {
                db.get(
                    'SELECT password FROM users WHERE username = ?',
                    ['hashtest'],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            expect(user.password).not.toBe('PlainPassword123');
            expect(user.password.startsWith('$2')).toBe(true); // bcrypt hash prefix
        });

        it('should fail when name is missing', async () => {
            const response = await request(app)
                .post('/api/users')
                .send({
                    username: 'noname',
                    password: 'Pass123456',
                    role: 'staff',
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should fail when username is missing', async () => {
            const response = await request(app)
                .post('/api/users')
                .send({
                    name: 'No Username',
                    password: 'Pass123456',
                    role: 'staff',
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should fail when password is missing', async () => {
            const response = await request(app)
                .post('/api/users')
                .send({
                    name: 'No Password',
                    username: 'nopassword',
                    role: 'staff',
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should fail when username already exists', async () => {
            const newUser = {
                name: 'Duplicate User',
                username: 'duplicate',
                password: 'Pass123456',
                role: 'staff',
            };

            // Create first user
            await request(app).post('/api/users').send(newUser).expect(201);

            // Try to create duplicate
            const response = await request(app).post('/api/users').send(newUser).expect(409);

            expect(response.body).toHaveProperty('error', 'Nome de usuário já existe');
        });

        it('should validate password strength', async () => {
            const response = await request(app)
                .post('/api/users')
                .send({
                    name: 'Weak Password User',
                    username: 'weakpw',
                    password: '123', // Too short (min 6)
                    role: 'staff',
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });

        it('should validate invalid role', async () => {
            const response = await request(app)
                .post('/api/users')
                .send({
                    name: 'Invalid Role User',
                    username: 'invalidrole',
                    password: 'Pass123456',
                    role: 'invalid_role',
                })
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('DELETE /api/users/:id - Delete User', () => {
        it('should delete a user successfully', async () => {
            // Create user to delete
            const hashedPw = await bcrypt.hash('test123pass', 10);
            const userId = await new Promise<number>((resolve, reject) => {
                db.run(
                    'INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)',
                    ['To Delete', 'todelete', hashedPw, 'staff'],
                    function (err) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    }
                );
            });

            const response = await request(app).delete(`/api/users/${userId}`).expect(200);

            expect(response.body).toHaveProperty('message', 'Usuário removido com sucesso');
            expect(response.body).toHaveProperty('changes', 1);
        });

        it('should prevent deletion of admin user (id=1)', async () => {
            const response = await request(app).delete('/api/users/1').expect(403);

            expect(response.body).toHaveProperty(
                'error',
                'Não é possível deletar o usuário administrador padrão'
            );
        });

        it('should return 404 for non-existent user', async () => {
            const response = await request(app).delete('/api/users/99999').expect(404);

            expect(response.body).toHaveProperty('error', 'Usuário não encontrado');
        });
    });

    describe('PATCH /api/users/profile - Update Profile', () => {
        it('should update CRM information', async () => {
            const response = await request(app)
                .patch('/api/users/profile')
                .send({
                    crm: '123456',
                    crm_state: 'SP',
                })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('crm', '123456');
            expect(response.body).toHaveProperty('crm_state', 'SP');
        });

        it('should uppercase CRM state', async () => {
            const response = await request(app)
                .patch('/api/users/profile')
                .send({
                    crm_state: 'rj',
                })
                .expect(200);

            expect(response.body.crm_state).toBe('RJ');
        });

        it('should reject invalid CRM state (not 2 chars)', async () => {
            const response = await request(app)
                .patch('/api/users/profile')
                .send({
                    crm_state: 'SPA', // 3 chars
                })
                .expect(400);

            expect(response.body).toHaveProperty('error', 'UF do CRM inválida');
        });

        it('should update signature URL', async () => {
            const response = await request(app)
                .patch('/api/users/profile')
                .send({
                    signature_url: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
                })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
        });

        it('should allow partial updates', async () => {
            const response = await request(app)
                .patch('/api/users/profile')
                .send({
                    crm: '999999',
                    // No crm_state or signature_url
                })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('crm', '999999');
        });
    });

    describe('POST /api/login-legacy - Legacy Login', () => {
        beforeEach(async () => {
            // Create test user for login tests
            const hashedPw = await bcrypt.hash('correctpassword', 10);
            await new Promise<void>((resolve, reject) => {
                db.run(
                    'INSERT OR REPLACE INTO users (id, name, username, password, role, clinic_id) VALUES (?, ?, ?, ?, ?, ?)',
                    [100, 'Login Test User', 'logintest', hashedPw, 'medico', 1],
                    (err) => (err ? reject(err) : resolve())
                );
            });
        });

        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/login-legacy')
                .send({
                    username: 'logintest',
                    password: 'correctpassword',
                })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.username).toBe('logintest');
        });

        it('should return JWT token on successful login', async () => {
            const response = await request(app)
                .post('/api/login-legacy')
                .send({
                    username: 'logintest',
                    password: 'correctpassword',
                })
                .expect(200);

            // Verify token is valid JWT
            const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET!) as any;
            expect(decoded).toHaveProperty('userId');
            expect(decoded).toHaveProperty('username', 'logintest');
        });

        it('should fail with missing username', async () => {
            const response = await request(app)
                .post('/api/login-legacy')
                .send({
                    password: 'somepassword',
                })
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
        });

        it('should fail with missing password', async () => {
            const response = await request(app)
                .post('/api/login-legacy')
                .send({
                    username: 'logintest',
                })
                .expect(400);

            expect(response.body).toHaveProperty('success', false);
        });

        it('should fail with invalid username', async () => {
            const response = await request(app)
                .post('/api/login-legacy')
                .send({
                    username: 'nonexistent',
                    password: 'anypassword',
                })
                .expect(401);

            expect(response.body).toHaveProperty('success', false);
        });

        it('should fail with invalid password', async () => {
            const response = await request(app)
                .post('/api/login-legacy')
                .send({
                    username: 'logintest',
                    password: 'wrongpassword',
                })
                .expect(401);

            expect(response.body).toHaveProperty('success', false);
        });

        it('should accept email field as alternative to username', async () => {
            const response = await request(app)
                .post('/api/login-legacy')
                .send({
                    email: 'logintest', // Using email field instead of username
                    password: 'correctpassword',
                })
                .expect(200);

            expect(response.body).toHaveProperty('success', true);
        });
    });

    describe('Security', () => {
        it('should not return password in user list', async () => {
            const response = await request(app).get('/api/users').expect(200);

            response.body.forEach((user: any) => {
                expect(user).not.toHaveProperty('password');
            });
        });

        it('should not allow SQL injection in username', async () => {
            const response = await request(app)
                .post('/api/login-legacy')
                .send({
                    username: "admin'; DROP TABLE users;--",
                    password: 'test',
                })
                .expect(401);

            // Database should still be functional
            const users = await request(app).get('/api/users').expect(200);
            expect(Array.isArray(users.body)).toBe(true);
        });
    });
});
