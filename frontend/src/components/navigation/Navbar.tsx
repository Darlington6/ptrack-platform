import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { notificationsApi } from '../../api/endpoints/notifications';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

function greetingIcon(): string {
  const h = new Date().getHours();
  if (h < 6 || h >= 21) return '🌙';
  if (h < 12) return '🌅';
  if (h < 17) return '☀️';
  return '🌆';
}

export function Navbar() {
  const { user } = useAuth();
  const networkStatus = useNetworkStatus();
  const firstName = user?.full_name?.split(' ')[0] ?? user?.username ?? 'there';

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      const res = await notificationsApi.list();
      return (res.data.unread_count as number | undefined) ?? 0;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
    enabled: !!user,
  });

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
      <span className="text-xl font-bold text-green-600">pTrack</span>

      <div className="flex items-center gap-3">
        <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-slate-300">
          Hi, {firstName} {greetingIcon()}
        </span>

        <NavLink to="/notifications" className="relative p-1.5">
          <span className="text-xl">🔔</span>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-0.5">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </NavLink>

        <NavLink to="/profile">
          <Avatar
            src={user?.profile_picture}
            name={user?.full_name ?? user?.username ?? 'U'}
            size="sm"
            statusDot={networkStatus}
          />
        </NavLink>
      </div>
    </header>
  );
}
