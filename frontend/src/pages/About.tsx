import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function About() {
  const navigate = useNavigate();

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
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">About pTrack</h1>
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
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Our mission</h2>
        <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
          pTrack helps Kigali citizens track, report, and reduce plastic waste in their
          neighbourhoods. By combining community reporting with gamified recycling incentives, we
          aim to make environmental accountability a daily habit — one point at a time.
        </p>
      </div>

      {/* ALU capstone context */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 space-y-1">
        <p className="text-sm font-semibold text-green-800 dark:text-green-300">
          ALU Capstone Project
        </p>
        <p className="text-sm text-green-700 dark:text-green-400 leading-relaxed">
          pTrack was developed as a final-year BSc Software Engineering capstone at the African
          Leadership University (ALU). It pilots a digital incentive model to drive measurable
          behavioural change in plastic waste management — grounding the research in the lived
          reality of Kimironko Sector, Gasabo District, Kigali.
        </p>
      </div>

      {/* Coverage info */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
          Piloting in Kimironko, Kigali
        </p>
        <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
          pTrack is currently piloting with residents of Kimironko Sector, Gasabo District. The
          platform is designed to scale across all of Kigali — and eventually Rwanda — as the
          programme expands.
        </p>
      </div>

      <p className="text-center text-xs text-gray-400 dark:text-slate-600">
        MIT License · &copy; {new Date().getFullYear()} pTrack
      </p>
    </div>
  );
}
