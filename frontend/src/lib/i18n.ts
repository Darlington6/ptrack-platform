// i18n-ready: see src/locales/{en,rw}/
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enLanding from '../locales/en/landing.json';
import enNav from '../locales/en/nav.json';
import enEducation from '../locales/en/education.json';
import enCommon from '../locales/en/common.json';
import enAuth from '../locales/en/auth.json';
import enDashboard from '../locales/en/dashboard.json';
import enSettings from '../locales/en/settings.json';
import enReport from '../locales/en/report.json';
import enRewards from '../locales/en/rewards.json';
import enLeaderboard from '../locales/en/leaderboard.json';
import enActivity from '../locales/en/activity.json';
import enNotifications from '../locales/en/notifications.json';
import enProfile from '../locales/en/profile.json';
import enMap from '../locales/en/map.json';
import enCentres from '../locales/en/centres.json';
import enOnboarding from '../locales/en/onboarding.json';
import enImpact from '../locales/en/impact.json';
import enAbout from '../locales/en/about.json';
import enRecycling from '../locales/en/recycling.json';
import enReportDetail from '../locales/en/report_detail.json';
import enTerms from '../locales/en/terms.json';
import enPrivacy from '../locales/en/privacy.json';

import rwLanding from '../locales/rw/landing.json';
import rwNav from '../locales/rw/nav.json';
import rwEducation from '../locales/rw/education.json';
import rwCommon from '../locales/rw/common.json';
import rwAuth from '../locales/rw/auth.json';
import rwDashboard from '../locales/rw/dashboard.json';
import rwSettings from '../locales/rw/settings.json';
import rwReport from '../locales/rw/report.json';
import rwRewards from '../locales/rw/rewards.json';
import rwLeaderboard from '../locales/rw/leaderboard.json';
import rwActivity from '../locales/rw/activity.json';
import rwNotifications from '../locales/rw/notifications.json';
import rwProfile from '../locales/rw/profile.json';
import rwMap from '../locales/rw/map.json';
import rwCentres from '../locales/rw/centres.json';
import rwOnboarding from '../locales/rw/onboarding.json';
import rwImpact from '../locales/rw/impact.json';
import rwAbout from '../locales/rw/about.json';
import rwRecycling from '../locales/rw/recycling.json';
import rwReportDetail from '../locales/rw/report_detail.json';
import rwTerms from '../locales/rw/terms.json';
import rwPrivacy from '../locales/rw/privacy.json';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        landing: enLanding,
        nav: enNav,
        education: enEducation,
        common: enCommon,
        auth: enAuth,
        dashboard: enDashboard,
        settings: enSettings,
        report: enReport,
        rewards: enRewards,
        leaderboard: enLeaderboard,
        activity: enActivity,
        notifications: enNotifications,
        profile: enProfile,
        map: enMap,
        centres: enCentres,
        onboarding: enOnboarding,
        impact: enImpact,
        about: enAbout,
        recycling: enRecycling,
        report_detail: enReportDetail,
        terms: enTerms,
        privacy: enPrivacy,
      },
      rw: {
        landing: rwLanding,
        nav: rwNav,
        education: rwEducation,
        common: rwCommon,
        auth: rwAuth,
        dashboard: rwDashboard,
        settings: rwSettings,
        report: rwReport,
        rewards: rwRewards,
        leaderboard: rwLeaderboard,
        activity: rwActivity,
        notifications: rwNotifications,
        profile: rwProfile,
        map: rwMap,
        centres: rwCentres,
        onboarding: rwOnboarding,
        impact: rwImpact,
        about: rwAbout,
        recycling: rwRecycling,
        report_detail: rwReportDetail,
        terms: rwTerms,
        privacy: rwPrivacy,
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
