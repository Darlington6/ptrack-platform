import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { leaderboardApi, type LeaderboardPeriod } from '../api/endpoints/leaderboard';
import type { LeaderboardEntry } from '../types';

const PERIODS: { key: LeaderboardPeriod; label: string }[] = [
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Time' },
];

const PODIUM_COLORS = [
  'from-amber-400 to-yellow-300',
  'from-slate-400 to-slate-300',
  'from-orange-500 to-orange-400',
];

function Avatar({ name, className = '' }: { name: string; className?: string }) {
  const initials = name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className={`rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${className}`}
    >
      {initials}
    </div>
  );
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [period, setPeriod] = useState<LeaderboardPeriod>('week');
  const [sectorOnly, setSectorOnly] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: () => leaderboardApi.top(period),
    staleTime: 5 * 60_000,
  });

  const all: LeaderboardEntry[] = data?.data ?? [];
  const entries = sectorOnly && user?.sector ? all.filter((e) => e.sector === user.sector) : all;

  const podium = entries.slice(0, 3);
  const rest = entries.slice(3, 20);
  const currentUser = entries.find((e) => e.id === user?.id);
  const userInVisible = entries.slice(0, 20).some((e) => e.id === user?.id);

  return (
    <div className="px-4 pt-4 pb-24 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-slate-400">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Leaderboard</h1>
      </div>

      {/* Period tabs */}
      <div className="flex bg-gray-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              period === p.key
                ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-slate-400'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Green gradient section — edge-to-edge from toggle through podium */}
      <div className="-mx-4 bg-gradient-to-b from-green-50 to-transparent dark:from-green-900/20 dark:to-transparent">
        {/* Sector toggle */}
        <div className="flex items-center justify-end gap-2 px-4 pt-3 pb-2">
          <span className="text-xs text-gray-500 dark:text-slate-400">Your sector only</span>
          <button
            onClick={() => setSectorOnly((v) => !v)}
            aria-label="Toggle sector filter"
            className={`relative w-11 h-6 rounded-full transition-colors ${
              sectorOnly ? 'bg-green-600' : 'bg-gray-300 dark:bg-slate-600'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                sectorOnly ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {isLoading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && entries.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-slate-400 text-sm">
            No data yet for this period.
          </div>
        )}

        {/* Podium — top 3 */}
        {!isLoading && podium.length > 0 && (
          <div className="px-4 pb-0">
            <div className="flex items-end justify-center gap-3">
              {/* 2nd */}
              {podium[1] && (
                <div className="flex flex-col items-center gap-1 flex-1">
                  <Avatar name={podium[1].full_name} className="w-10 h-10" />
                  <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 text-center truncate w-full px-1">
                    {podium[1].full_name.split(' ')[0]}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {podium[1].points} pts
                  </p>
                  <div
                    className={`w-full h-16 rounded-t-xl bg-gradient-to-b ${PODIUM_COLORS[1]} flex items-center justify-center`}
                  >
                    <span className="text-lg font-bold text-white/90">2</span>
                  </div>
                </div>
              )}
              {/* 1st */}
              {podium[0] && (
                <div className="flex flex-col items-center gap-1 flex-1">
                  <Trophy size={18} className="text-amber-500" />
                  <Avatar name={podium[0].full_name} className="w-12 h-12" />
                  <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 text-center truncate w-full px-1">
                    {podium[0].full_name.split(' ')[0]}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {podium[0].points} pts
                  </p>
                  <div
                    className={`w-full h-24 rounded-t-xl bg-gradient-to-b ${PODIUM_COLORS[0]} flex items-center justify-center`}
                  >
                    <span className="text-2xl font-bold text-white/90">1</span>
                  </div>
                </div>
              )}
              {/* 3rd */}
              {podium[2] && (
                <div className="flex flex-col items-center gap-1 flex-1">
                  <Avatar name={podium[2].full_name} className="w-10 h-10" />
                  <p className="text-xs font-semibold text-gray-800 dark:text-slate-200 text-center truncate w-full px-1">
                    {podium[2].full_name.split(' ')[0]}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {podium[2].points} pts
                  </p>
                  <div
                    className={`w-full h-10 rounded-t-xl bg-gradient-to-b ${PODIUM_COLORS[2]} flex items-center justify-center`}
                  >
                    <span className="text-lg font-bold text-white/90">3</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {/* end green gradient section */}

      {/* Ranked list 4–20 */}
      {!isLoading && rest.length > 0 && (
        <div className="space-y-2">
          {rest.map((entry) => {
            const isMe = entry.id === user?.id;
            return (
              <div
                key={entry.id}
                className={`flex items-center gap-3 p-3 rounded-xl border ${
                  isMe
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700'
                }`}
              >
                <span className="text-sm font-bold text-gray-500 dark:text-slate-400 w-6 text-center">
                  {entry.rank}
                </span>
                <Avatar name={entry.full_name} className="w-8 h-8" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {entry.full_name}
                    {isMe && <span className="ml-1 text-xs text-green-600 font-normal">(You)</span>}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-slate-500">{entry.sector}</p>
                </div>
                <span className="text-sm font-bold text-gray-800 dark:text-white">
                  {entry.points} pts
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Current user outside top 20 */}
      {!isLoading && !userInVisible && currentUser && (
        <div className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed border-green-400 dark:border-green-700 bg-green-50 dark:bg-green-900/20">
          <span className="text-sm font-bold text-green-600 w-6 text-center">
            {currentUser.rank}
          </span>
          <Avatar name={currentUser.full_name} className="w-8 h-8" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {currentUser.full_name}{' '}
              <span className="text-xs text-green-600 font-normal">(You)</span>
            </p>
            <p className="text-xs text-gray-400 dark:text-slate-500">{currentUser.sector}</p>
          </div>
          <span className="text-sm font-bold text-gray-800 dark:text-white">
            {currentUser.points} pts
          </span>
        </div>
      )}
    </div>
  );
}
