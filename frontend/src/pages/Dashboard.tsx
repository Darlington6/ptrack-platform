// i18n-ready: see src/locales/{en,rw}/
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
  Flame,
  PartyPopper,
  Target,
  Eye,
  EyeOff,
} from 'lucide-react';
import { authApi } from '../api/endpoints/auth';
import { KIGALI_SECTORS } from '../lib/sectors';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { NudgeBanner } from '../components/feedback/NudgeBanner';
import { InstallBanner } from '../components/InstallBanner';
import RecyclingModal from './RecyclingModal';
import { Skeleton } from '../components/ui/Skeleton';
import client from '../api/client';
import { useUiStore } from '../stores/uiStore';
import type { CursorPaginatedResponse, Reward, CommunityStats } from '../types';

type TSimple = (key: string, opts?: { count: number }) => string;

function timeAgo(dateStr: string, t: TSimple): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return t('common:time_minutes', { count: Math.floor(diff / 60) });
  if (diff < 86400) return t('common:time_hours', { count: Math.floor(diff / 3600) });
  if (diff < 7 * 86400) return t('common:time_days', { count: Math.floor(diff / 86400) });
  return new Date(dateStr).toLocaleDateString();
}

const REWARD_ICONS: Record<string, ReactNode> = {
  report_submitted: <MapPin size={14} className="text-green-600" />,
  recycling_logged: <Recycle size={14} className="text-green-600" />,
  verification_bonus: <CheckCircle size={14} className="text-green-600" />,
};

interface RewardsResponse {
  total_points: number;
  rewards: Reward[];
}

function SectorPickerModal({ onDone }: { onDone: (sector: string) => void }) {
  const [selected, setSelected] = useState('Kimironko');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation('dashboard');

  async function save() {
    setSaving(true);
    setError('');
    try {
      await authApi.updateMe({ sector: selected });
      onDone(selected);
    } catch {
      setError(t('sector_save_error'));
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
          {t('sector_picker_title')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">{t('sector_picker_body')}</p>
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-green-500 mb-4"
        >
          {KIGALI_SECTORS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
        <button
          onClick={() => void save()}
          disabled={saving}
          className="w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          {saving ? t('sector_saving') : t('sector_save')}
        </button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation(['dashboard', 'common']);
  const [showRecycling, setShowRecycling] = useState(false);
  const [communityExpanded, setCommunityExpanded] = useState(false);
  const [sectorSaved, setSectorSaved] = useState(false);
  const { pointsHidden, setPointsHidden } = useUiStore();
  const confettiFired = useRef(false);

  const needsSector = !sectorSaved && user !== null && !user.sector;

  const { data: rewardsData, isLoading: rewardsLoading } = useQuery({
    queryKey: ['rewards', 'dashboard'],
    queryFn: () => client.get<CursorPaginatedResponse<RewardsResponse>>('/rewards/me/?limit=100'),
    staleTime: 60_000,
  });

  const { data: sectorRankData } = useQuery({
    queryKey: ['sector-rank'],
    queryFn: () =>
      client.get<{
        sector_rank: number | null;
        sector_total: number | null;
        sector: string | null;
      }>('/auth/me/rank/'),
    staleTime: 5 * 60_000,
  });

  const { data: statsData } = useQuery({
    queryKey: ['community', 'stats'],
    queryFn: () => client.get<CommunityStats>('/community/stats/'),
    staleTime: 5 * 60_000,
  });

  const rewardsPayload =
    (rewardsData?.data as unknown as { results?: RewardsResponse })?.results ?? null;
  const allRewards: Reward[] = rewardsPayload?.rewards ?? [];
  const rewards: Reward[] = allRewards.slice(0, 5);

  const sectorRank = sectorRankData?.data ?? null;
  const communityStats = statsData?.data ?? null;
  const plasticKg = communityStats?.estimated_plastic_kg ?? 0;
  const plasticDisplay =
    plasticKg >= 1000 ? `${(plasticKg / 1000).toFixed(1)}T` : `${plasticKg.toFixed(0)}kg`;

  const now = new Date();
  const mondayMidnight = new Date(now);
  mondayMidnight.setHours(0, 0, 0, 0);
  mondayMidnight.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const weeklyReports = allRewards.filter(
    (r) =>
      r.reward_type === 'report_submitted' &&
      new Date(r.date_earned).getTime() >= mondayMidnight.getTime()
  ).length;

  const weeklyGoal = user?.weekly_goal ?? 5;
  const weeklyPct = Math.min((weeklyReports / weeklyGoal) * 100, 100);
  const goalComplete = weeklyReports >= weeklyGoal;

  const REWARD_LABELS: Record<string, string> = {
    report_submitted: t('dashboard:reward_report'),
    recycling_logged: t('dashboard:reward_recycling'),
    verification_bonus: t('dashboard:reward_bonus'),
  };

  useEffect(() => {
    if (goalComplete && !confettiFired.current) {
      confettiFired.current = true;
      void confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
    }
  }, [goalComplete]);

  return (
    <div className="px-4 pt-4 pb-24 space-y-4">
      {needsSector && (
        <SectorPickerModal
          onDone={async (_sector) => {
            setSectorSaved(true);
            await refreshUser();
          }}
        />
      )}

      <InstallBanner />
      <NudgeBanner />

      {rewardsLoading ? (
        <div className="h-32 rounded-2xl bg-gradient-to-br from-green-600/20 to-green-800/20 dark:from-green-700/30 dark:to-green-900/30 p-6 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-20 rounded" />
            <Skeleton className="h-4 w-4 rounded" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-10 w-24 rounded" />
            <Skeleton className="h-3 w-36 rounded" />
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-green-600 to-green-800 dark:from-green-700 dark:to-green-900 rounded-2xl p-6 text-white relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -right-2 bottom-0 w-16 h-16 rounded-full bg-white/5 pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between mb-1">
            <p className="text-sm font-medium text-green-100">{t('dashboard:your_points')}</p>
            <button
              onClick={() => setPointsHidden(!pointsHidden)}
              className="text-green-200 hover:text-white transition-colors"
              aria-label={pointsHidden ? 'Show points' : 'Hide points'}
            >
              {pointsHidden ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <p className="text-5xl font-extrabold tabular-nums mb-3">
            {pointsHidden ? '••••' : (user?.points ?? 0)}
          </p>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1">
              <Flame size={14} className="text-orange-400" />{' '}
              {t('dashboard:streak', { count: user?.current_streak ?? 0 })}
            </span>
            {sectorRank?.sector_rank !== null && sectorRank !== null && (
              <span className="font-semibold">
                ↗{' '}
                {t('dashboard:rank_in', {
                  rank: sectorRank.sector_rank,
                  total: sectorRank.sector_total,
                  sector: sectorRank.sector ?? user?.sector ?? 'your area',
                })}
              </span>
            )}
          </div>
        </div>
      )}

      <div
        className={`rounded-xl p-4 border ${
          goalComplete
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold text-gray-800 dark:text-slate-100 flex items-center gap-1.5">
            <Target size={15} className="text-green-600" /> {t('dashboard:weekly_goal')}
          </p>
          <span className="text-sm text-gray-500 dark:text-slate-400">
            {weeklyReports} / {weeklyGoal}
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
            <PartyPopper size={13} className="inline mr-1" /> {t('dashboard:goal_complete')}
          </p>
        ) : (
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1.5">
            {t('dashboard:goal_remaining', { count: Math.max(0, weeklyGoal - weeklyReports) })}
          </p>
        )}
      </div>

      <div>
        <h2 className="font-bold text-gray-900 dark:text-slate-100 text-base mb-3">
          {t('dashboard:quick_actions')}
        </h2>
        <div className="grid grid-cols-3 gap-3">
          <Link
            to="/report"
            className="bg-white dark:bg-slate-800 rounded-xl p-4 flex flex-col items-center gap-2 text-center border border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors active:scale-95"
          >
            <Plus size={22} className="text-green-600" />
            <span className="text-xs font-medium text-gray-700 dark:text-slate-300">
              {t('dashboard:report_waste')}
            </span>
          </Link>
          <button
            onClick={() => setShowRecycling(true)}
            className="bg-white dark:bg-slate-800 rounded-xl p-4 flex flex-col items-center gap-2 text-center border border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors active:scale-95"
          >
            <Recycle size={22} className="text-green-600" />
            <span className="text-xs font-medium text-gray-700 dark:text-slate-300">
              {t('dashboard:log_recycling')}
            </span>
          </button>
          <Link
            to="/leaderboard"
            className="bg-white dark:bg-slate-800 rounded-xl p-4 flex flex-col items-center gap-2 text-center border border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors active:scale-95"
          >
            <Trophy size={22} className="text-amber-500" />
            <span className="text-xs font-medium text-gray-700 dark:text-slate-300">
              {t('dashboard:leaderboard')}
            </span>
          </Link>
        </div>
      </div>

      <div className="bg-slate-800 dark:bg-slate-900 rounded-2xl overflow-hidden">
        <div className="p-5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
              {t('dashboard:community_impact')} — {user?.sector ?? 'your area'}
            </p>
            <button
              onClick={() => setCommunityExpanded((v) => !v)}
              className="text-xs text-green-400 hover:text-green-300"
            >
              {communityExpanded ? t('dashboard:view_less') : t('dashboard:view_more')}
            </button>
          </div>
          <div className="grid grid-cols-3 text-center mt-4">
            {[
              { value: communityStats?.total_reports ?? '—', label: t('dashboard:total_reports') },
              {
                value: communityStats?.active_citizens ?? '—',
                label: t('dashboard:active_citizens'),
              },
              {
                value: communityStats ? plasticDisplay : '—',
                label: t('dashboard:plastic_logged'),
              },
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
              {t('dashboard:neighbours_reported', { count: communityStats?.active_citizens ?? 0 })}
            </p>
            <button
              onClick={() => navigate('/community')}
              className="text-xs font-semibold text-green-400 flex items-center gap-1"
            >
              {t('dashboard:explore')} <ChevronRight size={12} />
            </button>
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900 dark:text-slate-100 text-base">
            {t('dashboard:recent_activity')}
          </h2>
          <Link to="/activity" className="text-sm text-green-600 font-medium">
            {t('dashboard:see_all')}
          </Link>
        </div>

        {rewardsLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 flex items-center gap-3"
              >
                <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <Skeleton className="h-3.5 w-3/4 rounded" />
                  <Skeleton className="h-3 w-1/2 rounded" />
                </div>
                <Skeleton className="h-4 w-14 rounded flex-shrink-0" />
              </div>
            ))}
          </div>
        ) : rewards.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-6 text-center text-gray-500 dark:text-slate-400 text-sm">
            {t('dashboard:no_activity')}
          </div>
        ) : (
          <div className="space-y-2">
            {rewards.map((r) => (
              <Link
                key={r.id}
                to="/activity"
                className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-base flex-shrink-0">
                  {REWARD_ICONS[r.reward_type] ?? <Star size={14} className="text-green-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">
                    {REWARD_LABELS[r.reward_type] ?? r.reward_type}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {timeAgo(r.date_earned, t as TSimple)}
                  </p>
                </div>
                <span className="text-sm font-semibold text-green-600 flex-shrink-0">
                  +{r.points_earned} pts
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Link
        to="/education"
        className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <BookOpen size={18} className="text-green-600" />
          <span className="text-sm font-medium text-gray-800 dark:text-slate-200">
            {t('dashboard:education_link')}
          </span>
        </div>
        <ChevronRight size={16} className="text-gray-400" />
      </Link>

      {showRecycling && <RecyclingModal onClose={() => setShowRecycling(false)} />}
    </div>
  );
}
