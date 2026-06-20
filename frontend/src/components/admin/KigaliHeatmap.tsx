import { useEffect } from 'react';
import { Map, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import type { HeatmapPoint } from '../../api/endpoints/admin';

const KIMIRONKO = { lat: -1.9441, lng: 30.0619 };

interface Props {
  points: HeatmapPoint[];
}

function HeatmapLayer({ points }: Props) {
  const map = useMap();
  const viz = useMapsLibrary('visualization');

  useEffect(() => {
    if (!map || !viz) return;
    // @types/google.maps stubs the modern importLibrary HeatmapLayer without
    // options or setMap — cast to the legacy constructor signature which is
    // what the runtime actually provides.
    type HeatmapLayerCtor = new (opts: {
      data: google.maps.LatLng[];
      map: google.maps.Map;
      radius?: number;
      opacity?: number;
    }) => { setMap(m: google.maps.Map | null): void };
    const Ctor = google.maps.visualization.HeatmapLayer as unknown as HeatmapLayerCtor;
    const layer = new Ctor({
      data: points.map((p) => new google.maps.LatLng(p.latitude, p.longitude)),
      map,
      radius: 20,
      opacity: 0.7,
    });
    return () => {
      layer.setMap(null);
    };
  }, [map, viz, points]);

  return null;
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
      <HeatmapLayer points={points} />
    </Map>
  );
}
