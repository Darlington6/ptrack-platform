import { useRef, useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Plus,
  Recycle,
  Trophy,
  ChevronRight,
  Star,
  BookOpen,
  MapPin,
  CheckCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { NudgeBanner } from '../components/feedback/NudgeBanner';
import RecyclingModal from './RecyclingModal';
import { Skeleton } from '../components/ui/Skeleton';
import client from '../api/client';
import type { CursorPaginatedResponse, Reward, CommunityStats } from '../types';

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const REWARD_ICONS: Record<string, ReactNode> = {
  report_submitted: <MapPin size={14} className="text-green-600" />,
  recycling_logged: <Recycle size={14} className="text-green-600" />,
  verification_bonus: <CheckCircle size={14} className="text-green-600" />,
};

const REWARD_LABELS: Record<string, string> = {
  report_submitted: 'Waste Report',
  recycling_logged: 'Recycling Activity',
  verification_bonus: 'Verification Bonus',
};

interface RewardsResponse {
  total_points: number;
  rewards: Reward[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');
  const [showRecycling, setShowRecycling] = useState(false);
  const [communityExpanded, setCommunityExpanded] = useState(false);
  const confettiFired = useRef(false);

  const { data: rewardsData, isLoading: rewardsLoading } = useQuery({
    queryKey: ['rewards', 'dashboard'],
    queryFn: () => client.get<CursorPaginatedResponse<RewardsResponse>>('/rewards/me/?limit=5'),
    staleTime: 60_000,
  });

  const { data: leaderboardData } = useQuery({
    queryKey: ['leaderboard', 'dashboard'],
    queryFn: () => client.get<Array<{ id: number; rank: number }>>('/leaderboard/?period=all'),
    staleTime: 5 * 60_000,
  });

  const { data: statsData } = useQuery({
    queryKey: ['community', 'stats'],
    queryFn: () => client.get<CommunityStats>('/community/stats/'),
    staleTime: 5 * 60_000,
  });

  // The /rewards/me/ endpoint returns cursor-paginated { next, previous, results: { total_points, rewards } }
  const rewardsPayload =
    (rewardsData?.data as unknown as { results?: RewardsResponse })?.results ?? null;
  const rewards: Reward[] = rewardsPayload?.rewards?.slice(0, 5) ?? [];

  const rank = leaderboardData?.data?.find((u) => u.id === user?.id)?.rank ?? null;
  const communityStats = statsData?.data ?? null;
  const plasticKg = communityStats?.estimated_plastic_kg ?? 0;
  const plasticDisplay =
    plasticKg >= 1000 ? `${(plasticKg / 1000).toFixed(1)}T` : `${plasticKg.toFixed(0)}kg`;

  const oneWeekAgo = Date.now() - 7 * 86_400_000;
  const weeklyReports = rewards.filter(
    (r) => r.reward_type === 'report_submitted' && new Date(r.date_earned).getTime() > oneWeekAgo
  ).length;

  const weeklyGoal = user?.weekly_goal ?? 5;
  const weeklyPct = Math.min((weeklyReports / weeklyGoal) * 100, 100);
  const goalComplete = weeklyReports >= weeklyGoal;

  useEffect(() => {
    if (goalComplete && !confettiFired.current) {
      confettiFired.current = true;
      void confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
    }
  }, [goalComplete]);

  return (
    <div className="px-4 pt-4 pb-24 space-y-4">
      {/* NudgeBanner */}
      <NudgeBanner />

      {/* C — Points card */}
      {rewardsLoading ? (
        <Skeleton className="h-32 rounded-2xl" />
      ) : (
        <div className="bg-gradient-to-br from-green-600 to-green-800 dark:from-green-700 dark:to-green-900 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-28 h-28 rounded-full bg-white/10" />
          <div className="absolute -right-2 bottom-0 w-16 h-16 rounded-full bg-white/5" />
          <p className="text-sm font-medium text-green-100 mb-1">{t('your_points')}</p>
          <p className="text-5xl font-extrabold tabular-nums mb-3">{user?.points ?? 0}</p>
          <div className="flex items-center justify-between text-sm">
            <span>🔥 {t('streak', { count: user?.current_streak ?? 0 })}</span>
            {rank !== null && (
              <span className="font-semibold">
                ↗ {t('rank_in', { rank, sector: user?.sector ?? 'your area' })}
              </span>
            )}
          </div>
        </div>
      )}

      {/* D — Weekly goal */}
      <div
        className={`rounded-xl p-4 border ${
          goalComplete
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-1.5">
            <span className="text-green-600">⊙</span> {t('weekly_goal')}
          </p>
          <span className="text-sm text-gray-500 dark:text-slate-400">
            {weeklyReports} / {weeklyGoal} reports
          </span>
        </div>
        <div className="h-2.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-600 rounded-full transition-all duration-700"
            style={{ width: `${weeklyPct}%` }}
          />
        </div>
        {goalComplete ? (
          <p className="text-xs font-semibold text-green-700 dark:text-green-400 mt-1.5">
            🎉 Goal complete! Amazing work this week.
          </p>
        ) : (
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1.5">
            {Math.max(0, weeklyGoal - weeklyReports)} more reports to hit your goal this week
          </p>
        )}
      </div>

      {/* E — Quick actions */}
      <div>
        <h2 className="font-bold text-gray-900 dark:text-slate-100 text-base mb-3">
          {t('quick_actions')}
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <Link
            to="/report"
            className="bg-white dark:bg-slate-800 rounded-xl p-4 flex flex-col items-center gap-2 text-center border border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors active:scale-95"
          >
            <Plus size={22} className="text-green-600" />
            <span className="text-xs font-medium text-gray-700 dark:text-slate-300">
              {t('report_waste')}
            </span>
          </Link>
          <button
            onClick={() => setShowRecycling(true)}
            className="bg-white dark:bg-slate-800 rounded-xl p-4 flex flex-col items-center gap-2 text-center border border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors active:scale-95"
          >
            <Recycle size={22} className="text-green-600" />
            <span className="text-xs font-medium text-gray-700 dark:text-slate-300">
              {t('log_recycling')}
            </span>
          </button>
          <Link
            to="/leaderboard"
            className="bg-white dark:bg-slate-800 rounded-xl p-4 flex flex-col items-center gap-2 text-center border border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors active:scale-95"
          >
            <Trophy size={22} className="text-amber-500" />
            <span className="text-xs font-medium text-gray-700 dark:text-slate-300">
              {t('leaderboard')}
            </span>
          </Link>
        </div>
      </div>

      {/* F — Community impact (collapsible) */}
      <div className="bg-slate-800 dark:bg-slate-900 rounded-2xl overflow-hidden">
        <div className="p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
              {t('community_impact')} — {user?.sector ?? 'your area'}
            </p>
            <button
              onClick={() => setCommunityExpanded((v) => !v)}
              className="text-xs text-green-400 hover:text-green-300"
            >
              {communityExpanded ? 'Less' : 'View more'}
            </button>
          </div>
          <div className="grid grid-cols-3 text-center mt-4">
            {[
              { value: communityStats?.total_reports ?? '—', label: t('total_reports') },
              { value: communityStats?.active_citizens ?? '—', label: t('active_citizens') },
              { value: communityStats ? plasticDisplay : '—', label: t('plastic_logged') },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        {communityExpanded && (
          <div className="border-t border-slate-700 px-5 py-3 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              {communityStats?.active_citizens ?? 0} neighbours reported this week
            </p>
            <button
              onClick={() => navigate('/community')}
              className="text-xs font-semibold text-green-400 flex items-center gap-1"
            >
              Explore <ChevronRight size={12} />
            </button>
          </div>
        )}
      </div>

      {/* G — Recent activity */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900 dark:text-slate-100 text-base">
            {t('recent_activity')}
          </h2>
          <Link to="/activity" className="text-sm text-green-600 font-medium">
            See all
          </Link>
        </div>

        {rewardsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : rewards.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-6 text-center text-gray-500 dark:text-slate-400 text-sm">
            {t('no_activity')}
          </div>
        ) : (
          <div className="space-y-2">
            {rewards.map((r) => (
              <div
                key={r.id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-base flex-shrink-0">
                  {REWARD_ICONS[r.reward_type] ?? <Star size={14} className="text-green-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">
                    {REWARD_LABELS[r.reward_type] ?? r.reward_type}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {timeAgo(r.date_earned)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-green-600 flex-shrink-0">
                  +{r.points_earned} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* H — Education footer */}
      <Link
        to="/education"
        className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <BookOpen size={18} className="text-green-600" />
          <span className="text-sm font-medium text-gray-800 dark:text-slate-200">
            Recycling tips &amp; education
          </span>
        </div>
        <ChevronRight size={16} className="text-gray-400" />
      </Link>

      {showRecycling && <RecyclingModal onClose={() => setShowRecycling(false)} />}
    </div>
  );
}
