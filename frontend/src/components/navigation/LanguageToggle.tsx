import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'rw', label: 'Kinyarwanda' },
] as const;

type LangCode = 'en' | 'rw';

export function LanguageToggle() {
  const { i18n } = useTranslation();
  const { user } = useAuth();

  async function setLang(code: LangCode) {
    await i18n.changeLanguage(code);
    localStorage.setItem('ptrack-lang', code);
    if (user) {
      try {
        await client.patch('/auth/me/', { preferred_language: code });
      } catch {
        // non-fatal
      }
    }
  }

  const current = (i18n.language?.startsWith('rw') ? 'rw' : 'en') as LangCode;

  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-1">
        <Languages size={15} className="text-gray-500 dark:text-slate-400" />
        <select
          value={current}
          onChange={(e) => void setLang(e.target.value as LangCode)}
          className="text-xs text-gray-600 dark:text-slate-300 bg-transparent border-none outline-none cursor-pointer"
        >
          {LANGS.map((l) => (
            <option key={l.code} value={l.code}>
              {l.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
