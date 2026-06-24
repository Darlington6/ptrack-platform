import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import type { User } from '../../types';
import { useWebPush } from '../../hooks/useWebPush';

const PREFS = [
  {
    key: 'report_notifications',
    label: 'Waste report updates',
    desc: 'Confirm when your report is received or verified',
  },
  {
    key: 'recycling_notifications',
    label: 'Recycling activity',
    desc: 'Confirm when a recycling log is recorded',
  },
  {
    key: 'verification_notifications',
    label: 'Verification bonus',
    desc: 'Alert when an admin verifies your report (+5 pts)',
  },
  { key: 'badge_earned', label: 'Badge earned', desc: 'Celebrate when you earn a badge' },
  { key: 'streak_reminders', label: 'Streak reminders', desc: 'Get reminded to keep your streak' },
  { key: 'weekly_digest', label: 'Weekly digest', desc: 'Summary of your activity each week' },
  { key: 'community_updates', label: 'Community updates', desc: 'News from your sector' },
] as const;

export default function NotificationSettings() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { supported, permission, isSubscribed, isLoading, subscribe, unsubscribe } = useWebPush();

  const prefs: Record<string, boolean> = user?.notification_preferences ?? {
    streak_reminders: true,
    weekly_digest: true,
    community_updates: true,
    badge_earned: true,
    push_enabled: false,
  };

  async function handleToggle(key: string, val: boolean) {
    const updated = { ...prefs, [key]: val };
    try {
      const res = await client.patch<User>('/auth/me/', { notification_preferences: updated });
      setUser(res.data);
    } catch {
      toast.error('Failed to save preference.');
    }
  }

  async function handlePushToggle() {
    if (isSubscribed) {
      await unsubscribe();
      await handleToggle('push_enabled', false);
      toast.success('Push notifications disabled.');
    } else {
      await subscribe();
      if (permission === 'granted') {
        await handleToggle('push_enabled', true);
        toast.success('Push notifications enabled.');
      } else if (permission === 'denied') {
        toast.error('Notifications blocked. Enable them in your browser settings.');
      }
    }
  }

  return (
    <div className="pb-24 px-4">
      <div className="py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-slate-100">Notifications</h1>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        {PREFS.map((p, i) => (
          <label
            key={p.key}
            className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700 ${
              i < PREFS.length - 1 ? 'border-b border-gray-100 dark:border-slate-700' : ''
            }`}
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{p.label}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{p.desc}</p>
            </div>
            <input
              type="checkbox"
              aria-label={p.label}
              checked={prefs[p.key] ?? true}
              onChange={(e) => void handleToggle(p.key, e.target.checked)}
              className="w-5 h-5 accent-green-600 rounded"
            />
          </label>
        ))}
      </div>

      {supported && (
        <div className="mt-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="flex items-center gap-3 p-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800 dark:text-slate-200">
                Push notifications
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                {permission === 'denied'
                  ? 'Blocked in browser — enable in site settings'
                  : 'Nudges and streak alerts even when the app is closed'}
              </p>
            </div>
            <button
              disabled={isLoading || permission === 'denied'}
              onClick={() => void handlePushToggle()}
              aria-label="Toggle push notifications"
              className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-40 ${
                isSubscribed ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  isSubscribed ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
