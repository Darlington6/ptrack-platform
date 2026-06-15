import { X } from 'lucide-react';
import { useNudges } from '../../hooks/useNudges';
import { useTranslation } from 'react-i18next';

export function NudgeBanner() {
  const { query, dismiss } = useNudges();
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith('rw') ? 'rw' : 'en';

  const nudge = query.data?.data?.[0];
  if (!nudge) return null;

  const title = lang === 'rw' ? nudge.title_rw || nudge.title_en : nudge.title_en;
  const body = lang === 'rw' ? nudge.body_rw || nudge.body_en : nudge.body_en;

  return (
    <div className="mx-4 mt-2 mb-0 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-start gap-2">
      <div className="flex-1">
        <p className="text-xs font-semibold text-green-800 dark:text-green-300">{title}</p>
        <p className="text-xs text-green-700 dark:text-green-400 mt-0.5">{body}</p>
      </div>
      <button
        onClick={() => dismiss.mutate(nudge.id)}
        className="text-green-600 hover:text-green-800 flex-shrink-0"
      >
        <X size={14} />
      </button>
    </div>
  );
}