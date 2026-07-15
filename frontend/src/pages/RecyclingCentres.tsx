import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ExternalLink,
  List,
  Map as MapIcon,
  ArrowLeft,
  ChevronRight,
} from 'lucide-react';
import { Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import { useTranslation } from 'react-i18next';
import { recyclingCentresApi } from '../api/endpoints/recyclingCentres';
import { Spinner } from '../components/ui/Spinner';
import type { RecyclingCentre } from '../api/types';

const KIGALI_CENTER = { lat: -1.9441, lng: 30.0619 };
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined;

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type TDist = (key: string, opts?: { dist: string }) => string;

function formatDist(km: number, t: TDist): string {
  return km < 1
    ? t('dist_m', { dist: (km * 1000).toFixed(0) })
    : t('dist_km', { dist: km.toFixed(1) });
}

const MATERIAL_KEY_MAP: Record<string, string> = {
  PET: 'mat_pet',
  HDPE: 'mat_hdpe',
  PP: 'mat_pp',
  'Plastic bottles': 'mat_plastic_bottles',
  Cardboard: 'mat_cardboard',
  Glass: 'mat_glass',
  Metal: 'mat_metal',
  'E-waste': 'mat_ewaste',
  Organic: 'mat_organic',
  Paper: 'mat_paper',
  Textiles: 'mat_textiles',
};

function isOpenNow(centre: RecyclingCentre): boolean | null {
  if (!centre.open_time || !centre.close_time) return null;
  const tz = centre.timezone || 'Africa/Kigali';
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(new Date());
  const h = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const m = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0');
  const nowMin = h * 60 + m;
  const hhmm = (t: string) => {
    const [th, tm] = t.split(':').map(Number);
    return (th ?? 0) * 60 + (tm ?? 0);
  };
  return nowMin >= hhmm(centre.open_time) && nowMin < hhmm(centre.close_time);
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const ampm = (h ?? 0) >= 12 ? 'pm' : 'am';
  const h12 = (h ?? 0) % 12 || 12;
  return m ? `${h12}:${String(m).padStart(2, '0')}${ampm}` : `${h12}${ampm}`;
}

function CentreCard({
  centre,
  userLat,
  userLon,
}: {
  centre: RecyclingCentre;
  userLat: number | null;
  userLon: number | null;
}) {
  const { t } = useTranslation('centres');
  const dist =
    userLat !== null && userLon !== null
      ? haversineKm(userLat, userLon, centre.latitude, centre.longitude)
      : null;
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${centre.latitude},${centre.longitude}`;
  const openStatus = isOpenNow(centre);

  const hoursLabel =
    centre.open_time && centre.close_time
      ? `${formatTime(centre.open_time)} – ${formatTime(centre.close_time)}`
      : (centre.operating_hours['weekdays'] ?? null);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{centre.name}</h3>
            {openStatus === null ? null : openStatus ? (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                {t('open')}
              </span>
            ) : (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                {t('closed')}
              </span>
            )}
          </div>
          {dist !== null && (
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              {formatDist(dist, t as TDist)}
            </p>
          )}
        </div>
        <ChevronRight
          size={16}
          className="text-gray-400 dark:text-slate-500 flex-shrink-0 mt-0.5"
        />
      </div>

      <div className="space-y-1.5">
        {centre.address && (
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
            <MapPin size={11} className="flex-shrink-0" /> {centre.address}
          </p>
        )}
        {hoursLabel && (
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
            <Clock size={11} className="flex-shrink-0" /> {hoursLabel}
          </p>
        )}
        {centre.contact_phone && (
          <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1.5 font-medium">
            <Phone size={11} className="flex-shrink-0" /> {centre.contact_phone}
          </p>
        )}
        {centre.contact_email && (
          <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1.5 font-medium">
            <Mail size={11} className="flex-shrink-0" /> {centre.contact_email}
          </p>
        )}
      </div>

      {centre.accepted_materials.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {centre.accepted_materials.map((m) => (
            <span
              key={m}
              className="text-[10px] font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 px-2 py-0.5 rounded-full"
            >
              {MATERIAL_KEY_MAP[m] ? t(MATERIAL_KEY_MAP[m]!) : m}
            </span>
          ))}
        </div>
      )}

      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
      >
        <ExternalLink size={14} /> {t('get_directions')}
      </a>
    </div>
  );
}

export default function RecyclingCentres() {
  const navigate = useNavigate();
  const { t } = useTranslation('centres');
  const [materialFilter, setMaterialFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [userPos, setUserPos] = useState<{ lat: number; lon: number } | null>(null);
  const [selectedCentre, setSelectedCentre] = useState<RecyclingCentre | null>(null);

  const MATERIALS: { value: string; label: string }[] = [
    { value: 'All', label: t('mat_all') },
    { value: 'Plastic bottles', label: t('mat_plastic_bottles') },
    { value: 'Cardboard', label: t('mat_cardboard') },
    { value: 'Glass', label: t('mat_glass') },
    { value: 'Metal', label: t('mat_metal') },
    { value: 'E-waste', label: t('mat_ewaste') },
    { value: 'Organic', label: t('mat_organic') },
    { value: 'Paper', label: t('mat_paper') },
    { value: 'Textiles', label: t('mat_textiles') },
  ];

  const { data, isLoading } = useQuery({
    queryKey: ['recycling-centres', materialFilter],
    queryFn: () =>
      recyclingCentresApi.list(materialFilter !== 'All' ? { material: materialFilter } : undefined),
    staleTime: 0,
  });

  const centres: RecyclingCentre[] = data?.data ?? [];

  function requestLocation() {
    navigator.geolocation.getCurrentPosition((pos) =>
      setUserPos({ lat: pos.coords.latitude, lon: pos.coords.longitude })
    );
  }

  const sorted = userPos
    ? [...centres].sort(
        (a, b) =>
          haversineKm(userPos.lat, userPos.lon, a.latitude, a.longitude) -
          haversineKm(userPos.lat, userPos.lon, b.latitude, b.longitude)
      )
    : centres;

  return (
    <div className="flex flex-col h-full pb-24">
      <div className="px-4 pt-4 pb-2 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="text-gray-500 dark:text-slate-400">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('title')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={requestLocation}
              className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400"
            >
              <MapPin size={13} /> {t('near_me')}
            </button>
            <div className="flex rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1.5 ${viewMode === 'list' ? 'bg-green-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400'}`}
              >
                <List size={14} />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-2.5 py-1.5 ${viewMode === 'map' ? 'bg-green-600 text-white' : 'bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400'}`}
              >
                <MapIcon size={14} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {MATERIALS.map((m) => (
            <button
              key={m.value}
              onClick={() => setMaterialFilter(m.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                materialFilter === m.value
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {!isLoading && sorted.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-slate-400 text-sm px-4">
          {t('no_centres')}
        </div>
      )}

      {viewMode === 'map' && !isLoading && (
        <div
          className="mx-4 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700"
          style={{ height: '400px' }}
        >
          <Map
            mapId={MAP_ID ?? null}
            defaultCenter={userPos ? { lat: userPos.lat, lng: userPos.lon } : KIGALI_CENTER}
            defaultZoom={13}
            gestureHandling="greedy"
            disableDefaultUI
            zoomControl
            style={{ width: '100%', height: '100%' }}
          >
            {sorted.map((c) => (
              <AdvancedMarker
                key={c.id}
                position={{ lat: c.latitude, lng: c.longitude }}
                onClick={() => setSelectedCentre(c)}
              />
            ))}
            {selectedCentre && (
              <InfoWindow
                position={{ lat: selectedCentre.latitude, lng: selectedCentre.longitude }}
                onCloseClick={() => setSelectedCentre(null)}
              >
                <div className="text-sm min-w-[180px] space-y-1.5">
                  <p className="font-semibold text-gray-800">{selectedCentre.name}</p>
                  <p className="text-xs text-gray-500">{selectedCentre.address}</p>
                  {selectedCentre.accepted_materials.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedCentre.accepted_materials.slice(0, 4).map((m) => (
                        <span
                          key={m}
                          className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full"
                        >
                          {MATERIAL_KEY_MAP[m] ? t(MATERIAL_KEY_MAP[m]!) : m}
                        </span>
                      ))}
                    </div>
                  )}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedCentre.latitude},${selectedCentre.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center text-xs font-semibold text-green-700 hover:underline mt-2"
                  >
                    {t('get_directions_arrow')}
                  </a>
                </div>
              </InfoWindow>
            )}
          </Map>
        </div>
      )}

      {viewMode === 'list' && !isLoading && (
        <div className="px-4 mt-2 space-y-3">
          {sorted.map((c) => (
            <CentreCard
              key={c.id}
              centre={c}
              userLat={userPos?.lat ?? null}
              userLon={userPos?.lon ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
