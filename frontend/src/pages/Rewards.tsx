import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { MapPin, Recycle, CheckCircle, Flame, Lock, Star, Lightbulb } from 'lucide-react';
import { type ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { badgesApi } from '../api/endpoints/badges';
import client from '../api/client';
import type { BadgeDefinition, Reward } from '../api/types';

interface RewardsResponse {
  total_points: number;
  rewards: Reward[];
  next: string | null;
  previous: string | null;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

const REWARD_LABELS: Record<string, string> = {
  report_submitted: 'Reported plastic waste',
  recycling_logged: 'Recycling activity logged',
  verification_bonus: 'Admin verification bonus',
  streak_bonus: 'Streak bonus',
};

const REWARD_ICONS: Record<string, ReactNode> = {
  report_submitted: <MapPin size={14} className="text-green-600" />,
  recycling_logged: <Recycle size={14} className="text-green-600" />,
  verification_bonus: <CheckCircle size={14} className="text-green-600" />,
  streak_bonus: <Flame size={14} className="text-orange-500" />,
};

function BadgeCard({ badge, currentPoints }: { badge: BadgeDefinition; currentPoints: number }) {
  const earned = currentPoints >= badge.required_points;
  const pct = Math.min((currentPoints / badge.required_points) * 100, 100);

  return (
    <div
      className={`rounded-2xl border p-4 flex flex-col gap-2 ${
        earned
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700'
      }`}
    >
      <div className="relative w-fit">
        <span className="text-3xl">{badge.icon || '🏅'}</span>
        {!earned && (
          <span className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full leading-none">
            <Lock size={11} className="text-gray-400 dark:text-slate-500" />
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900 dark:text-slate-100 leading-tight">
          {badge.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 leading-snug">
          {badge.description}
        </p>
      </div>
      {earned ? (
        <p className="text-xs font-semibold text-green-600 dark:text-green-400 flex items-center gap-1">
          ✓ Earned
        </p>
      ) : (
        <div>
          <div className="h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">
            {currentPoints} / {badge.required_points} pts
          </p>
        </div>
      )}
    </div>
  );
}

export default function Rewards() {
  const { user } = useAuth();

  const { data: badgesData } = useQuery({
    queryKey: ['badges'],
    queryFn: () => badgesApi.list(),
    staleTime: 10 * 60_000,
  });

  const { data: leaderboardData } = useQuery({
    queryKey: ['leaderboard', 'rewards'],
    queryFn: () => client.get<Array<{ id: number; rank: number }>>('/leaderboard/?period=all'),
    staleTime: 5 * 60_000,
  });

  const {
    data: rewardsPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['rewards', 'history'],
    queryFn: ({ pageParam }) =>
      client.get<RewardsResponse>((pageParam as string | undefined) ?? '/rewards/me/'),
    initialPageParam: '/rewards/me/',
    getNextPageParam: (last) =>
      (last.data as unknown as { next?: string | null }).next ?? undefined,
    staleTime: 60_000,
  });

  const badges: BadgeDefinition[] = badgesData?.data ?? [];
  const points = user?.points ?? 0;
  const streak = user?.current_streak ?? 0;
  const rank = leaderboardData?.data?.find((u) => u.id === user?.id)?.rank ?? null;

  const earnedCount = badges.filter((b) => points >= b.required_points).length;
  const nextBadge = badges.find((b) => b.required_points > points);
  const nextBadgePts = nextBadge ? nextBadge.required_points - points : 0;
  const prevThreshold = nextBadge
    ? (badges.filter((b) => b.required_points <= points).slice(-1)[0]?.required_points ?? 0)
    : points;
  const progressPct = nextBadge
    ? Math.min(((points - prevThreshold) / (nextBadge.required_points - prevThreshold)) * 100, 100)
    : 100;

  const allRewards: Reward[] =
    rewardsPages?.pages.flatMap((p) => {
      const results = (p.data as unknown as { results?: { rewards?: Reward[] } }).results;
      return results?.rewards ?? [];
    }) ?? [];

  return (
    <div className="px-4 pt-4 pb-24 space-y-5 max-w-2xl mx-auto">
      {/* Points card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 shadow-sm">
        <p className="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-1">
          Total Points
        </p>
        <p className="text-4xl font-extrabold text-green-600 tabular-nums">{points}</p>
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400 mb-1">
            <span>Progress to next badge</span>
            {nextBadge && <span>{nextBadgePts} pts needed</span>}
          </div>
          <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Badges Earned', value: String(earnedCount) },
          { label: 'Day Streak', value: String(streak) },
          { label: 'Sector Rank', value: rank ? `#${rank}` : '—' },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-3 text-center shadow-sm"
          >
            <p className="text-xl font-extrabold text-gray-900 dark:text-slate-100">{value}</p>
            <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-0.5 leading-tight">
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Badges grid */}
      {badges.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-slate-100 mb-3">Badges</h2>
          <div className="grid grid-cols-2 gap-3">
            {badges.map((b) => (
              <BadgeCard key={b.id} badge={b} currentPoints={points} />
            ))}
          </div>
        </div>
      )}

      {/* Points history */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900 dark:text-slate-100">Points History</h2>
          <Link to="/activity" className="text-sm text-green-600 dark:text-green-400 font-medium">
            See all
          </Link>
        </div>

        {allRewards.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-6 text-center text-sm text-gray-400 dark:text-slate-500">
            No activity yet — submit your first report!
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 divide-y divide-gray-100 dark:divide-slate-700">
            {allRewards.slice(0, 10).map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <span className="w-7 flex-shrink-0 flex items-center justify-center">
                  {REWARD_ICONS[r.reward_type] ?? <Star size={14} className="text-amber-500" />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">
                    {REWARD_LABELS[r.reward_type] ?? r.reward_type}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">
                    {formatDate(r.date_earned)}
                  </p>
                </div>
                <span className="text-sm font-bold text-green-600 flex-shrink-0">
                  +{r.points_earned}
                </span>
              </div>
            ))}
          </div>
        )}

        {hasNextPage && (
          <button
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
            className="mt-3 w-full py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            {isFetchingNextPage ? 'Loading…' : 'Load more'}
          </button>
        )}
      </div>

      {/* Coming soon */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex items-start gap-2">
        <Lightbulb size={16} className="flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <p className="text-sm text-amber-800 dark:text-amber-300">
          <span className="font-bold">Coming soon:</span> Redeem points for airtime, local business
          vouchers, and eco-products.
        </p>
      </div>
    </div>
  );
}
