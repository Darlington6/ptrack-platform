import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  XCircle,
  Trash2,
  ShieldCheck,
  Ban,
  Navigation,
  PackageCheck,
  MapPin,
} from 'lucide-react';
import { Map, AdvancedMarker, InfoWindow } from '@vis.gl/react-google-maps';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { ConfirmModal } from '../components/ui/ConfirmModal';
import { VerifyReportModal, RejectReportModal } from '../components/admin/ReportActionModals';
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
    icon: <PackageCheck size={14} />,
    cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  rejected: {
    label: 'Rejected',
    icon: <XCircle size={14} />,
    cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
};

type Confirm = 'verify' | 'reject' | 'resolve' | 'delete' | null;

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [markerOpen, setMarkerOpen] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['report', id],
    queryFn: () => client.get<WasteReport>(`/reports/${id}/`),
    enabled: !!id,
  });

  const report = data?.data;

  function applyUpdate(updated: WasteReport) {
    qc.setQueryData(['report', id], (old: typeof data) => (old ? { ...old, data: updated } : old));
    void qc.invalidateQueries({ queryKey: ['reports'] });
    void qc.invalidateQueries({ queryKey: ['admin', 'reports'] });
  }

  const verify = useMutation({
    mutationFn: (note: string) =>
      client.patch<WasteReport>(`/reports/${id}/verify/`, note ? { note } : {}),
    onSuccess: ({ data: updated }) => {
      applyUpdate(updated);
      toast.success('Report verified — citizen awarded +10 pts');
    },
    onError: () => toast.error('Verification failed'),
    onSettled: () => setConfirm(null),
  });

  const reject = useMutation({
    mutationFn: (reason: string) => client.patch<WasteReport>(`/reports/${id}/reject/`, { reason }),
    onSuccess: ({ data: updated }) => {
      applyUpdate(updated);
      toast.success('Report rejected');
    },
    onError: () => toast.error('Reject failed'),
    onSettled: () => setConfirm(null),
  });

  const resolve = useMutation({
    mutationFn: () => client.patch<WasteReport>(`/reports/${id}/resolve/`),
    onSuccess: ({ data: updated }) => {
      applyUpdate(updated);
      toast.success('Report marked as resolved');
    },
    onError: () => toast.error('Failed to mark as resolved'),
    onSettled: () => setConfirm(null),
  });

  const deleteReport = useMutation({
    mutationFn: () => client.delete(`/reports/${id}/`),
    onSuccess: () => {
      toast.success('Report deleted');
      navigate(-1);
    },
    onError: () => toast.error('Delete failed'),
    onSettled: () => setConfirm(null),
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

  const statusMeta = STATUS_META[report.status as keyof typeof STATUS_META] ?? STATUS_META.pending;
  const isOwner =
    typeof report.user === 'number' ? report.user === user?.id : report.user.id === user?.id;
  const isAdmin = user?.role === 'admin';
  const reporterName = isOwner
    ? 'You'
    : isAdmin
      ? (report.user_detail?.full_name ?? report.user_detail?.username ?? 'Unknown user')
      : 'A citizen';

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${report.latitude},${report.longitude}`;

  const isPending = report.status === 'pending';
  const isVerified = report.status === 'verified';
  const isRejected = report.status === 'rejected';

  return (
    <div className="pb-24">
      {/* Hero image */}
      {report.image ? (
        <div className="w-full h-56 bg-gray-200 dark:bg-slate-700 overflow-hidden">
          <img src={report.image} alt="Waste report" className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-full h-40 bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
          <MapPin size={48} className="text-gray-400 dark:text-slate-500" />
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
            className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${statusMeta.cls}`}
          >
            {statusMeta.icon} {statusMeta.label}
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

        {/* Location map — tap pin to get directions */}
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
            <AdvancedMarker
              position={{ lat: report.latitude, lng: report.longitude }}
              onClick={() => setMarkerOpen(true)}
            />
            {markerOpen && (
              <InfoWindow
                position={{ lat: report.latitude, lng: report.longitude }}
                onCloseClick={() => setMarkerOpen(false)}
                pixelOffset={[0, -40]}
              >
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium text-blue-600 whitespace-nowrap"
                >
                  <Navigation size={14} /> Get Directions
                </a>
              </InfoWindow>
            )}
          </Map>
        </div>

        {/* Admin actions */}
        {isAdmin && (
          <div className="space-y-2 pt-2">
            {(isPending || isRejected) && (
              <button
                onClick={() => setConfirm('verify')}
                className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                <ShieldCheck size={16} /> Verify Report
              </button>
            )}
            {(isPending || isVerified) && (
              <button
                onClick={() => setConfirm('reject')}
                className="w-full flex items-center justify-center gap-2 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 font-semibold py-3 rounded-xl transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Ban size={16} /> Reject Report
              </button>
            )}
            {isVerified && (
              <button
                onClick={() => setConfirm('resolve')}
                className="w-full flex items-center justify-center gap-2 border border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-semibold py-3 rounded-xl transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                <PackageCheck size={16} /> Mark as Resolved
              </button>
            )}
          </div>
        )}

        {/* Citizen delete */}
        {isOwner && (
          <div className="pt-2">
            <button
              onClick={() => setConfirm('delete')}
              className="w-full flex items-center justify-center gap-2 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 font-semibold py-3 rounded-xl transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 size={16} /> Delete Report
            </button>
          </div>
        )}
      </div>

      <VerifyReportModal
        open={confirm === 'verify'}
        loading={verify.isPending}
        onConfirm={(note) => verify.mutate(note)}
        onCancel={() => setConfirm(null)}
      />
      <RejectReportModal
        open={confirm === 'reject'}
        loading={reject.isPending}
        onConfirm={(reason) => reject.mutate(reason)}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmModal
        open={confirm === 'resolve'}
        intent="warning"
        title="Mark as resolved?"
        message="This confirms the waste has been physically collected or cleaned up."
        confirmLabel="Mark Resolved"
        loading={resolve.isPending}
        onConfirm={() => resolve.mutate()}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmModal
        open={confirm === 'delete'}
        intent="danger"
        title="Delete this report?"
        message="This will permanently remove your report. This cannot be undone."
        confirmLabel="Delete"
        loading={deleteReport.isPending}
        onConfirm={() => deleteReport.mutate()}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
