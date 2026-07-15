import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Users, Recycle, Globe, Flame } from 'lucide-react';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import type { CommunityStats, CommunityTrends } from '../api/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { format, parseISO } from 'date-fns';

function KpiCard({
  value,
  label,
  icon,
}: {
  value: string | number;
  label: string;
  icon: ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4 flex flex-col gap-1">
      <div className="w-7 h-7 flex items-center">{icon}</div>
      <p className="text-2xl font-extrabold text-gray-900 dark:text-white tabular-nums">{value}</p>
      <p className="text-xs text-gray-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

export default function CommunityImpact() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation('impact');

  const { data: statsData } = useQuery({
    queryKey: ['community', 'stats'],
    queryFn: () => client.get<CommunityStats>('/community/stats/'),
    staleTime: 5 * 60_000,
  });

  const { data: trendsData } = useQuery({
    queryKey: ['community', 'trends'],
    queryFn: () => client.get<CommunityTrends>('/community/trends/'),
    staleTime: 60 * 60_000,
  });

  const stats = statsData?.data;
  const trends: CommunityTrends['weeks'] = trendsData?.data?.weeks ?? [];

  const chartData = trends.map((w) => ({
    week: format(parseISO(w.week), 'MMM d'),
    reports: w.reports,
    recycling: w.recycling,
  }));

  const plasticKg = stats?.estimated_plastic_kg ?? 0;
  const plasticDisplay =
    plasticKg >= 1000 ? `${(plasticKg / 1000).toFixed(1)}T` : `${plasticKg.toFixed(0)} kg`;

  return (
    <div className="px-4 pt-4 pb-24 space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-0.5">
          <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-slate-400">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5 pl-8">
          {user?.sector ?? 'Your area'} · {t('all_time')}
        </p>
      </div>

      {/* KPIs grid */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard
          value={stats?.total_reports ?? '—'}
          label={t('kpi_reports')}
          icon={<MapPin size={22} className="text-green-600" />}
        />
        <KpiCard
          value={stats?.active_citizens ?? '—'}
          label={t('kpi_citizens')}
          icon={<Users size={22} className="text-blue-500" />}
        />
        <KpiCard
          value={stats?.total_recycling_activities ?? '—'}
          label={t('kpi_recycling')}
          icon={<Recycle size={22} className="text-green-600" />}
        />
        <KpiCard
          value={plasticDisplay}
          label={t('kpi_plastic')}
          icon={<Globe size={22} className="text-blue-500" />}
        />
      </div>

      {/* Trends chart */}
      {chartData.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            {t('chart_title')}
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                width={28}
              />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#f1f5f9',
                }}
              />
              <Line
                type="monotone"
                dataKey="reports"
                stroke="#16a34a"
                strokeWidth={2}
                dot={false}
                name={t('chart_reports')}
              />
              <Line
                type="monotone"
                dataKey="recycling"
                stroke="#60a5fa"
                strokeWidth={2}
                dot={false}
                name={t('chart_recycling')}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2">
            <span className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
              <span className="w-3 h-0.5 bg-green-600 inline-block" /> {t('chart_reports')}
            </span>
            <span className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
              <span className="w-3 h-0.5 bg-blue-400 inline-block" /> {t('chart_recycling')}
            </span>
          </div>
        </div>
      )}

      {/* Your contribution */}
      {user && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800 p-4">
          <p className="text-sm font-semibold text-green-800 dark:text-green-300 mb-1">
            {t('your_contribution')}
          </p>
          <p className="text-sm text-green-700 dark:text-green-400">
            {t('contribution_body', { points: user.points, sector: user.sector })}
          </p>
          <p className="text-sm text-green-700 dark:text-green-400 mt-1">
            {t('streak_label', { days: user.current_streak })}{' '}
            <Flame size={14} className="inline text-orange-400" />
          </p>
        </div>
      )}
    </div>
  );
}