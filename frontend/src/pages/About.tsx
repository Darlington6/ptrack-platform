import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Leaf } from 'lucide-react';

const TECH_STACK = [
  { label: 'React 19', color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
  {
    label: 'TypeScript',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  {
    label: 'Tailwind v4',
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  },
  {
    label: 'Django 5',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  {
    label: 'PostgreSQL',
    color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  },
  {
    label: 'Recharts',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  },
  {
    label: 'React Query v5',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
  {
    label: 'Simple JWT',
    color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  },
];

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
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Leaf size={32} className="text-green-600 dark:text-green-400" />
        </div>
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
          pTrack was built as a final-year capstone project at the African Leadership University
          (ALU), Kigali campus. It addresses Rwanda's ongoing challenge of plastic pollution in
          urban neighbourhoods by giving every citizen a direct, measurable way to contribute.
        </p>
      </div>

      {/* Pilot info */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4">
        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
          🚀 Pilot — Kimironko, Kigali
        </p>
        <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">
          The current pilot is limited to the Kimironko sector. We plan to expand to all 35 Kigali
          sectors based on pilot feedback and adoption metrics.
        </p>
      </div>

      {/* Tech stack */}
      <div className="space-y-2">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Built with</h2>
        <div className="flex flex-wrap gap-2">
          {TECH_STACK.map(({ label, color }) => (
            <span key={label} className={`text-xs font-medium px-3 py-1 rounded-full ${color}`}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* GitHub link */}
      <a
        href="https://github.com/Darlington6/ptrack-platform"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
      >
        <ExternalLink size={16} /> View source on GitHub
      </a>

      <p className="text-center text-xs text-gray-400 dark:text-slate-600">
        MIT License · © {new Date().getFullYear()} pTrack
      </p>
    </div>
  );
}
