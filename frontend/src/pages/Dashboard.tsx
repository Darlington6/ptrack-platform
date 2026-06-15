import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Recycle, Trophy, ChevronRight, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import type { Reward, CommunityStats } from '../types';

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const REWARD_LABELS: Record<string, string> = {
  report_submitted: 'Waste Report',
  recycling_logged: 'Recycling Activity',
  verification_bonus: 'Verification Bonus',
};

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useTranslation('dashboard');

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(null);
  const [weeklyReports, setWeeklyReports] = useState(0);

  useEffect(() => {
    client
      .get<{ rewards?: Reward[]; results?: { rewards?: Reward[] } }>('/rewards/me/')
      .then((r) => {
        const data = r.data;
        const list = Array.isArray(data.rewards)
          ? data.rewards
          : Array.isArray(data.results?.rewards)
            ? (data.results?.rewards ?? [])
            : [];
        setRewards(list);
      })
      .catch(() => setRewards([]));

    client
      .get<Array<{ id: number; rank: number }>>('/leaderboard/')
      .then((r) => {
        const entry = r.data.find((u) => u.id === user?.id);
        if (entry) setRank(entry.rank);
      })
      .catch(() => null);

    client
      .get<CommunityStats>('/community/stats/')
      .then((r) => setCommunityStats(r.data))
      .catch(() => null);

    // Count this-week reports from rewards
    const oneWeekAgo = Date.now() - 7 * 86400000;
    setWeeklyReports(
      rewards.filter(
        (r) =>
          r.reward_type === 'report_submitted' && new Date(r.date_earned).getTime() > oneWeekAgo
      ).length
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const weeklyGoal = user?.weekly_goal ?? 5;
  const weeklyPct = Math.min((weeklyReports / weeklyGoal) * 100, 100);

  return (
    <div className="px-4 pt-4 space-y-4">
      {/* Hero card */}
      <div className="bg-green-700 dark:bg-green-800 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-4 top-4 w-24 h-24 rounded-full bg-green-600/40" />
        <p className="text-sm font-medium text-green-100 mb-1">{t('your_points')}</p>
        <p className="text-5xl font-bold mb-4">{user?.points ?? 0}</p>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1">🔥 {user?.current_streak ?? 0}-day streak</span>
          {rank && (
            <span className="flex items-center gap-1 font-semibold">
              ↗ Rank #{rank} in {user?.sector ?? 'Kimironko'}
            </span>
          )}
        </div>
      </div>

      {/* Weekly goal */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-1.5">
            <span className="text-green-600">⊙</span> {t('weekly_goal')}
          </p>
          <span className="text-sm text-gray-500 dark:text-slate-400">
            {weeklyReports} / {weeklyGoal} reports
          </span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-600 rounded-full transition-all"
            style={{ width: `${weeklyPct}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1.5">
          {Math.max(0, weeklyGoal - weeklyReports)} more reports to hit your goal this week
        </p>
      </div>

      {/* Community nudge */}
      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800">
        <p className="font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-1.5">
          👥 {communityStats?.active_citizens ?? 0} neighbours reported this week
        </p>
        <p className="text-sm text-gray-600 dark:text-slate-400 mt-0.5">
          Be the {(communityStats?.active_citizens ?? 0) + 1}th — your community needs you!
        </p>
        <Link
          to="/report"
          className="text-sm font-medium text-green-600 mt-2 inline-flex items-center gap-1"
        >
          Report Now <ChevronRight size={14} />
        </Link>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-bold text-gray-900 dark:text-slate-100 text-lg mb-3">
          {t('quick_actions')}
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              icon: <Plus size={22} className="text-green-600" />,
              label: t('report_waste'),
              to: '/report',
            },
            {
              icon: <Recycle size={22} className="text-green-600" />,
              label: t('log_recycling'),
              to: '/recycling',
            },
            {
              icon: <Trophy size={22} className="text-amber-500" />,
              label: t('leaderboard'),
              to: '/leaderboard',
            },
          ].map((a) => (
            <Link
              key={a.label}
              to={a.to}
              className="bg-white dark:bg-slate-800 rounded-xl p-4 flex flex-col items-center gap-2 text-center border border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              {a.icon}
              <span className="text-xs font-medium text-gray-700 dark:text-slate-300">
                {a.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Community impact */}
      <div className="bg-slate-800 dark:bg-slate-900 rounded-2xl p-5 text-white">
        <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase mb-4">
          {t('community_impact')} — {user?.sector ?? 'Kimironko'}
        </p>
        <div className="grid grid-cols-3 text-center">
          {[
            { value: communityStats?.total_reports ?? '—', label: t('total_reports') },
            { value: communityStats?.active_citizens ?? '—', label: t('active_citizens') },
            { value: '4.2T', label: t('plastic_logged') },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="pb-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900 dark:text-slate-100 text-lg">
            {t('recent_activity')}
          </h2>
          <Link to="/activity" className="text-sm text-green-600 font-medium">
            See all
          </Link>
        </div>

        {rewards.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-6 text-center text-gray-500 dark:text-slate-400 text-sm">
            {t('no_activity')}
          </div>
        ) : (
          <div className="space-y-2">
            {rewards.slice(0, 3).map((r) => (
              <div
                key={r.id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <Star size={14} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-slate-100">
                      {REWARD_LABELS[r.reward_type] ?? r.reward_type}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {timeAgo(r.date_earned)}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-green-600">+{r.points_earned} pts</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
