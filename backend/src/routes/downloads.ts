import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import { downloadService } from '../services/download.js';
import { prisma } from '../lib/prisma.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STORAGE_DIR = process.env.STORAGE_DIR || 'storage/output';

function isPathSafe(filePath: string, allowedBase: string): boolean {
  const resolved = resolve(filePath);
  const base = resolve(allowedBase);
  return resolved.startsWith(base + require('node:path').sep) || resolved === base;
}

function isOutputFilePathSafe(filePath: string): boolean {
  if (filePath.includes('..') || filePath.includes('\0')) return false;
  const resolved = resolve(filePath);
  const base = resolve(STORAGE_DIR);
  return resolved.startsWith(base);
}

function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

export async function downloadRoutes(app: FastifyInstance) {
  app.get('/api/items/:itemId/download', async (request: FastifyRequest, reply: FastifyReply) => {
    const { itemId } = request.params as { itemId: string };

    if (!itemId || !isValidUuid(itemId)) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_ITEM_ID', message: 'itemId deve ser um UUID válido.' },
      });
    }

    const item = await prisma.jobItem.findUnique({
      where: { id: itemId },
      select: { status: true, outputFilePath: true, title: true, job: { select: { format: true } } },
    });

    if (!item) {
      return reply.status(404).send({
        success: false,
        error: { code: 'ITEM_NOT_FOUND', message: 'Item não encontrado.' },
      });
    }

    if (item.status !== 'completed') {
      return reply.status(400).send({
        success: false,
        error: { code: 'ITEM_NOT_READY', message: 'Este item ainda está processando.' },
      });
    }

    if (!item.outputFilePath) {
      return reply.status(404).send({
        success: false,
        error: { code: 'FILE_NOT_FOUND', message: 'Arquivo não encontrado.' },
      });
    }

    if (!isOutputFilePathSafe(item.outputFilePath)) {
      return reply.status(403).send({
        success: false,
        error: { code: 'ACCESS_DENIED', message: 'Acesso negado.' },
      });
    }

    try {
      await stat(item.outputFilePath);
    } catch {
      return reply.status(404).send({
        success: false,
        error: { code: 'FILE_NOT_FOUND', message: 'Arquivo não encontrado no disco.' },
      });
    }

    const ext = item.job.format === 'mp3' ? 'mp3' : 'mp4';
    const safeName = item.title.replace(/[^a-zA-Z0-9_\- ]/g, '_').substring(0, 100);
    const fileName = `${safeName}.${ext}`;

    const fileStat = await stat(item.outputFilePath);

    reply.raw.writeHead(200, {
      'Content-Type': ext === 'mp3' ? 'audio/mpeg' : 'video/mp4',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': fileStat.size.toString(),
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    });

    const stream = createReadStream(item.outputFilePath);
    stream.pipe(reply.raw);

    stream.on('error', () => {
      reply.raw.end();
    });

    request.raw.on('close', () => {
      stream.destroy();
    });
  });

  app.get('/api/jobs/:jobId/download.zip', async (request: FastifyRequest, reply: FastifyReply) => {
    const { jobId } = request.params as { jobId: string };

    if (!jobId || !isValidUuid(jobId)) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_JOB_ID', message: 'jobId deve ser um UUID válido.' },
      });
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true },
    });

    if (!job) {
      return reply.status(404).send({
        success: false,
        error: { code: 'JOB_NOT_FOUND', message: 'Job não encontrado.' },
      });
    }

    const info = await downloadService.getJobDownloadInfo(jobId);

    if (info.ready === 0) {
      return reply.status(400).send({
        success: false,
        error: { code: 'NO_FILES_READY', message: 'Nenhum arquivo pronto para download.' },
      });
    }

    reply.raw.writeHead(200, {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="convertflow-${jobId.substring(0, 8)}.zip"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    });

    const zipStream = downloadService.createZipStream(jobId);
    zipStream.pipe(reply.raw);

    zipStream.on('error', () => {
      reply.raw.end();
    });

    request.raw.on('close', () => {
      if ('destroy' in zipStream && typeof zipStream.destroy === 'function') {
        zipStream.destroy();
      }
    });
  });

  app.get('/api/jobs/:jobId/download-info', async (request: FastifyRequest, reply: FastifyReply) => {
    const { jobId } = request.params as { jobId: string };

    if (!jobId || !isValidUuid(jobId)) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_JOB_ID', message: 'jobId deve ser um UUID válido.' },
      });
    }

    const info = await downloadService.getJobDownloadInfo(jobId);

    return {
      success: true,
      data: info,
    };
  });
}
