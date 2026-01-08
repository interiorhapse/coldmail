import Modal from './Modal';
import Button from './Button';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = '확인',
  message,
  confirmText = '확인',
  cancelText = '취소',
  variant = 'primary', // primary, danger
  loading = false,
}) {
  const buttonClass = variant === 'danger'
    ? 'bg-red-600 hover:bg-red-700'
    : 'bg-primary-600 hover:bg-primary-700';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <p className="text-gray-600">{message}</p>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            className={buttonClass}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? '처리 중...' : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
