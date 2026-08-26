import { prisma } from '../lib/prisma.js';
import type { JobStatus, JobItemStatus } from '@prisma/client';

export interface ItemStats {
  total: number;
  completed: number;
  processing: number;
  pending: number;
  failed: number;
}

export class WorkerJobService {
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
    outputFilePath?: string,
  ): Promise<void> {
    await prisma.jobItem.update({
      where: { id: itemId },
      data: { status, error, outputFilePath },
    });
  }

  async getItemStats(jobId: string): Promise<ItemStats> {
    const items = await prisma.jobItem.findMany({
      where: { jobId },
      select: { status: true },
    });

    return {
      total: items.length,
      completed: items.filter((i) => i.status === 'completed').length,
      processing: items.filter((i) => i.status === 'processing').length,
      pending: items.filter((i) => i.status === 'pending').length,
      failed: items.filter((i) => i.status === 'failed').length,
    };
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
}

export const jobService = new WorkerJobService();
