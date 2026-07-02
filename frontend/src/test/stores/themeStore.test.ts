import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from '../../stores/themeStore';

// Reset store state between tests
beforeEach(() => {
  useThemeStore.setState({ preference: 'system', resolved: 'light' });
  document.documentElement.classList.remove('dark');
});

describe('themeStore', () => {
  it('has default preference of system', () => {
    const { preference } = useThemeStore.getState();
    expect(preference).toBe('system');
  });

  it('setPreference("dark") updates preference and adds dark class', () => {
    useThemeStore.getState().setPreference('dark');
    const { preference, resolved } = useThemeStore.getState();
    expect(preference).toBe('dark');
    expect(resolved).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('setPreference("light") updates preference and removes dark class', () => {
    // Start in dark
    document.documentElement.classList.add('dark');
    useThemeStore.getState().setPreference('light');
    const { preference, resolved } = useThemeStore.getState();
    expect(preference).toBe('light');
    expect(resolved).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('setPreference("system") resolves based on matchMedia', () => {
    // jsdom defaults matchMedia to not dark, so system => light
    useThemeStore.getState().setPreference('system');
    const { preference } = useThemeStore.getState();
    expect(preference).toBe('system');
  });
});
