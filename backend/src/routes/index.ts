import { FastifyInstance } from 'fastify';
import { healthRoutes } from './health.js';
import { mediaRoutes } from './media.js';
import { jobRoutes } from './jobs.js';
import { jobEventsRoutes } from './jobs-events.js';
import { downloadRoutes } from './downloads.js';

export async function registerRoutes(app: FastifyInstance) {
  await app.register(healthRoutes);
  await app.register(mediaRoutes);
  await app.register(jobEventsRoutes);
  await app.register(downloadRoutes);
  await app.register(jobRoutes);
}
