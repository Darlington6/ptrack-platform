import { NavLink } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { ThemeToggle } from '../theme/ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { useNetworkStore } from '../../stores/networkStore';

interface Props {
  title?: string;
}

export function Navbar({ title }: Props) {
  const { user } = useAuth();
  const networkStatus = useNetworkStore((s) => s.status);
  const name = user?.full_name || user?.username || 'User';

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-2">
        <span className="text-lg font-bold text-green-600">pTrack</span>
        {title && (
          <span className="text-sm text-gray-500 dark:text-slate-400 hidden sm:inline">
            / {title}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <LanguageToggle />
        <ThemeToggle />
        <NavLink
          to="/notifications"
          className="relative p-1.5 text-gray-500 dark:text-slate-400 hover:text-gray-700"
        >
          <Bell size={20} />
        </NavLink>
        <NavLink to="/profile">
          <Avatar src={user?.profile_picture} name={name} size="sm" statusDot={networkStatus} />
        </NavLink>
      </div>
    </header>
  );
}