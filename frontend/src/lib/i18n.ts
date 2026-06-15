import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from '../locales/en/common.json';
import enAuth from '../locales/en/auth.json';
import enDashboard from '../locales/en/dashboard.json';
import enReport from '../locales/en/report.json';
import enRewards from '../locales/en/rewards.json';
import enSettings from '../locales/en/settings.json';
import rwCommon from '../locales/rw/common.json';
import rwAuth from '../locales/rw/auth.json';
import rwDashboard from '../locales/rw/dashboard.json';
import rwReport from '../locales/rw/report.json';
import rwRewards from '../locales/rw/rewards.json';
import rwSettings from '../locales/rw/settings.json';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        auth: enAuth,
        dashboard: enDashboard,
        report: enReport,
        rewards: enRewards,
        settings: enSettings,
      },
      rw: {
        common: rwCommon,
        auth: rwAuth,
        dashboard: rwDashboard,
        report: rwReport,
        rewards: rwRewards,
        settings: rwSettings,
      },
    },
    defaultNS: 'common',
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'ptrack-lang',
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;