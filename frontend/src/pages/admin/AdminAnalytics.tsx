import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useReactToPrint } from 'react-to-print';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Download } from 'lucide-react';
import { AdminPageShell } from '../../components/admin/AdminPageShell';
import { adminApi } from '../../api/endpoints/admin';

const DONUT_COLORS = ['#16a34a', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444'];

type DateRange = '7' | '30' | '90';

export default function AdminAnalytics() {
  const printRef = useRef<HTMLDivElement>(null);
  const [dateRange, setDateRange] = useState<DateRange>('30');

  const { data: timeData } = useQuery({
    queryKey: ['admin', 'analytics', 'time', dateRange],
    queryFn: () => adminApi.analytics.reportsOverTime(Number(dateRange)),
    staleTime: 5 * 60_000,
  });

  const { data: sectorData } = useQuery({
    queryKey: ['admin', 'analytics', 'sector'],
    queryFn: () => adminApi.analytics.bySector(),
    staleTime: 5 * 60_000,
  });

  const { data: typeData } = useQuery({
    queryKey: ['admin', 'analytics', 'type'],
    queryFn: () => adminApi.analytics.byType(),
    staleTime: 5 * 60_000,
  });

  const { data: topData } = useQuery({
    queryKey: ['admin', 'analytics', 'top'],
    queryFn: () => adminApi.analytics.topUsers(10),
    staleTime: 5 * 60_000,
  });

  const weeklyReports = timeData?.data?.weeks ?? [];
  const bySector = sectorData?.data ?? [];
  const byType = typeData?.data ?? [];
  const topUsers = topData?.data ?? [];

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `pTrack Analytics — ${new Date().toISOString().slice(0, 10)}`,
  });

  const actions = (
    <button
      onClick={() => handlePrint()}
      className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800"
    >
      <Download size={14} /> Export PDF
    </button>
  );

  return (
    <AdminPageShell title="Analytics" actions={actions}>
      <div ref={printRef} className="space-y-6">
        {/* Date range */}
        <div className="flex gap-2">
          {(['7', '30', '90'] as DateRange[]).map((d) => (
            <button
              key={d}
              onClick={() => setDateRange(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                dateRange === d
                  ? 'bg-green-600 text-white'
                  : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              Last {d}d
            </button>
          ))}
        </div>

        {/* Reports over time */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
          <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100 mb-4">
            Reports Over Time
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={weeklyReports} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#16a34a"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Donut — by waste type */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
            <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100 mb-4">
              Reports by Waste Type
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={byType}
                  dataKey="count"
                  nameKey="waste_type"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {byType.map((_, i) => (
                    <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length] ?? '#16a34a'} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend
                  formatter={(value) => (
                    <span className="text-xs text-gray-700 dark:text-slate-300">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar — by sector */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
            <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100 mb-4">
              Reports by Sector
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={bySector} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="sector" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top users */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100">
              Top 10 Contributors
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
                <tr>
                  {['#', 'Name', 'Sector', 'Reports', 'Points'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {topUsers.map((u, i) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/40">
                    <td className="px-4 py-3 text-gray-400 dark:text-slate-500 font-mono text-xs">
                      {i + 1}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-slate-200">
                      {u.full_name || u.email}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{u.sector}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-slate-300">
                      {u.report_count}
                    </td>
                    <td className="px-4 py-3 font-semibold text-amber-600 dark:text-amber-400">
                      {u.points.toLocaleString()}
                    </td>
                  </tr>
                ))}
                {topUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-gray-400 dark:text-slate-500"
                    >
                      No data yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Engagement funnel */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5">
          <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100 mb-4">
            Engagement Funnel
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Registered users', value: 100 },
              { label: 'Users who submitted ≥1 report', value: 72 },
              { label: 'Users with verified report', value: 55 },
              { label: 'Users with streak ≥7 days', value: 30 },
            ].map((step) => (
              <div key={step.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-slate-300">{step.label}</span>
                  <span className="font-semibold text-gray-800 dark:text-slate-100">
                    {step.value}%
                  </span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${step.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-3">
            Funnel percentages are relative to total registered users (illustrative).
          </p>
        </div>
      </div>
    </AdminPageShell>
  );
}
