import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, Trophy, Flame, BarChart2, Users, Shield, Bell, ArrowLeft } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { notificationsApi } from '../api/endpoints/notifications';
import type { Notification } from '../types';

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  system: Info,
  badge_earned: Trophy,
  streak_warning: Flame,
  weekly_digest: BarChart2,
  community: Users,
  admin: Shield,
};

type FilterKey = 'all' | 'unread' | 'streak_warning' | 'badge_earned' | 'community';
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'streak_warning', label: 'Streaks' },
  { key: 'badge_earned', label: 'Badges' },
  { key: 'community', label: 'Community' },
];

function groupByDate(items: Notification[]): Record<string, Notification[]> {
  const today = new Date();
  const groups: Record<string, Notification[]> = {
    Today: [],
    'This week': [],
    Earlier: [],
  };
  items.forEach((n) => {
    const d = new Date(n.created_at);
    const diffDays = Math.floor((today.getTime() - d.getTime()) / 86400000);
    if (diffDays < 1) groups['Today']!.push(n);
    else if (diffDays < 7) groups['This week']!.push(n);
    else groups['Earlier']!.push(n);
  });
  return groups;
}

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const fetchNotifications = useCallback(async (cursor?: string) => {
    try {
      const res = await notificationsApi.list(cursor);
      const data = res.data;
      if (cursor) {
        setNotifications((prev) => [...prev, ...data.results]);
      } else {
        setNotifications(data.results);
      }
      setNextCursor(data.next);
    } catch {
      toast.error('Failed to load notifications.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || !nextCursor) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && nextCursor && !loadingMore) {
          setLoadingMore(true);
          void fetchNotifications(nextCursor);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [nextCursor, loadingMore, fetchNotifications]);

  async function handleClick(n: Notification) {
    if (!n.is_read) {
      try {
        await notificationsApi.markRead(n.id);
        setNotifications((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item))
        );
      } catch {
        // silent
      }
    }
    if (n.action_url) navigate(n.action_url);
  }

  const filtered = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.is_read;
    return n.category === filter;
  });

  const groups = groupByDate(filtered);

  return (
    <div className="pb-24 px-4">
      <div className="py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-slate-400">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-slate-100">Notifications</h1>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f.key
                ? 'bg-green-600 text-white'
                : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bell size={40} className="text-gray-300 dark:text-slate-600 mb-3" />
          <p className="text-gray-500 dark:text-slate-400 font-medium">You're all caught up.</p>
        </div>
      ) : (
        <>
          {Object.entries(groups).map(([groupName, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={groupName} className="mt-4">
                <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-2">
                  {groupName}
                </p>
                <div className="space-y-2">
                  {items.map((n) => {
                    const Icon = CATEGORY_ICONS[n.category] ?? Info;
                    return (
                      <button
                        key={n.id}
                        onClick={() => handleClick(n)}
                        className={`w-full flex items-start gap-3 p-4 rounded-xl border transition-colors text-left ${
                          n.is_read
                            ? 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700'
                            : 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-800'
                        }`}
                      >
                        <div
                          className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            n.is_read
                              ? 'bg-gray-100 dark:bg-slate-700'
                              : 'bg-green-100 dark:bg-green-900/30'
                          }`}
                        >
                          <Icon
                            size={16}
                            className={
                              n.is_read ? 'text-gray-500' : 'text-green-600 dark:text-green-400'
                            }
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium truncate ${
                              n.is_read
                                ? 'text-gray-800 dark:text-slate-200'
                                : 'text-gray-900 dark:text-slate-100'
                            }`}
                          >
                            {n.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                            {n.body}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                            {timeAgo(n.created_at)}
                          </p>
                        </div>
                        {!n.is_read && (
                          <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} className="h-4" />
          {loadingMore && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
