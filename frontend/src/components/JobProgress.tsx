import { useCallback, useEffect, useState } from 'react';
import { useJobEvents, type JobEvent } from '@/hooks/useJobEvents';
import {
  getJobDetails,
  cancelJob,
  retryJob,
  getItemDownloadUrl,
  getJobDownloadZipUrl,
  type JobDetails,
  type JobItemStatus,
  type JobStatus,
} from '@/services/jobs';
import {
  CheckCircle,
  XCircle,
  Loader2,
  Circle,
  Download,
  ExternalLink,
  X,
  RefreshCw,
} from 'lucide-react';

interface JobProgressProps {
  jobId: string;
}

const STATUS_CONFIG: Record<JobItemStatus, { icon: typeof Circle; color: string; label: string }> = {
  pending: { icon: Circle, color: 'text-gray-500', label: 'Aguardando' },
  processing: { icon: Loader2, color: 'text-blue-400', label: 'Processando' },
  completed: { icon: CheckCircle, color: 'text-green-400', label: 'Concluído' },
  failed: { icon: XCircle, color: 'text-red-400', label: 'Erro' },
};

const JOB_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  queued: { label: 'Na fila', color: 'text-yellow-400' },
  processing: { label: 'Processando', color: 'text-blue-400' },
  completed: { label: 'Concluído', color: 'text-green-400' },
  failed: { label: 'Falhou', color: 'text-red-400' },
  cancelled: { label: 'Cancelado', color: 'text-gray-400' },
};

export function JobProgress({ jobId }: JobProgressProps) {
  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchJob() {
      try {
        const response = await getJobDetails(jobId);
        if (!cancelled && response.success && response.data) {
          setJob(response.data);
        } else if (!cancelled) {
          setError(response.error?.message || 'Job não encontrado');
        }
      } catch {
        if (!cancelled) setError('Erro ao carregar job');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchJob();
    return () => { cancelled = true; };
  }, [jobId]);

  const handleEvent = useCallback((event: JobEvent) => {
    setJob((prev) => {
      if (!prev) return prev;

      const items = prev.items.map((item) => {
        if (event.itemId && item.id === event.itemId) {
          if (event.type === 'item:start' || event.type === 'item:progress') {
            return { ...item, status: 'processing' as JobItemStatus };
          }
          if (event.type === 'item:completed') {
            return { ...item, status: 'completed' as JobItemStatus, outputFilePath: event.outputFilePath || null };
          }
          if (event.type === 'item:failed') {
            return { ...item, status: 'failed' as JobItemStatus, error: event.error || null };
          }
        }
        return item;
      });

      let status = prev.status;
      if (event.type === 'job:completed') status = 'completed';
      else if (event.type === 'job:failed') status = 'failed';
      else if (event.type === 'job:cancelled') status = 'cancelled';
      else if (event.type === 'snapshot' && event.status) status = event.status as JobStatus;

      return { ...prev, items, status };
    });
  }, []);

  const { connected } = useJobEvents({ jobId, onEvent: handleEvent });

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const response = await cancelJob(jobId);
      if (response.success) {
        setJob((prev) => prev ? { ...prev, status: 'cancelled' } : prev);
      }
    } catch {
      setError('Erro ao cancelar job');
    } finally {
      setCancelling(false);
    }
  };

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const response = await retryJob(jobId);
      if (response.success && response.data) {
        setJob((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            status: 'queued',
            items: prev.items.map((item) =>
              item.status === 'failed'
                ? { ...item, status: 'pending' as JobItemStatus, error: null }
                : item
            ),
          };
        });
      }
    } catch {
      setError('Erro ao retentar job');
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8" role="status" aria-label="Carregando progresso do job">
        <Loader2 className="h-6 w-6 animate-spin text-blue-400" aria-hidden="true" />
        <span className="ml-2 text-gray-400">Carregando...</span>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="p-6 text-center" role="alert">
        <XCircle className="h-12 w-12 text-red-400 mx-auto mb-3" aria-hidden="true" />
        <p className="text-red-400">{error || 'Job não encontrado'}</p>
      </div>
    );
  }

  const completedCount = job.items.filter((i) => i.status === 'completed').length;
  const failedCount = job.items.filter((i) => i.status === 'failed').length;
  const processingCount = job.items.filter((i) => i.status === 'processing').length;
  const pendingCount = job.items.filter((i) => i.status === 'pending').length;
  const total = job.items.length;
  const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const jobStatus = JOB_STATUS_CONFIG[job.status] || JOB_STATUS_CONFIG.queued;
  const hasCompletedItems = completedCount > 0;
  const isActive = job.status === 'queued' || job.status === 'processing';
  const isFailed = job.status === 'failed';

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Progresso</h2>
          <div className="flex items-center gap-2">
            {isActive && (
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                aria-label={cancelling ? 'Cancelando job...' : 'Cancelar job'}
              >
                {cancelling ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                CANCELAR
              </button>
            )}
            {isFailed && (
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                aria-label={retrying ? 'Retentando job...' : 'Tentar novamente job com falha'}
              >
                {retrying ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                TENTAR NOVAMENTE
              </button>
            )}
            {!connected && (
              <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded" role="status">
                Reconectando...
              </span>
            )}
            <span className={`text-sm font-medium ${jobStatus.color}`} aria-label={`Status: ${jobStatus.label}`}>
              {jobStatus.label}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
            <span>{completedCount} de {total} concluídos</span>
            <span aria-hidden="true">{progress}%</span>
          </div>
          <div
            className="w-full bg-gray-800 rounded-full h-3"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progresso: ${progress}% (${completedCount} de ${total} concluídos)`}
          >
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {hasCompletedItems && (
          <div className="mb-4 flex items-center gap-3">
            <a
              href={getJobDownloadZipUrl(jobId)}
              download
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-900 text-white text-sm font-medium rounded-lg transition-colors"
              aria-label={`Baixar todos os ${completedCount} arquivos concluídos como ZIP`}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              BAIXAR TODOS
            </a>
            <span className="text-sm text-gray-400" aria-live="polite">
              {completedCount} {completedCount === 1 ? 'arquivo pronto' : 'arquivos prontos'}.
            </span>
          </div>
        )}

        <div className="grid grid-cols-4 gap-3 mb-6 text-center" role="list" aria-label="Resumo do progresso">
          <div className="bg-gray-800 rounded-lg p-3" role="listitem">
            <div className="text-lg font-bold text-gray-300">{pendingCount}</div>
            <div className="text-xs text-gray-500">Aguardando</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3" role="listitem">
            <div className="text-lg font-bold text-blue-400">{processingCount}</div>
            <div className="text-xs text-gray-500">Processando</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3" role="listitem">
            <div className="text-lg font-bold text-green-400">{completedCount}</div>
            <div className="text-xs text-gray-500">Concluídos</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3" role="listitem">
            <div className="text-lg font-bold text-red-400">{failedCount}</div>
            <div className="text-xs text-gray-500">Erros</div>
          </div>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto" role="list" aria-label="Lista de itens">
          {job.items.map((item) => {
            const config = STATUS_CONFIG[item.status];
            const Icon = config.icon;

            return (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg"
                role="listitem"
              >
                <Icon
                  className={`h-5 w-5 ${config.color} ${
                    item.status === 'processing' ? 'animate-spin' : ''
                  }`}
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{item.title}</div>
                  {item.error && (
                    <div className="text-xs text-red-400 truncate mt-0.5" role="alert">{item.error}</div>
                  )}
                </div>
                {item.status === 'completed' ? (
                  <a
                    href={getItemDownloadUrl(item.id)}
                    download
                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Baixar ${item.title}`}
                  >
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                    BAIXAR
                  </a>
                ) : (
                  <span className={`text-xs font-medium ${config.color}`} aria-label={config.label}>
                    {config.label}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
