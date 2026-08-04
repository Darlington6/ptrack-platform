// i18n-ready: see src/locales/{en,rw}/ — AI validation and fraud warning banners included.
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Locate, Loader2, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { Map as GoogleMap, AdvancedMarker } from '@vis.gl/react-google-maps';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import client from '../api/client';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { ImageUpload } from '../components/ImageUpload';
import { GeoConsentModal, getGeoConsent, saveGeoConsent } from '../components/GeoConsentModal';
import { useDebounce } from '../hooks/useDebounce';
import axios from 'axios';
import { enqueueReport } from '../lib/offlineQueue';

const KIGALI_CENTER = { lat: -1.9441, lng: 30.0619 };
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined;

// Module-level reverse-geocode cache (LRU, max 50)
const geocodeCache = new Map<string, string>();

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  if (geocodeCache.has(key)) return geocodeCache.get(key)!;
  try {
    const geocoder = new google.maps.Geocoder();
    const result = await geocoder.geocode({ location: { lat, lng } });
    const addr = result.results[0]?.formatted_address ?? 'Unknown location';
    if (geocodeCache.size >= 50) {
      const firstKey = geocodeCache.keys().next().value;
      if (firstKey) geocodeCache.delete(firstKey);
    }
    geocodeCache.set(key, addr);
    return addr;
  } catch {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

export default function ReportWaste() {
  const navigate = useNavigate();
  const location = useLocation();
  const { refreshUser } = useAuth();
  const qc = useQueryClient();
  const { t, i18n } = useTranslation('report');

  const wasteTypeOptions = [
    { value: 'bottles', label: t('bottles') },
    { value: 'bags', label: t('bags') },
    { value: 'mixed', label: t('mixed') },
    { value: 'other', label: t('other') },
  ];

  const { data: pointConfigs } = useQuery<Record<string, number>>({
    queryKey: ['point-configs'],
    queryFn: () => client.get<Record<string, number>>('/point-configs/').then((r) => r.data),
    staleTime: 60 * 60_000,
    gcTime: 7 * 24 * 60 * 60_000,
  });
  const reportPts = pointConfigs?.['report_submitted'] ?? 10;

  const [markerPos, setMarkerPos] = useState<google.maps.LatLngLiteral>(KIGALI_CENTER);
  const [address, setAddress] = useState('Kigali');
  const [wasteType, setWasteType] = useState('bottles');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showConsent, setShowConsent] = useState(false);

  // AI image validation state
  type AiState =
    | { status: 'idle' }
    | { status: 'analysing' }
    | { status: 'valid'; waste_type: string; confidence: number }
    | { status: 'invalid'; reason: string }
    | { status: 'unavailable' };
  const [aiState, setAiState] = useState<AiState>({ status: 'idle' });
  // Fraud warning codes returned by the pre-submission check (non-blocking)
  const [fraudWarnings, setFraudWarnings] = useState<string[]>([]);
  // True while the description textarea holds AI-generated text (cleared on user edit)
  const [isAiDescription, setIsAiDescription] = useState(false);
  // Keep a ref to the latest image so stale async responses don't clobber newer ones
  const latestImageRef = useRef<File | null>(null);

  async function validateImage(file: File) {
    latestImageRef.current = file;
    setAiState({ status: 'analysing' });
    setFraudWarnings([]);
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('latitude', String(markerPos.lat));
      formData.append('longitude', String(markerPos.lng));
      const res = await client.post<{
        available: boolean;
        is_valid?: boolean;
        invalid_reason?: string;
        waste_type?: string;
        confidence?: number;
        description_en?: string;
        description_rw?: string;
        fraud_warnings?: string[];
      }>('/reports/analyse-image/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      });
      // Ignore if the user already changed the image again
      if (latestImageRef.current !== file) return;
      const data = res.data;
      if (data.fraud_warnings?.length) setFraudWarnings(data.fraud_warnings);
      if (!data.available) {
        setAiState({ status: 'unavailable' });
        return;
      }
      if (!data.is_valid) {
        setAiState({ status: 'invalid', reason: data.invalid_reason ?? t('ai_invalid_title') });
        return;
      }
      setAiState({
        status: 'valid',
        waste_type: data.waste_type ?? 'other',
        confidence: data.confidence ?? 0,
      });
      // Pre-fill waste type from AI suggestion
      if (data.waste_type) setWasteType(data.waste_type);
      // Pre-fill description from AI suggestion (prefer Kinyarwanda if that's the active language)
      const aiDesc = i18n.language === 'rw' ? data.description_rw : data.description_en;
      if (aiDesc) {
        setDescription(aiDesc);
        setIsAiDescription(true);
      }
    } catch {
      if (latestImageRef.current !== file) return;
      setAiState({ status: 'unavailable' });
    }
  }

  // Debounced marker position for geocoding
  const debouncedPos = useDebounce(markerPos, 800);

  // Trigger geocode when debounced position changes
  useEffect(() => {
    void reverseGeocode(debouncedPos.lat, debouncedPos.lng).then(setAddress);
  }, [debouncedPos]);

  function requestGeolocation() {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setMarkerPos(p);
      },
      () => {
        // silently fall back to the default map center
      }
    );
  }

  // Geo consent — run once on mount
  useEffect(() => {
    const consent = getGeoConsent();
    if (consent === 'allowed') requestGeolocation();
    else if (consent === null) setShowConsent(true);
  }, []);

  // Android share target: SW stores the shared image in cache then redirects
  // here with ?shared=true. Re-run whenever search params change.
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('shared') === 'true') {
      void caches.open('ptrack-share-target').then(async (cache) => {
        const response = await cache.match('shared-image');
        if (response) {
          const blob = await response.blob();
          const file = new File([blob], 'shared-image.jpg', { type: blob.type || 'image/jpeg' });
          setImage(file);
          await cache.delete('shared-image');
        }
      });
    }
  }, [location.search]);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!image) {
      toast.error(t('photo_required'));
      return;
    }
    setLoading(true);
    try {
      const payload = {
        latitude: markerPos.lat,
        longitude: markerPos.lng,
        waste_type: wasteType,
        description,
      };

      // If offline, queue locally and show a friendly message
      if (!navigator.onLine) {
        await enqueueReport(payload, image);
        toast.success(t('saved_offline'));
        setTimeout(() => navigate('/dashboard'), 2000);
        return;
      }

      // Online path — POST normally
      const data = new FormData();
      data.append('latitude', String(markerPos.lat));
      data.append('longitude', String(markerPos.lng));
      data.append('waste_type', wasteType);
      data.append('description', description);
      if (image) data.append('image', image);

      try {
        const res = await client.post('/reports/', data, {
          headers: { 'Content-Type': 'multipart/form-data' },
          // Extended to 60s — Gemini analysis at submission adds 2-5s
          timeout: 60000,
        });
        await refreshUser();
        void qc.invalidateQueries({ queryKey: ['leaderboard'] });
        void qc.invalidateQueries({ queryKey: ['sector-rank'] });
        void qc.invalidateQueries({ queryKey: ['notifications', 'unread'] });
        const pts = (res.data as { points_earned?: number }).points_earned ?? 10;
        const bal = (res.data as { new_points_balance?: number }).new_points_balance;
        if (bal !== undefined) {
          toast.success(t('submit_success', { pts, bal }));
        } else {
          toast.success(t('submit_success_no_bal', { pts }));
        }
        setTimeout(() => navigate('/dashboard'), 1500);
      } catch (networkErr) {
        if (axios.isAxiosError(networkErr) && networkErr.response) {
          // API returned an error response — check for AI rejection before generic error
          const errData = networkErr.response.data as { code?: string; detail?: string };
          if (errData.code === 'invalid_image') {
            const reason = errData.detail ?? t('ai_invalid_title');
            setAiState({ status: 'invalid', reason });
            toast.error(reason);
            setLoading(false);
            return;
          }
          toast.error(t('submit_failed'));
          setLoading(false);
          return;
        }
        // True network failure (no response) — queue for offline sync
        await enqueueReport(payload, image);
        toast.success(t('saved_network'));
        setTimeout(() => navigate('/dashboard'), 2000);
      }
    } catch {
      toast.error(t('submit_failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pb-24 max-w-2xl mx-auto">
      {showConsent && (
        <GeoConsentModal
          onAllow={() => {
            setShowConsent(false);
            requestGeolocation();
          }}
          onDeny={() => {
            saveGeoConsent('denied');
            setShowConsent(false);
          }}
          onClose={() => setShowConsent(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 sticky top-0 z-10">
        <button
          onClick={() => navigate(-1)}
          className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-semibold text-gray-800 dark:text-slate-100">{t('title')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-5">
        {/* Map */}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
            {t('pin_location')}
          </p>
          <div
            className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700"
            style={{ height: '220px' }}
          >
            <GoogleMap
              mapId={MAP_ID ?? null}
              defaultCenter={KIGALI_CENTER}
              center={markerPos}
              defaultZoom={15}
              gestureHandling="greedy"
              disableDefaultUI
              zoomControl
              style={{ width: '100%', height: '100%' }}
            >
              <AdvancedMarker
                position={markerPos}
                draggable
                onDragEnd={(e) => {
                  const lat = e.latLng?.lat() ?? markerPos.lat;
                  const lng = e.latLng?.lng() ?? markerPos.lng;
                  setMarkerPos({ lat, lng });
                }}
              />
            </GoogleMap>
          </div>
          {/* Address row */}
          <div className="mt-1.5 flex items-center justify-between gap-2">
            <p className="text-xs text-gray-500 dark:text-slate-400 truncate flex-1">{address}</p>
            <button
              type="button"
              onClick={() => {
                const consent = getGeoConsent();
                if (consent === 'allowed') {
                  requestGeolocation();
                } else {
                  setShowConsent(true);
                }
              }}
              className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 flex-shrink-0"
            >
              <Locate size={12} /> {t('my_location')}
            </button>
          </div>
        </div>

        {/* Image + AI validation */}
        <div className="flex flex-col gap-1">
          <ImageUpload
            value={image}
            onChange={(file) => {
              setImage(file);
              if (file) void validateImage(file);
              else setAiState({ status: 'idle' });
            }}
            maxSizeMB={0.5}
            maxWidthOrHeight={1920}
            label={t('photo')}
          />
          <p className="text-xs text-gray-400 dark:text-slate-500">{t('camera_note')}</p>

          {/* AI validation banner */}
          {aiState.status === 'analysing' && (
            <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-sm">
              <Loader2 size={14} className="animate-spin shrink-0" />
              {t('ai_analysing')}
            </div>
          )}

          {aiState.status === 'valid' && (
            <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400 text-sm">
              <CheckCircle2 size={14} className="shrink-0" />
              <span>
                <Sparkles size={12} className="inline mr-1 opacity-70" />
                {t('ai_detected', {
                  type: aiState.waste_type,
                  pct: Math.round(aiState.confidence * 100),
                })}
              </span>
            </div>
          )}

          {fraudWarnings.length > 0 && aiState.status !== 'analysing' && (
            <div className="mt-2 space-y-1">
              {fraudWarnings.map((code) => (
                <div
                  key={code}
                  className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 text-sm"
                >
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>{t(`fraud_${code}`)}</span>
                </div>
              ))}
            </div>
          )}

          {aiState.status === 'invalid' && (
            <div className="mt-2 px-3 py-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-sm space-y-1">
              <div className="flex items-start gap-2 text-red-700 dark:text-red-400 font-medium">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                <span>{t('ai_invalid_title')}</span>
              </div>
              {aiState.reason && (
                <p className="text-red-600 dark:text-red-500 text-xs pl-5">{aiState.reason}</p>
              )}
              <p className="text-gray-500 dark:text-slate-400 text-xs pl-5 mt-1">
                {t('ai_invalid_contact')}{' '}
                <a
                  href="mailto:d.tunyinko@alustudent.com"
                  className="underline text-green-600 dark:text-green-400"
                >
                  {t('ai_invalid_contact_link')}
                </a>
                .
              </p>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="report-description"
            className="text-sm font-medium text-gray-700 dark:text-slate-300"
          >
            {t('description_label')}
          </label>
          <textarea
            id="report-description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (!e.target.value) setIsAiDescription(false);
            }}
            rows={3}
            placeholder={t('description_placeholder')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100"
          />
          {isAiDescription && (
            <p className="flex items-center gap-1 text-xs text-indigo-500 dark:text-indigo-400">
              <Sparkles size={11} />
              {t('ai_description_hint')}
            </p>
          )}
        </div>

        {/* Waste type */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="report-waste-type"
            className="text-sm font-medium text-gray-700 dark:text-slate-300"
          >
            {t('waste_type')}
          </label>
          <select
            id="report-waste-type"
            value={wasteType}
            onChange={(e) => setWasteType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100"
          >
            {wasteTypeOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading || aiState.status === 'analysing' || aiState.status === 'invalid'}
        >
          {loading
            ? t('submitting')
            : aiState.status === 'analysing'
              ? t('ai_analysing')
              : t('submit_report')}
        </Button>

        <p className="text-center text-sm text-gray-500 dark:text-slate-400">
          {t('points_earn')}{' '}
          <span className="font-semibold text-green-600">{t('pts_label', { pts: reportPts })}</span>{' '}
          {t('points_for')}
        </p>
      </form>
    </div>
  );
}
