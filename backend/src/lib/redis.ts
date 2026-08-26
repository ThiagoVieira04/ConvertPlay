import Redis from 'ioredis';
import { env } from '../config/env.js';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function createRedisConnection(): Redis {
  return new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

export const redis = globalForRedis.redis ?? createRedisConnection();

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}
