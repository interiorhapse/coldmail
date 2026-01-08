import { useState, useEffect } from 'react';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import Input, { Textarea } from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function TemplateForm({
  isOpen,
  onClose,
  onSubmit,
  template = null,
}) {
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body: '',
    is_default: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        subject: template.subject || '',
        body: template.body || '',
        is_default: template.is_default || false,
      });
    } else {
      setFormData({
        name: '',
        subject: '',
        body: '',
        is_default: false,
      });
    }
    setError(null);
  }, [template, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const variables = [
    { name: '{{company_name}}', desc: '회사명' },
    { name: '{{contact_name}}', desc: '담당자명' },
    { name: '{{bm_summary}}', desc: 'BM 요약' },
    { name: '{{news_summary}}', desc: '뉴스 요약' },
    { name: '{{custom_intro}}', desc: 'AI 생성 인트로' },
    { name: '{{custom_proposal}}', desc: 'AI 생성 제안' },
    { name: '{{demo_link}}', desc: '데모 링크' },
    { name: '{{sender_name}}', desc: '발신자명' },
    { name: '{{sender_signature}}', desc: '발신자 서명' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={template ? '템플릿 수정' : '템플릿 추가'}
      size="xl"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-3 gap-6">
          {/* Form */}
          <div className="col-span-2 space-y-4">
            <Input
              label="템플릿 이름 *"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="템플릿 이름"
            />
            <Input
              label="메일 제목 *"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              placeholder="메일 제목 (변수 사용 가능)"
            />
            <Textarea
              label="메일 본문 *"
              name="body"
              value={formData.body}
              onChange={handleChange}
              required
              rows={12}
              placeholder="메일 본문 (변수 사용 가능)"
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_default"
                checked={formData.is_default}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">기본 템플릿으로 설정</span>
            </label>
          </div>

          {/* Variables Guide */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">사용 가능한 변수</h4>
            <div className="space-y-2">
              {variables.map((v) => (
                <div key={v.name} className="text-sm">
                  <code className="text-primary-600 bg-primary-50 px-1 rounded">
                    {v.name}
                  </code>
                  <span className="text-gray-500 ml-2">{v.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" loading={loading}>
            {template ? '수정' : '추가'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
