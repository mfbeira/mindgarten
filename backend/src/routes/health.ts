import { FastifyInstance } from 'fastify';
import { prisma } from '../db/prisma.js';

export const healthRoutes = async (fastify: FastifyInstance) => {
  fastify.get('/health', async (request, reply) => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      service: 'mindgarten-api',
    };
  });

  fastify.get('/ready', async (request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ready',
        database: 'connected',
      };
    } catch (error) {
      return reply.status(503).send({
        status: 'not_ready',
        error: 'Database connection failed',
      });
    }
  });
};
