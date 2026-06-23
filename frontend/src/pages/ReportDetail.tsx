import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, Clock, XCircle, Trash2, ShieldCheck } from 'lucide-react';
import { Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import type { WasteReport } from '../types';

const STATUS_META = {
  pending: {
    label: 'Pending',
    icon: <Clock size={14} />,
    cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  },
  verified: {
    label: 'Verified',
    icon: <CheckCircle size={14} />,
    cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  resolved: {
    label: 'Resolved',
    icon: <XCircle size={14} />,
    cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
};

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['report', id],
    queryFn: () => client.get<WasteReport>(`/reports/${id}/`),
    enabled: !!id,
  });

  const report = data?.data;

  const verify = useMutation({
    mutationFn: () => client.patch(`/reports/${id}/verify/`),
    onSuccess: () => {
      toast.success('Report verified — citizen awarded +5 pts');
      void qc.invalidateQueries({ queryKey: ['report', id] });
    },
    onError: () => toast.error('Verification failed'),
  });

  const deleteReport = useMutation({
    mutationFn: () => client.delete(`/reports/${id}/`),
    onSuccess: () => {
      toast.success('Report deleted');
      navigate(-1);
    },
    onError: () => toast.error('Delete failed'),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !report) {
    return (
      <div className="px-4 py-16 text-center">
        <p className="text-gray-500 dark:text-slate-400">Report not found.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-green-600 font-medium text-sm">
          Go back
        </button>
      </div>
    );
  }

  const status = STATUS_META[report.status] ?? STATUS_META.pending;
  const isOwner =
    typeof report.user === 'number' ? report.user === user?.id : report.user.id === user?.id;
  const isAdmin = user?.role === 'admin';
  const reporterName = isOwner
    ? 'You'
    : report.user_detail?.full_name
      ? `A citizen in ${report.user_detail?.username ?? 'Kimironko'}`
      : `A citizen in ${user?.sector ?? 'Kimironko'}`;

  return (
    <div className="pb-24">
      {/* Hero image */}
      {report.image ? (
        <div className="w-full h-56 bg-gray-200 dark:bg-slate-700 overflow-hidden">
          <img src={report.image} alt="Waste report" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-full h-40 bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
          <span className="text-4xl">📍</span>
        </div>
      )}

      <div className="px-4 pt-4 space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-slate-400 -mt-1"
        >
          <ArrowLeft size={14} /> Back
        </button>

        {/* Status + waste type */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${status.cls}`}
          >
            {status.icon} {status.label}
          </span>
          <span className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 px-2.5 py-1 rounded-full font-medium capitalize">
            {report.waste_type}
          </span>
        </div>

        {/* Description */}
        <div>
          <p className="text-base font-semibold text-gray-900 dark:text-white mb-1">Description</p>
          <p className="text-sm text-gray-600 dark:text-slate-400">
            {report.description || 'No description provided.'}
          </p>
        </div>

        {/* Metadata */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 divide-y divide-gray-100 dark:divide-slate-700">
          <div className="flex justify-between px-4 py-3">
            <span className="text-sm text-gray-500 dark:text-slate-400">Submitted by</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {reporterName}
            </span>
          </div>
          <div className="flex justify-between px-4 py-3">
            <span className="text-sm text-gray-500 dark:text-slate-400">Date</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {new Date(report.created_at).toLocaleDateString()}
            </span>
          </div>
          <div className="flex justify-between px-4 py-3">
            <span className="text-sm text-gray-500 dark:text-slate-400">Location</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}
            </span>
          </div>
        </div>

        {/* Location map — interactive, shows where waste was reported */}
        <div className="w-full h-44 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700">
          <Map
            mapId={(import.meta.env.VITE_GOOGLE_MAPS_MAP_ID as string | undefined) ?? null}
            defaultCenter={{ lat: report.latitude, lng: report.longitude }}
            defaultZoom={15}
            gestureHandling="cooperative"
            zoomControl
            streetViewControl={false}
            mapTypeControl={false}
            fullscreenControl={false}
            style={{ width: '100%', height: '100%' }}
          >
            <AdvancedMarker position={{ lat: report.latitude, lng: report.longitude }} />
          </Map>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          {isAdmin && report.status === 'pending' && (
            <button
              onClick={() => verify.mutate()}
              disabled={verify.isPending}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
            >
              <ShieldCheck size={16} />
              {verify.isPending ? 'Verifying…' : 'Verify Report'}
            </button>
          )}
          {isOwner && (
            <button
              onClick={() => {
                if (confirm('Delete this report?')) deleteReport.mutate();
              }}
              disabled={deleteReport.isPending}
              className="w-full flex items-center justify-center gap-2 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 font-semibold py-3 rounded-xl transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-60"
            >
              <Trash2 size={16} />
              {deleteReport.isPending ? 'Deleting…' : 'Delete Report'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
