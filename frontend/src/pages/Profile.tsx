import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, Bell, Shield, HelpCircle, LogOut, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import client from "../api/client";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [reportCount, setReportCount] = useState(0);
  const [activityCount, setActivityCount] = useState(0);

  useEffect(() => {
    client.get("/reports/", { params: { user: "me" } }).then((r) => setReportCount(r.data.length));
    client.get("/recycling/").then((r) => setActivityCount(r.data.length));
  }, []);

  const initials = (user?.full_name || user?.username || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  function handleLogout() {
    logout();
    navigate("/");
  }

  const MENU_ITEMS = [
    { icon: Activity, label: "My Activity", action: () => navigate("/rewards") },
    { icon: Bell, label: "Notifications", action: () => {} },
    { icon: Shield, label: "Privacy Settings", action: () => {} },
    { icon: HelpCircle, label: "Help & Support", action: () => {} },
  ];

  return (
    <div className="pb-24 px-4">
      {/* Profile header */}
      <div className="flex flex-col items-center py-8">
        <div className="w-20 h-20 rounded-full bg-green-600 text-white flex items-center justify-center text-2xl font-bold mb-3 shadow">
          {initials}
        </div>
        <h1 className="text-xl font-bold text-gray-900">{user?.full_name || user?.username}</h1>
        <p className="text-sm text-gray-500">{user?.email}</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Reports", value: reportCount },
          { label: "Recycling Logs", value: activityCount },
          { label: "Points", value: user?.points ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-lg border border-gray-200 p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Menu */}
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 mb-4">
        {MENU_ITEMS.map(({ icon: Icon, label, action }) => (
          <button
            key={label}
            onClick={action}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
          >
            <Icon size={18} className="text-gray-500" />
            <span className="flex-1 text-sm font-medium text-gray-700">{label}</span>
            <ChevronRight size={16} className="text-gray-400" />
          </button>
        ))}
      </div>

      {/* Logout — separate card to match Figma */}
      <div className="bg-white rounded-lg border border-gray-200">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-red-600 hover:bg-red-50 transition-colors rounded-lg"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>

      {/* Version footer — matches Figma */}
      <p className="text-center text-xs text-gray-400 mt-6">
        pTrack v1.0.0<br />Built for Kigali. For Africa.
      </p>
    </div>
  );
}