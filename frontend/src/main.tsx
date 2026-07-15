// i18n-ready: see src/locales/{en,rw}/
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './lib/i18n'; // must be imported before App to initialise react-i18next
import { Toaster } from 'sonner';
import { initSentry } from './lib/sentry';
import { useThemeStore } from './stores/themeStore';
import App from './App';

initSentry();
useThemeStore.getState().hydrate();

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

createRoot(rootEl).render(
  <StrictMode>
    <Toaster position="top-right" richColors duration={5000} />
    <App />
  </StrictMode>
);
