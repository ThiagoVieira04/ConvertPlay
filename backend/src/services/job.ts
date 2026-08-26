import { join } from 'node:path';
import { rm } from 'node:fs/promises';
import { prisma } from '../lib/prisma.js';
import { conversionQueue } from '../lib/queue.js';
import { env } from '../config/env.js';
import type { Job, JobItem, JobStatus, JobItemStatus } from '@prisma/client';

const MAX_RETRIES = 2;
const STORAGE_DIR = process.env.STORAGE_DIR || join(process.cwd(), 'storage', 'output');

export interface CreateJobInput {
  sourceUrl: string;
  type: 'video' | 'playlist';
  format: 'mp3' | 'mp4';
  quality: string;
  items: {
    id: string;
    title: string;
    position: number;
  }[];
}

export interface JobWithItems extends Job {
  items: JobItem[];
}

export interface JobProgress {
  jobId: string;
  status: JobStatus;
  total: number;
  completed: number;
  processing: number;
  queued: number;
  failed: number;
  progress: number;
}

export class JobService {
  async createJob(input: CreateJobInput): Promise<Job> {
    const job = await prisma.job.create({
      data: {
        sourceUrl: input.sourceUrl,
        type: input.type,
        format: input.format,
        quality: input.quality,
        status: 'queued',
        items: {
          create: input.items.map((item) => ({
            sourceId: item.id,
            title: item.title,
            position: item.position,
            status: 'pending' as JobItemStatus,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    const jobs = job.items.map((item) =>
      conversionQueue.add(
        'process-item',
        {
          jobId: job.id,
          itemId: item.id,
          sourceId: item.sourceId,
          title: item.title,
          format: input.format,
          quality: input.quality,
        },
        {
          jobId: `${job.id}-${item.id}`,
        },
      ),
    );

    await Promise.all(jobs);

    return job;
  }

  async getJobById(jobId: string): Promise<JobWithItems | null> {
    return prisma.job.findUnique({
      where: { id: jobId },
      include: {
        items: {
          orderBy: { position: 'asc' },
        },
      },
    });
  }

  async getJobProgress(jobId: string): Promise<JobProgress | null> {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        items: {
          select: { status: true },
        },
      },
    });

    if (!job) return null;

    const total = job.items.length;
    const completed = job.items.filter((i) => i.status === 'completed').length;
    const processing = job.items.filter((i) => i.status === 'processing').length;
    const queued = job.items.filter((i) => i.status === 'pending').length;
    const failed = job.items.filter((i) => i.status === 'failed').length;

    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      jobId: job.id,
      status: job.status,
      total,
      completed,
      processing,
      queued,
      failed,
      progress,
    };
  }

  async updateJobStatus(jobId: string, status: JobStatus): Promise<void> {
    await prisma.job.update({
      where: { id: jobId },
      data: { status },
    });
  }

  async updateItemStatus(
    itemId: string,
    status: JobItemStatus,
    error?: string,
  ): Promise<void> {
    await prisma.jobItem.update({
      where: { id: itemId },
      data: { status, error },
    });
  }

  async checkJobCompletion(jobId: string): Promise<void> {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        items: {
          select: { status: true },
        },
      },
    });

    if (!job) return;

    const allCompleted = job.items.every((i) => i.status === 'completed');
    const anyFailed = job.items.some((i) => i.status === 'failed');
    const allFinished = job.items.every(
      (i) => i.status === 'completed' || i.status === 'failed',
    );

    if (allCompleted) {
      await this.updateJobStatus(jobId, 'completed');
    } else if (allFinished && anyFailed) {
      await this.updateJobStatus(jobId, 'failed');
    }
  }

  async cancelJob(jobId: string): Promise<void> {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { items: true },
    });

    if (!job) return;

    const itemIds = job.items.map((i) => i.id);

    await Promise.all(
      itemIds.map((id) =>
        conversionQueue.remove(`${jobId}-${id}`),
      ),
    );

    await prisma.jobItem.updateMany({
      where: {
        jobId,
        status: { in: ['pending', 'processing'] },
      },
      data: { status: 'failed', error: 'Cancelado pelo usuário' },
    });

    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'cancelled' },
    });

    this.cleanupFiles(jobId).catch(() => {});
  }

  async retryJob(jobId: string): Promise<{ retried: number; skipped: number }> {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { items: true },
    });

    if (!job) return { retried: 0, skipped: 0 };

    const failedItems = job.items.filter((i) => i.status === 'failed');

    let retried = 0;
    let skipped = 0;

    for (const item of failedItems) {
      const queueJobId = `${jobId}-${item.id}`;
      const existingJob = await conversionQueue.getJob(queueJobId);

      if (existingJob && existingJob.attemptsMade >= MAX_RETRIES) {
        skipped++;
        continue;
      }

      await prisma.jobItem.update({
        where: { id: item.id },
        data: { status: 'pending', error: null },
      });

      await conversionQueue.add(
        'process-item',
        {
          jobId: job.id,
          itemId: item.id,
          sourceId: item.sourceId,
          title: item.title,
          format: job.format as 'mp3' | 'mp4',
          quality: job.quality,
        },
        {
          jobId: queueJobId,
          attempts: MAX_RETRIES,
        },
      );

      retried++;
    }

    if (retried > 0) {
      await prisma.job.update({
        where: { id: jobId },
        data: { status: 'queued' },
      });
    }

    return { retried, skipped };
  }

  async listJobs(limit = 20, offset = 0): Promise<Job[]> {
    return prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async deleteJob(jobId: string): Promise<void> {
    this.cleanupFiles(jobId).catch(() => {});
    await prisma.job.delete({
      where: { id: jobId },
    });
  }

  async cleanupExpiredJobs(): Promise<number> {
    const ttlMs = env.JOB_TTL_HOURS * 60 * 60 * 1000;
    const cutoff = new Date(Date.now() - ttlMs);

    const expired = await prisma.job.findMany({
      where: {
        createdAt: { lt: cutoff },
        status: { in: ['completed', 'failed', 'cancelled'] },
      },
      select: { id: true },
    });

    if (expired.length === 0) return 0;

    for (const job of expired) {
      this.cleanupFiles(job.id).catch(() => {});
    }

    await prisma.jobItem.deleteMany({
      where: { jobId: { in: expired.map((j) => j.id) } },
    });

    await prisma.job.deleteMany({
      where: { id: { in: expired.map((j) => j.id) } },
    });

    return expired.length;
  }

  async getJobStats(): Promise<{ total: number; completed: number; failed: number; active: number }> {
    const [total, completed, failed, active] = await Promise.all([
      prisma.job.count(),
      prisma.job.count({ where: { status: 'completed' } }),
      prisma.job.count({ where: { status: 'failed' } }),
      prisma.job.count({ where: { status: { in: ['queued', 'processing'] } } }),
    ]);
    return { total, completed, failed, active };
  }

  private async cleanupFiles(jobId: string): Promise<void> {
    const dir = join(STORAGE_DIR, jobId);
    try {
      await rm(dir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
}

export const jobService = new JobService();
