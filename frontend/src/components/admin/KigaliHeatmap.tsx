import { AdvancedMarker, Map } from '@vis.gl/react-google-maps';
import type { HeatmapPoint } from '../../api/endpoints/admin';

const KIMIRONKO = { lat: -1.9441, lng: 30.0619 };
const MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined;

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  verified: '#16a34a',
  resolved: '#60a5fa',
  rejected: '#ef4444',
};

interface Props {
  points: HeatmapPoint[];
}

export function KigaliHeatmap({ points }: Props) {
  return (
    <Map
      mapId={MAP_ID ?? null}
      defaultCenter={KIMIRONKO}
      defaultZoom={13}
      gestureHandling="none"
      disableDefaultUI
      zoomControl
      style={{ height: '100%', width: '100%' }}
    >
      {points.map((p, i) => (
        <AdvancedMarker key={i} position={{ lat: p.latitude, lng: p.longitude }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: STATUS_COLORS[p.status] ?? '#94a3b8',
              border: '2px solid rgba(255,255,255,0.7)',
              opacity: 0.85,
            }}
          />
        </AdvancedMarker>
      ))}
    </Map>
  );
}
