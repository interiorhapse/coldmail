import { useState, useEffect } from 'react';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import Input, { Textarea } from '@/components/ui/Input';
import Button from '@/components/ui/Button';

export default function AiDraftModal({
  isOpen,
  onClose,
  onGenerate,
  selectedCompanies = [],
  templates = [],
  demoLinks = [],
}) {
  const [templateId, setTemplateId] = useState('');
  const [demoLink, setDemoLink] = useState('');
  const [customDemoLink, setCustomDemoLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedDrafts, setGeneratedDrafts] = useState([]);
  const [step, setStep] = useState(1); // 1: 설정, 2: 결과

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setGeneratedDrafts([]);
      // 기본 템플릿 선택
      const defaultTemplate = templates.find((t) => t.is_default);
      if (defaultTemplate) {
        setTemplateId(defaultTemplate.id);
      }
    }
  }, [isOpen, templates]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const finalDemoLink = demoLink === 'custom' ? customDemoLink : demoLink;
      const result = await onGenerate(
        selectedCompanies.map((c) => c.id),
        templateId,
        finalDemoLink
      );
      setGeneratedDrafts(result.drafts || []);
      setStep(2);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditDraft = (index, field, value) => {
    setGeneratedDrafts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const templateOptions = templates.map((t) => ({
    value: t.id,
    label: t.name + (t.is_default ? ' (기본)' : ''),
  }));

  const demoLinkOptions = [
    ...demoLinks.map((d) => ({ value: d.url, label: d.name })),
    { value: 'custom', label: '직접 입력' },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AI 초안 생성"
      size={step === 2 ? 'full' : 'lg'}
    >
      {step === 1 ? (
        <div className="space-y-4">
          <div className="bg-primary-50 rounded-lg p-4">
            <p className="text-sm text-primary-700">
              {selectedCompanies.length}개 기업에 대한 맞춤형 콜드메일 초안을 AI가 생성합니다.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">선택된 기업</p>
            <div className="max-h-32 overflow-auto bg-gray-50 rounded-lg p-2">
              {selectedCompanies.map((company) => (
                <div key={company.id} className="text-sm text-gray-600 py-1">
                  {company.name} ({company.contact_email})
                </div>
              ))}
            </div>
          </div>

          <Select
            label="템플릿 선택"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            options={templateOptions}
            placeholder="템플릿 선택"
          />

          <Select
            label="데모 링크"
            value={demoLink}
            onChange={(e) => setDemoLink(e.target.value)}
            options={demoLinkOptions}
            placeholder="데모 링크 선택"
          />

          {demoLink === 'custom' && (
            <Input
              label="커스텀 데모 링크"
              value={customDemoLink}
              onChange={(e) => setCustomDemoLink(e.target.value)}
              placeholder="https://..."
            />
          )}

          <ModalFooter>
            <Button variant="secondary" onClick={onClose}>
              취소
            </Button>
            <Button onClick={handleGenerate} loading={loading}>
              AI 초안 생성
            </Button>
          </ModalFooter>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-700">
              {generatedDrafts.length}개의 초안이 생성되었습니다. 내용을 확인하고 수정할 수 있습니다.
            </p>
          </div>

          <div className="space-y-6 max-h-[60vh] overflow-auto">
            {generatedDrafts.map((draft, index) => (
              <div key={draft.id} className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-3">
                  {draft.company_name} ({draft.contact_email})
                </p>
                <div className="space-y-3">
                  <Input
                    label="제목"
                    value={draft.subject}
                    onChange={(e) => handleEditDraft(index, 'subject', e.target.value)}
                  />
                  <Textarea
                    label="본문"
                    value={draft.body}
                    onChange={(e) => handleEditDraft(index, 'body', e.target.value)}
                    rows={8}
                  />
                </div>
              </div>
            ))}
          </div>

          <ModalFooter>
            <Button variant="secondary" onClick={() => setStep(1)}>
              다시 생성
            </Button>
            <Button onClick={onClose}>
              완료
            </Button>
          </ModalFooter>
        </div>
      )}
    </Modal>
  );
}
