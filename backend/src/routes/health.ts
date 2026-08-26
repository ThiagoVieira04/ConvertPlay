import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';
import { redis } from '../lib/redis.js';
import { conversionQueue } from '../lib/queue.js';
import { jobService } from '../services/job.js';
import { env } from '../config/env.js';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/api/health', async (_request, reply) => {
    const checks: Record<string, string> = {};

    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.postgres = 'ok';
    } catch {
      checks.postgres = 'error';
    }

    try {
      const pong = await redis.ping();
      checks.redis = pong === 'PONG' ? 'ok' : 'error';
    } catch {
      checks.redis = 'error';
    }

    try {
      const waiting = await conversionQueue.getWaitingCount();
      const active = await conversionQueue.getActiveCount();
      const failed = await conversionQueue.getFailedCount();
      checks.queue = 'ok';
      checks.queue_metrics = JSON.stringify({ waiting, active, failed });
    } catch {
      checks.queue = 'error';
    }

    let stats;
    try {
      stats = await jobService.getJobStats();
    } catch {
      stats = null;
    }

    const allHealthy = Object.values(checks).every((v) => v === 'ok');

    const response = {
      status: allHealthy ? 'ok' : 'degraded',
      service: 'convertflow-api',
      version: '1.0.0',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      checks,
      stats,
    };

    return reply.status(allHealthy ? 200 : 503).send(response);
  });

  app.get('/api/health/live', async (_request, reply) => {
    return reply.status(200).send({ status: 'ok' });
  });

  app.get('/api/health/ready', async (_request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return reply.status(200).send({ status: 'ok' });
    } catch {
      return reply.status(503).send({ status: 'not ready' });
    }
  });
}
