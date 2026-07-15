import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Static about page — content driven by the 'about' i18n namespace
export default function About() {
  const navigate = useNavigate();
  const { t } = useTranslation('about');

  return (
    <div className="px-4 pt-4 pb-24 max-w-lg mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 dark:text-slate-400"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
      </div>

      {/* App identity */}
      <div className="flex items-center gap-4">
        <img
          src="/icons/icon-192.png"
          alt="pTrack"
          className="w-16 h-16 rounded-2xl flex-shrink-0"
        />
        <div>
          <p className="text-2xl font-extrabold text-gray-900 dark:text-white">pTrack</p>
          <p className="text-sm text-gray-500 dark:text-slate-400">v1.0.0-pilot · MIT License</p>
        </div>
      </div>

      {/* Mission */}
      <div className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">
          {t('mission_title')}
        </h2>
        <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
          {t('mission_body')}
        </p>
      </div>

      {/* ALU capstone context */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 space-y-1">
        <p className="text-sm font-semibold text-green-800 dark:text-green-300">
          {t('capstone_title')}
        </p>
        <p className="text-sm text-green-700 dark:text-green-400 leading-relaxed">
          {t('capstone_body')}
        </p>
      </div>

      {/* Coverage info */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
          {t('pilot_title')}
        </p>
        <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
          {t('pilot_body')}
        </p>
      </div>

      <p className="text-center text-xs text-gray-400 dark:text-slate-600">
        {t('version', { year: new Date().getFullYear() })}
      </p>
    </div>
  );
}
