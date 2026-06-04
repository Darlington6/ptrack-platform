import { Link } from "react-router-dom";
import { Leaf } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 w-16 h-16 rounded-2xl bg-green-600 flex items-center justify-center shadow-lg">
          <Leaf size={32} className="text-white" />
        </div>

        <h1 className="text-6xl font-bold text-green-600 mb-3 tracking-tight">pTrack</h1>

        <p className="text-2xl font-bold text-gray-900 mb-4">
          Report. Recycle. Reward.
        </p>

        <p className="text-gray-500 max-w-sm mb-10 text-base leading-relaxed">
          Help keep cities clean. Earn points for every action - report plastic
          waste, log recycling activities, and climb the leaderboard.
        </p>

        {/* Stacked full-width CTAs matching Figma */}
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <Link
            to="/register"
            className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors text-center text-base"
          >
            Get Started
          </Link>
          <Link
            to="/login"
            className="w-full py-3 border-2 border-green-600 text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors text-center text-base"
          >
            Login
          </Link>
        </div>
      </main>

      <footer className="text-center py-6 text-gray-400 text-sm">
        Built for Kigali. For Africa.
      </footer>
    </div>
  );
}