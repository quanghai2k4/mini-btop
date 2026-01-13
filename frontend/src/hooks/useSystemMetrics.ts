import { useEffect, useState } from 'react';
import type { SystemMetrics } from '@/types/metrics';

export function useSystemMetrics() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connect = () => {
      eventSource = new EventSource('/api/stream');

      eventSource.onopen = () => {
        console.log('SSE connected');
        setConnected(true);
      };

      eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        setConnected(false);
        eventSource?.close();
        
        // Reconnect after 5 seconds
        setTimeout(connect, 5000);
      };

      eventSource.onmessage = (event) => {
        try {
          const data: SystemMetrics = JSON.parse(event.data);
          setMetrics(data);
        } catch (error) {
          console.error('Parse error:', error);
        }
      };
    };

    connect();

    return () => {
      eventSource?.close();
    };
  }, []);

  return { metrics, connected };
}
