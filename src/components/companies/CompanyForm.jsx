import { useState, useEffect } from 'react';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import Input, { Textarea } from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

export default function CompanyForm({
  isOpen,
  onClose,
  onSubmit,
  company = null,
  industries = [],
}) {
  const [formData, setFormData] = useState({
    name: '',
    industry_id: '',
    website: '',
    contact_name: '',
    contact_title: '',
    contact_email: '',
    contact_phone: '',
    memo: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        industry_id: company.industry_id || '',
        website: company.website || '',
        contact_name: company.contact_name || '',
        contact_title: company.contact_title || '',
        contact_email: company.contact_email || '',
        contact_phone: company.contact_phone || '',
        memo: company.memo || '',
      });
    } else {
      setFormData({
        name: '',
        industry_id: '',
        website: '',
        contact_name: '',
        contact_title: '',
        contact_email: '',
        contact_phone: '',
        memo: '',
      });
    }
    setError(null);
  }, [company, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  const industryOptions = industries.map((ind) => ({
    value: ind.id,
    label: ind.name,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={company ? '기업 수정' : '기업 추가'}
      size="lg"
    >
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="회사명 *"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="회사명 입력"
          />
          <Select
            label="업종"
            name="industry_id"
            value={formData.industry_id}
            onChange={handleChange}
            options={industryOptions}
            placeholder="업종 선택"
          />
          <div className="col-span-2">
            <Input
              label="웹사이트"
              name="website"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://example.com"
            />
          </div>
          <Input
            label="담당자명"
            name="contact_name"
            value={formData.contact_name}
            onChange={handleChange}
            placeholder="담당자 이름"
          />
          <Input
            label="직책"
            name="contact_title"
            value={formData.contact_title}
            onChange={handleChange}
            placeholder="직책/직함"
          />
          <Input
            label="이메일 *"
            name="contact_email"
            type="email"
            value={formData.contact_email}
            onChange={handleChange}
            required
            placeholder="email@example.com"
          />
          <Input
            label="전화번호"
            name="contact_phone"
            value={formData.contact_phone}
            onChange={handleChange}
            placeholder="02-1234-5678"
          />
          <div className="col-span-2">
            <Textarea
              label="메모"
              name="memo"
              value={formData.memo}
              onChange={handleChange}
              placeholder="메모 입력"
              rows={3}
            />
          </div>
        </div>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button type="submit" loading={loading}>
            {company ? '수정' : '추가'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
