import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { useThemeStore } from '../../stores/themeStore';
import client from '../../api/client';
import type { User, ThemePreference } from '../../types';

const THEMES: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

export default function ThemeSettings() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { setPreference } = useThemeStore();

  async function handleSelect(theme: ThemePreference) {
    setPreference(theme); // applies to DOM + persists to localStorage
    try {
      const res = await client.patch<User>('/auth/me/', { theme_preference: theme });
      setUser(res.data);
      toast.success('Theme updated.');
    } catch {
      toast.error('Failed to save preference.');
    }
  }

  return (
    <div className="pb-24 px-4">
      <div className="py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-slate-100">Theme</h1>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        {THEMES.map((t, i) => (
          <button
            key={t.value}
            onClick={() => handleSelect(t.value)}
            className={`w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-left ${
              i < THEMES.length - 1 ? 'border-b border-gray-100 dark:border-slate-700' : ''
            }`}
          >
            <span className="text-sm font-medium text-gray-800 dark:text-slate-200">{t.label}</span>
            {(user?.theme_preference ?? 'system') === t.value && (
              <Check size={18} className="text-green-600" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
