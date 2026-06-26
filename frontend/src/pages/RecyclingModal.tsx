import { useState } from 'react';
import { X, Recycle } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import client from '../api/client';
import { enqueueRecycling } from '../lib/offlineQueue';

const ACTIVITY_TYPES = [
  { value: 'drop_off', label: 'Drop-off at centre' },
  { value: 'pickup', label: 'Community pickup' },
  { value: 'exchange', label: 'Plastic exchange' },
  { value: 'other', label: 'Other activity' },
] as const;

const INPUT_CLS =
  'w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500';

interface Props {
  onClose: () => void;
}

export default function RecyclingModal({ onClose }: Props) {
  const qc = useQueryClient();
  const [activityType, setActivityType] = useState<string>('drop_off');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: pointConfigs } = useQuery<Record<string, number>>({
    queryKey: ['point-configs'],
    queryFn: () => client.get<Record<string, number>>('/point-configs/').then((r) => r.data),
    staleTime: 60_000,
  });

  const recyclingPts = pointConfigs?.['recycling_logged'] ?? 15;

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setLoading(true);
    const payload = { activity_type: activityType, note: note || undefined };
    try {
      if (!navigator.onLine) {
        await enqueueRecycling(payload);
        toast.success("Saved offline — will sync automatically when you're back online.");
        onClose();
        return;
      }
      const res = await client.post<{ points_earned?: number }>('/recycling/', payload);
      const earned = res.data.points_earned ?? recyclingPts;
      toast.success(`+${earned} points! Recycling activity logged.`);
      void qc.invalidateQueries({ queryKey: ['rewards'] });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
      void qc.invalidateQueries({ queryKey: ['notifications', 'unread'] });
      onClose();
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 429) {
        const msg =
          (err.response.data as { detail?: string }).detail ??
          "You've already logged a recycling activity today. Come back tomorrow!";
        toast.error(msg);
        setLoading(false);
        return;
      }
      await enqueueRecycling(payload);
      toast.success("Saved — will sync when you're back online.");
      onClose();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm shadow-xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
              <Recycle size={16} className="text-green-600" />
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Log Recycling</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label
              htmlFor="recycling-activity-type"
              className="block text-sm font-semibold text-gray-800 dark:text-slate-200 mb-1"
            >
              Activity Type
            </label>
            <select
              id="recycling-activity-type"
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className={`${INPUT_CLS} bg-white dark:bg-slate-700`}
            >
              {ACTIVITY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="recycling-note"
              className="block text-sm font-semibold text-gray-800 dark:text-slate-200 mb-1"
            >
              Note <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              id="recycling-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="e.g. Dropped off 3 bags at Kimironko centre"
              className={`${INPUT_CLS} resize-none`}
            />
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl px-4 py-2.5 flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-slate-300">Points earned</span>
            <span className="text-base font-bold text-green-600">+{recyclingPts} pts</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Logging…' : 'Log Activity'}
          </button>
        </form>
      </div>
    </div>
  );
}
