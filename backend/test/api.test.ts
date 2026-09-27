import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { buildApp } from '../src/server.js';

describe('MindGarten API Test Suite', () => {
  let app: FastifyInstance;
  const testToken = 'test-secret-token';

  beforeAll(async () => {
    process.env.API_TOKEN = testToken;
    process.env.LOG_LEVEL = 'silent';
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Endpoints', () => {
    it('GET /health should return 200 and status ok without authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/health',
      });

      expect(response.statusCode).toBe(200);
      const json = JSON.parse(response.payload);
      expect(json.status).toBe('ok');
      expect(json.version).toBe('0.1.0');
    });
  });

  describe('Authentication Middleware', () => {
    it('should reject request to /api/v1/links when token is missing', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/links',
      });

      expect(response.statusCode).toBe(401);
      const json = JSON.parse(response.payload);
      expect(json.success).toBe(false);
      expect(json.error).toMatch(/Missing API token/i);
    });

    it('should reject request with invalid Bearer token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/links',
        headers: {
          authorization: 'Bearer wrong-token',
        },
      });

      expect(response.statusCode).toBe(401);
      const json = JSON.parse(response.payload);
      expect(json.success).toBe(false);
      expect(json.error).toMatch(/Invalid API token/i);
    });

    it('should accept request with valid Bearer token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/links',
        headers: {
          authorization: `Bearer ${testToken}`,
        },
      });

      // Even if DB is disconnected in mock unit test, it gets past auth
      expect(response.statusCode).not.toBe(401);
    });

    it('should accept request with valid query token parameter', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/v1/links?token=${testToken}`,
      });

      expect(response.statusCode).not.toBe(401);
    });
  });

  describe('Zod Validation', () => {
    it('should reject POST /api/v1/links with invalid URL', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/links',
        headers: {
          authorization: `Bearer ${testToken}`,
        },
        payload: {
          url: 'not-a-valid-url',
          title: 'Invalid',
        },
      });

      expect(response.statusCode).toBe(400);
      const json = JSON.parse(response.payload);
      expect(json.success).toBe(false);
      expect(json.error).toMatch(/Invalid URL format/i);
    });

    it('should reject POST /api/v1/tags with invalid color format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/tags',
        headers: {
          authorization: `Bearer ${testToken}`,
        },
        payload: {
          name: 'tech',
          color: 'blue', // Must be #RRGGBB
        },
      });

      expect(response.statusCode).toBe(400);
      const json = JSON.parse(response.payload);
      expect(json.success).toBe(false);
      expect(json.error).toMatch(/hex code/i);
    });
  });
});
