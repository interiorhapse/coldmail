import { useState } from 'react';
import Modal, { ModalFooter } from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { PriorityBadge, SendStatusBadge } from '@/components/ui/Badge';
import { formatDate, formatDateTime } from '@/lib/utils';

export default function CompanyDetail({
  isOpen,
  onClose,
  company,
  onEdit,
  onDelete,
  onAnalyze,
}) {
  const [loading, setLoading] = useState(false);

  if (!company) return null;

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    setLoading(true);
    try {
      await onDelete(company.id);
      onClose();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      await onAnalyze([company.id]);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="기업 상세" size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{company.name}</h3>
            {company.industry && (
              <p className="text-sm text-gray-500">{company.industry.name}</p>
            )}
          </div>
          <div className="flex gap-2">
            <PriorityBadge priority={company.priority} />
            <SendStatusBadge status={company.send_status} />
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          <InfoItem label="담당자" value={company.contact_name || '-'} />
          <InfoItem label="직책" value={company.contact_title || '-'} />
          <InfoItem label="이메일" value={company.contact_email} />
          <InfoItem label="전화번호" value={company.contact_phone || '-'} />
          <InfoItem
            label="웹사이트"
            value={
              company.website ? (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  {company.website}
                </a>
              ) : (
                '-'
              )
            }
          />
          <InfoItem label="수집 소스" value={company.source || '-'} />
        </div>

        {/* AI Analysis */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">AI 분석 결과</h4>
            <Button size="sm" variant="outline" onClick={handleAnalyze} loading={loading}>
              재분석
            </Button>
          </div>

          {company.analysis_status === 'completed' ? (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">BM 요약</p>
                <p className="text-sm text-gray-700">{company.bm_summary || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">최근 뉴스</p>
                <p className="text-sm text-gray-700">{company.news_summary || '-'}</p>
              </div>
              {company.news_urls && company.news_urls.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">관련 링크</p>
                  <div className="flex flex-wrap gap-2">
                    {company.news_urls.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary-600 hover:underline"
                      >
                        링크 {index + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-400">
                분석일: {formatDateTime(company.analyzed_at)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">아직 분석되지 않았습니다.</p>
          )}
        </div>

        {/* Memo */}
        {company.memo && (
          <div>
            <p className="text-xs text-gray-500 mb-1">메모</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{company.memo}</p>
          </div>
        )}

        {/* Send History */}
        <div>
          <p className="text-xs text-gray-500 mb-1">발송 이력</p>
          <p className="text-sm text-gray-700">
            {company.send_count > 0
              ? `${company.send_count}회 발송 (마지막: ${formatDate(company.last_send_date)})`
              : '발송 이력 없음'}
          </p>
        </div>

        <ModalFooter>
          <Button variant="danger" onClick={handleDelete} loading={loading}>
            삭제
          </Button>
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
          <Button onClick={() => onEdit(company)}>수정</Button>
        </ModalFooter>
      </div>
    </Modal>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  );
}
