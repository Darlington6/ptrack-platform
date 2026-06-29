import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function UpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl: string, r: ServiceWorkerRegistration | undefined) {
      if (r) {
        setInterval(
          () => {
            void r.update();
          },
          5 * 60 * 1000
        );
      }
    },
  });

  const [dismissed, setDismissed] = useState(false);

  // Reset dismissal when a new update is available
  useEffect(() => {
    if (needRefresh) setDismissed(false);
  }, [needRefresh]);

  if (!needRefresh || dismissed) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div className="flex items-center gap-3 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white px-4 py-3 shadow-lg">
        <RefreshCw size={18} className="text-green-400 flex-shrink-0" />
        <p className="flex-1 text-sm">A new version of pTrack is available.</p>
        <button
          onClick={() => void updateServiceWorker(true)}
          className="text-xs font-semibold text-green-400 hover:text-green-300 flex-shrink-0"
        >
          Update
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="text-xs text-slate-400 hover:text-slate-200 flex-shrink-0"
        >
          Later
        </button>
      </div>
    </div>
  );
}
