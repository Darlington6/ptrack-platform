import { useEffect, useState } from 'react';
import { FileText, Users, Clock, Star } from 'lucide-react';
import { AdminAvatar } from '../../components/AdminAvatar';
import client from '../../api/client';
import type { LeaderboardEntry, WasteReportDetail } from '../../types';

const STATUS_BADGE = {
  pending: 'bg-yellow-100 text-yellow-800',
  verified: 'bg-green-100 text-green-800',
  resolved: 'bg-gray-100 text-gray-600',
};

export default function AdminDashboard() {
  const [reports, setReports] = useState<WasteReportDetail[]>([]);
  const [users, setUsers] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    client.get('/reports/').then((r) => setReports(r.data.results || []));
    client.get('/leaderboard/').then((r) => setUsers(r.data));
  }, []);

  const pending = reports.filter((r) => r.status === 'pending').length;
  const activeUsers = new Set(reports.map((r) => r.user)).size;
  const totalPoints = users.reduce((s, u) => s + u.points, 0);

  async function handleVerify(id: number) {
    await client.patch(`/reports/${id}/verify/`);
    const res = await client.get('/reports/');
    setReports(res.data.results || []);
  }

  return (
    <div className="flex-1">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Admin Dashboard</h1>
        <AdminAvatar />
      </header>

      <div className="p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: FileText,
              label: 'Total Reports',
              value: reports.length,
              color: 'text-blue-600 bg-blue-50',
            },
            {
              icon: Users,
              label: 'Active Users',
              value: activeUsers,
              color: 'text-green-600 bg-green-50',
            },
            {
              icon: Clock,
              label: 'Pending Verification',
              value: pending,
              color: 'text-amber-600 bg-amber-50',
            },
            {
              icon: Star,
              label: 'Points Awarded',
              value: totalPoints.toLocaleString(),
              color: 'text-purple-600 bg-purple-50',
            },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white rounded-lg border border-gray-200 p-5">
              <div
                className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}
              >
                <Icon size={20} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Report heatmap placeholder — matches Figma */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-800">Report Heatmap</h2>
          </div>
          <div className="h-48 bg-green-50 rounded-b-lg flex items-center justify-center">
            <p className="text-sm text-gray-400">Kimironko, Kigali — Report Distribution</p>
            {/* TODO: integrate Google Maps heatmap layer for production */}
          </div>
        </div>

        {/* Recent reports table */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-base font-semibold text-gray-800">Recent Reports</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['ID', 'User', 'Location', 'Type', 'Status', 'Date', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.slice(0, 10).map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">R-{r.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {r.user_detail?.full_name?.split(' ')[0] || '—'}{' '}
                      {r.user_detail?.full_name?.split(' ')[1]?.[0]
                        ? r.user_detail.full_name.split(' ')[1][0] + '.'
                        : ''}
                    </td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      {r.latitude?.toFixed(3)}, {r.longitude?.toFixed(3)}
                    </td>
                    <td className="px-4 py-3 capitalize text-gray-700">
                      {r.waste_type.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[r.status]}`}
                      >
                        {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {r.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleVerify(r.id)}
                              className="text-green-600 hover:text-green-700"
                              title="Verify"
                            >
                              ✓
                            </button>
                            <button className="text-red-400 hover:text-red-600" title="Reject">
                              ✕
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
