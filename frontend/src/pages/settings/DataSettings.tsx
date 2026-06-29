import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/endpoints/auth';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

export default function DataSettings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const hasPassword = !!user?.has_usable_password;

  async function handleExport() {
    try {
      const res = await authApi.exportData();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ptrack-data-export.json';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Your data has been downloaded.');
    } catch {
      toast.error('Export failed. Please try again.');
    }
  }

  async function handleDelete() {
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      toast.error('Type exactly: DELETE MY ACCOUNT');
      return;
    }
    setDeleting(true);
    try {
      await authApi.deleteAccount(hasPassword ? password : '');
      logout();
      toast.success('Your account has been deleted.');
      navigate('/');
    } catch {
      toast.error(hasPassword ? 'Incorrect password or request failed.' : 'Request failed.');
    } finally {
      setDeleting(false);
    }
  }

  function handleClose() {
    setShowDeleteModal(false);
    setDeleteConfirmText('');
    setPassword('');
  }

  return (
    <div className="pb-24 px-4">
      <div className="py-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-slate-100">Data & Privacy</h1>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleExport}
          className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 text-left hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
          <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">Export my data</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
            Download a copy of all your personal data (GDPR Article 20)
          </p>
        </button>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900 rounded-xl p-4 text-left hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
        >
          <p className="text-sm font-semibold text-red-600">Delete my account</p>
          <p className="text-xs text-red-400 mt-0.5">
            Permanently delete your account and all data. This cannot be undone.
          </p>
        </button>
      </div>

      <Modal isOpen={showDeleteModal} onClose={handleClose} title="Delete account">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-slate-400">
            This will permanently delete your account. Type{' '}
            <span className="font-mono font-bold text-red-600">DELETE MY ACCOUNT</span> to confirm.
          </p>

          <input
            type="text"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="DELETE MY ACCOUNT"
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
          />

          {hasPassword && (
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting} className="flex-1">
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
