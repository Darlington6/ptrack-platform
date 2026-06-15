import { useNetworkStore } from '../../stores/networkStore';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const status = useNetworkStore((s) => s.status);
  if (status === 'online') return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white text-xs font-medium px-4 py-2 flex items-center gap-2">
      <WifiOff size={14} />
      {status === 'offline'
        ? "You're offline. Actions will sync when reconnected."
        : 'Poor connection detected.'}
    </div>
  );
}