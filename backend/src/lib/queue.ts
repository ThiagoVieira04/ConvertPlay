import { Queue } from 'bullmq';
import { redis } from './redis.js';

export interface ConversionJobData {
  jobId: string;
  itemId: string;
  sourceId: string;
  title: string;
  format: 'mp3' | 'mp4';
  quality: string;
}

export const conversionQueue = new Queue<ConversionJobData>('conversion', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 86400, // 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 86400, // 24 hours
    },
  },
});
