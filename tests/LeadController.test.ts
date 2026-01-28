import request from 'supertest';
import express, { Express } from 'express';
import leadRoutes from '../src/routes/lead.routes';
import { db } from '../src/database';

describe('LeadController', () => {
  let app: Express;

  beforeAll(() => {
    // Setup Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/leads', leadRoutes);
  });

  afterAll((done) => {
    // Close database connection
    db.close(done);
  });

  describe('POST /api/leads - Create Lead', () => {
    it('should create a new lead successfully', async () => {
      const newLead = {
        name: 'João Silva',
        phone: '11987654321',
        type: 'primeira_consulta'
      };

      const response = await request(app)
        .post('/api/leads')
        .send(newLead)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Lead criado com sucesso');
      expect(response.body).toHaveProperty('id');
      expect(response.body.id).toBeGreaterThan(0);
    });

    it('should fail when name is missing', async () => {
      const invalidLead = {
        phone: '11987654321'
      };

      const response = await request(app)
        .post('/api/leads')
        .send(invalidLead)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail when phone is missing', async () => {
      const invalidLead = {
        name: 'João Silva'
      };

      const response = await request(app)
        .post('/api/leads')
        .send(invalidLead)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should create lead with default type when not specified', async () => {
      const newLead = {
        name: 'Maria Santos',
        phone: '11987654322'
      };

      const response = await request(app)
        .post('/api/leads')
        .send(newLead)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Lead criado com sucesso');
      expect(response.body).toHaveProperty('id');
    });
  });

  describe('GET /api/leads - List Leads', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/leads')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should list leads when authenticated', async () => {
      const token = process.env.ACCESS_TOKEN || 'test-token';

      const response = await request(app)
        .get('/api/leads')
        .set('x-access-token', token)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter archived leads when requested', async () => {
      const token = process.env.ACCESS_TOKEN || 'test-token';

      const response = await request(app)
        .get('/api/leads?show_archived=true')
        .set('x-access-token', token)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should filter kanban view correctly', async () => {
      const token = process.env.ACCESS_TOKEN || 'test-token';

      const response = await request(app)
        .get('/api/leads?view=kanban')
        .set('x-access-token', token)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('PATCH /api/leads/:id - Update Lead', () => {
    let testLeadId: number;

    beforeAll(async () => {
      // Create a test lead
      const response = await request(app)
        .post('/api/leads')
        .send({
          name: 'Test User for Update',
          phone: '11999999999',
          type: 'primeira_consulta'
        });
      testLeadId = response.body.id;
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .patch(`/api/leads/${testLeadId}`)
        .send({ status: 'agendado' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should update lead status successfully', async () => {
      const token = process.env.ACCESS_TOKEN || 'test-token';

      const response = await request(app)
        .patch(`/api/leads/${testLeadId}`)
        .set('x-access-token', token)
        .send({ status: 'agendado' })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Lead atualizado com sucesso');
      expect(response.body).toHaveProperty('changes', 1);
    });

    it('should update lead appointment details', async () => {
      const token = process.env.ACCESS_TOKEN || 'test-token';
      const appointmentDate = new Date().toISOString();

      const response = await request(app)
        .patch(`/api/leads/${testLeadId}`)
        .set('x-access-token', token)
        .send({
          appointment_date: appointmentDate,
          doctor: 'Dr. João',
          notes: 'Consulta de rotina'
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Lead atualizado com sucesso');
    });

    it('should update attendance status', async () => {
      const token = process.env.ACCESS_TOKEN || 'test-token';

      const response = await request(app)
        .patch(`/api/leads/${testLeadId}`)
        .set('x-access-token', token)
        .send({
          status: 'Finalizado',
          attendance_status: 'compareceu'
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Lead atualizado com sucesso');
    });

    it('should fail with invalid status', async () => {
      const token = process.env.ACCESS_TOKEN || 'test-token';

      const response = await request(app)
        .patch(`/api/leads/${testLeadId}`)
        .set('x-access-token', token)
        .send({ status: 'invalid_status' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should fail when no fields provided', async () => {
      const token = process.env.ACCESS_TOKEN || 'test-token';

      const response = await request(app)
        .patch(`/api/leads/${testLeadId}`)
        .set('x-access-token', token)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Nenhum campo para atualizar');
    });
  });

  describe('DELETE /api/leads/:id - Delete Lead', () => {
    let testLeadId: number;

    beforeEach(async () => {
      // Create a test lead
      const response = await request(app)
        .post('/api/leads')
        .send({
          name: 'Test User for Delete',
          phone: '11988888888'
        });
      testLeadId = response.body.id;
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/leads/${testLeadId}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should delete lead successfully', async () => {
      const token = process.env.ACCESS_TOKEN || 'test-token';

      const response = await request(app)
        .delete(`/api/leads/${testLeadId}`)
        .set('x-access-token', token)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Lead removido com sucesso');
      expect(response.body).toHaveProperty('changes', 1);
    });

    it('should return 404 for non-existent lead', async () => {
      const token = process.env.ACCESS_TOKEN || 'test-token';
      const nonExistentId = 999999;

      const response = await request(app)
        .delete(`/api/leads/${nonExistentId}`)
        .set('x-access-token', token)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Lead não encontrado');
    });
  });

  describe('GET /api/leads/dashboard - Metrics', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/leads/dashboard')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return dashboard metrics when authenticated', async () => {
      const token = process.env.ACCESS_TOKEN || 'test-token';

      const response = await request(app)
        .get('/api/leads/dashboard')
        .set('x-access-token', token)
        .expect(200);

      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('byStatus');
      expect(response.body).toHaveProperty('byType');
      expect(response.body).toHaveProperty('byAttendanceStatus');
      expect(response.body).toHaveProperty('history');
      expect(Array.isArray(response.body.byStatus)).toBe(true);
      expect(Array.isArray(response.body.byType)).toBe(true);
      expect(Array.isArray(response.body.history)).toBe(true);
    });
  });

  describe('PUT /api/leads/:id/archive - Archive Lead', () => {
    let testLeadId: number;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/leads')
        .send({
          name: 'Test User for Archive',
          phone: '11977777777'
        });
      testLeadId = response.body.id;
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/leads/${testLeadId}/archive`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should archive lead successfully', async () => {
      const token = process.env.ACCESS_TOKEN || 'test-token';

      const response = await request(app)
        .put(`/api/leads/${testLeadId}/archive`)
        .set('x-access-token', token)
        .send({ archive_reason: 'tratamento_concluido' })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Lead arquivado com sucesso');
    });

    it('should archive lead without reason', async () => {
      const token = process.env.ACCESS_TOKEN || 'test-token';

      const response = await request(app)
        .put(`/api/leads/${testLeadId}/archive`)
        .set('x-access-token', token)
        .send({})
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Lead arquivado com sucesso');
    });
  });

  describe('PUT /api/leads/:id/unarchive - Unarchive Lead', () => {
    let testLeadId: number;

    beforeEach(async () => {
      const token = process.env.ACCESS_TOKEN || 'test-token';
      
      // Create and archive a lead
      const createResponse = await request(app)
        .post('/api/leads')
        .send({
          name: 'Test User for Unarchive',
          phone: '11966666666'
        });
      testLeadId = createResponse.body.id;

      await request(app)
        .put(`/api/leads/${testLeadId}/archive`)
        .set('x-access-token', token)
        .send({});
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put(`/api/leads/${testLeadId}/unarchive`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should unarchive lead successfully', async () => {
      const token = process.env.ACCESS_TOKEN || 'test-token';

      const response = await request(app)
        .put(`/api/leads/${testLeadId}/unarchive`)
        .set('x-access-token', token)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Lead desarquivado com sucesso');
    });
  });
});
