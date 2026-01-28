import request from 'supertest';
import express, { Express } from 'express';
import bcrypt from 'bcrypt';
import authRoutes from '../src/routes/auth.routes';

describe('AuthController', () => {
  let app: Express;

  beforeAll(() => {
    // Setup Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);
  });

  describe('POST /api/auth/login - JWT Login', () => {
    it('should login successfully with valid credentials', async () => {
      // Hash the test password
      const hashedPassword = await bcrypt.hash('Mudar123!', 10);
      
      // Temporarily set the hashed password in env
      const originalPass = process.env.ADMIN_PASS;
      process.env.ADMIN_PASS = hashedPassword;

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'Mudar123!'
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('name', 'Administrador');
      expect(response.body.user).toHaveProperty('email', 'admin@test.com');
      expect(typeof response.body.token).toBe('string');

      // Restore original password
      process.env.ADMIN_PASS = originalPass;
    });

    it('should fail with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'Mudar123!'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'E-mail e senha são obrigatórios');
    });

    it('should fail with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'E-mail e senha são obrigatórios');
    });

    it('should fail with invalid email', async () => {
      const hashedPassword = await bcrypt.hash('Mudar123!', 10);
      const originalPass = process.env.ADMIN_PASS;
      process.env.ADMIN_PASS = hashedPassword;

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@test.com',
          password: 'Mudar123!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'E-mail ou senha inválidos');

      process.env.ADMIN_PASS = originalPass;
    });

    it('should fail with invalid password', async () => {
      const hashedPassword = await bcrypt.hash('Mudar123!', 10);
      const originalPass = process.env.ADMIN_PASS;
      process.env.ADMIN_PASS = hashedPassword;

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'E-mail ou senha inválidos');

      process.env.ADMIN_PASS = originalPass;
    });

    it('should return valid JWT token', async () => {
      const hashedPassword = await bcrypt.hash('Mudar123!', 10);
      const originalPass = process.env.ADMIN_PASS;
      process.env.ADMIN_PASS = hashedPassword;

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'Mudar123!'
        })
        .expect(200);

      // Verify JWT token format (should have 3 parts separated by dots)
      const token = response.body.token;
      expect(token).toBeDefined();
      expect(token.split('.').length).toBe(3);

      process.env.ADMIN_PASS = originalPass;
    });

    it('should include user information in response', async () => {
      const hashedPassword = await bcrypt.hash('Mudar123!', 10);
      const originalPass = process.env.ADMIN_PASS;
      process.env.ADMIN_PASS = hashedPassword;

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'Mudar123!'
        })
        .expect(200);

      expect(response.body.user).toEqual({
        name: 'Administrador',
        email: 'admin@test.com'
      });

      process.env.ADMIN_PASS = originalPass;
    });

    it('should handle bcrypt comparison correctly', async () => {
      // Create a known hash
      const password = 'TestPassword123!';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const originalPass = process.env.ADMIN_PASS;
      process.env.ADMIN_PASS = hashedPassword;

      // Should succeed with correct password
      const successResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: password
        })
        .expect(200);

      expect(successResponse.body).toHaveProperty('token');

      // Should fail with incorrect password
      const failResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'WrongPassword'
        })
        .expect(401);

      expect(failResponse.body).toHaveProperty('error');

      process.env.ADMIN_PASS = originalPass;
    });

    it('should not leak information about which credential is wrong', async () => {
      const hashedPassword = await bcrypt.hash('Mudar123!', 10);
      const originalPass = process.env.ADMIN_PASS;
      process.env.ADMIN_PASS = hashedPassword;

      // Wrong email
      const wrongEmailResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@test.com',
          password: 'Mudar123!'
        })
        .expect(401);

      // Wrong password
      const wrongPasswordResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'WrongPassword'
        })
        .expect(401);

      // Both should return the same generic error message
      expect(wrongEmailResponse.body.error).toBe(wrongPasswordResponse.body.error);
      expect(wrongEmailResponse.body.error).toBe('E-mail ou senha inválidos');

      process.env.ADMIN_PASS = originalPass;
    });
  });

  describe('JWT Token Security', () => {
    it('should create token with expiration', async () => {
      const hashedPassword = await bcrypt.hash('Mudar123!', 10);
      const originalPass = process.env.ADMIN_PASS;
      process.env.ADMIN_PASS = hashedPassword;

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'Mudar123!'
        })
        .expect(200);

      const token = response.body.token;
      
      // Decode token to verify it has expiration
      const jwt = require('jsonwebtoken');
      const decoded: any = jwt.decode(token);
      
      expect(decoded).toHaveProperty('exp');
      expect(decoded).toHaveProperty('iat');
      expect(decoded.exp).toBeGreaterThan(decoded.iat);

      process.env.ADMIN_PASS = originalPass;
    });

    it('should include user id in token payload', async () => {
      const hashedPassword = await bcrypt.hash('Mudar123!', 10);
      const originalPass = process.env.ADMIN_PASS;
      process.env.ADMIN_PASS = hashedPassword;

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'Mudar123!'
        })
        .expect(200);

      const token = response.body.token;
      const jwt = require('jsonwebtoken');
      const decoded: any = jwt.decode(token);
      
      expect(decoded).toHaveProperty('id', 1);
      expect(decoded).toHaveProperty('name', 'Administrador');
      expect(decoded).toHaveProperty('email', 'admin@test.com');

      process.env.ADMIN_PASS = originalPass;
    });
  });

  describe('Input Validation', () => {
    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'E-mail e senha são obrigatórios');
    });

    it('should handle null values', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: null,
          password: null
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle empty strings', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: '',
          password: ''
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'E-mail e senha são obrigatórios');
    });

    it('should handle whitespace-only strings', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: '   ',
          password: '   '
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});
