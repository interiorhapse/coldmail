import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';

const statusConfig = {
  waiting: { label: '대기중', variant: 'warning' },
  processing: { label: '발송중', variant: 'primary' },
  complete: { label: '완료', variant: 'success' },
  failed: { label: '실패', variant: 'danger' },
};

export default function QueueEditModal({ isOpen, onClose, item, onSave }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const isEditable = item?.status === 'waiting';
  const config = statusConfig[item?.status] || statusConfig.waiting;

  useEffect(() => {
    if (item) {
      setSubject(item.subject || '');
      setBody(item.body || '');
    }
  }, [item]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(item.id, { subject, body });
      onClose();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!item) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditable ? '발송 내용 수정' : '발송 내용 조회'}
      size="lg"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              수신자
            </label>
            <div className="text-gray-600">
              {item.company?.name} &lt;{item.to_email}&gt;
            </div>
          </div>
          <Badge variant={config.variant}>{config.label}</Badge>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            제목
          </label>
          {isEditable ? (
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="이메일 제목"
            />
          ) : (
            <div className="text-gray-800 bg-gray-50 px-3 py-2 rounded-lg">
              {subject}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            본문
          </label>
          {isEditable ? (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="이메일 본문"
            />
          ) : (
            <div className="text-gray-800 bg-gray-50 px-3 py-2 rounded-lg whitespace-pre-wrap max-h-80 overflow-y-auto">
              {body}
            </div>
          )}
        </div>

        {item.error_message && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm font-medium text-red-800">오류 메시지</p>
            <p className="text-sm text-red-600">{item.error_message}</p>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            {isEditable ? '취소' : '닫기'}
          </Button>
          {isEditable && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
