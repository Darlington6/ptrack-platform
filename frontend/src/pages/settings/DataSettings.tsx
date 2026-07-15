import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/endpoints/auth';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

export default function DataSettings() {
  const navigate = useNavigate();
  const { t } = useTranslation('settings');
  const { user, logout } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  const hasPassword = !!user?.has_usable_password;
  const DELETE_PHRASE = t('delete_confirm_placeholder');

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
      toast.success(t('export_success'));
    } catch {
      toast.error(t('export_failed'));
    }
  }

  async function handleDelete() {
    if (deleteConfirmText !== DELETE_PHRASE) {
      toast.error(t('delete_type_error'));
      return;
    }
    setDeleting(true);
    try {
      await authApi.deleteAccount(hasPassword ? password : '');
      logout();
      toast.success(t('delete_success'));
      navigate('/');
    } catch {
      toast.error(hasPassword ? t('delete_failed_pwd') : t('delete_failed'));
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
        <h1 className="text-lg font-bold text-gray-900 dark:text-slate-100">{t('page_data')}</h1>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleExport}
          className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 text-left hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
        >
          <p className="text-sm font-semibold text-gray-800 dark:text-slate-200">{t('export_title')}</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">{t('export_desc')}</p>
        </button>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="w-full bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900 rounded-xl p-4 text-left hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
        >
          <p className="text-sm font-semibold text-red-600">{t('delete_title')}</p>
          <p className="text-xs text-red-400 mt-0.5">{t('delete_desc')}</p>
        </button>
      </div>

      <Modal isOpen={showDeleteModal} onClose={handleClose} title={t('delete_modal_title')}>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-slate-400">
            {t('delete_modal_intro')}{' '}
            <span className="font-mono font-bold text-red-600">{DELETE_PHRASE}</span>
          </p>

          <input
            type="text"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder={DELETE_PHRASE}
            className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
          />

          {hasPassword && (
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('current_password')}
              className="w-full px-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              {t('cancel', { ns: 'common' })}
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting} className="flex-1">
              {deleting ? t('deleting') : t('delete_account')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}