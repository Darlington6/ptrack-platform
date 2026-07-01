/**
 * Shared confirm modals for verifying and rejecting waste reports.
 * Used by ReportDetail, AdminDashboard, and AdminReports to keep
 * the exact same UX regardless of where the action is triggered.
 */
import { useState } from 'react';
import { ConfirmModal } from '../ui/ConfirmModal';

interface VerifyModalProps {
  open: boolean;
  loading: boolean;
  onConfirm: (note: string) => void;
  onCancel: () => void;
}

export function VerifyReportModal({ open, loading, onConfirm, onCancel }: VerifyModalProps) {
  const [note, setNote] = useState('');
  return (
    <ConfirmModal
      open={open}
      intent="success"
      title="Verify this report?"
      message="This will mark the report as verified and award the citizen a bonus."
      confirmLabel="Verify"
      loading={loading}
      onConfirm={() => onConfirm(note)}
      onCancel={() => {
        setNote('');
        onCancel();
      }}
    >
      <label
        htmlFor="verify-note"
        className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1"
      >
        Note for citizen <span className="font-normal text-gray-400">(optional)</span>
      </label>
      <textarea
        id="verify-note"
        rows={2}
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="e.g. Confirmed waste visible at this location"
        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
      />
    </ConfirmModal>
  );
}

interface RejectModalProps {
  open: boolean;
  loading: boolean;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function RejectReportModal({ open, loading, onConfirm, onCancel }: RejectModalProps) {
  const [reason, setReason] = useState('');
  return (
    <ConfirmModal
      open={open}
      intent="danger"
      title="Reject this report?"
      message="This will mark the report as rejected and notify the citizen."
      confirmLabel="Reject"
      loading={loading}
      confirmDisabled={reason.trim() === ''}
      onConfirm={() => onConfirm(reason)}
      onCancel={() => {
        setReason('');
        onCancel();
      }}
    >
      <label
        htmlFor="reject-reason"
        className="block text-xs font-medium text-gray-600 dark:text-slate-400 mb-1"
      >
        Reason <span className="text-red-500">*</span>
      </label>
      <textarea
        id="reject-reason"
        rows={3}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Explain why this report is being rejected…"
        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
      />
      {reason.trim() === '' && (
        <p className="text-xs text-red-500 mt-1">A reason is required to reject a report.</p>
      )}
    </ConfirmModal>
  );
}
