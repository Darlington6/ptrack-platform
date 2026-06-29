import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Recycle, CheckCircle } from 'lucide-react';
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

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const REWARD_LABELS: Record<string, string> = {
  report_submitted: 'Waste Report Submitted',
  recycling_logged: 'Recycling Logged',
  verification_bonus: 'Report Verified',
};

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'reports', label: 'Reports' },
  { key: 'recycling', label: 'Recycling' },
  { key: 'points', label: 'Points' },
];

export default function MyActivity() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [rewardsCursor, setRewardsCursor] = useState<string | null>('/rewards/me/');
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);

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
        label: REWARD_LABELS[r.reward_type] ?? r.reward_type,
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
  }, [rewardsCursor, hasMore]);

  // Initial load: fetch reports + recycling too
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
              label: `${r.waste_type.charAt(0).toUpperCase() + r.waste_type.slice(1)} waste report`,
              sublabel: r.status,
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
              label: `Recycling — ${a.activity_type.replace('_', ' ')}`,
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

  // Infinite scroll
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
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Activity</h1>
      </div>

      {/* Filter chips */}
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

      {/* Timeline */}
      {filtered.length === 0 && !loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-slate-400 text-sm">
          No activity yet.
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
                    {timeAgo(item.date)}
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
              <Link key={item.id} to={item.linkTo}>
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
