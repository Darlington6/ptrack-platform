import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import client from "../api/client";
import type { WasteReportDetail } from "../types";

const STATUS_COLORS = {
  pending: "bg-yellow-400",
  verified: "bg-green-500",
  resolved: "bg-blue-500",
};

const STATUS_BADGE = {
  pending: "bg-yellow-100 text-yellow-800",
  verified: "bg-green-100 text-green-800",
  resolved: "bg-blue-100 text-blue-800",
};

const FILTERS = ["All", "pending", "verified", "resolved"];

export default function MapView() {
  const [reports, setReports] = useState<WasteReportDetail[]>([]);
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    const params = filter !== "All" ? { status: filter } : {};
    client.get("/reports/", { params }).then((r) => setReports(r.data));
  }, [filter]);

  return (
    <div className="pb-24">
      <div className="px-4 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-lg font-semibold text-gray-800">Waste Reports Near You</h1>
      </div>

      {/* Placeholder map */}
      <div className="relative mx-4 mt-4 h-64 rounded-lg overflow-hidden bg-gray-200 border border-gray-300">
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
          <MapPin size={36} className="text-green-600 mb-2" />
          <p className="text-sm font-medium">Map — Kimironko, Kigali</p>
          <p className="text-xs text-gray-400">Google Maps / Leaflet integration goes here</p>
        </div>
        {/* Simulated pins */}
        {reports.slice(0, 6).map((r, i) => (
          <div
            key={r.id}
            className={`absolute w-4 h-4 rounded-full border-2 border-white ${STATUS_COLORS[r.status]}`}
            style={{
              top: `${20 + (i * 37) % 70}%`,
              left: `${15 + (i * 43) % 70}%`,
            }}
            title={r.waste_type}
          />
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 px-4 mt-4 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "All" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="px-4 mt-4 space-y-3">
        {reports.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-8">No reports found.</p>
        )}
        {reports.map((r) => (
          <div key={r.id} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-800 capitalize">{r.waste_type.replace("_", " ")}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[r.status]}`}>
                {r.status}
              </span>
            </div>
            {r.description && <p className="text-xs text-gray-500 mb-1">{r.description}</p>}
            <p className="text-xs text-gray-400">
              {new Date(r.created_at).toLocaleDateString()} — {r.user_detail?.full_name || "Citizen"}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
