import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { badgesApi } from '../api/endpoints/badges';
import client from '../api/client';
import type { BadgeDefinition, CursorPaginatedResponse, Reward } from '../api/types';
import { useState } from 'react';

interface RewardsResponse {
  total_points: number;
  rewards: Reward[];
  next: string | null;
  previous: string | null;
}

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const REWARD_ICONS: Record<string, string> = {
  report_submitted: '📍',
  recycling_logged: '♻️',
  verification_bonus: '✅',
};

const REWARD_LABELS: Record<string, string> = {
  report_submitted: 'Waste Report',
  recycling_logged: 'Recycling Activity',
  verification_bonus: 'Verification Bonus',
};

function BadgeCard({ badge, earned }: { badge: BadgeDefinition; earned: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
          earned
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 opacity-50 grayscale'
        }`}
      >
        <span className="text-3xl">{badge.icon || '🏅'}</span>
        <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 text-center leading-tight">
          {badge.name}
        </p>
        {earned && (
          <span className="text-[10px] font-bold text-green-600 dark:text-green-400">EARNED</span>
        )}
        {!earned && <span className="text-[10px] text-gray-400">{badge.required_points} pts</span>}
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-xs w-full text-center shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-5xl">{badge.icon || '🏅'}</span>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-3">{badge.name}</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{badge.description}</p>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-3">
              Requires {badge.required_points} points
            </p>
            {earned ? (
              <p className="text-sm font-semibold text-green-600 mt-2">
                ✅ You&apos;ve earned this!
              </p>
            ) : (
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
                Keep going — you need {Math.max(0, badge.required_points - 0)} more points.
              </p>
            )}
            <button
              onClick={() => setOpen(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function Rewards() {
  const { user } = useAuth();

  const { data: badgesData } = useQuery({
    queryKey: ['badges'],
    queryFn: () => badgesApi.list(),
    staleTime: 10 * 60_000,
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
      (last.data as unknown as CursorPaginatedResponse<unknown>).next ?? undefined,
    staleTime: 60_000,
  });

  const badges: BadgeDefinition[] = badgesData?.data ?? [];
  const points = user?.points ?? 0;

  const allRewards: Reward[] =
    rewardsPages?.pages.flatMap((p) => {
      const d = p.data as unknown as { rewards?: Reward[] };
      return d.rewards ?? [];
    }) ?? [];

  return (
    <div className="px-4 pt-4 pb-24 space-y-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Rewards</h1>

      {/* Points summary */}
      <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
        <p className="text-sm text-green-100 mb-1">Total Points</p>
        <p className="text-5xl font-extrabold tabular-nums">{points}</p>
        <p className="text-sm text-green-200 mt-2">
          {badges.filter((b) => b.required_points <= points).length} of {badges.length} badges
          earned
        </p>
      </div>

      {/* Badges grid */}
      {badges.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">Badges</h2>
          <div className="grid grid-cols-3 gap-3">
            {badges.map((b) => (
              <BadgeCard key={b.id} badge={b} earned={points >= b.required_points} />
            ))}
          </div>
        </div>
      )}

      {/* Activity history */}
      <div>
        <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">Activity History</h2>
        {allRewards.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-slate-400 text-sm">
            No activity yet — submit your first report!
          </div>
        ) : (
          <div className="space-y-2">
            {allRewards.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4"
              >
                <span className="text-xl w-9 text-center flex-shrink-0">
                  {REWARD_ICONS[r.reward_type] ?? '⭐'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">
                    {REWARD_LABELS[r.reward_type] ?? r.reward_type}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">
                    {timeAgo(r.date_earned)}
                  </p>
                </div>
                <span className="text-sm font-bold text-green-600 flex-shrink-0">
                  +{r.points_earned} pts
                </span>
              </div>
            ))}
          </div>
        )}

        {hasNextPage && (
          <button
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
            className="mt-3 w-full py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            {isFetchingNextPage ? 'Loading…' : 'Load more'}
          </button>
        )}
      </div>
    </div>
  );
}
