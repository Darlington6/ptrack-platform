import { useRef, useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, LayoutDashboard, Moon, Sunrise, Sun, Sunset, User, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';
import { ConfirmDialog } from '../feedback/ConfirmDialog';
import { LanguageToggle } from './LanguageToggle';
import { notificationsApi } from '../../api/endpoints/notifications';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

function GreetingIcon() {
  const h = new Date().getHours();
  const cls = 'inline-block align-middle ml-0.5';
  if (h < 6 || h >= 21) return <Moon size={15} className={`${cls} text-indigo-400`} />;
  if (h < 12) return <Sunrise size={15} className={`${cls} text-orange-400`} />;
  if (h < 17) return <Sun size={15} className={`${cls} text-amber-400`} />;
  return <Sunset size={15} className={`${cls} text-orange-500`} />;
}

const PAGE_TITLE_KEYS: Record<string, string> = {
  '/dashboard': 'page_home',
  '/map': 'page_map',
  '/report': 'page_report',
  '/rewards': 'page_rewards',
  '/leaderboard': 'page_leaderboard',
  '/profile': 'page_profile',
  '/notifications': 'page_notifications',
  '/settings': 'page_settings',
  '/settings/account': 'page_account_settings',
  '/settings/security': 'page_security',
  '/settings/language': 'page_language',
  '/settings/theme': 'page_theme',
  '/settings/notifications': 'page_notification_settings',
  '/settings/privacy': 'page_privacy',
  '/settings/data': 'page_data',
  '/activity': 'page_activity',
  '/community': 'page_community',
  '/centres': 'page_centres',
  '/education': 'page_education',
  '/help': 'page_help',
  '/about': 'page_about',
};

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const networkStatus = useNetworkStatus();
  const { t } = useTranslation('nav');
  const firstName = user?.full_name?.split(' ')[0] ?? user?.username ?? '';
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const key = PAGE_TITLE_KEYS[pathname];
  const pageTitle = key
    ? t(key)
    : pathname.startsWith('/reports/')
      ? t('page_report_detail')
      : pathname.startsWith('/education/')
        ? t('page_education')
        : 'pTrack';

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      {/* Mobile: pTrack logo | Desktop: current page title */}
      <span className="text-xl font-bold text-green-600 lg:hidden">pTrack</span>
      <span className="hidden lg:block text-xl font-semibold text-gray-800 dark:text-slate-100">
        {pageTitle}
      </span>

      <div className="flex items-center gap-3">
        <span className="hidden sm:flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-slate-300">
          {firstName ? t('hi_greeting', { name: firstName }) : ''}
          {firstName && <GreetingIcon />}
        </span>

        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-green-200 dark:border-green-800 text-xs font-semibold text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
          >
            <LayoutDashboard size={12} /> {t('admin_panel')}
          </NavLink>
        )}

        <NavLink to="/notifications" className="relative p-1.5">
          <Bell size={20} className="text-gray-600 dark:text-slate-400" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-0.5">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </NavLink>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="hover:opacity-80 transition-opacity"
            aria-label={t('profile_menu')}
          >
            <Avatar
              src={user?.profile_picture}
              name={user?.full_name ?? user?.username ?? 'U'}
              size="sm"
              statusDot={networkStatus}
            />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                <p className="text-sm font-medium text-gray-800 dark:text-slate-100 truncate">
                  {user?.full_name ?? user?.username}
                </p>
                <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/profile');
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                <User size={15} />
                {t('profile_menu')}
              </button>
              <div className="px-4 py-2.5 border-t border-gray-100 dark:border-slate-700">
                <LanguageToggle />
              </div>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmLogout(true);
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-gray-100 dark:border-slate-700"
              >
                <LogOut size={15} />
                {t('logout')}
              </button>
            </div>
          )}
        </div>

        <ConfirmDialog
          isOpen={confirmLogout}
          onClose={() => setConfirmLogout(false)}
          onConfirm={() => {
            logout();
            navigate('/');
          }}
          title={t('logout_title')}
          message={t('logout_message')}
          confirmLabel={t('logout')}
        />
      </div>
    </header>
  );
}