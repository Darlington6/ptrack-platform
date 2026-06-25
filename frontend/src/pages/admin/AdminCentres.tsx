import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { AdminPageShell } from '../../components/admin/AdminPageShell';
import { adminApi } from '../../api/endpoints/admin';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import type { RecyclingCentre } from '../../api/types';

const ALL_MATERIALS = [
  'Plastic bottles',
  'Cardboard',
  'Glass',
  'Metal',
  'E-waste',
  'Organic',
  'Paper',
  'Textiles',
];

const SECTORS = ['Kimironko', 'Gasabo', 'Kicukiro', 'Nyarugenge'];

type FormState = {
  name: string;
  address: string;
  sector: string;
  district: string;
  latitude: string;
  longitude: string;
  accepted_materials: string[];
  contact_phone: string;
  contact_email: string;
  is_active: boolean;
};

const EMPTY_FORM: FormState = {
  name: '',
  address: '',
  sector: '',
  district: 'Gasabo',
  latitude: '',
  longitude: '',
  accepted_materials: [],
  contact_phone: '',
  contact_email: '',
  is_active: true,
};

function centreToForm(c: RecyclingCentre): FormState {
  return {
    name: c.name,
    address: c.address,
    sector: c.sector,
    district: c.district,
    latitude: String(c.latitude),
    longitude: String(c.longitude),
    accepted_materials: c.accepted_materials,
    contact_phone: c.contact_phone ?? '',
    contact_email: c.contact_email ?? '',
    is_active: c.is_active,
  };
}

function CentreModal({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial: FormState;
  onSave: (f: FormState) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial);

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!form.name || !form.latitude || !form.longitude) {
      toast.error('Name, latitude and longitude are required');
      return;
    }
    onSave(form);
  }

  function toggleMaterial(m: string) {
    setForm((f) => ({
      ...f,
      accepted_materials: f.accepted_materials.includes(m)
        ? f.accepted_materials.filter((x) => x !== m)
        : [...f.accepted_materials, m],
    }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {initial.name ? 'Edit Centre' : 'Add Centre'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
                Name *
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
                Address
              </label>
              <input
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
                Sector
              </label>
              <select
                value={form.sector}
                onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">— select —</option>
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
                District
              </label>
              <input
                value={form.district}
                onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
                Latitude *
              </label>
              <input
                type="text"
                placeholder="-1.9441"
                value={form.latitude}
                onChange={(e) => setForm((f) => ({ ...f, latitude: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
                Longitude *
              </label>
              <input
                type="text"
                placeholder="30.0619"
                value={form.longitude}
                onChange={(e) => setForm((f) => ({ ...f, longitude: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
                Contact phone
              </label>
              <input
                value={form.contact_phone}
                onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
                Contact email
              </label>
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-2">
              Accepted materials
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_MATERIALS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleMaterial(m)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    form.accepted_materials.includes(m)
                      ? 'bg-green-600 text-white border-green-600'
                      : 'border-gray-300 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is_active"
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              className="rounded text-green-600 focus:ring-green-500"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-slate-300">
              Active (visible to citizens)
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-200 dark:border-slate-700 rounded-xl text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
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

export default function AdminCentres() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; centre?: RecyclingCentre } | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<RecyclingCentre | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'centres'],
    queryFn: () => adminApi.centres.list(),
    staleTime: 2 * 60_000,
  });
  const centres: RecyclingCentre[] = data?.data ?? [];

  function invalidate() {
    void qc.invalidateQueries({ queryKey: ['admin', 'centres'] });
    void qc.invalidateQueries({ queryKey: ['centres'] });
  }

  const create = useMutation({
    mutationFn: (f: FormState) =>
      adminApi.centres.create({
        ...f,
        latitude: parseFloat(f.latitude),
        longitude: parseFloat(f.longitude),
      }),
    onSuccess: () => {
      toast.success('Centre added');
      invalidate();
      setModal(null);
    },
    onError: () => toast.error('Failed to add centre'),
  });

  const update = useMutation({
    mutationFn: ({ id, f }: { id: number; f: FormState }) =>
      adminApi.centres.update(id, {
        ...f,
        latitude: parseFloat(f.latitude),
        longitude: parseFloat(f.longitude),
      }),
    onSuccess: () => {
      toast.success('Centre updated');
      invalidate();
      setModal(null);
    },
    onError: () => toast.error('Failed to update centre'),
  });

  const remove = useMutation({
    mutationFn: (id: number) => adminApi.centres.delete(id),
    onSuccess: () => {
      toast.success('Centre deleted');
      invalidate();
    },
    onError: () => toast.error('Failed to delete centre'),
  });

  const actions = (
    <button
      onClick={() => setModal({ mode: 'add' })}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
    >
      <Plus size={14} /> Add Centre
    </button>
  );

  return (
    <>
      <AdminPageShell title={`Recycling Centres (${centres.length})`} actions={actions}>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
              <tr>
                {['Name', 'Sector', 'Lat / Lng', 'Materials', 'Status', 'Actions'].map((h) => (
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
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-400 dark:text-slate-500"
                  >
                    Loading…
                  </td>
                </tr>
              )}
              {!isLoading &&
                centres.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-slate-200">
                      {c.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{c.sector}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-slate-400">
                      {c.latitude.toFixed(4)}, {c.longitude.toFixed(4)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {c.accepted_materials.slice(0, 3).map((m) => (
                          <span
                            key={m}
                            className="text-xs bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded"
                          >
                            {m}
                          </span>
                        ))}
                        {c.accepted_materials.length > 3 && (
                          <span className="text-xs text-gray-400 dark:text-slate-500">
                            +{c.accepted_materials.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400'}`}
                      >
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setModal({ mode: 'edit', centre: c })}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(c)}
                          className="text-red-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {!isLoading && centres.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-400 dark:text-slate-500"
                  >
                    No recycling centres yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminPageShell>

      {modal && (
        <CentreModal
          initial={modal.mode === 'edit' && modal.centre ? centreToForm(modal.centre) : EMPTY_FORM}
          saving={create.isPending || update.isPending}
          onClose={() => setModal(null)}
          onSave={(f) => {
            if (modal.mode === 'edit' && modal.centre) {
              update.mutate({ id: modal.centre.id, f });
            } else {
              create.mutate(f);
            }
          }}
        />
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete centre?"
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
