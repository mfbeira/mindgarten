import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../db/prisma.js';

declare module 'fastify' {
  interface FastifyRequest {
    callerName?: string;
  }
}

export const authMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
  if (request.method === 'OPTIONS') {
    return;
  }

  const url = request.url;
  if (url === '/health' || url === '/ready' || url.startsWith('/health') || url.startsWith('/ready')) {
    return;
  }

  const authHeader = request.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if ((request.query as Record<string, string>)?.token) {
    token = (request.query as Record<string, string>).token;
  }

  if (!token) {
    return reply.status(401).send({
      success: false,
      error: 'Unauthorized: Missing API token. Provide via Authorization header (Bearer <token>) or ?token=<token>',
    });
  }

  const expectedToken = process.env.API_TOKEN || 'mindgarten-dev-token';

  if (token === expectedToken) {
    request.callerName = 'user';
    return;
  }

  try {
    const dbToken = await prisma.apiToken.findUnique({
      where: { token },
    });

    if (dbToken) {
      request.callerName = dbToken.name;
      prisma.apiToken.update({
        where: { id: dbToken.id },
        data: { lastUsed: new Date() },
      }).catch((err) => {
        request.log.warn({ err }, 'Failed to update token lastUsed timestamp');
      });
      return;
    }
  } catch (error) {
    request.log.error({ error }, 'Database error during token validation');
  }

  return reply.status(401).send({
    success: false,
    error: 'Unauthorized: Invalid API token',
  });
};
