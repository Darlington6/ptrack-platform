import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Map, Camera, Gift, User } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { flushQueue, getQueueStats } from '../../lib/offlineQueue';

export function BottomNav() {
  const [pendingCount, setPendingCount] = useState(0);
  const qc = useQueryClient();
  const { t } = useTranslation('nav');

  const NAV_ITEMS = [
    { to: '/dashboard', icon: Home, label: t('home') },
    { to: '/map', icon: Map, label: t('map') },
    { to: '/report', icon: Camera, label: t('report'), isReport: true },
    { to: '/rewards', icon: Gift, label: t('rewards') },
    { to: '/profile', icon: User, label: t('profile') },
  ] as const;

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

    function showSyncResult({
      reports,
      recycling,
      rejectedRecycling,
      abandonedReports,
      abandonedRecycling,
    }: {
      reports: number;
      recycling: number;
      rejectedRecycling: number;
      abandonedReports: number;
      abandonedRecycling: number;
    }) {
      void checkQueue();
      if (reports + recycling > 0) {
        toast.success(t('sync_success', { count: reports + recycling }));
        void qc.invalidateQueries({ queryKey: ['notifications', 'unread'] });
        void qc.invalidateQueries({ queryKey: ['dashboard'] });
      }
      if (rejectedRecycling > 0) {
        toast.error(t('sync_rejected_recycling'));
      }
      if (abandonedReports + abandonedRecycling > 0) {
        toast.error(t('sync_abandoned'));
      }
    }

    const flushAndCheck = () => {
      void flushQueue().then((result) => showSyncResult(result));
    };

    const onOnline = flushAndCheck;
    const onFlushed = (e: Event) => {
      const detail = (
        e as CustomEvent<{
          reports: number;
          recycling: number;
          rejectedRecycling: number;
          abandonedReports: number;
          abandonedRecycling: number;
        }>
      ).detail ?? {
        reports: 0,
        recycling: 0,
        rejectedRecycling: 0,
        abandonedReports: 0,
        abandonedRecycling: 0,
      };
      showSyncResult(detail);
    };
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
  }, [qc, t]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 z-30 lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center h-16">
        {NAV_ITEMS.map(({ to, icon: Icon, label, ...rest }) => {
          const isReport = 'isReport' in rest && rest.isReport;
          return (
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
                <Icon size={isReport ? 24 : 22} />
                {isReport && pendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 flex items-center justify-center rounded-full bg-amber-500 text-white text-[9px] font-bold leading-none px-0.5">
                    {pendingCount > 9 ? '9+' : String(pendingCount)}
                  </span>
                )}
              </div>
              <span>{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
