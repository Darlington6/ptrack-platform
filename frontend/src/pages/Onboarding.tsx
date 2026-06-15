import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

const SLIDES = [
  {
    bg: 'bg-green-50 dark:bg-green-950',
    icon: '👋',
    title: 'Welcome to pTrack!',
    body: "Kigali's first citizen-led plastic waste tracking platform. Together, we can make a real difference.",
  },
  {
    bg: 'bg-amber-50 dark:bg-amber-950',
    icon: '⭐',
    title: 'Earn points for every action',
    body: 'Report waste (+10 pts), log recycling (+15 pts), get verified (+5 bonus). Points unlock rewards and badges.',
  },
  {
    bg: 'bg-blue-50 dark:bg-blue-950',
    icon: '🏆',
    title: 'Climb the leaderboard',
    body: 'Compete with neighbours in your sector. Top citizens unlock exclusive badges and community recognition.',
  },
  {
    bg: 'bg-purple-50 dark:bg-purple-950',
    icon: '🚀',
    title: 'Ready to get started?',
    body: 'Start your first report and earn 10 points right now. Kigali is counting on you!',
  },
] as const;

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [slide, setSlide] = useState(0);

  async function finishOnboarding() {
    try {
      await client.patch('/auth/me/', { has_completed_onboarding: true });
      if (user) {
        setUser({ ...user, has_completed_onboarding: true });
      }
    } catch {
      // non-fatal
    }
    navigate('/dashboard');
  }

  function handleNext() {
    if (slide < SLIDES.length - 1) {
      setSlide((s) => s + 1);
    } else {
      void finishOnboarding();
    }
  }

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center px-6 transition-colors duration-500 ${SLIDES[slide].bg}`}
    >
      {/* Icon */}
      <span className="text-6xl mb-8 select-none" aria-hidden="true">
        {SLIDES[slide].icon}
      </span>

      {/* Text */}
      <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 text-center mb-3 leading-snug">
        {SLIDES[slide].title}
      </h1>
      <p className="text-gray-600 dark:text-slate-400 text-center text-base leading-relaxed max-w-sm">
        {SLIDES[slide].body}
      </p>

      {/* Progress dots */}
      <div className="flex items-center gap-2 mt-10 mb-8">
        {SLIDES.map((_, i) => (
          <div
            key={i}
            className={`transition-all duration-300 rounded-full ${
              i === slide ? 'w-6 h-2 bg-green-600' : 'w-2 h-2 bg-gray-300 dark:bg-slate-600'
            }`}
          />
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={handleNext}
        className="w-full max-w-sm bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-2xl text-base flex items-center justify-center gap-2 transition-colors"
      >
        {slide < SLIDES.length - 1 ? (
          <>
            Next <ChevronRight size={18} />
          </>
        ) : (
          'Get Started'
        )}
      </button>

      {/* Skip link */}
      {slide < SLIDES.length - 1 && (
        <button
          onClick={() => void finishOnboarding()}
          className="mt-4 text-sm text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Skip
        </button>
      )}
    </div>
  );
}
