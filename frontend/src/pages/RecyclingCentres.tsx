import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Phone, Clock, ExternalLink } from 'lucide-react';
import { recyclingCentresApi } from '../api/endpoints/recyclingCentres';
import type { RecyclingCentre } from '../api/types';

const MATERIALS = ['All', 'PET', 'HDPE', 'Glass', 'Paper', 'Metal', 'Electronics'];

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
  const dist =
    userLat !== null && userLon !== null
      ? haversineKm(userLat, userLon, centre.latitude, centre.longitude)
      : null;

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${centre.latitude},${centre.longitude}`;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{centre.name}</h3>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{centre.address}</p>
        </div>
        {dist !== null && (
          <span className="text-xs font-medium text-green-600 dark:text-green-400 flex-shrink-0">
            {dist < 1 ? `${(dist * 1000).toFixed(0)} m` : `${dist.toFixed(1)} km`}
          </span>
        )}
      </div>

      {/* Materials */}
      {centre.accepted_materials.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {centre.accepted_materials.slice(0, 5).map((m) => (
            <span
              key={m}
              className="text-[10px] font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full"
            >
              {m}
            </span>
          ))}
        </div>
      )}

      {/* Hours + phone */}
      <div className="space-y-1">
        {centre.operating_hours['weekdays'] && (
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
            <Clock size={11} /> {centre.operating_hours['weekdays']}
          </p>
        )}
        {centre.contact_phone && (
          <p className="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
            <Phone size={11} /> {centre.contact_phone}
          </p>
        )}
      </div>

      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
      >
        <ExternalLink size={14} /> Get Directions
      </a>
    </div>
  );
}

export default function RecyclingCentres() {
  const [materialFilter, setMaterialFilter] = useState('All');
  const [userPos, setUserPos] = useState<{ lat: number; lon: number } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['recycling-centres', materialFilter],
    queryFn: () =>
      recyclingCentresApi.list(materialFilter !== 'All' ? { material: materialFilter } : undefined),
    staleTime: 10 * 60_000,
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
    <div className="px-4 pt-4 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Recycling Centres</h1>
        <button
          onClick={requestLocation}
          className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400"
        >
          <MapPin size={13} /> Near me
        </button>
      </div>

      {/* Material filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {MATERIALS.map((m) => (
          <button
            key={m}
            onClick={() => setMaterialFilter(m)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              materialFilter === m
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && sorted.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-slate-400 text-sm">
          No centres found for the selected material.
        </div>
      )}

      <div className="space-y-3">
        {sorted.map((c) => (
          <CentreCard
            key={c.id}
            centre={c}
            userLat={userPos?.lat ?? null}
            userLon={userPos?.lon ?? null}
          />
        ))}
      </div>
    </div>
  );
}
