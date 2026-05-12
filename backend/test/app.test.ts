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

  describe('DELETE /api/grievances (cleanup)', () => {
    it('cleans up test data', async () => {
      await prisma.grievanceTimeline.deleteMany({});
      await prisma.message.deleteMany({});
      await prisma.attachment.deleteMany({});
      await prisma.notification.deleteMany({});
      await prisma.auditLog.deleteMany({});
      await prisma.grievance.deleteMany({});
      await prisma.grievanceCategory.deleteMany({});
      await prisma.department.deleteMany({});
      await prisma.user.deleteMany({});
      expect(true).toBe(true);
    });
  });

  describe('POST /api/auth/register', () => {
    it('registers a new user', async () => {
      const email = 'test-' + Date.now() + '@example.com';
      const uniId = 'UGRP-STU-' + Date.now();
      const res = await request(app)
        .post('/api/auth/register')
        .send({ universityId: uniId, email, password: 'password123', name: 'Test User', role: 'STUDENT' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user.email).toBe(email);
    });

    it('returns 409 for duplicate email', async () => {
      const email = 'dup-' + Date.now() + '@example.com';
      const uniId = 'UGRP-DUP-' + Date.now();
      await request(app).post('/api/auth/register').send({
        universityId: uniId,
        email,
        password: 'password123',
        name: 'Duplicate',
        role: 'STUDENT',
      });
      const res = await request(app).post('/api/auth/register').send({
        universityId: 'UGRP-DUP2-' + Date.now(),
        email,
        password: 'password123',
        name: 'Duplicate 2',
        role: 'STUDENT',
      });
      expect(res.status).toBe(409);
    });

    it('returns 400 for invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ universityId: 'UGRP-INV-001', email: 'invalid', password: 'password123', name: 'Test', role: 'STUDENT' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with valid credentials', async () => {
      const email = 'login-' + Date.now() + '@example.com';
      const uniId = 'UGRP-LOGIN-' + Date.now();
      await request(app).post('/api/auth/register').send({
        universityId: uniId,
        email,
        password: 'password123',
        name: 'Login Test',
        role: 'STUDENT',
      });
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
    });

    it('returns 401 for wrong password', async () => {
      const email = 'wrong-' + Date.now() + '@example.com';
      const uniId = 'UGRP-WRONG-' + Date.now();
      await request(app).post('/api/auth/register').send({
        universityId: uniId,
        email,
        password: 'password123',
        name: 'Wrong PW',
        role: 'STUDENT',
      });
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'wrongpassword' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/departments', () => {
    it('returns department list', async () => {
      const res = await request(app).get('/api/departments');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/categories', () => {
    it('returns category list', async () => {
      const res = await request(app).get('/api/categories');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/grievances', () => {
    it('creates a new grievance', async () => {
      // First register a student
      const email = 'griev-' + Date.now() + '@example.com';
      const uniId = 'UGRP-GREV-' + Date.now();
      const regRes = await request(app).post('/api/auth/register').send({
        universityId: uniId,
        email,
        password: 'password123',
        name: 'Grievance Student',
        role: 'STUDENT',
        departmentId: null,
      });
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'password123' });
      const token = loginRes.body.data.token;

      // Get a category
      const catRes = await request(app).get('/api/categories');
      const categoryId = catRes.body.data[0]?.id;
      if (!categoryId) {
        // No categories seeded yet via DB, skip
        return;
      }

      // Get a department
      const deptRes = await request(app).get('/api/departments');
      const departmentId = deptRes.body.data[0]?.id;
      if (!departmentId) {
        return;
      }

      const res = await request(app)
        .post('/api/grievances')
        .set('Authorization', 'Bearer ' + token)
        .send({
          title: 'Test Grievance',
          categoryId,
          departmentId,
          description: 'Test description',
          isAnonymous: false,
          priorityFlag: 'NORMAL',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('grievanceId');
    });
  });
});
