import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Recycle, Trophy, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import client from '../api/client';
import RecyclingModal from './RecyclingModal';
import type { Reward } from '../types';

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const REWARD_LABELS: Record<string, string> = {
  report_submitted: 'Waste Report',
  recycling_logged: 'Recycling Activity',
  verification_bonus: 'Verification Bonus',
};

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [showRecycling, setShowRecycling] = useState(false);

  useEffect(() => {
    client.get('/rewards/me/').then((r) => setRewards(r.data.results?.rewards || []));
    client.get('/leaderboard/').then((r) => {
      const entry = r.data.find((u: { id: number; rank: number }) => u.id === user?.id);
      if (entry) setRank(entry.rank);
    });
  }, [user?.id]);

  return (
    <div className="pb-24">
      {/* Points card */}
      <div className="bg-gradient-to-br from-green-600 to-green-800 text-white px-6 py-8 mx-4 mt-4 rounded-lg">
        <p className="text-green-100 text-sm font-medium">Your Points</p>
        <p className="text-5xl font-bold mt-1">{user?.points ?? 0}</p>
        {rank && <p className="text-green-200 text-sm mt-2">Rank #{rank} in Kimironko</p>}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3 px-4 mt-4">
        <button
          onClick={() => navigate('/report')}
          className="flex flex-col items-center gap-2 bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow text-sm font-medium text-gray-700"
        >
          <MapPin size={24} className="text-green-600" />
          Report Waste
        </button>
        <button
          onClick={() => setShowRecycling(true)}
          className="flex flex-col items-center gap-2 bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow text-sm font-medium text-gray-700"
        >
          <Recycle size={24} className="text-green-600" />
          Log Recycling
        </button>
        <button
          onClick={() => navigate('/leaderboard')}
          className="flex flex-col items-center gap-2 bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow text-sm font-medium text-gray-700"
        >
          <Trophy size={24} className="text-amber-500" />
          Leaderboard
        </button>
      </div>

      {/* Recent activity */}
      <div className="px-4 mt-6">
        <h2 className="text-base font-semibold text-gray-800 mb-3">Recent Activity</h2>
        {rewards.length === 0 ? (
          <Card className="p-6 text-center text-gray-500 text-sm">
            No activity yet — submit your first report!
          </Card>
        ) : (
          <div className="space-y-2">
            {rewards.slice(0, 5).map((r) => (
              <Card key={r.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Star size={14} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {REWARD_LABELS[r.reward_type] || r.reward_type}
                    </p>
                    <p className="text-xs text-gray-500">{timeAgo(r.date_earned)}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-amber-500">+{r.points_earned} pts</span>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* # Uncomment the button below to test Sentry error tracking by throwing a test error when clicked. Make sure to have your Sentry DSN configured in the .env file for this to work. */}
      {/* <button
        onClick={() => {
          throw new Error("This is my first Sentry error!");
        }}
        className="bg-red-600 text-white px-4 py-2 rounded"
      >
        Test Sentry
    </button> */}

      {showRecycling && (
        <RecyclingModal
          onClose={() => setShowRecycling(false)}
          onSuccess={() => {
            setShowRecycling(false);
            refreshUser();
            client.get('/rewards/me/').then((r) => setRewards(r.data.results?.rewards || []));
          }}
        />
      )}
    </div>
  );
}
