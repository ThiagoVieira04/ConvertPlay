import Fastify, { type FastifyError } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env.js';
import { registerCors } from './plugins/cors.js';
import { registerRoutes } from './routes/index.js';
import { prisma } from './lib/prisma.js';
import { redis } from './lib/redis.js';

const app = Fastify({
  logger: {
    level: env.NODE_ENV === 'production' ? 'warn' : 'info',
    transport:
      env.NODE_ENV === 'development'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  },
  bodyLimit: 1048576,
  requestTimeout: env.REQUEST_TIMEOUT_MS,
  trustProxy: true,
});

async function bootstrap() {
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
    keyGenerator: (request) => {
      return request.ip || request.socket.remoteAddress || 'unknown';
    },
    errorResponseBuilder: (_request, context) => ({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Muitas requisições. Tente novamente em ${Math.ceil(context.ttl / 1000)}s.`,
        retryAfter: Math.ceil(context.ttl / 1000),
      },
    }),
  });

  app.addHook('onSend', async (request, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-XSS-Protection', '1; mode=block');
    reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (env.NODE_ENV === 'production') {
      reply.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    reply.header('X-Request-Id', request.id?.toString() || '');
  });

  await registerCors(app);
  await registerRoutes(app);

  app.setErrorHandler((error: FastifyError, _request, reply) => {
    app.log.error(error);

    if (error.validation) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dados inválidos na requisição.',
        },
      });
    }

    const statusCode = error.statusCode || 500;
    return reply.status(statusCode).send({
      success: false,
      error: {
        code: statusCode >= 500 ? 'INTERNAL_ERROR' : error.code || 'ERROR',
        message: statusCode >= 500 ? 'Erro interno do servidor.' : error.message,
      },
    });
  });

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    console.log(`🚀 ConvertFlow API running at http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

const signals = ['SIGINT', 'SIGTERM'] as const;
for (const signal of signals) {
  process.on(signal, async () => {
    app.log.info(`Received ${signal}, shutting down gracefully...`);
    await app.close();
    await prisma.$disconnect();
    redis.disconnect();
    process.exit(0);
  });
}

bootstrap();
