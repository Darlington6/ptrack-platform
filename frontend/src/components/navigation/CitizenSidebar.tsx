import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Map, Camera, Gift, User, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ConfirmDialog } from '../feedback/ConfirmDialog';
import { getQueueStats } from '../../lib/offlineQueue';

const NAV_ITEMS = [
  { to: '/dashboard', icon: Home, label: 'Home', end: true },
  { to: '/map', icon: Map, label: 'Map', end: false },
  { to: '/report', icon: Camera, label: 'Report', end: false },
  { to: '/rewards', icon: Gift, label: 'Rewards', end: false },
  { to: '/profile', icon: User, label: 'Profile', end: false },
] as const;

export function CitizenSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    async function checkQueue() {
      try {
        const stats = await getQueueStats();
        if (mounted) setPendingCount(stats.reports + stats.recycling);
      } catch {
        // IndexedDB not available
      }
    }

    void checkQueue();

    const onUpdate = () => void checkQueue();
    window.addEventListener('online', onUpdate);
    window.addEventListener('queue-flushed', onUpdate);

    return () => {
      mounted = false;
      window.removeEventListener('online', onUpdate);
      window.removeEventListener('queue-flushed', onUpdate);
    };
  }, []);

  function handleLogout() {
    logout();
    void navigate('/');
  }

  return (
    <aside className="hidden lg:flex w-64 min-h-screen bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 flex-col fixed top-0 left-0 z-30">
      <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-700">
        <span className="text-xl font-bold text-green-600">pTrack</span>
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
            <div className="relative">
              <Icon size={18} />
              {label === 'Report' && pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 flex items-center justify-center rounded-full bg-amber-500 text-white text-[9px] font-bold leading-none px-0.5">
                  {pendingCount > 9 ? '9+' : String(pendingCount)}
                </span>
              )}
            </div>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-6">
        <button
          onClick={() => setConfirmLogout(true)}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>

      <ConfirmDialog
        isOpen={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        onConfirm={handleLogout}
        title="Logout"
        message="Are you sure you want to log out?"
        confirmLabel="Logout"
      />
    </aside>
  );
}