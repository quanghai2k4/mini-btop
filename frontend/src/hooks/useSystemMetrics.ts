import { useEffect, useState, useRef, useCallback } from 'react';
import type { SystemMetrics } from '@/types/metrics';

const MIN_RETRY_DELAY = 1000;  // 1 second
const MAX_RETRY_DELAY = 30000; // 30 seconds

export function useSystemMetrics() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [connected, setConnected] = useState(false);
  const retryDelayRef = useRef(MIN_RETRY_DELAY);
  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource('/api/stream');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('SSE connected');
      setConnected(true);
      // Reset retry delay on successful connection
      retryDelayRef.current = MIN_RETRY_DELAY;
    };

    eventSource.onerror = () => {
      console.error('SSE error, reconnecting in', retryDelayRef.current, 'ms');
      setConnected(false);
      eventSource.close();
      
      // Exponential backoff
      setTimeout(() => {
        connect();
      }, retryDelayRef.current);
      
      // Increase delay for next retry (exponential backoff with max)
      retryDelayRef.current = Math.min(retryDelayRef.current * 2, MAX_RETRY_DELAY);
    };

    eventSource.onmessage = (event) => {
      try {
        const data: SystemMetrics = JSON.parse(event.data);
        setMetrics(data);
      } catch {
        // Ignore parse errors (e.g., heartbeat pings)
      }
    };
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [connect]);

  return { metrics, connected };
}
