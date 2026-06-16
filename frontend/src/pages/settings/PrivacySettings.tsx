import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import type { User } from '../../types';

export default function PrivacySettings() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  async function handleToggle(field: 'show_on_leaderboard' | 'allow_public_reports', val: boolean) {
    try {
      const res = await client.patch<User>('/auth/me/', { [field]: val });
      setUser(res.data);
      toast.success('Saved');
    } catch {
      toast.error('Failed to save.');
    }
  }

  const TOGGLES = [
    {
      field: 'show_on_leaderboard' as const,
      label: 'Show on leaderboard',
      desc: 'Let your sector see your points ranking',
      value: user?.show_on_leaderboard ?? true,
    },
    {
      field: 'allow_public_reports' as const,
      label: 'Allow public reports',
      desc: 'Your waste reports appear on the public map',
      value: user?.allow_public_reports ?? true,
    },
  ];

  return (
    <div className="pb-24 px-4">
      <div className="py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-slate-100">Privacy</h1>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        {TOGGLES.map((t, i) => (
          <label
            key={t.field}
            className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 ${
              i < TOGGLES.length - 1 ? 'border-b border-gray-100 dark:border-slate-700' : ''
            }`}
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{t.label}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{t.desc}</p>
            </div>
            <input
              type="checkbox"
              aria-label={t.label}
              checked={t.value}
              onChange={(e) => handleToggle(t.field, e.target.checked)}
              className="w-5 h-5 accent-green-600 rounded"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
