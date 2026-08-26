import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { jobService } from '../services/job.js';
import type { CreateJobInput } from '../services/job.js';
import { env } from '../config/env.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VALID_QUALITIES = ['128', '192', '256', '320'];

function sanitizeTitle(title: string): string {
  return title.replace(/[<>"'&]/g, '').substring(0, 200);
}

function isValidUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

export async function jobRoutes(app: FastifyInstance) {
  app.post('/api/jobs', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as Partial<CreateJobInput>;

    if (!body?.sourceUrl || typeof body.sourceUrl !== 'string') {
      return reply.status(400).send({
        success: false,
        error: { code: 'MISSING_SOURCE_URL', message: 'sourceUrl é obrigatório.' },
      });
    }

    const sourceUrl = body.sourceUrl.trim();
    if (sourceUrl.length === 0 || sourceUrl.length > env.MAX_URL_LENGTH) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_SOURCE_URL', message: `sourceUrl deve ter entre 1 e ${env.MAX_URL_LENGTH} caracteres.` },
      });
    }

    try {
      const parsed = new URL(sourceUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return reply.status(400).send({
          success: false,
          error: { code: 'INVALID_SOURCE_URL', message: 'sourceUrl deve usar protocolo HTTP ou HTTPS.' },
        });
      }
    } catch {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_SOURCE_URL', message: 'sourceUrl inválida.' },
      });
    }

    if (!body.type || !['video', 'playlist'].includes(body.type)) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_TYPE', message: 'type deve ser "video" ou "playlist".' },
      });
    }

    if (!body.format || !['mp3', 'mp4'].includes(body.format)) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_FORMAT', message: 'format deve ser "mp3" ou "mp4".' },
      });
    }

    if (!body.quality || typeof body.quality !== 'string') {
      return reply.status(400).send({
        success: false,
        error: { code: 'MISSING_QUALITY', message: 'quality é obrigatório.' },
      });
    }

    if (!VALID_QUALITIES.includes(body.quality)) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_QUALITY', message: 'quality deve ser 128, 192, 256 ou 320.' },
      });
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return reply.status(400).send({
        success: false,
        error: { code: 'MISSING_ITEMS', message: 'items é obrigatório e deve conter pelo menos um item.' },
      });
    }

    if (body.items.length > env.MAX_ITEMS_PER_JOB) {
      return reply.status(400).send({
        success: false,
        error: { code: 'TOO_MANY_ITEMS', message: `Máximo de ${env.MAX_ITEMS_PER_JOB} itens por job.` },
      });
    }

    const seenPositions = new Set<number>();
    for (const item of body.items) {
      if (!item.id || typeof item.id !== 'string' || !isValidUuid(item.id)) {
        return reply.status(400).send({
          success: false,
          error: { code: 'INVALID_ITEM_ID', message: 'Cada item deve ter um id UUID válido.' },
        });
      }
      if (!item.title || typeof item.title !== 'string' || item.title.trim().length === 0) {
        return reply.status(400).send({
          success: false,
          error: { code: 'INVALID_ITEM_TITLE', message: 'Cada item deve ter um title não vazio.' },
        });
      }
      if (typeof item.position !== 'number' || item.position < 0 || !Number.isInteger(item.position)) {
        return reply.status(400).send({
          success: false,
          error: { code: 'INVALID_ITEM_POSITION', message: 'Cada item deve ter um position inteiro não negativo.' },
        });
      }
      if (seenPositions.has(item.position)) {
        return reply.status(400).send({
          success: false,
          error: { code: 'DUPLICATE_POSITION', message: 'Positions devem ser únicos.' },
        });
      }
      seenPositions.add(item.position);
    }

    const sanitizedItems = body.items.map((item) => ({
      id: item.id,
      title: sanitizeTitle(item.title),
      position: item.position,
    }));

    try {
      const job = await jobService.createJob({
        sourceUrl,
        type: body.type,
        format: body.format,
        quality: body.quality,
        items: sanitizedItems,
      });

      return reply.status(201).send({
        success: true,
        data: { jobId: job.id, status: job.status },
      });
    } catch (error) {
      console.error('Error creating job:', error);
      return reply.status(500).send({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Erro ao criar job.' },
      });
    }
  });

  app.get('/api/jobs/:jobId', async (request: FastifyRequest, reply: FastifyReply) => {
    const { jobId } = request.params as { jobId: string };

    if (!jobId || !isValidUuid(jobId)) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_JOB_ID', message: 'jobId deve ser um UUID válido.' },
      });
    }

    const progress = await jobService.getJobProgress(jobId);

    if (!progress) {
      return reply.status(404).send({
        success: false,
        error: { code: 'JOB_NOT_FOUND', message: 'Job não encontrado.' },
      });
    }

    return { success: true, data: progress };
  });

  app.get('/api/jobs/:jobId/details', async (request: FastifyRequest, reply: FastifyReply) => {
    const { jobId } = request.params as { jobId: string };

    if (!jobId || !isValidUuid(jobId)) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_JOB_ID', message: 'jobId deve ser um UUID válido.' },
      });
    }

    const job = await jobService.getJobById(jobId);

    if (!job) {
      return reply.status(404).send({
        success: false,
        error: { code: 'JOB_NOT_FOUND', message: 'Job não encontrado.' },
      });
    }

    return { success: true, data: job };
  });

  app.get('/api/jobs', async (request: FastifyRequest, reply: FastifyReply) => {
    const { limit, offset } = request.query as { limit?: string; offset?: string };

    const parsedLimit = limit ? parseInt(limit, 10) : 20;
    const parsedOffset = offset ? parseInt(offset, 10) : 0;

    if (isNaN(parsedLimit) || isNaN(parsedOffset) || parsedLimit < 1 || parsedLimit > 100 || parsedOffset < 0) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_PAGINATION', message: 'limit deve ser 1-100 e offset >= 0.' },
      });
    }

    const jobs = await jobService.listJobs(parsedLimit, parsedOffset);

    return { success: true, data: jobs };
  });

  app.post('/api/jobs/:jobId/cancel', async (request: FastifyRequest, reply: FastifyReply) => {
    const { jobId } = request.params as { jobId: string };

    if (!jobId || !isValidUuid(jobId)) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_JOB_ID', message: 'jobId deve ser um UUID válido.' },
      });
    }

    const job = await jobService.getJobById(jobId);

    if (!job) {
      return reply.status(404).send({
        success: false,
        error: { code: 'JOB_NOT_FOUND', message: 'Job não encontrado.' },
      });
    }

    if (job.status === 'completed' || job.status === 'cancelled') {
      return reply.status(400).send({
        success: false,
        error: { code: 'JOB_NOT_CANCELLABLE', message: 'Este job não pode ser cancelado.' },
      });
    }

    await jobService.cancelJob(jobId);

    return {
      success: true,
      data: { jobId, status: 'cancelled' },
    };
  });

  app.post('/api/jobs/:jobId/retry', async (request: FastifyRequest, reply: FastifyReply) => {
    const { jobId } = request.params as { jobId: string };

    if (!jobId || !isValidUuid(jobId)) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_JOB_ID', message: 'jobId deve ser um UUID válido.' },
      });
    }

    const job = await jobService.getJobById(jobId);

    if (!job) {
      return reply.status(404).send({
        success: false,
        error: { code: 'JOB_NOT_FOUND', message: 'Job não encontrado.' },
      });
    }

    if (job.status !== 'failed') {
      return reply.status(400).send({
        success: false,
        error: { code: 'JOB_NOT_RETRYABLE', message: 'Apenas jobs com falha podem ser retentados.' },
      });
    }

    const hasFailedItems = job.items.some((i) => i.status === 'failed');
    if (!hasFailedItems) {
      return reply.status(400).send({
        success: false,
        error: { code: 'NO_FAILED_ITEMS', message: 'Nenhum item com falha para retentar.' },
      });
    }

    const result = await jobService.retryJob(jobId);

    return {
      success: true,
      data: {
        jobId,
        status: 'queued',
        retried: result.retried,
        skipped: result.skipped,
      },
    };
  });
}
