import { useEffect, useRef, useCallback, useState } from 'react';

export interface JobEvent {
  type: string;
  jobId: string;
  itemId?: string;
  title?: string;
  progress?: number;
  error?: string;
  outputFilePath?: string;
  total?: number;
  completedCount?: number;
  status?: string;
}

interface UseJobEventsOptions {
  jobId: string | null;
  onEvent?: (event: JobEvent) => void;
}

export function useJobEvents({ jobId, onEvent }: UseJobEventsOptions) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<JobEvent | null>(null);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    if (!jobId) return;

    const url = `/api/jobs/${jobId}/events`;

    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data: JobEvent = JSON.parse(event.data);
        setLastEvent(data);
        onEvent?.(data);

        if (data.type === 'job:completed' || data.type === 'job:failed' || data.type === 'job:final') {
          eventSource.close();
          setConnected(false);
        }
      } catch {
        // ignore malformed messages
      }
    };

    eventSource.onerror = () => {
      setConnected(false);
      eventSource.close();
      eventSourceRef.current = null;
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
      setConnected(false);
    };
  }, [jobId, onEvent]);

  return { connected, lastEvent, disconnect };
}
