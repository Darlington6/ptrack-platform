import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Locate } from 'lucide-react';
import { Map as GoogleMap, AdvancedMarker } from '@vis.gl/react-google-maps';
import client from '../api/client';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { ImageUpload } from '../components/ImageUpload';
import { GeoConsentModal, getGeoConsent, saveGeoConsent } from '../components/GeoConsentModal';
import { useDebounce } from '../hooks/useDebounce';

const KIMIRONKO = { lat: -1.9441, lng: 30.0619 };
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined;

const WASTE_TYPES = [
  { value: 'bottles', label: 'Plastic bottles' },
  { value: 'bags', label: 'Plastic bags' },
  { value: 'mixed', label: 'Mixed plastic' },
  { value: 'other', label: 'Other' },
];

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
  const { refreshUser } = useAuth();

  const [markerPos, setMarkerPos] = useState<google.maps.LatLngLiteral>(KIMIRONKO);
  const [address, setAddress] = useState('Kimironko, Kigali');
  const [wasteType, setWasteType] = useState('bottles');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
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
        // silently fall back to Kimironko
      }
    );
  }

  // Check consent on mount
  useEffect(() => {
    const consent = getGeoConsent();
    if (consent === 'allowed') {
      requestGeolocation();
    } else if (consent === null) {
      setShowConsent(true);
    }
  }, []);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = new FormData();
      data.append('latitude', String(markerPos.lat));
      data.append('longitude', String(markerPos.lng));
      data.append('waste_type', wasteType);
      data.append('description', description);
      if (image) data.append('image', image);

      const res = await client.post('/reports/', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      await refreshUser();
      setToast(
        `Report submitted! +10 points earned. Balance: ${String(res.data.new_points_balance)} pts`
      );
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch {
      setToast('Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pb-24 max-w-lg mx-auto">
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
        <h1 className="text-lg font-semibold text-gray-800 dark:text-slate-100">
          Report Plastic Waste
        </h1>
      </div>

      {toast && (
        <div className="mx-4 mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm font-medium">
          {toast}
        </div>
      )}

      <form onSubmit={handleSubmit} className="px-4 py-4 space-y-5">
        {/* Map */}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">
            Pin the exact location
          </p>
          <div
            className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700"
            style={{ height: '220px' }}
          >
            <GoogleMap
              mapId={MAP_ID ?? null}
              defaultCenter={KIMIRONKO}
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
          {/* Address bar */}
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
              <Locate size={12} /> My location
            </button>
          </div>
        </div>

        {/* Image */}
        <ImageUpload
          value={image}
          onChange={setImage}
          maxSizeMB={0.5}
          maxWidthOrHeight={1920}
          label="Photo"
        />

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="report-description"
            className="text-sm font-medium text-gray-700 dark:text-slate-300"
          >
            Describe what you found (optional)
          </label>
          <textarea
            id="report-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="e.g., Large pile of plastic bottles near the road..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100"
          />
        </div>

        {/* Waste type */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="report-waste-type"
            className="text-sm font-medium text-gray-700 dark:text-slate-300"
          >
            Waste Type
          </label>
          <select
            id="report-waste-type"
            value={wasteType}
            onChange={(e) => setWasteType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100"
          >
            {WASTE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Submitting…' : 'Submit Report'}
        </Button>

        <p className="text-center text-sm text-gray-500 dark:text-slate-400">
          You'll earn <span className="font-semibold text-green-600">+10 points</span> for this
          report
        </p>
      </form>
    </div>
  );
}
