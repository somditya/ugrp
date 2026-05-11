import request from 'supertest';
import app from '../src/app';
import { prisma } from '@database/prisma/client';

describe('App', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /api/health', () => {
    it('returns health status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  describe('POST /api/auth/register', () => {
    it('registers a new user', async () => {
      const email = `test-${Date.now()}@example.com`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email, password: 'password123', name: 'Test User' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe(email);
    });

    it('returns 409 for duplicate email', async () => {
      const email = 'duplicate@example.com';
      await request(app).post('/api/auth/register').send({
        email,
        password: 'password123',
        name: 'Duplicate',
      });
      const res = await request(app).post('/api/auth/register').send({
        email,
        password: 'password123',
        name: 'Duplicate 2',
      });
      expect(res.status).toBe(409);
    });

    it('returns 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'invalid', password: 'password123', name: 'Test' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with valid credentials', async () => {
      const email = `login-${Date.now()}@example.com`;
      await request(app).post('/api/auth/register').send({
        email,
        password: 'password123',
        name: 'Login Test',
      });
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
    });

    it('returns 401 for wrong password', async () => {
      const email = `wrong-${Date.now()}@example.com`;
      await request(app).post('/api/auth/register').send({
        email,
        password: 'password123',
        name: 'Wrong PW',
      });
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/posts', () => {
    it('returns empty list when no posts', async () => {
      const res = await request(app).get('/api/posts');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});
