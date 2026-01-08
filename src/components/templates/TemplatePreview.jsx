import { useState, useEffect } from 'react';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

export default function TemplatePreview({
  isOpen,
  onClose,
  template,
  companies = [],
}) {
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [preview, setPreview] = useState({ subject: '', body: '' });

  useEffect(() => {
    if (template && selectedCompanyId) {
      const company = companies.find((c) => c.id === selectedCompanyId);
      if (company) {
        setPreview({
          subject: replaceVariables(template.subject, company),
          body: replaceVariables(template.body, company),
        });
      }
    } else if (template) {
      setPreview({
        subject: template.subject,
        body: template.body,
      });
    }
  }, [template, selectedCompanyId, companies]);

  const replaceVariables = (text, company) => {
    return text
      .replace(/\{\{company_name\}\}/g, company.name || '')
      .replace(/\{\{contact_name\}\}/g, company.contact_name || '담당자')
      .replace(/\{\{bm_summary\}\}/g, company.bm_summary || '')
      .replace(/\{\{news_summary\}\}/g, company.news_summary || '')
      .replace(/\{\{custom_intro\}\}/g, '[AI 생성 인트로]')
      .replace(/\{\{custom_proposal\}\}/g, '[AI 생성 제안]')
      .replace(/\{\{demo_link\}\}/g, 'https://demo.gptko.co.kr')
      .replace(/\{\{sender_name\}\}/g, process.env.SENDER_NAME || 'GPTko')
      .replace(/\{\{sender_signature\}\}/g, '[발신자 서명]');
  };

  const companyOptions = companies.slice(0, 20).map((c) => ({
    value: c.id,
    label: `${c.name} (${c.contact_email})`,
  }));

  if (!template) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="템플릿 미리보기" size="lg">
      <div className="space-y-4">
        <Select
          label="샘플 기업 선택"
          value={selectedCompanyId}
          onChange={(e) => setSelectedCompanyId(e.target.value)}
          options={companyOptions}
          placeholder="기업을 선택하면 변수가 치환됩니다"
        />

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">제목</p>
          <p className="text-gray-900 font-medium">{preview.subject}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-xs text-gray-500 mb-1">본문</p>
          <div className="text-gray-700 whitespace-pre-wrap text-sm">
            {preview.body}
          </div>
        </div>
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          닫기
        </Button>
      </ModalFooter>
    </Modal>
  );
}
