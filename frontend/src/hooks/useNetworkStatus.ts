import { useEffect } from 'react';
import { useNetworkStore } from '../stores/networkStore';

export function useNetworkStatus() {
  const { status, setStatus } = useNetworkStore();

  useEffect(() => {
    const onOnline = () => setStatus('online');
    const onOffline = () => setStatus('offline');
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    const ping = async () => {
      if (!navigator.onLine) {
        setStatus('offline');
        return;
      }
      try {
        const start = Date.now();
        const base = import.meta.env.VITE_API_BASE_URL
          ? `${import.meta.env.VITE_API_BASE_URL as string}/api/v1`
          : '/api/v1';
        await fetch(`${base}/health/`, { method: 'GET', signal: AbortSignal.timeout(5000) });
        const ms = Date.now() - start;
        setStatus(ms > 2000 ? 'poor' : 'online');
      } catch {
        setStatus('poor');
      }
    };
    const interval = setInterval(ping, 30_000);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      clearInterval(interval);
    };
  }, [setStatus]);

  return status;
}
