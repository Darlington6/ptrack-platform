import { NavLink } from 'react-router-dom';
import { User, Lock, Globe, Sun, Bell, Eye, Database, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ITEMS = [
  { icon: User, label: 'Account', desc: 'Name, email, phone', to: '/settings/account' },
  { icon: Lock, label: 'Security', desc: 'Password, sessions', to: '/settings/security' },
  { icon: Globe, label: 'Language', desc: 'English / Kinyarwanda', to: '/settings/language' },
  { icon: Sun, label: 'Theme', desc: 'Light / Dark / System', to: '/settings/theme' },
  { icon: Bell, label: 'Notifications', desc: 'Alerts and digests', to: '/settings/notifications' },
  { icon: Eye, label: 'Privacy', desc: 'Leaderboard, public reports', to: '/settings/privacy' },
  {
    icon: Database,
    label: 'Data & Privacy',
    desc: 'Export or delete account',
    to: '/settings/data',
  },
] as const;

export default function Settings() {
  const { t } = useTranslation('settings');

  return (
    <div className="pb-24 px-4">
      <div className="py-4">
        <h1 className="text-lg font-bold text-gray-900 dark:text-slate-100">{t('title')}</h1>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        {ITEMS.map((item, i) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={`flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
              i < ITEMS.length - 1 ? 'border-b border-gray-100 dark:border-slate-700' : ''
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <item.icon size={18} className="text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{item.label}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500">{item.desc}</p>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </NavLink>
        ))}
      </div>
    </div>
  );
}
