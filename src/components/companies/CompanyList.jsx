import { useState } from 'react';
import Table, { Thead, Tbody, Tr, Th, Td, EmptyState } from '@/components/ui/Table';
import { PriorityBadge, SendStatusBadge } from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatDateTime } from '@/lib/utils';

export default function CompanyList({
  companies,
  loading,
  selectedIds,
  onSelect,
  onSelectAll,
  onRowClick,
  onAnalyze,
  onAddToQueue,
  onBulkDelete,
  onCsvDownload,
}) {
  const allSelected = companies.length > 0 && selectedIds.length === companies.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < companies.length;

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <Table>
        <Thead>
          <Tr>
            <Th className="w-12">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => el && (el.indeterminate = someSelected)}
                onChange={(e) => onSelectAll(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
            </Th>
            <Th>기업명</Th>
            <Th>업종</Th>
            <Th>담당자</Th>
            <Th>우선순위</Th>
            <Th>발송상태</Th>
            <Th>수집일</Th>
          </Tr>
        </Thead>
        <Tbody>
          {loading ? (
            <Tr>
              <Td colSpan="7" className="text-center py-8">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                </div>
              </Td>
            </Tr>
          ) : companies.length === 0 ? (
            <EmptyState message="등록된 기업이 없습니다." />
          ) : (
            companies.map((company) => (
              <Tr
                key={company.id}
                clickable
                onClick={() => onRowClick(company)}
                className={selectedIds.includes(company.id) ? 'bg-primary-50' : ''}
              >
                <Td onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(company.id)}
                    onChange={(e) => onSelect(company.id, e.target.checked)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </Td>
                <Td>
                  <div>
                    <p className="font-medium text-gray-900">{company.name}</p>
                    {company.website && (
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">
                        {company.website}
                      </p>
                    )}
                  </div>
                </Td>
                <Td>
                  <span className="text-gray-600">
                    {company.industry?.name || '-'}
                  </span>
                </Td>
                <Td>
                  <div>
                    <p className="text-gray-900">{company.contact_name || '-'}</p>
                    <p className="text-xs text-gray-500">{company.contact_email}</p>
                  </div>
                </Td>
                <Td>
                  <PriorityBadge priority={company.priority} />
                </Td>
                <Td>
                  <SendStatusBadge status={company.send_status} />
                </Td>
                <Td className="text-gray-500">
                  {formatDateTime(company.collected_at || company.created_at)}
                </Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>
      </div>

      {/* Fixed Bottom Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <span className="text-lg font-medium text-gray-700">
              {selectedIds.length}개 기업 선택됨
            </span>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => {
                  if (window.confirm(`${selectedIds.length}개 기업을 삭제하시겠습니까?`)) {
                    onBulkDelete(selectedIds);
                  }
                }}
              >
                삭제
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={onCsvDownload}
              >
                CSV 다운로드
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => onAnalyze(selectedIds)}
              >
                AI 분석
              </Button>
              <Button
                size="lg"
                className="px-8 bg-primary-600 hover:bg-primary-700"
                onClick={() => onAddToQueue(selectedIds)}
              >
                발송대기열 추가
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
