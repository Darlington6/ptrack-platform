import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Map, InfoWindow, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { Locate, MapPin } from 'lucide-react';
import { reportsApi } from '../api/endpoints/reports';
import type { WasteReport, ReportStatus } from '../api/types';

const KIMIRONKO = { lat: -1.9441, lng: 30.0619 };
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined;

const STATUS_COLOR: Record<ReportStatus, string> = {
  pending: '#f59e0b', // amber-500
  verified: '#16a34a', // green-600
  resolved: '#60a5fa', // blue-400
  rejected: '#ef4444', // red-500
};

const FILTERS: Array<{ label: string; value: ReportStatus | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Verified', value: 'verified' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Rejected', value: 'rejected' },
];

interface BBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface MapContentProps {
  reports: WasteReport[];
  onBboxChange: (bbox: BBox) => void;
  targetPos: google.maps.LatLngLiteral | null;
}

function MapContent({ reports, onBboxChange, targetPos }: MapContentProps) {
  const map = useMap();

  useEffect(() => {
    if (map && targetPos) map.panTo(targetPos);
  }, [map, targetPos]);
  const markerLib = useMapsLibrary('marker');
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [selected, setSelected] = useState<WasteReport | null>(null);

  // Bbox on idle
  useEffect(() => {
    if (!map) return;
    const listener = map.addListener('idle', () => {
      const b = map.getBounds();
      if (!b) return;
      const ne = b.getNorthEast();
      const sw = b.getSouthWest();
      onBboxChange({ north: ne.lat(), south: sw.lat(), east: ne.lng(), west: sw.lng() });
    });
    return () => google.maps.event.removeListener(listener);
  }, [map, onBboxChange]);

  // Imperative markers + clusterer
  useEffect(() => {
    if (!map || !markerLib) return;

    // Clear previous
    markersRef.current.forEach((m) => {
      m.map = null;
    });
    markersRef.current = [];
    clustererRef.current?.clearMarkers();

    const markers = reports.map((r) => {
      const dot = document.createElement('div');
      dot.style.cssText = `width:14px;height:14px;border-radius:50%;background:${STATUS_COLOR[r.status] ?? '#ef4444'};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4);cursor:pointer`;
      const marker = new markerLib.AdvancedMarkerElement({
        position: { lat: r.latitude, lng: r.longitude },
        map,
        content: dot,
        title: r.waste_type,
      });
      marker.addListener('click', () => setSelected(r));
      return marker;
    });

    markersRef.current = markers;
    clustererRef.current = new MarkerClusterer({ map, markers });

    return () => {
      markers.forEach((m) => {
        m.map = null;
      });
      clustererRef.current?.clearMarkers();
    };
  }, [map, markerLib, reports]);

  return (
    <>
      {selected && (
        <InfoWindow
          position={{ lat: selected.latitude, lng: selected.longitude }}
          onCloseClick={() => setSelected(null)}
        >
          <div className="text-sm min-w-[180px]">
            <div className="flex items-center justify-between gap-4 mb-1">
              <span className="font-semibold capitalize text-gray-800">
                {selected.waste_type.replace('_', ' ')}
              </span>
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                style={{
                  background: `${STATUS_COLOR[selected.status]}22`,
                  color: STATUS_COLOR[selected.status],
                }}
              >
                {selected.status}
              </span>
            </div>
            {selected.description && (
              <p className="text-xs text-gray-500 mb-1.5">{selected.description}</p>
            )}
            <p className="text-[10px] text-gray-400 mb-2">
              {new Date(selected.created_at).toLocaleDateString()} —{' '}
              {selected.user_detail?.full_name ?? 'Citizen'}
            </p>
            <Link
              to={`/reports/${selected.id}`}
              className="block text-center text-xs font-semibold text-green-700 hover:underline"
            >
              View detail →
            </Link>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export default function MapView() {
  const [filter, setFilter] = useState<ReportStatus | 'all'>('all');
  const [reports, setReports] = useState<WasteReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [userPos, setUserPos] = useState<google.maps.LatLngLiteral | null>(null);
  const bboxRef = useRef<BBox | null>(null);
  const fetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchReports = useCallback(
    async (bbox: BBox) => {
      setLoading(true);
      try {
        const params = {
          ...(filter !== 'all' ? { status: filter } : {}),
          north: bbox.north,
          south: bbox.south,
          east: bbox.east,
          west: bbox.west,
        };
        const res = await reportsApi.list(params);
        setReports(res.data.results ?? []);
      } finally {
        setLoading(false);
      }
    },
    [filter]
  );

  const handleBboxChange = useCallback(
    (bbox: BBox) => {
      bboxRef.current = bbox;
      if (fetchTimer.current) clearTimeout(fetchTimer.current);
      fetchTimer.current = setTimeout(() => void fetchReports(bbox), 400);
    },
    [fetchReports]
  );

  function recentre() {
    navigator.geolocation.getCurrentPosition((pos) => {
      setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 64px)' }}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white dark:bg-slate-900 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
        <h1 className="text-base font-semibold text-gray-800 dark:text-slate-100">
          Waste Reports Near You
          {loading && <span className="ml-2 text-xs text-gray-400 font-normal">Loading…</span>}
        </h1>
        <button
          onClick={recentre}
          className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400"
        >
          <Locate size={13} /> Re-centre
        </button>
      </div>

      {/* Map — fixed height */}
      <div className="flex-shrink-0" style={{ height: '45%' }}>
        <Map
          mapId={MAP_ID ?? null}
          defaultCenter={KIMIRONKO}
          defaultZoom={14}
          minZoom={11}
          gestureHandling="greedy"
          disableDefaultUI={false}
          zoomControl
          streetViewControl={false}
          mapTypeControl={false}
          fullscreenControl={false}
          style={{ width: '100%', height: '100%' }}
        >
          <MapContent reports={reports} onBboxChange={handleBboxChange} targetPos={userPos} />
        </Map>
      </div>

      {/* Status filter chips */}
      <div className="flex-shrink-0 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
        <div className="flex gap-2 px-4 py-2.5 overflow-x-auto">
          {FILTERS.map((f) => {
            const color = f.value !== 'all' ? STATUS_COLOR[f.value] : undefined;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  filter === f.value
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400'
                }`}
              >
                {color && (
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: filter === f.value ? 'white' : color }}
                  />
                )}
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Reports list */}
      <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950 pb-6">
        {reports.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <MapPin size={32} className="text-gray-300 dark:text-slate-600 mb-2" />
            <p className="text-sm text-gray-500 dark:text-slate-400">No reports in this area.</p>
          </div>
        )}
        <div className="space-y-2 px-3 pt-3">
          {reports.map((r) => (
            <Link
              key={r.id}
              to={`/reports/${r.id}`}
              className="flex items-start gap-3 px-4 py-3.5 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
            >
              <span
                className="mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: STATUS_COLOR[r.status] ?? '#94a3b8' }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-slate-100 capitalize">
                  {r.waste_type.replace('_', ' ')}
                </p>
                {r.description && (
                  <p className="text-xs text-gray-500 dark:text-slate-400 truncate">
                    {r.description}
                  </p>
                )}
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                  {new Date(r.created_at).toLocaleDateString('en-GB')} —{' '}
                  {r.user_detail?.full_name ?? 'Citizen'}
                </p>
              </div>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize flex-shrink-0"
                style={{
                  background: `${STATUS_COLOR[r.status]}22`,
                  color: STATUS_COLOR[r.status],
                }}
              >
                {r.status}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
