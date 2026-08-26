import { prisma } from '../lib/prisma.js';
import { jobService } from './job-service.js';
import { log } from '../lib/logger.js';
import { publishJobEvent } from '../lib/pubsub.js';
import { mediaConverter, ConversionError, TimeoutError, DiskFullError } from '../services/media-converter/index.js';
import { storage } from '../services/storage.js';
import { env } from '../config/env.js';
import type { ConversionJobData } from './types.js';

interface ProcessContext {
  jobId: string;
  itemId: string;
  attemptsMade: number;
  maxAttempts: number;
}

export async function processConversionJob(
  data: ConversionJobData,
  ctx: ProcessContext,
): Promise<void> {
  const { jobId, itemId, sourceId, title, format, quality } = data;
  const { attemptsMade, maxAttempts } = ctx;
  const isLastAttempt = attemptsMade >= maxAttempts;

  log.info('item:start', { itemId, title, sourceId, format, quality, attempt: attemptsMade + 1, maxAttempts });

  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job || job.status === 'cancelled') {
    log.info('item:skipped', { itemId, title, reason: 'job_cancelled' });
    return;
  }

  const outputPath = storage.getOutputPath(jobId, itemId, format as 'mp3' | 'mp4');

  try {
    await storage.ensureDir();
    await jobService.updateItemStatus(itemId, 'processing');

    if (job.status === 'queued') {
      await jobService.updateJobStatus(jobId, 'processing');
    }

    const stats = await jobService.getItemStats(jobId);
    await publishJobEvent(jobId, {
      type: 'item:start',
      jobId,
      itemId,
      title,
      total: stats.total,
      completedCount: stats.completed,
    });

    const inputPath = sourceId;

    let result;
    if (format === 'mp3') {
      const validBitrates = ['128', '192', '256', '320'];
      const bitrate = validBitrates.includes(quality) ? quality as '128' | '192' | '256' | '320' : '192';

      result = await mediaConverter.convertToMp3({
        inputPath,
        outputPath,
        bitrate,
        timeoutMs: env.FFMPEG_TIMEOUT_MS,
      });
    } else {
      const validQualities = ['best', 'good', 'standard'];
      const mp4Quality = validQualities.includes(quality) ? quality as 'best' | 'good' | 'standard' : 'good';

      result = await mediaConverter.convertToMp4({
        inputPath,
        outputPath,
        quality: mp4Quality,
        timeoutMs: env.FFMPEG_TIMEOUT_MS,
      });
    }

    await jobService.updateItemStatus(itemId, 'completed', undefined, result.outputPath);
    log.info('item:completed', { itemId, title, outputPath: result.outputPath, fileSize: result.fileSize });

    const afterStats = await jobService.getItemStats(jobId);
    await publishJobEvent(jobId, {
      type: 'item:completed',
      jobId,
      itemId,
      title,
      outputFilePath: result.outputPath,
      total: afterStats.total,
      completedCount: afterStats.completed,
    });

    await jobService.checkJobCompletion(jobId);

    const finalJob = await prisma.job.findUnique({ where: { id: jobId } });
    if (finalJob?.status === 'completed') {
      await publishJobEvent(jobId, { type: 'job:completed', jobId });
    } else if (finalJob?.status === 'failed') {
      await publishJobEvent(jobId, { type: 'job:failed', jobId });
    }
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    log.error('item:failed', { itemId, title, error: errorMessage, attempt: attemptsMade + 1, isLastAttempt });

    if (isLastAttempt) {
      await storage.removeFile(outputPath);
      await jobService.updateItemStatus(itemId, 'failed', errorMessage);
      await jobService.checkJobCompletion(jobId);

      const afterStats = await jobService.getItemStats(jobId);
      await publishJobEvent(jobId, {
        type: 'item:failed',
        jobId,
        itemId,
        title,
        error: errorMessage,
        total: afterStats.total,
        completedCount: afterStats.completed,
      });

      const finalJob = await prisma.job.findUnique({ where: { id: jobId } });
      if (finalJob?.status === 'failed') {
        await publishJobEvent(jobId, { type: 'job:failed', jobId });
      }
    }

    throw error;
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof TimeoutError) {
    return `[TIMEOUT] ${error.message}`;
  }
  if (error instanceof DiskFullError) {
    return `[DISK_FULL] ${error.message}`;
  }
  if (error instanceof ConversionError) {
    return `[${error.code}] ${error.message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
}
