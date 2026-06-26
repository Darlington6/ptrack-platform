import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  Trophy,
  Bell,
  Settings,
  HelpCircle,
  Info,
  LogOut,
  ChevronRight,
  MapPin,
  Share2,
  Pencil,
  Recycle,
  BookOpen,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useAuth } from '../context/AuthContext';
import { Avatar } from '../components/ui/Avatar';
import { ConfirmDialog } from '../components/feedback/ConfirmDialog';
import { AvatarUploadModal } from '../components/AvatarUploadModal';
import client from '../api/client';
import type { ImpactSummary } from '../types';

function formatDate(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-RW', { month: 'short', year: 'numeric' });
}

const MENU = [
  { icon: Activity, label: 'My Activity', to: '/activity' },
  { icon: Trophy, label: 'My Achievements', to: '/rewards' },
  { icon: Recycle, label: 'Recycling Centres', to: '/centres' },
  { icon: BookOpen, label: 'Recycling Tips & Education', to: '/education' },
  { icon: Bell, label: 'Notifications', to: '/notifications' },
  { icon: Settings, label: 'Settings', to: '/settings' },
  { icon: HelpCircle, label: 'Help & Support', to: '/help' },
  { icon: Info, label: 'About pTrack', to: '/about' },
] as const;

export default function Profile() {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const networkStatus = useNetworkStatus();

  const [reportsCount, setReportsCount] = useState(0);
  const [recyclingCount, setRecyclingCount] = useState(0);
  const [impact, setImpact] = useState<ImpactSummary | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [showDeleteAvatarConfirm, setShowDeleteAvatarConfirm] = useState(false);

  useEffect(() => {
    client
      .get<{ count?: number; length?: number }>('/reports/', { params: { user: 'me' } })
      .then((r) => setReportsCount(r.data.count ?? 0))
      .catch(() => null);

    client
      .get<{ results?: unknown[] }>('/recycling/')
      .then((r) => setRecyclingCount(r.data.results?.length ?? 0))
      .catch(() => null);

    client
      .get<ImpactSummary>('/auth/me/impact/')
      .then((r) => setImpact(r.data))
      .catch(() => null);
  }, []);

  function handleLogout() {
    logout();
    navigate('/');
  }

  async function handleDeleteAvatar() {
    try {
      await client.delete('/auth/me/avatar/');
      setUser({ ...user!, profile_picture: null });
      toast.success('Profile photo removed.');
    } catch {
      toast.error('Failed to remove photo.');
    }
    setShowDeleteAvatarConfirm(false);
  }

  const stats = [
    { label: 'Reports', value: String(reportsCount) },
    { label: 'Recycling', value: String(recyclingCount) },
    { label: 'Points', value: String(user?.points ?? 0) },
    { label: 'Badges', value: '0' },
    { label: 'Streak', value: `${user?.current_streak ?? 0}d` },
  ];

  return (
    <div className="pb-24">
      {/* Header */}
      <div>
        <div className="bg-green-600 h-28" />
        <div className="mx-4 -mt-12 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-5">
          <div className="flex items-end gap-4 -mt-14 mb-3">
            <div className="relative">
              <Avatar
                src={user?.profile_picture}
                name={user?.full_name ?? user?.username ?? 'U'}
                size="lg"
                statusDot={networkStatus}
              />
              <button
                onClick={() => setShowAvatarModal(true)}
                className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center shadow"
                aria-label="Change photo"
              >
                <Pencil size={11} />
              </button>
              {!!user?.profile_picture && (
                <button
                  onClick={() => setShowDeleteAvatarConfirm(true)}
                  className="absolute bottom-0 left-0 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow"
                  aria-label="Remove photo"
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
            <div className="pb-1">
              <p className="font-bold text-gray-900 dark:text-slate-100 text-lg leading-tight">
                {user?.full_name ?? user?.username}
              </p>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {user?.email?.startsWith('phone_') ? user?.phone_number : user?.email}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
            <MapPin size={12} /> {user?.sector} · Joined {formatDate(user?.created_at ?? '')}
          </p>
          {user?.bio && (
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-2">{user.bio}</p>
          )}
        </div>
      </div>

      {/* Stats grid */}
      <div className="mx-4 mt-4">
        <div className="grid grid-cols-3 gap-2 mb-2">
          {stats.slice(0, 3).map((s) => (
            <div
              key={s.label}
              className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-3 text-center"
            >
              <p className="text-xl font-bold text-green-600">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {stats.slice(3).map((s) => (
            <div
              key={s.label}
              className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-3 text-center"
            >
              <p className="text-xl font-bold text-green-600">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Impact card */}
      {impact && (
        <div className="mx-4 mt-4 bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800">
          <p className="text-sm font-semibold text-green-800 dark:text-green-300 mb-1">
            Your Environmental Impact
          </p>
          <p className="text-sm text-green-700 dark:text-green-400">
            You've helped prevent ~<span className="font-bold">{impact.plastic_kg}kg</span> of
            plastic from reaching Kigali's drainage.
          </p>
          <button
            onClick={() => {
              const text = `I've helped prevent ~${impact.plastic_kg}kg of plastic from reaching Kigali's drainage using pTrack!`;
              if (navigator.share) {
                void navigator.share({
                  title: 'My pTrack Impact',
                  text,
                  url: window.location.origin,
                });
              } else {
                void navigator.clipboard
                  .writeText(text)
                  .then(() => toast.success('Impact copied to clipboard!'));
              }
            }}
            className="mt-3 text-xs font-medium text-green-600 flex items-center gap-1 hover:underline"
          >
            <Share2 size={12} /> Share my impact
          </button>
        </div>
      )}

      {/* Menu */}
      <div className="mx-4 mt-4 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        {MENU.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-slate-700 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            <item.icon size={18} className="text-gray-500 dark:text-slate-400" />
            <span className="flex-1 text-sm font-medium text-gray-800 dark:text-slate-200">
              {item.label}
            </span>
            <ChevronRight size={16} className="text-gray-400" />
          </NavLink>
        ))}

        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="flex items-center gap-3 p-4 w-full text-left hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
        >
          <LogOut size={18} className="text-red-500" />
          <span className="text-sm font-medium text-red-600">Logout</span>
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 mt-6 pb-2">
        pTrack v1.0.0 · Built for Kigali.
      </p>

      {/* Logout confirm */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Logout"
        message="Are you sure you want to log out?"
        confirmLabel="Logout"
      />

      {/* Delete avatar confirm */}
      <ConfirmDialog
        isOpen={showDeleteAvatarConfirm}
        onClose={() => setShowDeleteAvatarConfirm(false)}
        onConfirm={() => void handleDeleteAvatar()}
        title="Remove photo"
        message="This will permanently remove your profile photo."
        confirmLabel="Remove"
      />

      {/* Avatar upload */}
      <AvatarUploadModal
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onSuccess={(url) => {
          if (user) setUser({ ...user, profile_picture: url });
        }}
      />
    </div>
  );
}
