// i18n-ready: see src/locales/{en,rw}/
// Translations: en & rw namespaces.
import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Skeleton } from '../components/ui/Skeleton';
import { ArrowLeft, MapPin, Recycle, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import client from '../api/client';
import type { Reward, RecyclingActivity, WasteReport } from '../types';

type Filter = 'all' | 'reports' | 'recycling' | 'points';

interface ActivityItem {
  id: string;
  type: 'report' | 'recycling' | 'reward';
  icon: ReactNode;
  label: string;
  sublabel: string;
  points?: number;
  date: string;
  linkTo?: string;
}

function timeAgo(dateStr: string, t: TFunction): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return t('common:time_minutes', { count: Math.floor(diff / 60) });
  if (diff < 86400) return t('common:time_hours', { count: Math.floor(diff / 3600) });
  if (diff < 7 * 86400) return t('common:time_days', { count: Math.floor(diff / 86400) });
  return new Date(dateStr).toLocaleDateString();
}

export default function MyActivity() {
  const navigate = useNavigate();
  const { t } = useTranslation(['activity', 'common', 'report', 'recycling']);
  const [filter, setFilter] = useState<Filter>('all');
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rewardsCursor, setRewardsCursor] = useState<string | null>('/rewards/me/');
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: t('filter_all') },
    { key: 'reports', label: t('filter_reports') },
    { key: 'recycling', label: t('filter_recycling') },
    { key: 'points', label: t('filter_points') },
  ];

  const rewardLabels: Record<string, string> = {
    report_submitted: t('label_report_submitted'),
    recycling_logged: t('label_recycling_logged'),
    verification_bonus: t('label_verification_bonus'),
  };

  const fetchMore = useCallback(async () => {
    if (!rewardsCursor || !hasMore) return;
    setLoading(true);
    try {
      const res = await client.get<{
        results?: { rewards?: Reward[]; total_points?: number };
        next: string | null;
      }>(rewardsCursor);
      const rawRewards: Reward[] = res.data.results?.rewards ?? [];
      const newItems: ActivityItem[] = rawRewards.map((r) => ({
        id: `reward-${r.id}`,
        type: 'reward',
        icon:
          r.reward_type === 'report_submitted' ? (
            <MapPin size={16} className="text-green-600" />
          ) : r.reward_type === 'recycling_logged' ? (
            <Recycle size={16} className="text-green-600" />
          ) : (
            <CheckCircle size={16} className="text-green-600" />
          ),
        label: rewardLabels[r.reward_type] ?? r.reward_type,
        sublabel: `+${r.points_earned} pts`,
        points: r.points_earned,
        date: r.date_earned,
      }));
      setItems((prev) => {
        const ids = new Set(prev.map((i) => i.id));
        return [...prev, ...newItems.filter((i) => !ids.has(i.id))].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      });
      const nextCursor = (res.data as unknown as { next?: string | null }).next ?? null;
      setRewardsCursor(nextCursor);
      if (!nextCursor) setHasMore(false);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [rewardsCursor, hasMore]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    async function init() {
      setLoading(true);
      const [reportsRes, recyclingRes] = await Promise.allSettled([
        client.get<{ results: WasteReport[] }>('/reports/?user=me'),
        client.get<{ results: RecyclingActivity[] }>('/recycling/'),
      ]);

      const reportItems: ActivityItem[] =
        reportsRes.status === 'fulfilled'
          ? (reportsRes.value.data.results ?? []).map((r) => ({
              id: `report-${r.id}`,
              type: 'report' as const,
              icon: <MapPin size={16} className="text-green-600" />,
              label: t('report:' + r.waste_type),
              sublabel: t('report:' + r.status),
              date: r.created_at,
              linkTo: `/reports/${r.id}`,
            }))
          : [];

      const recyclingItems: ActivityItem[] =
        recyclingRes.status === 'fulfilled'
          ? (recyclingRes.value.data.results ?? []).map((a) => ({
              id: `recycling-${a.id}`,
              type: 'recycling' as const,
              icon: <Recycle size={16} className="text-green-600" />,
              label: t('recycling:' + a.activity_type),
              sublabel: `+${a.points_awarded} pts`,
              points: a.points_awarded,
              date: a.date,
            }))
          : [];

      setItems(
        [...reportItems, ...recyclingItems].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      );
      setLoading(false);
    }
    void init();
    void fetchMore();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && hasMore && !loading) void fetchMore();
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [fetchMore, hasMore, loading]);

  const filtered = items.filter((i) => {
    if (filter === 'all') return true;
    if (filter === 'reports') return i.type === 'report';
    if (filter === 'recycling') return i.type === 'recycling';
    if (filter === 'points') return i.type === 'reward';
    return true;
  });

  return (
    <div className="px-4 pt-4 pb-24 space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-slate-400">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f.key
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && filtered.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4"
            >
              <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              <Skeleton className="h-4 w-12 flex-shrink-0" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 && !loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-slate-400 text-sm">
          {t('no_activity')}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => {
            const content = (
              <div className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4">
                <span className="w-9 flex-shrink-0 flex items-center justify-center">
                  {item.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">
                    {item.label}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">
                    {timeAgo(item.date, t)}
                    {item.sublabel ? ` · ${item.sublabel}` : ''}
                  </p>
                </div>
                {item.points !== undefined && (
                  <span className="text-sm font-bold text-green-600 flex-shrink-0">
                    +{item.points} pts
                  </span>
                )}
              </div>
            );
            return item.linkTo ? (
              <Link key={item.id} to={item.linkTo} className="block">
                {content}
              </Link>
            ) : (
              <div key={item.id}>{content}</div>
            );
          })}
        </div>
      )}

      <div ref={loaderRef} className="h-4" />
      {loading && (
        <div className="flex justify-center py-4">
          <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}
