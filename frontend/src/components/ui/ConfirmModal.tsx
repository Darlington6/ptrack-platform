import { AlertTriangle, Trash2 } from 'lucide-react';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 text-center">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
            danger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30'
          }`}
        >
          {danger ? (
            <Trash2 size={22} className="text-red-600 dark:text-red-400" />
          ) : (
            <AlertTriangle size={22} className="text-amber-600 dark:text-amber-400" />
          )}
        </div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">{title}</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 ${
              danger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}