import { useEffect, useState } from 'react';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import client from '../api/client';
import type { WasteReportDetail } from '../types';

const STATUS_BADGE = {
  pending: 'bg-yellow-100 text-yellow-800',
  verified: 'bg-green-100 text-green-800',
  resolved: 'bg-blue-100 text-blue-800',
};

const FILTERS = ['All', 'pending', 'verified', 'resolved'];

export default function MapView() {
  const [reports, setReports] = useState<WasteReportDetail[]>([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    const params = filter !== 'All' ? { status: filter } : {};
    client.get('/reports/', { params }).then((r) => setReports(r.data.results || []));
  }, [filter]);

  return (
    <div className="pb-24">
      <div className="px-4 py-4 border-b border-gray-200 bg-white">
        <h1 className="text-lg font-semibold text-gray-800">Waste Reports Near You</h1>
      </div>

      {/* Placeholder map */}
      <div className="mx-4 mt-4">
        <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
          <GoogleMap
            mapContainerStyle={{
              width: '100%',
              height: '400px',
            }}
            center={{
              lat: -1.9441,
              lng: 30.0619,
            }}
            zoom={13}
          >
            {reports.map((report) => (
              <Marker
                key={report.id}
                position={{
                  lat: report.latitude,
                  lng: report.longitude,
                }}
              />
            ))}
          </GoogleMap>
        </LoadScript>
      </div>

      {/* Filters */}
      <div className="flex gap-2 px-4 mt-4 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'All' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="px-4 mt-4 space-y-3">
        {reports.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-8">No reports found.</p>
        )}
        {reports.map((r) => (
          <div key={r.id} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-800 capitalize">
                {r.waste_type.replace('_', ' ')}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[r.status]}`}
              >
                {r.status}
              </span>
            </div>
            {r.description && <p className="text-xs text-gray-500 mb-1">{r.description}</p>}
            <p className="text-xs text-gray-400">
              {new Date(r.created_at).toLocaleDateString()} —{' '}
              {r.user_detail?.full_name || 'Citizen'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
