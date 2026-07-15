// i18n-ready: see src/locales/{en,rw}/
import { createPortal } from 'react-dom';
import { AlertTriangle, ShieldCheck, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Intent = 'danger' | 'warning' | 'success';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  /** @deprecated use intent instead */
  danger?: boolean;
  intent?: Intent;
  loading?: boolean;
  confirmDisabled?: boolean;
  children?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

const INTENT_STYLES: Record<Intent, { icon: React.ReactNode; btn: string; ring: string }> = {
  danger: {
    icon: <Trash2 size={22} className="text-red-600 dark:text-red-400" />,
    btn: 'bg-red-600 hover:bg-red-700',
    ring: 'bg-red-100 dark:bg-red-900/30',
  },
  warning: {
    icon: <AlertTriangle size={22} className="text-amber-600 dark:text-amber-400" />,
    btn: 'bg-amber-600 hover:bg-amber-700',
    ring: 'bg-amber-100 dark:bg-amber-900/30',
  },
  success: {
    icon: <ShieldCheck size={22} className="text-green-600 dark:text-green-400" />,
    btn: 'bg-green-600 hover:bg-green-700',
    ring: 'bg-green-100 dark:bg-green-900/30',
  },
};

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  danger = false,
  intent,
  loading = false,
  confirmDisabled = false,
  children,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useTranslation('common');
  if (!open) return null;
  const resolved: Intent = intent ?? (danger ? 'danger' : 'warning');
  const { icon, btn, ring } = INTENT_STYLES[resolved];
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 text-center">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${ring}`}
        >
          {icon}
        </div>
        <h2 className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2">{title}</h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">{message}</p>
        {children && <div className="mb-4 text-left">{children}</div>}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-60"
          >
            {t('cancel')}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || confirmDisabled}
            className={`flex-1 px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-60 ${btn}`}
          >
            {loading ? t('please_wait') : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
