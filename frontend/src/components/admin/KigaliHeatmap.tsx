import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import type { HeatmapPoint } from '../../api/endpoints/admin';

interface Props {
  points: HeatmapPoint[];
}

const STATUS_COLOR: Record<string, string> = {
  pending: '#f59e0b',
  verified: '#16a34a',
  resolved: '#60a5fa',
};

export function KigaliHeatmap({ points }: Props) {
  return (
    <MapContainer
      center={[-1.9441, 30.0619]}
      zoom={13}
      style={{ height: '100%', width: '100%', borderRadius: '0 0 8px 8px' }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((p, i) => (
        <CircleMarker
          key={i}
          center={[p.latitude, p.longitude]}
          radius={8}
          pathOptions={{
            color: STATUS_COLOR[p.status] ?? '#16a34a',
            fillColor: STATUS_COLOR[p.status] ?? '#16a34a',
            fillOpacity: 0.6,
            weight: 1,
          }}
        >
          <Tooltip>
            {p.waste_type} · {p.status}
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
