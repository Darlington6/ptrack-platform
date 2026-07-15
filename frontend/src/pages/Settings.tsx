import { NavLink, useNavigate } from 'react-router-dom';
import { User, Lock, Globe, Sun, Bell, Eye, Database, ChevronRight, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Settings() {
  const navigate = useNavigate();
  const { t } = useTranslation('settings');

  const ITEMS = [
    { icon: User, label: t('account'), desc: t('account_desc'), to: '/settings/account' },
    { icon: Lock, label: t('security'), desc: t('security_desc'), to: '/settings/security' },
    { icon: Globe, label: t('language'), desc: t('language_desc'), to: '/settings/language' },
    { icon: Sun, label: t('theme'), desc: t('theme_desc'), to: '/settings/theme' },
    {
      icon: Bell,
      label: t('notifications'),
      desc: t('notifications_desc'),
      to: '/settings/notifications',
    },
    { icon: Eye, label: t('privacy'), desc: t('privacy_desc'), to: '/settings/privacy' },
    { icon: Database, label: t('data'), desc: t('data_desc'), to: '/settings/data' },
  ] as const;

  return (
    <div className="pb-24 px-4">
      <div className="py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-slate-400">
          <ArrowLeft size={20} />
        </button>
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
