import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { subscribeToJobEvents } from '../lib/pubsub.js';
import { jobService } from '../services/job.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function jobEventsRoutes(app: FastifyInstance) {
  app.get('/api/jobs/:jobId/events', async (request: FastifyRequest, reply: FastifyReply) => {
    const { jobId } = request.params as { jobId: string };

    if (!jobId || !UUID_REGEX.test(jobId)) {
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

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const sendSSE = (data: object) => {
      reply.raw.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    sendSSE({ type: 'connected', jobId });

    if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
      sendSSE({ type: 'job:final', jobId, status: job.status });
      reply.raw.end();
      return;
    }

    const progress = await jobService.getJobProgress(jobId);
    if (progress) {
      sendSSE({
        type: 'snapshot',
        jobId,
        status: progress.status,
        total: progress.total,
        completed: progress.completed,
        processing: progress.processing,
        queued: progress.queued,
        failed: progress.failed,
        progress: progress.progress,
      });
    }

    const unsubscribe = subscribeToJobEvents(jobId, (event) => {
      sendSSE(event);
      if (event.type === 'job:completed' || event.type === 'job:failed') {
        setTimeout(() => {
          unsubscribe();
          reply.raw.end();
        }, 100);
      }
    });

    request.raw.on('close', () => {
      unsubscribe();
    });
  });
}
