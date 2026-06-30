import { Link } from 'react-router-dom';
import { Globe, Leaf, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { communityApi } from '../api/endpoints/community';

export default function Landing() {
  const { i18n } = useTranslation();

  const { data: statsData } = useQuery({
    queryKey: ['community', 'stats', 'public'],
    queryFn: () => communityApi.statsPublic(),
    staleTime: 5 * 60_000,
  });
  const stats = statsData?.data;
  const plasticKg = stats?.estimated_plastic_kg ?? 0;
  const plasticDisplay =
    plasticKg >= 1000 ? `${(plasticKg / 1000).toFixed(1)}T` : `${plasticKg.toFixed(0)}kg`;

  const current = i18n.language?.startsWith('rw') ? 'rw' : 'en';

  function toggleLang() {
    const next = current === 'en' ? 'rw' : 'en';
    void i18n.changeLanguage(next);
    localStorage.setItem('ptrack-lang', next);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col">
      {/* Top nav */}
      <nav className="flex items-center justify-between px-6 py-4">
        <span className="text-xl font-bold text-green-600">pTrack</span>
        <button
          onClick={toggleLang}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-300 dark:border-slate-600 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Globe size={14} />
          {current === 'en' ? 'EN' : 'RW'}
        </button>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center -mt-8">
        {/* Coverage badge */}
        <div className="mb-6 px-4 py-1.5 rounded-full border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950 text-sm text-green-700 dark:text-green-400 font-medium">
          Piloting in Kimironko, Kigali
        </div>

        {/* Icon */}
        <div className="mb-5 w-14 h-14 rounded-2xl bg-green-600 flex items-center justify-center shadow-md">
          <Leaf size={28} className="text-white" />
        </div>

        {/* Heading */}
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3 leading-tight">
          Report. Recycle. Reward.
        </h1>

        {/* Subtitle */}
        <p className="text-gray-500 dark:text-slate-400 max-w-xs mb-8 text-base leading-relaxed">
          Help keep cities clean. Earn points for every action.
        </p>

        {/* Community Impact card */}
        <div className="w-full max-w-sm mb-8 bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <Users size={13} /> Community Impact
          </p>
          <div className="flex justify-between text-center">
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {stats ? stats.total_reports.toLocaleString() : '—'}
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Reports Filed</p>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {stats ? stats.active_citizens.toLocaleString() : '—'}
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Active Citizens</p>
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {stats ? plasticDisplay : '—'}
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Plastic Tracked</p>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <Link
            to="/register"
            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold transition-colors text-center text-base flex items-center justify-center gap-2"
          >
            Get Started <span aria-hidden="true">›</span>
          </Link>
          <Link
            to="/login"
            className="w-full py-4 border-2 border-green-600 text-green-600 rounded-2xl font-bold hover:bg-green-50 dark:hover:bg-green-950 transition-colors text-center text-base"
          >
            Login
          </Link>
        </div>
      </main>

      <footer className="text-center py-6 text-gray-400 dark:text-slate-600 text-sm">
        Built for Kigali. For Africa.
      </footer>
    </div>
  );
}
