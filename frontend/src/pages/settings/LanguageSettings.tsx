import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import type { User } from '../../types';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'rw', label: 'Kinyarwanda' },
] as const;

export default function LanguageSettings() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('settings');
  const { user, setUser } = useAuth();

  async function handleSelect(code: 'en' | 'rw') {
    void i18n.changeLanguage(code);
    try {
      const res = await client.patch<User>('/auth/me/', { preferred_language: code });
      setUser(res.data);
      toast.success(t('language_updated'));
    } catch {
      toast.error(t('language_failed'));
    }
  }

  return (
    <div className="pb-24 px-4">
      <div className="py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-slate-100">
          {t('page_language')}
        </h1>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        {LANGUAGES.map((lang, i) => (
          <button
            key={lang.code}
            onClick={() => handleSelect(lang.code)}
            className={`w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left ${
              i < LANGUAGES.length - 1 ? 'border-b border-gray-100 dark:border-slate-700' : ''
            }`}
          >
            <span className="text-sm font-medium text-gray-800 dark:text-slate-200">
              {lang.label}
            </span>
            {(user?.preferred_language ?? 'en') === lang.code && (
              <Check size={18} className="text-green-600" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
