import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Map, Camera, Gift, User } from 'lucide-react';
import { flushQueue, getQueueStats } from '../../lib/offlineQueue';

const NAV_ITEMS = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/map', icon: Map, label: 'Map' },
  { to: '/report', icon: Camera, label: 'Report' },
  { to: '/rewards', icon: Gift, label: 'Rewards' },
  { to: '/profile', icon: User, label: 'Profile' },
] as const;

export function BottomNav() {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function checkQueue() {
      try {
        const stats = await getQueueStats();
        if (mounted) setPendingCount(stats.reports + stats.recycling);
      } catch {
        // IndexedDB not available — silently ignore
      }
    }

    void checkQueue();

    // Flush the queue and then re-read the count so the badge clears promptly.
    const flushAndCheck = () => {
      void flushQueue().then(() => void checkQueue());
    };

    const onOnline = flushAndCheck;
    const onFlushed = () => void checkQueue();
    const onSwMessage = (e: MessageEvent) => {
      if ((e.data as { type?: string } | null)?.type === 'FLUSH_QUEUE') {
        flushAndCheck();
      }
    };

    window.addEventListener('online', onOnline);
    window.addEventListener('queue-flushed', onFlushed);
    navigator.serviceWorker?.addEventListener('message', onSwMessage);

    return () => {
      mounted = false;
      window.removeEventListener('online', onOnline);
      window.removeEventListener('queue-flushed', onFlushed);
      navigator.serviceWorker?.removeEventListener('message', onSwMessage);
    };
  }, []);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 z-30"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center h-16">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center pb-1 gap-0.5 text-xs transition-colors relative ${
                isActive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'
              }`
            }
          >
            <div className="relative">
              <Icon size={label === 'Report' ? 24 : 22} />
              {label === 'Report' && pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 flex items-center justify-center rounded-full bg-amber-500 text-white text-[9px] font-bold leading-none px-0.5">
                  {pendingCount > 9 ? '9+' : String(pendingCount)}
                </span>
              )}
            </div>
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
