import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Backend Health & API Gateway Tests', () => {
  it('GET / should return service info and active status', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('service', 'WholesaleHub Ethiopia API');
    expect(res.body).toHaveProperty('status', 'active');
  });

  it('GET /api/v1/health should return 200 and healthy status details', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('status', 'healthy');
    expect(res.body.data).toHaveProperty('service', 'WholesaleHub Ethiopia API');
    expect(res.body.data).toHaveProperty('version', '1.0.0');
    expect(res.body.data).toHaveProperty('defaultCurrency', 'ETB');
    expect(res.body.data).toHaveProperty('timezone', 'Africa/Addis_Ababa');
    expect(res.body.data).toHaveProperty('uptimeSeconds');
    expect(res.body.data).toHaveProperty('timestamp');
  });

  it('GET /api/v1/non-existent-endpoint should return 404 with structured error', async () => {
    const res = await request(app).get('/api/v1/non-existent-endpoint');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.error).toHaveProperty('message');
    expect(res.body.error.message).toContain('Endpoint not found');
  });
});
