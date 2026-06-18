import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, X, Download } from 'lucide-react';
import { AdminPageShell } from '../../components/admin/AdminPageShell';
import { adminApi } from '../../api/endpoints/admin';
import type { AuditLog } from '../../api/types';

function LogDrawer({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-[500px] bg-white dark:bg-slate-900 h-full overflow-y-auto border-l border-gray-200 dark:border-slate-700 shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Audit Log #{log.id}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 p-6 space-y-4">
          <div className="bg-gray-50 dark:bg-slate-800 rounded-xl divide-y divide-gray-200 dark:divide-slate-700">
            {(
              [
                ['Action', log.action],
                ['Actor', log.actor_email ?? `ID ${log.actor ?? '—'}`],
                ['Target type', log.target_type],
                ['Target ID', String(log.target_id ?? '—')],
                ['IP address', log.ip_address ?? '—'],
                ['Timestamp', new Date(log.created_at).toLocaleString()],
              ] as [string, string][]
            ).map(([label, val]) => (
              <div key={label} className="flex justify-between px-4 py-3">
                <span className="text-sm text-gray-500 dark:text-slate-400">{label}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white max-w-[260px] text-right truncate">
                  {val}
                </span>
              </div>
            ))}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-2">
              Metadata
            </p>
            <pre className="bg-gray-900 dark:bg-slate-950 text-green-400 text-xs rounded-xl p-4 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(log.metadata, null, 2)}
            </pre>
          </div>
          {log.user_agent && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400 mb-1">
                User Agent
              </p>
              <p className="text-xs text-gray-600 dark:text-slate-400 break-all">
                {log.user_agent}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminAuditLog() {
  const [cursor, setCursor] = useState<string | null>(null);
  const [cursorHistory, setCursorHistory] = useState<string[]>([]);
  const [actionFilter, setActionFilter] = useState('');
  const [targetType, setTargetType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [drawer, setDrawer] = useState<AuditLog | null>(null);

  const params = {
    ...(cursor && { cursor }),
    ...(actionFilter && { action: actionFilter }),
    ...(targetType && { target_type: targetType }),
    ...(dateFrom && { date_from: dateFrom }),
    ...(dateTo && { date_to: dateTo }),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'audit-log', params],
    queryFn: () => adminApi.auditLogs.list(params),
    staleTime: 30_000,
  });

  const logs: AuditLog[] = data?.data?.results ?? [];
  const nextCursor: string | null = data?.data?.next ?? null;
  const hasPrev = cursorHistory.length > 0;

  function goNext() {
    if (!nextCursor) return;
    setCursorHistory((h) => [...h, cursor ?? '']);
    setCursor(nextCursor);
  }

  function goPrev() {
    const history = [...cursorHistory];
    const prev = history.pop() ?? null;
    setCursorHistory(history);
    setCursor(prev);
  }

  function exportCsv() {
    const p: Record<string, string> = {};
    if (actionFilter) p['action'] = actionFilter;
    if (targetType) p['target_type'] = targetType;
    if (dateFrom) p['date_from'] = dateFrom;
    if (dateTo) p['date_to'] = dateTo;
    const qs = new URLSearchParams(p).toString();
    const base = (import.meta.env.VITE_API_BASE_URL as string) ?? '';
    window.open(`${base}/api/v1/admin/audit-logs/export.csv${qs ? '?' + qs : ''}`, '_blank');
  }

  const actions = (
    <button
      onClick={exportCsv}
      className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800"
    >
      <Download size={14} /> Export CSV
    </button>
  );

  return (
    <>
      <AdminPageShell title="Audit Log" actions={actions}>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
            <input
              type="text"
              placeholder="Filter by action (e.g. REPORT_VERIFIED)"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setCursor(null);
                setCursorHistory([]);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 w-64"
            />
            <input
              type="text"
              placeholder="Target type (e.g. WasteReport)"
              value={targetType}
              onChange={(e) => {
                setTargetType(e.target.value);
                setCursor(null);
                setCursorHistory([]);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 w-48"
            />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setCursor(null);
                setCursorHistory([]);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              title="From date"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setCursor(null);
                setCursorHistory([]);
              }}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              title="To date"
            />
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                <tr>
                  {['ID', 'Actor', 'Action', 'Target', 'IP', 'Time', ''].map((h) => (
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
                {isLoading && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-gray-400 dark:text-slate-500"
                    >
                      Loading…
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700/40 cursor-pointer"
                      onClick={() => setDrawer(log)}
                    >
                      <td className="px-4 py-3 text-gray-500 dark:text-slate-400 font-mono text-xs">
                        #{log.id}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-slate-300 text-xs max-w-[140px] truncate">
                        {log.actor_email ?? `User ${log.actor ?? '—'}`}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-blue-600 dark:text-blue-400 max-w-[180px] truncate">
                        {log.action}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-400 text-xs">
                        {log.target_type}
                        {log.target_id != null && (
                          <span className="text-gray-400 dark:text-slate-500">
                            {' '}
                            #{log.target_id}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-slate-500 font-mono text-xs">
                        {log.ip_address ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-slate-400 text-xs">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <ChevronRight size={14} className="text-gray-400 dark:text-slate-500" />
                      </td>
                    </tr>
                  ))}
                {!isLoading && logs.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-gray-400 dark:text-slate-500"
                    >
                      No log entries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Cursor pagination */}
          <div className="flex justify-end gap-2">
            <button
              onClick={goPrev}
              disabled={!hasPrev}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-sm disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-800"
            >
              Prev
            </button>
            <button
              onClick={goNext}
              disabled={!nextCursor}
              className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 text-sm disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-slate-800"
            >
              Next
            </button>
          </div>
        </div>
      </AdminPageShell>
      {drawer && <LogDrawer log={drawer} onClose={() => setDrawer(null)} />}
    </>
  );
}
