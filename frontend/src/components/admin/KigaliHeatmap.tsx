import { AdvancedMarker, Map } from '@vis.gl/react-google-maps';
import type { HeatmapPoint } from '../../api/endpoints/admin';

const KIMIRONKO = { lat: -1.9441, lng: 30.0619 };

const TYPE_COLORS: Record<string, string> = {
  bottles: '#ef4444',
  bags: '#f97316',
  mixed: '#eab308',
  other: '#8b5cf6',
};

interface Props {
  points: HeatmapPoint[];
}

export function KigaliHeatmap({ points }: Props) {
  return (
    <Map
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
              background: TYPE_COLORS[p.waste_type] ?? '#22c55e',
              border: '2px solid rgba(255,255,255,0.7)',
              opacity: 0.85,
            }}
          />
        </AdvancedMarker>
      ))}
    </Map>
  );
}
