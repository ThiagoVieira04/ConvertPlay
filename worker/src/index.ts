import { Worker } from 'bullmq';
import { createWorkerRedisConnection } from './lib/redis.js';
import { processConversionJob } from './processors/conversion.js';
import { shutdownPublisher } from './lib/pubsub.js';
import { env } from './config/env.js';
import { log } from './lib/logger.js';
import type { ConversionJobData } from './processors/types.js';

log.info('starting', { redis: env.REDIS_URL, concurrency: env.MAX_CONCURRENT_JOBS });

const connection = createWorkerRedisConnection();

const worker = new Worker<ConversionJobData>(
  'conversion',
  async (job) => {
    log.info('job:received', { jobId: job.id, title: job.data.title, attempt: job.attemptsMade + 1 });

    await processConversionJob(job.data, {
      jobId: job.data.jobId,
      itemId: job.data.itemId,
      attemptsMade: job.attemptsMade,
      maxAttempts: job.opts.attempts ?? 3,
    });

    return { success: true };
  },
  {
    connection,
    concurrency: env.MAX_CONCURRENT_JOBS,
    lockDuration: 60_000,
    stalledInterval: 30_000,
    limiter: {
      max: 10,
      duration: 1000,
    },
  },
);

worker.on('completed', (job) => {
  log.info('job:completed', { jobId: job.id, title: job.data.title });
});

worker.on('failed', (job, err) => {
  log.error('job:failed', { jobId: job?.id, title: job?.data.title, error: err.message, attempts: job?.attemptsMade });
});

worker.on('ready', () => {
  log.info('ready', { message: 'Worker is ready and listening for jobs' });
});

worker.on('error', (err) => {
  log.error('error', { message: 'Worker error', error: err.message });
});

worker.on('stalled', (jobId) => {
  log.warn('stalled', { jobId });
});

async function shutdown() {
  log.info('shutdown', { message: 'Shutting down...' });
  await worker.close();
  await shutdownPublisher();
  await connection.quit();
  log.info('shutdown', { message: 'Worker stopped' });
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

process.on('unhandledRejection', (err) => {
  log.error('unhandled', { error: String(err) });
});

log.info('waiting', { message: 'Waiting for jobs...' });
