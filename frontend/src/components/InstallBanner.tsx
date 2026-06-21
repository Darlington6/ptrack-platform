import { Download, X } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

export function InstallBanner() {
  const { isInstallable, promptInstall, dismissInstall } = useInstallPrompt();

  if (!isInstallable) return null;

  return (
    <div className="mx-4 mb-3 flex items-center gap-3 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3">
      <Download size={20} className="text-green-600 dark:text-green-400 flex-shrink-0" />
      <p className="flex-1 text-sm text-green-800 dark:text-green-300">
        Install pTrack for offline access and quick reports.
      </p>
      <button
        onClick={() => void promptInstall()}
        className="text-xs font-semibold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors"
      >
        Install
      </button>
      <button
        onClick={dismissInstall}
        aria-label="Dismiss install banner"
        className="text-green-500 hover:text-green-700 dark:hover:text-green-300 flex-shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  );
}
