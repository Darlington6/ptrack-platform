import { useThemeStore } from '../stores/themeStore';

export function useTheme() {
  return useThemeStore();
}
