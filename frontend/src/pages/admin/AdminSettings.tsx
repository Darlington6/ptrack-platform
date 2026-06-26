import { useQuery } from '@tanstack/react-query';
import { CheckCircle, XCircle, Activity, RefreshCw } from 'lucide-react';
import { AdminPageShell } from '../../components/admin/AdminPageShell';
import client from '../../api/client';

interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  db: string;
  cache: string;
  version: string;
}

export default function AdminSettings() {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['admin', 'health'],
    queryFn: () => client.get<HealthStatus>('/health/'),
    staleTime: 0,
    retry: 1,
  });

  const health = data?.data;

  return (
    <AdminPageShell title="Settings">
      <div className="max-w-2xl space-y-6">
        {/* System health */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-green-600 dark:text-green-400" />
              <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100">
                System Health
              </h2>
            </div>
            <button
              onClick={() => void refetch()}
              disabled={isFetching}
              className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 hover:underline disabled:opacity-60"
            >
              <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
              {isFetching ? 'Checking…' : 'Refresh'}
            </button>
          </div>
          <div className="p-5 space-y-3">
            {isLoading && (
              <p className="text-sm text-gray-400 dark:text-slate-500">Checking health…</p>
            )}
            {error && (
              <div className="flex items-center gap-2 text-red-500">
                <XCircle size={16} />
                <span className="text-sm">Health endpoint unreachable</span>
              </div>
            )}
            {health && (
              <>
                {[
                  { label: 'API', value: health.status === 'ok' ? 'Healthy' : health.status },
                  { label: 'Database', value: health.db },
                  { label: 'Cache / Redis', value: health.cache },
                  { label: 'Version', value: health.version },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-slate-300">{label}</span>
                    <div className="flex items-center gap-1.5">
                      {value === 'Healthy' || value === 'ok' || value === 'connected' ? (
                        <CheckCircle
                          size={14}
                          className="text-green-600 dark:text-green-400 flex-shrink-0"
                        />
                      ) : (
                        <XCircle size={14} className="text-red-400 flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium text-gray-800 dark:text-slate-200">
                        {value}
                      </span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Environment info */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100">
              Environment
            </h2>
          </div>
          <div className="p-5 space-y-3">
            {[
              [
                'API base URL',
                (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
                  'http://localhost:8000',
              ],
              ['Environment', import.meta.env.MODE],
              ['Health endpoint', '/api/v1/health/'],
              ['Auth', 'JWT (access + refresh)'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-slate-300">{label}</span>
                <span className="text-sm font-mono font-medium text-gray-800 dark:text-slate-200">
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Placeholder note */}
        <p className="text-xs text-gray-400 dark:text-slate-500">
          Additional platform settings (SMTP, SMS gateway, rate limits) will be added in a future
          release.
        </p>
      </div>
    </AdminPageShell>
  );
}
