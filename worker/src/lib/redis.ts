import Redis from 'ioredis';
import { env } from '../config/env.js';
import { log } from './logger.js';

export function createWorkerRedisConnection(): Redis {
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times: number) {
      if (times > 10) {
        log.error('redis:retry_exhausted', { attempts: times });
        return null;
      }
      const delay = Math.min(times * 200, 5000);
      log.warn('redis:reconnecting', { attempt: times, delayMs: delay });
      return delay;
    },
  });

  client.on('connect', () => {
    log.info('redis:connected', { url: env.REDIS_URL });
  });

  client.on('error', (err) => {
    log.error('redis:error', { error: err.message });
  });

  return client;
}
