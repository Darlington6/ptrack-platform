import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import * as Sentry from '@sentry/react';
import App from './App';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  tracesSampleRate: 1.0,
  release: import.meta.env.VITE_APP_VERSION,
  environment: import.meta.env.MODE,
  // To disable sending user data, uncomment the line below. For more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/react/configuration/options/#dataCollection
  // dataCollection: { userInfo: false }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
