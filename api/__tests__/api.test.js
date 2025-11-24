import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../server';

describe('API Endpoints', () => {
  describe('Auth flow', () => {
    it('deve registrar e fazer login', async () => {
      const email = `test_${Date.now()}@example.com`;
      const password = '123456';
      const name = 'Test User';

      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({ email, password, name });
      expect(registerRes.status).toBe(201);
      expect(registerRes.body.success).toBe(true);
      expect(registerRes.body.data.user.email).toBe(email);

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email, password });
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body.data.user.email).toBe(email);
    });
  });

  describe('GET /api/health', () => {
    it('deve retornar status healthy', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('healthy');
    });
  });

  // Opcional: adicionar testes para sheets após autenticação real
});