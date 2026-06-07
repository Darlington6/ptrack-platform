import { NavLink } from "react-router-dom";
import { LayoutDashboard, FileText, Users, BarChart2, Settings, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/admin/reports", icon: FileText, label: "Reports" },
  { to: "/admin/users", icon: Users, label: "Users" },
  { to: "#", icon: BarChart2, label: "Analytics" },
  { to: "#", icon: Settings, label: "Settings" },
];

export function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col fixed top-0 left-0 z-30">
      <div className="px-6 py-5 border-b border-gray-200">
        <span className="text-xl font-bold text-green-600">pTrack</span>
        <p className="text-xs text-gray-500 mt-0.5">Admin Portal</p>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-3">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={label}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-green-50 text-green-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-6">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
