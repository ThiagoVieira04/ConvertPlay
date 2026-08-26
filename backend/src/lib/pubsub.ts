import { Redis } from 'ioredis';
import { redis } from './redis.js';

export interface JobEvent {
  type: 'item:start' | 'item:progress' | 'item:completed' | 'item:failed' | 'job:completed' | 'job:failed';
  jobId: string;
  itemId?: string;
  title?: string;
  progress?: number;
  error?: string;
  outputFilePath?: string;
  total?: number;
  completedCount?: number;
}

const SUBSCRIBERS = new Map<string, Set<(event: JobEvent) => void>>();
let subscriber: Redis | null = null;

function getSubscriber(): Redis {
  if (!subscriber) {
    subscriber = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }
  return subscriber;
}

function getChannel(jobId: string): string {
  return `job:${jobId}:events`;
}

export function subscribeToJobEvents(
  jobId: string,
  callback: (event: JobEvent) => void,
): () => void {
  const channel = getChannel(jobId);

  if (!SUBSCRIBERS.has(channel)) {
    SUBSCRIBERS.set(channel, new Set());
    getSubscriber().subscribe(channel);
  }

  SUBSCRIBERS.get(channel)!.add(callback);

  const messageHandler = (ch: string, message: string) => {
    if (ch === channel) {
      try {
        const event: JobEvent = JSON.parse(message);
        SUBSCRIBERS.get(channel)?.forEach((cb) => cb(event));
      } catch {
        // ignore malformed messages
      }
    }
  };

  getSubscriber().on('message', messageHandler);

  return () => {
    SUBSCRIBERS.get(channel)?.delete(callback);
    if (SUBSCRIBERS.get(channel)?.size === 0) {
      SUBSCRIBERS.delete(channel);
      getSubscriber().unsubscribe(channel);
    }
    getSubscriber().off('message', messageHandler);
  };
}

export async function publishJobEvent(jobId: string, event: JobEvent): Promise<void> {
  const channel = getChannel(jobId);
  await redis.publish(channel, JSON.stringify(event));
}

export async function shutdownPubSub(): Promise<void> {
  if (subscriber) {
    await subscriber.quit();
    subscriber = null;
  }
  SUBSCRIBERS.clear();
}
