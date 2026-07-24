// i18n-ready: see src/locales/{en,rw}/
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Locate } from 'lucide-react';
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
  const { t } = useTranslation('report');

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
          timeout: 15000,
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
          // API returned an error response — don't queue, show error
          toast.error(t('submit_failed'));
          setLoading(false);
          return;
        }
        // True network failure — queue for offline sync
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

        {/* Image */}
        <div className="flex flex-col gap-1">
          <ImageUpload
            value={image}
            onChange={setImage}
            maxSizeMB={0.5}
            maxWidthOrHeight={1920}
            label={t('photo')}
          />
          <p className="text-xs text-gray-400 dark:text-slate-500">{t('camera_note')}</p>
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
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder={t('description_placeholder')}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100"
          />
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

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? t('submitting') : t('submit_report')}
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
