import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './lib/i18n';
import { initSentry } from './lib/sentry';
import { useThemeStore } from './stores/themeStore';
import App from './App';

initSentry();
// Hydrate theme before first render to avoid flash
useThemeStore.getState().hydrate();

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

createRoot(rootEl).render(
  <StrictMode>
    <App />
  </StrictMode>
);