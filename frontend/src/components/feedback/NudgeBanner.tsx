// i18n-ready: see src/locales/{en,rw}/
// Onboarding nudges shown on the dashboard to guide new users toward key actions
import { useEffect, useState, type ReactNode } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Flame,
  Recycle,
  MapPin,
  Users,
  Trophy,
  Lightbulb,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { nudgesApi } from '../../api/endpoints/nudges';
import type { NudgeRule } from '../../api/types';

const CATEGORY_ICON: Record<string, ReactNode> = {
  streak: <Flame size={16} className="text-orange-500" />,
  recycling: <Recycle size={16} className="text-green-600" />,
  report: <MapPin size={16} className="text-green-700" />,
  community: <Users size={16} className="text-blue-500" />,
  reward: <Trophy size={16} className="text-amber-500" />,
  default: <Lightbulb size={16} className="text-amber-500" />,
};

const AUTO_ADVANCE_MS = 6000;

export function NudgeBanner() {
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  const qc = useQueryClient();
  const lang = i18n.language?.startsWith('rw') ? 'rw' : 'en';

  const { data } = useQuery({
    queryKey: ['nudges', 'active'],
    queryFn: () => nudgesApi.active(),
    staleTime: 5 * 60_000,
    refetchInterval: 5 * 60_000,
  });

  const dismiss = useMutation({
    mutationFn: (id: number) => nudgesApi.dismiss(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['nudges'] }),
  });

  const actedOn = useMutation({
    mutationFn: (id: number) => nudgesApi.acted(id),
  });

  const nudges: NudgeRule[] = (data?.data ?? []).slice(0, 3);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (nudges.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % nudges.length), AUTO_ADVANCE_MS);
    return () => clearInterval(t);
  }, [nudges.length]);

  useEffect(() => {
    setIdx(0);
  }, [nudges.length]);

  if (nudges.length === 0) return null;

  const nudge = nudges[idx];
  if (!nudge) return null;

  const title = lang === 'rw' ? nudge.title_rw || nudge.title_en : nudge.title_en;
  const body = lang === 'rw' ? nudge.body_rw || nudge.body_en : nudge.body_en;
  const icon = CATEGORY_ICON[nudge.category] ?? CATEGORY_ICON.default;

  function prev() {
    setIdx((i) => (i - 1 + nudges.length) % nudges.length);
  }
  function next() {
    setIdx((i) => (i + 1) % nudges.length);
  }

  return (
    <div className="mx-4 mt-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3">
      <div className="flex items-start gap-2">
        <span className="flex-shrink-0 mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-green-800 dark:text-green-300 truncate">
            {title}
          </p>
          <p className="text-xs text-green-700 dark:text-green-400 mt-0.5 line-clamp-2">{body}</p>
        </div>
        <button
          onClick={() => dismiss.mutate(nudge.id)}
          aria-label="Dismiss"
          className="text-green-500 hover:text-green-700 dark:hover:text-green-300 flex-shrink-0"
        >
          <X size={14} />
        </button>
      </div>

      {nudges.length > 1 && (
        <div className="flex items-center justify-between mt-2">
          <button
            onClick={prev}
            className="text-green-600 dark:text-green-400 hover:opacity-70"
            aria-label="Previous nudge"
          >
            <ChevronLeft size={14} />
          </button>
          <div className="flex gap-1">
            {nudges.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                aria-label={`Nudge ${i + 1}`}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === idx ? 'bg-green-600 dark:bg-green-400' : 'bg-green-300 dark:bg-green-700'
                }`}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="text-green-600 dark:text-green-400 hover:opacity-70"
            aria-label="Next nudge"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {nudge.code && (
        <button
          onClick={() => {
            actedOn.mutate(nudge.id);
            navigate('/report');
          }}
          className="mt-2 text-xs font-semibold text-green-700 dark:text-green-400 underline underline-offset-2"
        >
          {t('take_action')} →
        </button>
      )}
    </div>
  );
}
