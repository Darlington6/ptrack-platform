import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt(): Promise<void>;
}

const DISMISSED_KEY = 'ptrack_install_dismissed_at';
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
export const JUST_LOGGED_IN_KEY = 'ptrack_just_logged_in';

// Capture beforeinstallprompt at module load time so it's never missed regardless
// of which component mounts first or how late CitizenLayout renders.
let _prompt: BeforeInstallPromptEvent | null = null;
const _subs = new Set<() => void>();

function notify() {
  _subs.forEach((fn) => fn());
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    _prompt = e as BeforeInstallPromptEvent;
    notify();
  });

  window.addEventListener('appinstalled', () => {
    _prompt = null;
    notify();
  });
}

export function useInstallPrompt() {
  const [, rerender] = useState(0);
  const [isInstalled, setIsInstalled] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches
  );

  useEffect(() => {
    const cb = () => rerender((n) => n + 1);
    _subs.add(cb);
    return () => {
      _subs.delete(cb);
    };
  }, []);

  // On fresh login/register, clear the 7-day snooze so the banner shows immediately.
  const justLoggedIn = sessionStorage.getItem(JUST_LOGGED_IN_KEY) === '1';
  if (justLoggedIn) {
    localStorage.removeItem(DISMISSED_KEY);
    sessionStorage.removeItem(JUST_LOGGED_IN_KEY);
  }

  const promptInstall = useCallback(async () => {
    if (!_prompt) return;
    await _prompt.prompt();
    const { outcome } = await _prompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    _prompt = null;
    notify();
  }, []);

  const dismissInstall = useCallback(() => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    _prompt = null;
    notify();
  }, []);

  const dismissedAt = localStorage.getItem(DISMISSED_KEY);
  const snoozed = dismissedAt !== null && Date.now() - Number(dismissedAt) < DISMISS_COOLDOWN_MS;

  const isInstallable = _prompt !== null && !isInstalled && !snoozed;

  return { isInstallable, isInstalled, promptInstall, dismissInstall };
}
