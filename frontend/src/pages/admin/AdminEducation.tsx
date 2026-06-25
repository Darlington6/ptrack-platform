import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, X, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import MDEditor from '@uiw/react-md-editor';
import { AdminPageShell } from '../../components/admin/AdminPageShell';
import { adminApi } from '../../api/endpoints/admin';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import type { Article } from '../../api/types';

type ArticleForm = {
  title_en: string;
  title_rw: string;
  body_en: string;
  body_rw: string;
  category: string;
  is_published: boolean;
  cover_image: File | null;
};

const EMPTY_FORM: ArticleForm = {
  title_en: '',
  title_rw: '',
  body_en: '',
  body_rw: '',
  category: 'recycling',
  is_published: false,
  cover_image: null,
};

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'recycling', label: 'Recycling' },
  { value: 'waste_reduction', label: 'Waste Reduction' },
  { value: 'climate', label: 'Climate' },
  { value: 'policy', label: 'Policy' },
  { value: 'community', label: 'Community' },
];

function articleToForm(a: Article): ArticleForm {
  return {
    title_en: a.title_en,
    title_rw: a.title_rw,
    body_en: a.body_en ?? '',
    body_rw: a.body_rw ?? '',
    category: a.category,
    is_published: a.is_published ?? false,
    cover_image: null,
  };
}

function ArticleModal({
  initial,
  onSave,
  onClose,
  saving,
}: {
  initial: ArticleForm;
  onSave: (form: ArticleForm) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<ArticleForm>(initial);

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!form.title_en || !form.title_rw) {
      toast.error('Both English and Kinyarwanda titles are required');
      return;
    }
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-xl my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            {initial.title_en ? 'Edit Article' : 'New Article'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Titles side-by-side */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
                Title (English) *
              </label>
              <input
                value={form.title_en}
                onChange={(e) => setForm((f) => ({ ...f, title_en: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
                Umutwe (Kinyarwanda) *
              </label>
              <input
                value={form.title_rw}
                onChange={(e) => setForm((f) => ({ ...f, title_rw: e.target.value }))}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Body side-by-side */}
          <div className="grid grid-cols-2 gap-4" data-color-mode="light">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
                Body (English)
              </label>
              <MDEditor
                value={form.body_en}
                onChange={(v) => setForm((f) => ({ ...f, body_en: v ?? '' }))}
                height={300}
                preview="edit"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
                Ibiriho (Kinyarwanda)
              </label>
              <MDEditor
                value={form.body_rw}
                onChange={(v) => setForm((f) => ({ ...f, body_rw: v ?? '' }))}
                height={300}
                preview="edit"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
                Category
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
                Cover image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setForm((f) => ({ ...f, cover_image: e.target.files?.[0] ?? null }))
                }
                className="w-full text-sm text-gray-600 dark:text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-green-50 file:text-green-700 dark:file:bg-green-900/20 dark:file:text-green-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="is_published"
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
              className="rounded text-green-600 focus:ring-green-500"
            />
            <label htmlFor="is_published" className="text-sm text-gray-700 dark:text-slate-300">
              Published (visible to citizens)
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

export default function AdminEducation() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; article?: Article } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Article | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'education'],
    queryFn: () => adminApi.education.list(),
    staleTime: 2 * 60_000,
  });
  const articles: Article[] =
    (data?.data as unknown as { results: Article[] })?.results ??
    (data?.data as unknown as Article[]) ??
    [];

  function invalidate() {
    void qc.invalidateQueries({ queryKey: ['admin', 'education'] });
    void qc.invalidateQueries({ queryKey: ['education'] });
  }

  function buildFormData(form: ArticleForm): FormData {
    const fd = new FormData();
    fd.append('title_en', form.title_en);
    fd.append('title_rw', form.title_rw);
    fd.append('body_en', form.body_en);
    fd.append('body_rw', form.body_rw);
    fd.append('category', form.category);
    fd.append('is_published', form.is_published ? 'true' : 'false');
    if (form.cover_image) fd.append('cover_image', form.cover_image);
    return fd;
  }

  const create = useMutation({
    mutationFn: (form: ArticleForm) => adminApi.education.create(buildFormData(form)),
    onSuccess: () => {
      toast.success('Article created');
      invalidate();
      setModal(null);
    },
    onError: () => toast.error('Failed to create article'),
  });

  const update = useMutation({
    mutationFn: ({ slug, form }: { slug: string; form: ArticleForm }) =>
      adminApi.education.update(slug, buildFormData(form)),
    onSuccess: () => {
      toast.success('Article updated');
      invalidate();
      setModal(null);
    },
    onError: () => toast.error('Failed to update article'),
  });

  const remove = useMutation({
    mutationFn: (slug: string) => adminApi.education.delete(slug),
    onSuccess: () => {
      toast.success('Article deleted');
      invalidate();
    },
    onError: () => toast.error('Failed to delete article'),
  });

  const togglePublish = useMutation({
    mutationFn: ({ slug, published }: { slug: string; published: boolean }) =>
      adminApi.education.update(slug, { is_published: published }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin', 'education'] });
    },
  });

  const actions = (
    <button
      onClick={() => setModal({ mode: 'add' })}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
    >
      <Plus size={14} /> New Article
    </button>
  );

  return (
    <>
      <AdminPageShell title={`Education (${articles.length})`} actions={actions}>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
              <tr>
                {[
                  'Title (EN)',
                  'Title (RW)',
                  'Category',
                  'Reading time',
                  'Published',
                  'Actions',
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
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-400 dark:text-slate-500"
                  >
                    Loading…
                  </td>
                </tr>
              )}
              {!isLoading &&
                articles.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-slate-200 max-w-[200px] truncate">
                      {a.title_en}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300 max-w-[200px] truncate">
                      {a.title_rw}
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-600 dark:text-slate-300">
                      {a.category.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-slate-400">
                      {a.reading_time_minutes} min
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          togglePublish.mutate({ slug: a.slug, published: !a.is_published })
                        }
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          a.is_published
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-slate-400'
                        }`}
                        title="Toggle publish"
                      >
                        {a.is_published ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            togglePublish.mutate({ slug: a.slug, published: !a.is_published })
                          }
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
                          title={a.is_published ? 'Unpublish' : 'Publish'}
                        >
                          {a.is_published ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <button
                          onClick={() => setModal({ mode: 'edit', article: a })}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(a)}
                          className="text-red-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              {!isLoading && articles.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-400 dark:text-slate-500"
                  >
                    No articles yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </AdminPageShell>

      {modal && (
        <ArticleModal
          initial={
            modal.mode === 'edit' && modal.article ? articleToForm(modal.article) : EMPTY_FORM
          }
          saving={create.isPending || update.isPending}
          onClose={() => setModal(null)}
          onSave={(form) => {
            if (modal.mode === 'edit' && modal.article) {
              update.mutate({ slug: modal.article.slug, form });
            } else {
              create.mutate(form);
            }
          }}
        />
      )}

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete article?"
        message={`"${deleteTarget?.title_en ?? ''}" will be permanently deleted.`}
        confirmLabel="Delete"
        danger
        loading={remove.isPending}
        onConfirm={() => {
          if (deleteTarget) remove.mutate(deleteTarget.slug);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
