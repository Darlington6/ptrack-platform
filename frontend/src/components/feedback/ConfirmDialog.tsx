import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm',
  message = 'Are you sure?',
  confirmLabel = 'Confirm',
  isLoading,
}: Props) {
  const { t } = useTranslation('common');
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-sm text-gray-600 dark:text-slate-400 mb-6">{message}</p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={onClose} className="flex-1">
          {t('cancel')}
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={isLoading} className="flex-1">
          {isLoading ? t('working') : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}