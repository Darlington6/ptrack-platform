import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '../../components/ui/Skeleton';
import { CheckCircle, XCircle, Download, Eye, AlertTriangle, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { AdminPageShell } from '../../components/admin/AdminPageShell';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { VerifyReportModal, RejectReportModal } from '../../components/admin/ReportActionModals';
import { adminApi } from '../../api/endpoints/admin';
import client from '../../api/client';
import type { WasteReport } from '../../api/types';

async function downloadCsv(url: string, filename: string) {
  try {
    const res = await client.get(url, { responseType: 'blob' });
    const href = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(href);
  } catch {
    toast.error('Export failed — please try again');
  }
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  verified: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  resolved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const WASTE_TYPES = ['bottles', 'bags', 'mixed', 'other'];
const STATUSES = ['pending', 'verified', 'resolved', 'rejected'];

const PRIORITY_STYLES: Record<number, { label: string; cls: string }> = {
  1: { label: 'P1', cls: 'bg-red-600 text-white' },
  2: { label: 'P2', cls: 'bg-orange-500 text-white' },
  3: { label: 'P3', cls: 'bg-amber-400 text-gray-900' },
  4: { label: 'P4', cls: 'bg-green-500 text-white' },
  5: { label: 'P5', cls: 'bg-gray-400 text-white' },
};

const FLAG_LABELS: Record<string, string> = {
  duplicate_location: 'Submitted within 50m of another report in the last 24 hours',
  high_velocity: 'More than 5 reports submitted within the last hour',
  duplicate_image: 'Same image used in a previous report',
};

function PriorityBadge({ priority }: { priority: number | null | undefined }) {
  if (!priority) return <span className="text-gray-300 dark:text-slate-600">—</span>;
  const { label, cls } = PRIORITY_STYLES[priority] ?? {
    label: `P${priority}`,
    cls: 'bg-gray-400 text-white',
  };
  return (
    <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded ${cls}`}>{label}</span>
  );
}

export default function AdminReports() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [wasteType, setWasteType] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [expandedReasons, setExpandedReasons] = useState<Set<number>>(new Set());
  const [fraudTooltip, setFraudTooltip] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  function toggleReason(id: number) {
    setExpandedReasons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  // Inline (single-report) action pending confirmation
  const [pendingVerify, setPendingVerify] = useState<WasteReport | null>(null);
  const [pendingReject, setPendingReject] = useState<WasteReport | null>(null);
  // Bulk (multi-select) action pending confirmation
  const [bulkVerifyOpen, setBulkVerifyOpen] = useState(false);
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);

  const params = {
    page,
    page_size: 25,
    ordering: '-created_at',
    ...(status && { status }),
    ...(wasteType && { waste_type: wasteType }),
    ...(search && { search }),
    ...(dateFrom && { date_from: dateFrom }),
    ...(dateTo && { date_to: dateTo }),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reports-list', params],
    queryFn: () => adminApi.reports.list(params),
    staleTime: 30_000,
  });

  const reports: WasteReport[] = data?.data?.results ?? [];
  const count: number = data?.data?.count ?? 0;
  const totalPages = Math.ceil(count / 25) || 1;

  function refetch() {
    void qc.invalidateQueries({ queryKey: ['admin', 'reports'] });
    void qc.invalidateQueries({ queryKey: ['admin', 'kpis'] });
    setSelected(new Set());
  }

  // Inline single-report mutations — use the full /reports/{id}/ endpoints so
  // notifications fire correctly and notes/reasons are supported.
  const inlineVerify = useMutation({
    mutationFn: ({ id, note }: { id: number; note: string }) =>
      client.patch(`/reports/${id}/verify/`, note ? { note } : {}),
    onSuccess: () => {
      toast.success('Report verified');
      refetch();
    },
    onError: () => toast.error('Verification failed'),
    onSettled: () => setPendingVerify(null),
  });

  const inlineReject = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      client.patch(`/reports/${id}/reject/`, { reason }),
    onSuccess: () => {
      toast.success('Report rejected');
      refetch();
    },
    onError: () => toast.error('Reject failed'),
    onSettled: () => setPendingReject(null),
  });

  // Bulk mutations — operate on all selected IDs at once.
  const bulkVerify = useMutation({
    mutationFn: () => adminApi.reports.bulkVerify(Array.from(selected)),
    onSuccess: (res) => {
      toast.success(`${res.data.verified} report(s) verified`);
      refetch();
    },
    onError: () => toast.error('Bulk verify failed'),
    onSettled: () => setBulkVerifyOpen(false),
  });

  const bulkReject = useMutation({
    mutationFn: (reason: string) => adminApi.reports.bulkReject(Array.from(selected), reason),
    onSuccess: (res) => {
      toast.success(`${res.data.rejected} report(s) rejected`);
      refetch();
    },
    onError: () => toast.error('Bulk reject failed'),
    onSettled: () => setBulkRejectOpen(false),
  });

  function toggleRow(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === reports.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(reports.map((r) => r.id)));
    }
  }

  function exportCsv() {
    const p: Record<string, string> = {};
    if (status) p['status'] = status;
    if (wasteType) p['waste_type'] = wasteType;
    if (search) p['search'] = search;
    if (dateFrom) p['date_from'] = dateFrom;
    if (dateTo) p['date_to'] = dateTo;
    void downloadCsv(adminApi.reports.exportUrl(p), 'reports.csv');
  }

  const actions = (
    <div className="flex items-center gap-2 flex-wrap">
      {selected.size > 0 && (
        <>
          <button
            onClick={() => setBulkVerifyOpen(true)}
            disabled={bulkVerify.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60"
          >
            <CheckCircle size={14} /> Verify {selected.size}
          </button>
          <button
            onClick={() => setBulkRejectOpen(true)}
            disabled={bulkReject.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/10 disabled:opacity-60"
          >
            <XCircle size={14} /> Reject {selected.size}
          </button>
        </>
      )}
      <button
        onClick={exportCsv}
        className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800"
      >
        <Download size={14} /> Export CSV
      </button>
    </div>
  );

  return (
    <>
      <AdminPageShell title={`Reports (${count})`} actions={actions}>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
            <input
              type="text"
              placeholder="Search by user name or email…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-slate-900 dark:text-slate-200 w-56"
            />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={wasteType}
              onChange={(e) => {
                setWasteType(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All types</option>
              {WASTE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              title="From date"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              title="To date"
            />
          </div>

          {/* Table — table-fixed keeps it within its container (no page-level scroll) */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-x-auto">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col className="w-[4%]" />
                <col className="w-[5%]" />
                <col className="w-[16%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
                <col className="w-[9%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
                <col className="w-[10%]" />
                <col className="w-[12%]" />
              </colgroup>
              <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                <tr>
                  <th className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={reports.length > 0 && selected.size === reports.length}
                      onChange={toggleAll}
                      className="rounded text-green-600 focus:ring-green-500"
                      aria-label="Select all"
                    />
                  </th>
                  {[
                    'ID',
                    'User',
                    'Type',
                    'AI Type',
                    'Priority',
                    'Status',
                    'Location',
                    'Date',
                    'Actions',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-3 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {isLoading &&
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 10 }).map((__, j) => (
                        <td key={j} className="px-4 py-3">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))}
                {!isLoading &&
                  reports.map((r) => (
                    <tr
                      key={r.id}
                      className={`hover:bg-gray-50 dark:hover:bg-slate-700/40 ${
                        r.is_flagged ? 'border-l-2 border-red-400' : ''
                      } ${selected.has(r.id) ? 'bg-green-50 dark:bg-green-900/10' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(r.id)}
                          onChange={() => toggleRow(r.id)}
                          className="rounded text-green-600 focus:ring-green-500"
                          aria-label={`Select report ${r.id}`}
                        />
                      </td>
                      {/* ID */}
                      <td className="px-3 py-3 text-gray-500 dark:text-slate-400 font-mono text-xs whitespace-nowrap overflow-hidden">
                        #{r.id}
                      </td>
                      {/* User */}
                      <td className="px-3 py-3 font-medium text-gray-800 dark:text-slate-200 truncate overflow-hidden">
                        {r.user_detail?.full_name ?? r.user_detail?.email ?? '—'}
                      </td>
                      {/* Citizen-selected type */}
                      <td className="px-3 py-3 capitalize text-gray-700 dark:text-slate-300 truncate overflow-hidden">
                        {r.waste_type.replace('_', ' ')}
                      </td>
                      {/* AI suggested type + confidence */}
                      <td className="px-3 py-3 text-xs">
                        <div className="flex items-center gap-1 min-w-0">
                          {r.ai_waste_type ? (
                            <span className="text-indigo-600 dark:text-indigo-400 font-medium capitalize truncate">
                              {r.ai_waste_type}
                              {r.ai_confidence != null && (
                                <span className="ml-1 text-gray-400 dark:text-slate-500">
                                  {Math.round(r.ai_confidence * 100)}%
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="text-gray-300 dark:text-slate-600">—</span>
                          )}
                          {r.is_flagged && (
                            <button
                              onMouseEnter={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const text = (r.flag_reasons ?? [])
                                  .map((code) => FLAG_LABELS[code] ?? code)
                                  .join(' · ');
                                setFraudTooltip({ text, x: rect.left, y: rect.bottom });
                              }}
                              onMouseLeave={() => setFraudTooltip(null)}
                              className="shrink-0 inline-flex items-center text-red-500"
                              aria-label="Fraud flags"
                            >
                              <AlertTriangle size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                      {/* AI priority — reason is collapsible */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <PriorityBadge priority={r.ai_priority} />
                          {r.ai_priority_reason && (
                            <button
                              onClick={() => toggleReason(r.id)}
                              title={expandedReasons.has(r.id) ? 'Hide reason' : 'Show reason'}
                              className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
                            >
                              <ChevronDown
                                size={13}
                                className={`transition-transform ${expandedReasons.has(r.id) ? 'rotate-180' : ''}`}
                              />
                            </button>
                          )}
                        </div>
                        {expandedReasons.has(r.id) && r.ai_priority_reason && (
                          <p className="mt-1 text-xs text-gray-400 dark:text-slate-500 leading-tight">
                            {r.ai_priority_reason}
                          </p>
                        )}
                      </td>
                      {/* Status */}
                      <td className="px-3 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[r.status] ?? ''}`}
                        >
                          {r.status}
                        </span>
                      </td>
                      {/* Location */}
                      <td className="px-3 py-3 text-gray-500 dark:text-slate-400 font-mono text-xs truncate overflow-hidden">
                        {r.latitude.toFixed(3)},{r.longitude.toFixed(3)}
                      </td>
                      {/* Date */}
                      <td className="px-3 py-3 text-gray-500 dark:text-slate-400 text-xs whitespace-nowrap overflow-hidden">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                      {/* Actions */}
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/reports/${r.id}`)}
                            title="View"
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
                          >
                            <Eye size={15} />
                          </button>
                          {r.status === 'pending' && (
                            <>
                              <button
                                onClick={() => setPendingVerify(r)}
                                title="Verify"
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle size={15} />
                              </button>
                              <button
                                onClick={() => setPendingReject(r)}
                                title="Reject"
                                className="text-red-400 hover:text-red-600"
                              >
                                <XCircle size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                {!isLoading && reports.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-8 text-center text-gray-400 dark:text-slate-500"
                    >
                      No reports match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-slate-400">
              <p>{count} total reports</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  Prev
                </button>
                <span>
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-800"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </AdminPageShell>

      {/* Inline: single-report verify/reject — use full /reports/{id}/ endpoints */}
      <VerifyReportModal
        open={pendingVerify !== null}
        loading={inlineVerify.isPending}
        onConfirm={(note) =>
          pendingVerify !== null && inlineVerify.mutate({ id: pendingVerify.id, note })
        }
        onCancel={() => setPendingVerify(null)}
      />
      <RejectReportModal
        open={pendingReject !== null}
        loading={inlineReject.isPending}
        onConfirm={(reason) =>
          pendingReject !== null && inlineReject.mutate({ id: pendingReject.id, reason })
        }
        onCancel={() => setPendingReject(null)}
      />

      {/* Bulk: multi-select verify/reject */}
      <ConfirmModal
        open={bulkVerifyOpen}
        intent="success"
        title={`Verify ${selected.size} report(s)?`}
        message="All selected pending reports will be marked as verified and citizens awarded bonus points."
        confirmLabel="Verify all"
        loading={bulkVerify.isPending}
        onConfirm={() => bulkVerify.mutate()}
        onCancel={() => setBulkVerifyOpen(false)}
      />
      <RejectReportModal
        open={bulkRejectOpen}
        loading={bulkReject.isPending}
        onConfirm={(reason) => bulkReject.mutate(reason)}
        onCancel={() => setBulkRejectOpen(false)}
      />

      {/* Fraud flag tooltip — rendered in a Portal so overflow-x-auto never clips it */}
      {fraudTooltip !== null &&
        createPortal(
          <div
            style={{ top: fraudTooltip.y + 6, left: fraudTooltip.x }}
            className="fixed z-[9999] max-w-[280px] bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl pointer-events-none leading-relaxed"
          >
            {fraudTooltip.text}
          </div>,
          document.body
        )}
    </>
  );
}
// ----
