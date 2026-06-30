import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Hand, Star, Trophy, Rocket } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

interface Slide {
  bg: string;
  icon: ReactNode;
  title: string;
  body: string;
}

function buildSlides(report: number, recycling: number, bonus: number): Slide[] {
  return [
    {
      bg: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)',
      icon: <Hand size={56} className="text-green-700" />,
      title: 'Welcome to pTrack!',
      body: "Kigali's first citizen-led plastic waste tracking platform. Together, we can make a real difference.",
    },
    {
      bg: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
      icon: <Star size={56} className="text-amber-500" />,
      title: 'Earn points for every action',
      body: `Report waste (+${report} pts), log recycling (+${recycling} pts), get verified (+${bonus} bonus). Points unlock rewards and badges.`,
    },
    {
      bg: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
      icon: <Trophy size={56} className="text-blue-500" />,
      title: 'Climb the leaderboard',
      body: 'Compete with neighbours in your sector. Top citizens unlock exclusive badges and community recognition.',
    },
    {
      bg: 'linear-gradient(135deg, #FDF4FF, #FAE8FF)',
      icon: <Rocket size={56} className="text-purple-600" />,
      title: 'Ready to get started?',
      body: `Start your first report and earn ${report} points right now. Kigali is counting on you!`,
    },
  ];
}

const SLIDE_COUNT = 4;

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [slide, setSlide] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: ptData } = useQuery({
    queryKey: ['point-configs'],
    queryFn: () => client.get<Record<string, number>>('/point-configs/'),
    staleTime: 10 * 60_000,
  });

  const pts = ptData?.data ?? {};
  const slides = buildSlides(
    pts.report_submitted ?? 5,
    pts.recycling_logged ?? 5,
    pts.verification_bonus ?? 10
  );

  function resetTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSlide((s) => (s + 1) % SLIDE_COUNT);
    }, 3000);
  }

  useEffect(() => {
    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  async function finishOnboarding() {
    if (timerRef.current) clearInterval(timerRef.current);
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
    resetTimer();
    if (slide < SLIDE_COUNT - 1) {
      setSlide((s) => s + 1);
    } else {
      void finishOnboarding();
    }
  }

  const currentSlide = slides[slide]!;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: currentSlide.bg, transition: 'background 0.5s ease' }}
    >
      {/* Icon */}
      <div className="mb-8 select-none" aria-hidden="true">
        {currentSlide.icon}
      </div>

      {/* Text */}
      <h1 className="text-2xl font-bold text-gray-900 text-center mb-3 leading-snug">
        {currentSlide.title}
      </h1>
      <p className="text-gray-600 text-center text-base leading-relaxed max-w-sm">
        {currentSlide.body}
      </p>

      {/* Progress dots */}
      <div className="flex items-center gap-2 mt-10 mb-8">
        {slides.map((_, i) => (
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
        {slide < SLIDE_COUNT - 1 ? (
          <>
            Next <ChevronRight size={18} />
          </>
        ) : (
          'Get Started'
        )}
      </button>

      {/* Skip link */}
      {slide < SLIDE_COUNT - 1 && (
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
