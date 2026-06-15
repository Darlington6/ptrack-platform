import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import type { Reward } from '../types';

const BADGES = [
  { emoji: '🌱', name: 'Sprout', desc: 'First report', threshold: 1 },
  { emoji: '🌿', name: 'Recycler', desc: '10 reports', threshold: 10 },
  { emoji: '🌳', name: 'Eco-Warrior', desc: '50 reports', threshold: 50 },
  { emoji: '🏆', name: 'Champion', desc: '100 reports', threshold: 100 },
];

const REWARD_LABELS: Record<string, string> = {
  report_submitted: 'Waste Report Submitted',
  recycling_logged: 'Recycling Activity Logged',
  verification_bonus: 'Verification Bonus',
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function Rewards() {
  const { user } = useAuth();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [reportCount, setReportCount] = useState(0);

  useEffect(() => {
    client.get('/rewards/me/').then((r) => setRewards(r.data.results?.rewards || []));
    client
      .get('/reports/', { params: { user: 'me' } })
      .then((r) => setReportCount(r.data.count || 0));
  }, []);

  const points = user?.points ?? 0;
  const nextMilestone = [100, 250, 500, 1000].find((m) => m > points) ?? 1000;
  const progress = Math.min((points / nextMilestone) * 100, 100);

  return (
    <div className="pb-24 px-4">
      <div className="py-4">
        <h1 className="text-lg font-semibold text-gray-800">Your Rewards</h1>
      </div>

      {/* Points card */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-5">
        <div className="flex items-start justify-between mb-1">
          <p className="text-sm text-gray-500">Total Points</p>
          <Star size={20} className="text-amber-400 fill-amber-400" />
        </div>
        <p className="text-4xl font-bold text-green-600 mb-3">{points}</p>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Progress to next badge</span>
          <span>{nextMilestone - points} points needed</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Badges */}
      <h2 className="text-base font-semibold text-gray-800 mb-3">Badges</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {BADGES.map((badge) => {
          const earned = reportCount >= badge.threshold;
          return (
            <div
              key={badge.name}
              className={`rounded-lg border p-4 text-center transition-all ${
                earned
                  ? 'border-green-200 bg-white'
                  : 'border-gray-200 bg-gray-50 opacity-60 grayscale'
              }`}
            >
              <p className="text-3xl mb-1">{badge.emoji}</p>
              <p className={`text-sm font-semibold ${earned ? 'text-gray-800' : 'text-gray-500'}`}>
                {badge.name}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 capitalize">{badge.desc}</p>
              {earned && <p className="text-xs text-green-600 font-medium mt-1">Earned ✓</p>}
            </div>
          );
        })}
      </div>

      {/* Activity history */}
      <h2 className="text-base font-semibold text-gray-800 mb-3">Activity History</h2>
      {rewards.length === 0 ? (
        <p className="text-center text-gray-500 text-sm py-6">No activity yet.</p>
      ) : (
        <div className="space-y-0 bg-white rounded-lg border border-gray-200 divide-y divide-gray-100 mb-4">
          {rewards.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {REWARD_LABELS[r.reward_type] || r.reward_type}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(r.date_earned)}</p>
              </div>
              <span className="text-sm font-bold text-green-600">+{r.points_earned}</span>
            </div>
          ))}
        </div>
      )}

      {/* Partnership notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-2">
        <span className="text-amber-500 text-base mt-0.5">💡</span>
        <p className="text-sm text-amber-800">
          Rewards can be redeemed once partnerships are confirmed
        </p>
      </div>
    </div>
  );
}
