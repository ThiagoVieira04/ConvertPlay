import Redis from 'ioredis';
import { env } from '../config/env.js';
import { log } from './logger.js';

export interface JobEvent {
  type: 'item:start' | 'item:progress' | 'item:completed' | 'item:failed' | 'item:cancelled' | 'job:completed' | 'job:failed' | 'job:cancelled';
  jobId: string;
  itemId?: string;
  title?: string;
  progress?: number;
  error?: string;
  outputFilePath?: string;
  total?: number;
  completedCount?: number;
}

let publisher: Redis | null = null;

function getPublisher(): Redis {
  if (!publisher) {
    publisher = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
    publisher.on('error', (err) => {
      log.error('pubsub:error', { error: err.message });
    });
  }
  return publisher;
}

function getChannel(jobId: string): string {
  return `job:${jobId}:events`;
}

export async function publishJobEvent(jobId: string, event: JobEvent): Promise<void> {
  const channel = getChannel(jobId);
  await getPublisher().publish(channel, JSON.stringify(event));
}

export async function shutdownPublisher(): Promise<void> {
  if (publisher) {
    await publisher.quit();
    publisher = null;
  }
}
