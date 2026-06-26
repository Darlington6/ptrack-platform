import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, ShieldOff, UserX, UserCheck, X, ChevronRight, Download } from 'lucide-react';
import { toast } from 'sonner';
import { AdminPageShell } from '../../components/admin/AdminPageShell';
import { adminApi } from '../../api/endpoints/admin';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import client from '../../api/client';
import type { AdminUser } from '../../api/endpoints/admin';

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

const ROLE_BADGE: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  citizen: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400',
};

const SECTORS = ['Kimironko', 'Gasabo', 'Kicukiro', 'Nyarugenge'];

function UserDrawer({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const qc = useQueryClient();
  const [confirmSuspend, setConfirmSuspend] = useState(false);

  const promote = useMutation({
    mutationFn: () => adminApi.users.update(user.id, { role: 'admin' }),
    onSuccess: () => {
      toast.success('User promoted to admin');
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      onClose();
    },
  });

  const demote = useMutation({
    mutationFn: () => adminApi.users.update(user.id, { role: 'citizen' }),
    onSuccess: () => {
      toast.success('User demoted to citizen');
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      onClose();
    },
  });

  const suspend = useMutation({
    mutationFn: () => adminApi.users.suspend(user.id),
    onSuccess: () => {
      toast.success('User suspended');
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      onClose();
    },
  });

  const restore = useMutation({
    mutationFn: () => adminApi.users.update(user.id, { is_active: true }),
    onSuccess: () => {
      toast.success('User restored');
      void qc.invalidateQueries({ queryKey: ['admin', 'users'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40 cursor-default"
        onClick={onClose}
      />
      <div className="relative w-96 bg-white dark:bg-slate-900 h-full overflow-y-auto border-l border-gray-200 dark:border-slate-700 shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">User Profile</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-green-600 text-white flex items-center justify-center text-xl font-bold">
              {(user.full_name || user.username || 'U').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {user.full_name || user.username}
              </p>
              <p className="text-sm text-gray-500 dark:text-slate-400">{user.email}</p>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${ROLE_BADGE[user.role] ?? ''}`}
              >
                {user.role}
              </span>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-slate-800 rounded-xl divide-y divide-gray-200 dark:divide-slate-700">
            {[
              ['Phone', user.phone_number ?? '—'],
              ['Sector', user.sector],
              ['Points', user.points.toLocaleString()],
              ['Reports', String(user.report_count)],
              ['Streak', `${user.current_streak ?? 0} days`],
              ['Email verified', user.email_verified ? 'Yes' : 'No'],
              ['Status', user.is_active ? 'Active' : 'Suspended'],
              ['Joined', new Date(user.created_at).toLocaleDateString()],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between px-4 py-3">
                <span className="text-sm text-gray-500 dark:text-slate-400">{label}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{val}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {user.role === 'citizen' ? (
              <button
                onClick={() => promote.mutate()}
                disabled={promote.isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60"
              >
                <ShieldCheck size={16} /> Promote to Admin
              </button>
            ) : (
              <button
                onClick={() => demote.mutate()}
                disabled={demote.isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-purple-300 dark:border-purple-700 text-purple-600 dark:text-purple-400 rounded-xl text-sm font-semibold hover:bg-purple-50 dark:hover:bg-purple-900/10 disabled:opacity-60"
              >
                <ShieldOff size={16} /> Demote to Citizen
              </button>
            )}
            {user.is_active ? (
              <button
                onClick={() => setConfirmSuspend(true)}
                disabled={suspend.isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-xl text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/10 disabled:opacity-60"
              >
                <UserX size={16} /> Suspend User
              </button>
            ) : (
              <button
                onClick={() => restore.mutate()}
                disabled={restore.isPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60"
              >
                <UserCheck size={16} /> Restore User
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={confirmSuspend}
        title="Suspend user?"
        message={`${user.full_name} will lose access until restored.`}
        confirmLabel="Suspend"
        danger
        loading={suspend.isPending}
        onConfirm={() => {
          suspend.mutate();
          setConfirmSuspend(false);
        }}
        onCancel={() => setConfirmSuspend(false)}
      />
    </div>
  );
}

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [sector, setSector] = useState('');
  const [verified, setVerified] = useState('');
  const [hasActivity, setHasActivity] = useState('');
  const [page, setPage] = useState(1);
  const [drawer, setDrawer] = useState<AdminUser | null>(null);

  const filters = {
    ...(search && { search }),
    ...(role && { role }),
    ...(sector && { sector }),
    ...(verified && { verified }),
    ...(hasActivity && { has_activity: hasActivity }),
  };

  // Reset to page 1 when filters change
  function setFilter<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }

  const params = { ...filters, page };

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminApi.users.list(params),
    staleTime: 30_000,
  });

  const users: AdminUser[] = data?.data?.results ?? [];
  const totalCount: number = data?.data?.count ?? 0;
  const hasNext = !!data?.data?.next;
  const hasPrev = !!data?.data?.previous;

  const exportActions = (
    <button
      onClick={() => void downloadCsv('/admin/users/export.csv', 'users.csv')}
      className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800"
    >
      <Download size={14} /> Export CSV
    </button>
  );

  return (
    <>
      <AdminPageShell title={`Users (${totalCount})`} actions={exportActions}>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-3 flex-wrap bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4">
            <input
              type="text"
              placeholder="Search name / email / phone…"
              value={search}
              onChange={(e) => setFilter(setSearch)(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 w-56"
            />
            <select
              value={role}
              onChange={(e) => setFilter(setRole)(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All roles</option>
              <option value="citizen">Citizen</option>
              <option value="admin">Admin</option>
            </select>
            <select
              value={sector}
              onChange={(e) => setFilter(setSector)(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All sectors</option>
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={verified}
              onChange={(e) => setFilter(setVerified)(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Any verification</option>
              <option value="true">Verified email</option>
              <option value="false">Unverified email</option>
            </select>
            <select
              value={hasActivity}
              onChange={(e) => setFilter(setHasActivity)(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Any activity</option>
              <option value="true">Has reports</option>
            </select>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                <tr>
                  {[
                    'Name',
                    'Email',
                    'Sector',
                    'Points',
                    'Reports',
                    'Role',
                    'Status',
                    'Joined',
                    '',
                  ].map((h) => (
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
                      colSpan={9}
                      className="px-4 py-8 text-center text-gray-400 dark:text-slate-500"
                    >
                      Loading…
                    </td>
                  </tr>
                )}
                {!isLoading &&
                  users.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700/40 cursor-pointer"
                      onClick={() => setDrawer(u)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {(u.full_name || u.username || 'U').slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-800 dark:text-slate-200 max-w-[120px] truncate">
                            {u.full_name || u.username}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-slate-400 text-xs max-w-[160px] truncate">
                        {u.email}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{u.sector}</td>
                      <td className="px-4 py-3 font-semibold text-amber-600 dark:text-amber-400">
                        {u.points.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-300">
                        {u.report_count}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[u.role] ?? ''}`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}
                        >
                          {u.is_active ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-slate-400 text-xs">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <ChevronRight size={15} className="text-gray-400 dark:text-slate-500" />
                      </td>
                    </tr>
                  ))}
                {!isLoading && users.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-8 text-center text-gray-400 dark:text-slate-500"
                    >
                      No users match filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {(hasPrev || hasNext) && (
            <div className="flex items-center justify-between px-1">
              <span className="text-sm text-gray-500 dark:text-slate-400">
                Page {page} · {totalCount} total
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => p - 1)}
                  disabled={!hasPrev}
                  className="px-3 py-1.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={!hasNext}
                  className="px-3 py-1.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </AdminPageShell>
      {drawer && <UserDrawer user={drawer} onClose={() => setDrawer(null)} />}
    </>
  );
}
