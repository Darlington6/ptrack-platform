import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import type { ThemePreference } from '../../api/types';

const CYCLE: ThemePreference[] = ['light', 'dark', 'system'];
const ICONS = { light: Sun, dark: Moon, system: Monitor };
const LABELS = { light: 'Light', dark: 'Dark', system: 'System' };

export function ThemeToggle() {
  const { preference, setPreference } = useThemeStore();
  const Icon = ICONS[preference];

  function cycle() {
    const idx = CYCLE.indexOf(preference);
    const next = CYCLE[(idx + 1) % CYCLE.length] ?? 'system';
    setPreference(next);
  }

  return (
    <button
      onClick={cycle}
      title={`Theme: ${LABELS[preference]}`}
      className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-sm"
    >
      <Icon size={16} />
      <span className="hidden sm:inline">{LABELS[preference]}</span>
    </button>
  );
}
