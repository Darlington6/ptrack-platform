import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ThemePreference } from '../api/types';

type ResolvedTheme = 'light' | 'dark';

interface ThemeState {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (p: ThemePreference) => void;
  hydrate: () => void;
}

function getSystemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(resolved: ResolvedTheme): void {
  const html = document.documentElement;
  if (resolved === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) {
    meta.content = resolved === 'dark' ? '#0f172a' : '#ffffff';
  }
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      preference: 'system',
      resolved: 'light',

      setPreference: (preference) => {
        const resolved: ResolvedTheme = preference === 'system' ? getSystemTheme() : preference;
        applyTheme(resolved);
        set({ preference, resolved });
      },

      hydrate: () => {
        // Read directly from localStorage — persist middleware rehydrates async,
        // so get().preference would still be the default 'system' at call time.
        let preference: ThemePreference = 'system';
        try {
          const raw = localStorage.getItem('ptrack-theme');
          if (raw) {
            const parsed = JSON.parse(raw) as { state?: { preference?: ThemePreference } };
            preference = parsed?.state?.preference ?? 'system';
          }
        } catch {
          // ignore
        }
        const resolved: ResolvedTheme = preference === 'system' ? getSystemTheme() : preference;
        applyTheme(resolved);
        set({ preference, resolved });

        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => {
          if (get().preference === 'system') {
            const r = getSystemTheme();
            applyTheme(r);
            set({ resolved: r });
          }
        };
        mq.addEventListener('change', handler);
      },
    }),
    {
      name: 'ptrack-theme',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ preference: state.preference }),
    }
  )
);
