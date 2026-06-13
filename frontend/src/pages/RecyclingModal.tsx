import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import client from '../api/client';
import { Button } from '../components/ui/Button';

const ACTIVITY_TYPES = [
  { value: 'drop_off', label: 'Drop Off' },
  { value: 'pickup', label: 'Pickup' },
  { value: 'exchange', label: 'Exchange' },
  { value: 'other', label: 'Other' },
];

interface RecyclingModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function RecyclingModal({ onClose, onSuccess }: RecyclingModalProps) {
  const [activityType, setActivityType] = useState('drop_off');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await client.post('/recycling/', { activity_type: activityType });
      onSuccess();
    } catch {
      setError('Failed to log activity.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Log Recycling Activity</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">Activity Type</label>
            <select
              value={activityType}
              onChange={(e) => setActivityType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {ACTIVITY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <p className="text-sm text-gray-500">
            You will earn <span className="font-semibold text-green-600">+15 points</span> for this
            activity.
          </p>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Logging…' : 'Log Activity'}
          </Button>
        </form>
      </div>
    </div>
  );
}
