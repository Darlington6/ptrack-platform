import { useEffect, useState } from "react";
import { AdminAvatar } from "../../components/AdminAvatar";
import client from "../../api/client";
import type { WasteReportDetail } from "../../types";

const STATUS_BADGE = {
  pending: "bg-yellow-100 text-yellow-800",
  verified: "bg-green-100 text-green-800",
  resolved: "bg-blue-100 text-blue-800",
};

export default function AdminReports() {
  const [reports, setReports] = useState<WasteReportDetail[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const params = statusFilter !== "all" ? { status: statusFilter } : {};
    client.get("/reports/", { params }).then((r) => setReports(r.data));
  }, [statusFilter]);

  async function handleVerify(id) {
    await client.patch(`/reports/${id}/verify/`);
    const params = statusFilter !== "all" ? { status: statusFilter } : {};
    client.get("/reports/", { params }).then((r) => setReports(r.data));
  }

  const filtered = search
    ? reports.filter(
        (r) =>
          r.user_detail?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
          r.user_detail?.email?.toLowerCase().includes(search.toLowerCase())
      )
    : reports;

  return (
    <div className="flex-1">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-800">Reports</h1>
        <AdminAvatar />
      </header>

      <div className="p-6">
        {/* Filters */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <input
            type="text"
            placeholder="Search by user name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 w-64"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["ID", "User", "Type", "Description", "Status", "Date", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">#{r.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {r.user_detail?.full_name || r.user_detail?.email || "—"}
                  </td>
                  <td className="px-4 py-3 capitalize">{r.waste_type.replace("_", " ")}</td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{r.description || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[r.status]}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {r.status === "pending" && (
                        <button
                          onClick={() => handleVerify(r.id)}
                          className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
                        >
                          Verify
                        </button>
                      )}
                      {r.status === "pending" && (
                        <button className="text-xs border border-red-300 text-red-600 px-3 py-1 rounded hover:bg-red-50 transition-colors">
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">No reports found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
