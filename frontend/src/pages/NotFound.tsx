import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-green-600 mb-4">404</p>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-2">Page not found</h1>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-8">
        The page you're looking for doesn't exist.
      </p>
      <Link
        to="/dashboard"
        className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
      >
        Go home
      </Link>
    </div>
  );
}
