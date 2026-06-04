import { useEffect, useState } from "react";
import { AdminAvatar } from "../../components/AdminAvatar";
import client from "../../api/client";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [reportCounts, setReportCounts] = useState({});

  useEffect(() => {
    client.get("/leaderboard/").then((r) => setUsers(r.data));
    client.get("/reports/").then((r) => {
      const counts = {};
      r.data.forEach((report) => {
        counts[report.user] = (counts[report.user] || 0) + 1;
      });
      setReportCounts(counts);
    });
  }, []);

  return (
    <div className="flex-1">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Users</h1>
        <AdminAvatar />
      </header>

      <div className="p-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Rank", "Name", "Points", "Reports", "Sector"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">#{u.rank}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                        {(u.full_name || u.username || "U").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{u.full_name}</p>
                        <p className="text-xs text-gray-400">{u.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-amber-500">{u.points}</td>
                  <td className="px-4 py-3 text-gray-700">{reportCounts[u.id] || 0}</td>
                  <td className="px-4 py-3 text-gray-500">{u.sector}</td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400">No users found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
