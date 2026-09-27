import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { prisma } from './db/prisma.js';
import { authMiddleware } from './middleware/auth.js';
import { linkRoutes } from './routes/links.js';
import { tagRoutes } from './routes/tags.js';
import { healthRoutes } from './routes/health.js';
import { ensureLocalPostgres, stopLocalPostgres } from './db/embedded.js';

export const buildApp = async () => {
  const isDev = process.env.NODE_ENV !== 'production';

  const fastify = Fastify({
    logger: isDev
      ? {
          level: process.env.LOG_LEVEL || 'info',
          transport: {
            target: 'pino-pretty',
            options: { colorize: true },
          },
        }
      : {
          level: process.env.LOG_LEVEL || 'info',
        },
  });

  // Decorate fastify with prisma
  fastify.decorate('prisma', prisma);

  // Register security plugins
  await fastify.register(helmet, {
    contentSecurityPolicy: false, // For local dev and API convenience
  });

  await fastify.register(cors, {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000').split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Support empty JSON body on DELETE or other methods without throwing FST_ERR_CTP_EMPTY_JSON_BODY
  fastify.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    (req, body, done) => {
      if (!body || (typeof body === 'string' && body.trim() === '')) {
        done(null, undefined);
        return;
      }
      try {
        const json = JSON.parse(body as string);
        done(null, json);
      } catch (err: any) {
        err.statusCode = 400;
        done(err, undefined);
      }
    }
  );

  // Root landing & status endpoint (HTML or JSON)
  fastify.get('/', async (request, reply) => {
    const accept = request.headers.accept || '';
    if (accept.includes('text/html')) {
      reply.type('text/html');
      return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MindGarten API</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f4f4f4; color: #161616; margin: 0; padding: 40px 20px; }
    .card { max-width: 640px; margin: 0 auto; background: #fff; border: 1px solid #e0e0e0; border-left: 4px solid #0f62fe; padding: 32px; box-shadow: 0 2px 6px rgba(0,0,0,0.06); }
    h1 { font-size: 2rem; font-weight: 300; margin-top: 0; margin-bottom: 8px; }
    h1 strong { font-weight: 700; color: #0f62fe; }
    p { color: #525252; line-height: 1.5; margin-bottom: 24px; }
    .badge { display: inline-block; padding: 4px 8px; font-size: 11px; font-weight: 600; font-family: monospace; background: #eef2fe; color: #0f62fe; margin-bottom: 16px; letter-spacing: 0.5px; }
    ul { list-style: none; padding: 0; margin: 0 0 24px 0; }
    li { padding: 10px 0; border-bottom: 1px solid #f4f4f4; font-family: monospace; font-size: 13px; display: flex; justify-content: space-between; align-items: center; }
    a { color: #0f62fe; text-decoration: none; font-weight: 600; }
    a:hover { text-decoration: underline; }
    .btn { display: inline-block; background: #0f62fe; color: #fff; padding: 10px 18px; text-decoration: none; font-weight: 600; font-size: 14px; transition: background 0.15s; }
    .btn:hover { background: #0043ce; text-decoration: none; }
    .method { background: #e0e0e0; padding: 2px 6px; font-size: 11px; font-weight: bold; margin-right: 8px; }
    .tag { color: #8d8d8d; font-size: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <span class="badge">API SERVICE READY</span>
    <h1>Mind<strong>Garten</strong> API</h1>
    <p>Fastify REST backend with PostgreSQL persistence for bookmarks and agent memories.</p>
    <ul>
      <li><span><span class="method">GET</span><a href="/health">/health</a></span><span class="tag">System Health</span></li>
      <li><span><span class="method">GET</span><a href="/ready">/ready</a></span><span class="tag">Database Readiness</span></li>
      <li><span><span class="method">GET</span><a href="/api/v1/links">/api/v1/links</a></span><span class="tag">Auth Required</span></li>
      <li><span><span class="method">GET</span><a href="/api/v1/tags">/api/v1/tags</a></span><span class="tag">Auth Required</span></li>
    </ul>
    <a href="http://localhost:5173" class="btn">Open MindGarten Web UI &rarr;</a>
  </div>
</body>
</html>`;
    }

    return {
      name: 'MindGarten API',
      version: '0.1.0',
      status: 'online',
      endpoints: {
        health: '/health',
        ready: '/ready',
        links: '/api/v1/links',
        tags: '/api/v1/tags',
      },
      webUi: 'http://localhost:5173',
      docs: '/docs/API.md',
    };
  });

  // Health and ready checks (unauthenticated)
  await fastify.register(healthRoutes);

  // Protected API routes under /api/v1
  await fastify.register(
    async (apiScope) => {
      // Apply auth hook
      apiScope.addHook('onRequest', authMiddleware);

      await apiScope.register(linkRoutes);
      await apiScope.register(tagRoutes);
    },
    { prefix: '/api/v1' }
  );

  // Central error handler
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    const statusCode = error.statusCode || 500;
    return reply.status(statusCode).send({
      success: false,
      error: error.message || 'Internal Server Error',
    });
  });

  return fastify;
};

const start = async () => {
  // Ensure local PostgreSQL is running if localhost database is configured
  await ensureLocalPostgres();

  const app = await buildApp();
  const host = process.env.HOST || '0.0.0.0';
  const port = parseInt(process.env.PORT || '3000', 10);

  // Graceful shutdown
  const shutdown = async () => {
    app.log.info('Shutting down server...');
    await app.close();
    await prisma.$disconnect();
    await stopLocalPostgres();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  try {
    await app.listen({ host, port });
    console.log(`\n========================================`);
    console.log(`MindGarten API Server`);
    console.log(`Running on: http://${host}:${port}`);
    console.log(`Health:     http://${host}:${port}/health`);
    console.log(`Ready:      http://${host}:${port}/ready`);
    console.log(`API Base:   http://${host}:${port}/api/v1`);
    console.log(`========================================\n`);
  } catch (err: any) {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n[MindGarten Backend] Port ${port} is already in use by another process.`);
    } else {
      app.log.error(err);
    }
    process.exit(1);
  }
};

// Start server automatically if not in a test runner
if (process.env.VITEST !== 'true' && process.env.NODE_ENV !== 'test') {
  start();
}
