import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, X, Save } from 'lucide-react';
import { toast } from 'sonner';
import { AdminPageShell } from '../../components/admin/AdminPageShell';
import { adminApi } from '../../api/endpoints/admin';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import type { PointConfiguration, BadgeDefinition } from '../../api/types';

type Tab = 'points' | 'badges';

type BadgeForm = {
  name: string;
  slug: string;
  description: string;
  icon: string;
  required_points: number;
  badge_type: string;
  is_active: boolean;
};

const EMPTY_BADGE: BadgeForm = {
  name: '',
  slug: '',
  description: '',
  icon: '🏅',
  required_points: 0,
  badge_type: 'milestone',
  is_active: true,
};

function badgeToForm(b: BadgeDefinition): BadgeForm {
  return {
    name: b.name,
    slug: b.slug,
    description: b.description,
    icon: b.icon,
    required_points: b.required_points,
    badge_type: b.badge_type,
    is_active: b.is_active,
  };
}

function BadgeModal({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial: BadgeForm;
  onSave: (f: BadgeForm) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<BadgeForm>(initial);
  // When editing an existing badge, don't overwrite the slug from the name
  const [slugEdited, setSlugEdited] = useState(!!initial.name);

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!form.name || !form.slug) {
      toast.error('Name and slug are required');
      return;
    }
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/40 cursor-default"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {initial.name ? 'Edit Badge' : 'New Badge'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
                Name *
              </label>
              <input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  if (slugEdited) {
                    setForm((f) => ({ ...f, name }));
                  } else {
                    const slug = name
                      .toLowerCase()
                      .trim()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-+|-+$/g, '');
                    setForm((f) => ({ ...f, name, slug }));
                  }
                }}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
                Slug *
              </label>
              <input
                value={form.slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setForm((f) => ({ ...f, slug: e.target.value }));
                }}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
                Description
              </label>
              <input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
                Icon (emoji)
              </label>
              <input
                value={form.icon}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-xl"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
                Required points
              </label>
              <input
                type="number"
                min={0}
                value={form.required_points}
                onChange={(e) =>
                  setForm((f) => ({ ...f, required_points: parseInt(e.target.value) || 0 }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
                Badge type
              </label>
              <select
                value={form.badge_type}
                onChange={(e) => setForm((f) => ({ ...f, badge_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {['milestone', 'streak', 'special', 'community'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="badge_active"
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="rounded text-green-600 focus:ring-green-500"
            />
            <label htmlFor="badge_active" className="text-sm text-gray-700 dark:text-slate-300">
              Active
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-200 dark:border-slate-700 rounded-xl text-gray-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold disabled:opacity-60"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type NewPointForm = { event: string; description: string; points: number };
const EMPTY_POINT: NewPointForm = { event: '', description: '', points: 10 };

function PointsTab() {
  const qc = useQueryClient();
  const [edits, setEdits] = useState<Record<number, number>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [newForm, setNewForm] = useState<NewPointForm>(EMPTY_POINT);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'points'],
    queryFn: () => adminApi.configurations.points.list(),
    staleTime: 5 * 60_000,
  });
  const configs: PointConfiguration[] = data?.data ?? [];

  const save = useMutation({
    mutationFn: ({ id, points }: { id: number; points: number }) =>
      adminApi.configurations.points.update(id, { points }),
    onSuccess: () => {
      toast.success('Points saved');
      void qc.invalidateQueries({ queryKey: ['admin', 'points'] });
      setEdits({});
    },
    onError: () => toast.error('Failed to save'),
  });

  const create = useMutation({
    mutationFn: (f: NewPointForm) =>
      adminApi.configurations.points.create({
        event: f.event.toLowerCase().trim().replace(/\s+/g, '_'),
        description: f.description,
        points: f.points,
      }),
    onSuccess: () => {
      toast.success('Point event added');
      void qc.invalidateQueries({ queryKey: ['admin', 'points'] });
      setAddOpen(false);
      setNewForm(EMPTY_POINT);
    },
    onError: () => toast.error('Failed to add point event'),
  });

  if (isLoading)
    return (
      <div className="py-8 text-center text-gray-400 dark:text-slate-500 text-sm">Loading…</div>
    );

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500 dark:text-slate-400">
        Edit the point values awarded for each event type, then save each row.
      </p>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
            <tr>
              {['Event', 'Description', 'Points', ''].map((h) => (
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
            {configs.map((c) => {
              const edited = edits[c.id];
              const value = edited !== undefined ? edited : c.points;
              const dirty = edited !== undefined && edited !== c.points;
              return (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-slate-200">
                    {c.event
                      .split('_')
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(' ')}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{c.description}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min={0}
                      value={value}
                      onChange={(e) =>
                        setEdits((prev) => ({ ...prev, [c.id]: parseInt(e.target.value) || 0 }))
                      }
                      className={`w-24 px-2 py-1 border rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-slate-900 dark:text-slate-200 ${dirty ? 'border-amber-400 bg-amber-50 dark:border-amber-500 dark:bg-amber-900/10' : 'border-gray-300 dark:border-slate-600'}`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    {dirty && (
                      <button
                        onClick={() => save.mutate({ id: c.id, points: value })}
                        disabled={save.isPending}
                        className="flex items-center gap-1 px-2.5 py-1 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-60"
                      >
                        <Save size={12} /> Save
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add new point event */}
      {!addOpen ? (
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-gray-300 dark:border-slate-600 text-gray-500 dark:text-slate-400 rounded-lg text-sm hover:border-green-500 hover:text-green-600 dark:hover:text-green-400 transition-colors"
        >
          <Plus size={14} /> Add point event
        </button>
      ) : (
        <div className="bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 p-4 space-y-3">
          <p className="text-xs font-semibold text-gray-600 dark:text-slate-400">New point event</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">
                Event name
              </label>
              <input
                placeholder="e.g. cleanup_logged"
                value={newForm.event}
                onChange={(e) => setNewForm((f) => ({ ...f, event: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-mono bg-white dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">Points</label>
              <input
                type="number"
                min={0}
                value={newForm.points}
                onChange={(e) =>
                  setNewForm((f) => ({ ...f, points: parseInt(e.target.value) || 0 }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 dark:text-slate-400 mb-1">
                Description
              </label>
              <input
                placeholder="What earns these points?"
                value={newForm.description}
                onChange={(e) => setNewForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => create.mutate(newForm)}
              disabled={!newForm.event || create.isPending}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60"
            >
              <Save size={13} /> Save
            </button>
            <button
              onClick={() => {
                setAddOpen(false);
                setNewForm(EMPTY_POINT);
              }}
              className="px-3 py-1.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-500 dark:text-slate-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function BadgesTab() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; badge?: BadgeDefinition } | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<BadgeDefinition | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'badges'],
    queryFn: () => adminApi.configurations.badges.list(),
    staleTime: 5 * 60_000,
  });
  const badges: BadgeDefinition[] = data?.data ?? [];

  function invalidate() {
    void qc.invalidateQueries({ queryKey: ['admin', 'badges'] });
  }

  const create = useMutation({
    mutationFn: (f: BadgeForm) =>
      adminApi.configurations.badges.create({
        name: f.name,
        slug: f.slug,
        description: f.description,
        icon: f.icon,
        required_points: f.required_points,
        badge_type: f.badge_type,
        is_active: f.is_active,
      }),
    onSuccess: () => {
      toast.success('Badge created');
      invalidate();
      setModal(null);
    },
  });

  const update = useMutation({
    mutationFn: ({ id, f }: { id: number; f: BadgeForm }) =>
      adminApi.configurations.badges.update(id, f),
    onSuccess: () => {
      toast.success('Badge updated');
      invalidate();
      setModal(null);
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => adminApi.configurations.badges.delete(id),
    onSuccess: () => {
      toast.success('Badge deleted');
      invalidate();
    },
  });

  return (
    <>
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setModal({ mode: 'add' })}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
        >
          <Plus size={14} /> New Badge
        </button>
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
            <tr>
              {['Icon', 'Name', 'Type', 'Points req.', 'Active', 'Actions'].map((h) => (
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
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400 dark:text-slate-500">
                  Loading…
                </td>
              </tr>
            )}
            {!isLoading &&
              badges.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40">
                  <td className="px-4 py-3 text-2xl">{b.icon}</td>
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-slate-200">
                    {b.name}
                  </td>
                  <td className="px-4 py-3 capitalize text-gray-600 dark:text-slate-300">
                    {b.badge_type}
                  </td>
                  <td className="px-4 py-3 font-semibold text-amber-600 dark:text-amber-400">
                    {b.required_points.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${b.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400'}`}
                    >
                      {b.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setModal({ mode: 'edit', badge: b })}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(b)}
                        className="text-red-400 hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            {!isLoading && badges.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400 dark:text-slate-500">
                  No badges defined yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <BadgeModal
          initial={modal.mode === 'edit' && modal.badge ? badgeToForm(modal.badge) : EMPTY_BADGE}
          saving={create.isPending || update.isPending}
          onClose={() => setModal(null)}
          onSave={(f) => {
            if (modal.mode === 'edit' && modal.badge) {
              update.mutate({ id: modal.badge.id, f });
            } else {
              create.mutate(f);
            }
          }}
        />
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete badge?"
        message={`"${deleteTarget?.name ?? ''}" will be permanently deleted.`}
        confirmLabel="Delete"
        danger
        loading={remove.isPending}
        onConfirm={() => {
          if (deleteTarget) remove.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}

export default function AdminRewardConfig() {
  const [tab, setTab] = useState<Tab>('points');

  return (
    <AdminPageShell title="Reward Configuration">
      <div className="space-y-5">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-slate-700">
          {(['points', 'badges'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
                tab === t
                  ? 'border-green-600 text-green-600 dark:text-green-400'
                  : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
              }`}
            >
              {t === 'points' ? 'Point Values' : 'Badge Definitions'}
            </button>
          ))}
        </div>

        {tab === 'points' ? <PointsTab /> : <BadgesTab />}
      </div>
    </AdminPageShell>
  );
}
