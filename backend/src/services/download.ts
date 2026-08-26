import { createReadStream, statSync } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import archiver from 'archiver';
import { prisma } from '../lib/prisma.js';

const STORAGE_DIR = process.env.STORAGE_DIR || join(process.cwd(), 'storage', 'output');

export class DownloadService {
  async getItemFilePath(itemId: string): Promise<{ filePath: string; fileName: string } | null> {
    const item = await prisma.jobItem.findUnique({
      where: { id: itemId },
      include: { job: { select: { format: true } } },
    });

    if (!item) return null;
    if (item.status !== 'completed') return null;
    if (!item.outputFilePath) return null;

    try {
      await stat(item.outputFilePath);
    } catch {
      return null;
    }

    const ext = item.job.format === 'mp3' ? 'mp3' : 'mp4';
    const safeName = item.title.replace(/[^a-zA-Z0-9_\- ]/g, '_').substring(0, 100);
    const fileName = `${safeName}.${ext}`;

    return { filePath: item.outputFilePath, fileName };
  }

  async getCompletedItems(jobId: string): Promise<Array<{ id: string; title: string; filePath: string; format: string }>> {
    const items = await prisma.jobItem.findMany({
      where: {
        jobId,
        status: 'completed',
        outputFilePath: { not: null },
      },
      include: { job: { select: { format: true } } },
      orderBy: { position: 'asc' },
    });

    const valid: Array<{ id: string; title: string; filePath: string; format: string }> = [];

    for (const item of items) {
      if (!item.outputFilePath) continue;
      try {
        await stat(item.outputFilePath);
        valid.push({
          id: item.id,
          title: item.title,
          filePath: item.outputFilePath,
          format: item.job.format,
        });
      } catch {
        // file doesn't exist, skip
      }
    }

    return valid;
  }

  createZipStream(jobId: string): NodeJS.ReadableStream {
    const archive = archiver('zip', { zlib: { level: 6 } });

    this.populateZip(archive, jobId).catch((err) => {
      archive.emit('error', err);
    });

    return archive;
  }

  private async populateZip(archive: archiver.Archiver, jobId: string): Promise<void> {
    const items = await this.getCompletedItems(jobId);

    for (const item of items) {
      const ext = item.format === 'mp3' ? 'mp3' : 'mp4';
      const safeName = item.title.replace(/[^a-zA-Z0-9_\- ]/g, '_').substring(0, 100);
      const archivePath = `${safeName}.${ext}`;

      archive.append(createReadStream(item.filePath), { name: archivePath });
    }

    await archive.finalize();
  }

  async getJobDownloadInfo(jobId: string): Promise<{
    total: number;
    ready: number;
    format: string;
  }> {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        items: {
          select: { status: true, outputFilePath: true },
        },
      },
    });

    if (!job) return { total: 0, ready: 0, format: 'mp3' };

    const ready = job.items.filter(
      (i) => i.status === 'completed' && i.outputFilePath,
    ).length;

    return {
      total: job.items.length,
      ready,
      format: job.format,
    };
  }
}

export const downloadService = new DownloadService();
