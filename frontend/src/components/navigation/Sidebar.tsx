import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart2,
  Settings,
  LogOut,
  Building2,
  BookOpen,
  Trophy,
  ScrollText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/reports', icon: FileText, label: 'Reports', end: false },
  { to: '/admin/users', icon: Users, label: 'Users', end: false },
  { to: '/admin/analytics', icon: BarChart2, label: 'Analytics', end: false },
  { to: '/admin/audit-log', icon: ScrollText, label: 'Audit Log', end: false },
  { to: '/admin/centres', icon: Building2, label: 'Centres', end: false },
  { to: '/admin/education', icon: BookOpen, label: 'Education', end: false },
  { to: '/admin/rewards', icon: Trophy, label: 'Reward Config', end: false },
  { to: '/admin/settings', icon: Settings, label: 'Settings', end: false },
] as const;

export function Sidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    void navigate('/');
  }

  return (
    <aside className="w-64 min-h-screen bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex flex-col fixed top-0 left-0 z-30">
      <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-700">
        <span className="text-xl font-bold text-green-600">pTrack</span>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Admin Portal</p>
      </div>
      <nav className="flex-1 py-4 space-y-0.5 px-3 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={label}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800'
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
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}