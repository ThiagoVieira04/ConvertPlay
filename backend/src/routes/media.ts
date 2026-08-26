import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MediaAnalyzerService } from '../services/media-analyzer/index.js';
import { env } from '../config/env.js';

const analyzerService = new MediaAnalyzerService();

export async function mediaRoutes(app: FastifyInstance) {
  app.post('/api/media/analyze', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as { url?: string };

    if (!body?.url || typeof body.url !== 'string') {
      return reply.status(400).send({
        success: false,
        error: { code: 'MISSING_URL', message: 'URL é obrigatória.' },
      });
    }

    const url = body.url.trim();

    if (url.length === 0 || url.length > env.MAX_URL_LENGTH) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_URL', message: `URL deve ter entre 1 e ${env.MAX_URL_LENGTH} caracteres.` },
      });
    }

    const result = await analyzerService.analyze(url);

    if (result.success) {
      return reply.status(200).send({
        success: true,
        data: result.data,
      });
    }

    const statusCode = result.error.code === 'INVALID_URL' ? 400 : 422;

    return reply.status(statusCode).send({
      success: false,
      error: result.error,
    });
  });
}
