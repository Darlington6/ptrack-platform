import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText, Users, Clock, Star, CheckCircle, XCircle } from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';
import { toast } from 'sonner';
import { AdminPageShell } from '../../components/admin/AdminPageShell';
import { KigaliHeatmap } from '../../components/admin/KigaliHeatmap';
import { VerifyReportModal, RejectReportModal } from '../../components/admin/ReportActionModals';
import { adminApi } from '../../api/endpoints/admin';
import client from '../../api/client';
import type { WasteReport, AdminAnalyticsKpis } from '../../api/types';
import type { HeatmapPoint } from '../../api/endpoints/admin';

type DateRange = '7' | '30' | '90';

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  verified: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  resolved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{value}</p>
      <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const qc = useQueryClient();
  const [dateRange, setDateRange] = useState<DateRange>('7');

  const { data: kpisData } = useQuery({
    queryKey: ['admin', 'kpis'],
    queryFn: () => adminApi.analytics.kpis(),
    staleTime: 5 * 60_000,
  });

  const { data: heatmapData } = useQuery({
    queryKey: ['admin', 'heatmap'],
    queryFn: () => adminApi.analytics.heatmap(),
    staleTime: 10 * 60_000,
  });

  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['admin', 'reports-recent'],
    queryFn: () =>
      client.get<{ results: WasteReport[]; count: number }>('/reports/', {
        params: { ordering: '-created_at', page_size: 20 },
      }),
    staleTime: 60_000,
  });

  const kpis: AdminAnalyticsKpis | undefined = kpisData?.data;
  const heatPoints: HeatmapPoint[] = heatmapData?.data?.points ?? [];
  const reports: WasteReport[] = reportsData?.data?.results ?? [];

  function refetch() {
    void qc.invalidateQueries({ queryKey: ['admin', 'reports-recent'] });
    void qc.invalidateQueries({ queryKey: ['admin', 'kpis'] });
  }

  const [pendingVerify, setPendingVerify] = useState<number | null>(null);
  const [pendingReject, setPendingReject] = useState<number | null>(null);

  const verify = useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) =>
      client.patch(`/reports/${id}/verify/`, note ? { note } : {}),
    onSuccess: () => {
      toast.success('Report verified');
      refetch();
    },
    onError: () => toast.error('Verification failed'),
    onSettled: () => setPendingVerify(null),
  });

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      client.patch(`/reports/${id}/reject/`, { reason }),
    onSuccess: () => {
      toast.success('Report rejected');
      refetch();
    },
    onError: () => toast.error('Reject failed'),
    onSettled: () => setPendingReject(null),
  });

  const periodValue =
    dateRange === '7'
      ? (kpis?.reports_this_week ?? 0)
      : dateRange === '30'
        ? (kpis?.reports_this_month ?? 0)
        : (kpis?.reports_last_90d ?? 0);

  return (
    <>
      <AdminPageShell title="Dashboard">
        <div className="space-y-6">
          {/* Date range selector */}
          <div className="flex gap-2">
            {(['7', '30', '90'] as DateRange[]).map((d) => (
              <button
                key={d}
                onClick={() => setDateRange(d)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  dateRange === d
                    ? 'bg-green-600 text-white'
                    : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                Last {d}d
              </button>
            ))}
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              icon={FileText}
              label="Total Reports"
              value={kpis?.total_reports ?? '—'}
              sub={`+${periodValue} this period`}
              color="text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400"
            />
            <KpiCard
              icon={Users}
              label="Active Users (30d)"
              value={kpis?.active_citizens_30d ?? '—'}
              sub={`${kpis?.total_citizens ?? 0} citizens in total`}
              color="text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400"
            />
            <KpiCard
              icon={Clock}
              label="Pending Verification"
              value={kpis?.pending_reports ?? '—'}
              color="text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400"
            />
            <KpiCard
              icon={Star}
              label="Points Awarded"
              value={(kpis?.total_points_awarded ?? 0).toLocaleString()}
              color="text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400"
            />
          </div>

          {/* Heatmap */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100">
                Report Heatmap — Kigali
              </h2>
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Pending
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block" /> Verified
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" /> Resolved
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Rejected
                </span>
              </div>
            </div>
            <div className="h-72 rounded-b-xl overflow-hidden">
              <KigaliHeatmap points={heatPoints} />
            </div>
          </div>

          {/* Recent reports table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100">
                Recent Reports (last 20)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                  <tr>
                    {['ID', 'User', 'Location', 'Type', 'Status', 'Date', 'Actions'].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {reportsLoading &&
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 7 }).map((__, j) => (
                          <td key={j} className="px-4 py-3">
                            <Skeleton className="h-4 w-full" />
                          </td>
                        ))}
                      </tr>
                    ))}
                  {!reportsLoading &&
                    reports.slice(0, 20).map((r) => {
                      const nameParts = (r.user_detail?.full_name ?? '').split(' ');
                      const displayName =
                        nameParts.length > 1
                          ? `${nameParts[0]} ${nameParts[1]?.charAt(0)}.`
                          : (nameParts[0] ?? r.user_detail?.email ?? '—');
                      return (
                        <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40">
                          <td className="px-4 py-3 text-gray-500 dark:text-slate-400 font-mono text-xs">
                            R-{r.id}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-800 dark:text-slate-200">
                            {displayName}
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-slate-400 font-mono text-xs">
                            {r.latitude.toFixed(3)}, {r.longitude.toFixed(3)}
                          </td>
                          <td className="px-4 py-3 capitalize text-gray-700 dark:text-slate-300">
                            {r.waste_type.replace('_', ' ')}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[r.status] ?? ''}`}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 dark:text-slate-400 text-xs">
                            {new Date(r.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            {r.status === 'pending' && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setPendingVerify(r.id)}
                                  title="Verify"
                                  className="text-green-600 hover:text-green-700"
                                >
                                  <CheckCircle size={16} />
                                </button>
                                <button
                                  onClick={() => setPendingReject(r.id)}
                                  title="Reject"
                                  className="text-red-400 hover:text-red-600"
                                >
                                  <XCircle size={16} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  {!reportsLoading && reports.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-gray-400 dark:text-slate-500"
                      >
                        No reports yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AdminPageShell>

      <VerifyReportModal
        open={pendingVerify !== null}
        loading={verify.isPending}
        onConfirm={(note) => pendingVerify !== null && verify.mutate({ id: pendingVerify, note })}
        onCancel={() => setPendingVerify(null)}
      />
      <RejectReportModal
        open={pendingReject !== null}
        loading={reject.isPending}
        onConfirm={(reason) =>
          pendingReject !== null && reject.mutate({ id: pendingReject, reason })
        }
        onCancel={() => setPendingReject(null)}
      />
    </>
  );
}
