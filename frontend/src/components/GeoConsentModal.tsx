import { createPortal } from 'react-dom';
import { MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const STORAGE_KEY = 'ptrack_geo_consent';

export type GeoConsent = 'allowed' | 'denied' | null;

export function getGeoConsent(): GeoConsent {
  const val = localStorage.getItem(STORAGE_KEY);
  if (val === 'allowed' || val === 'denied') return val as GeoConsent;
  return null;
}

export function saveGeoConsent(consent: 'allowed' | 'denied') {
  localStorage.setItem(STORAGE_KEY, consent);
}

interface Props {
  onAllow: () => void;
  onDeny: () => void;
  onClose: () => void;
}

export function GeoConsentModal({ onAllow, onDeny, onClose }: Props) {
  const { t } = useTranslation('common');
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <button
        type="button"
        aria-label={t('close')}
        className="absolute inset-0 bg-black/40 cursor-default"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
            <MapPin size={20} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {t('geo_title')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400">{t('geo_subtitle')}</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-slate-300">{t('geo_body')}</p>
        <div className="flex gap-3">
          <button
            onClick={() => {
              saveGeoConsent('denied');
              onDeny();
            }}
            className="flex-1 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            {t('geo_not_now')}
          </button>
          <button
            onClick={() => {
              saveGeoConsent('allowed');
              onAllow();
            }}
            className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold"
          >
            {t('geo_allow')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}