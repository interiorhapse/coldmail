import { useState } from 'react';
import Table, { Thead, Tbody, Tr, Th, Td, EmptyState } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { formatDateTime } from '@/lib/utils';

const statusConfig = {
  waiting: { label: '대기중', variant: 'warning' },
  processing: { label: '발송중', variant: 'primary' },
  complete: { label: '완료', variant: 'success' },
  failed: { label: '실패', variant: 'danger' },
};

export default function SendQueue({
  items,
  loading,
  selectedIds,
  onSelect,
  onSelectAll,
  onSend,
  onRemove,
  onRetry,
  onEdit,
}) {
  const allSelected = items.length > 0 && selectedIds.length === items.length;
  const someSelected = selectedIds.length > 0 && selectedIds.length < items.length;

  const waitingItems = items.filter((i) => i.status === 'waiting');
  const selectedWaitingIds = selectedIds.filter((id) =>
    waitingItems.find((i) => i.id === id)
  );

  return (
    <>
      <div className={`bg-white rounded-xl shadow-sm overflow-hidden ${selectedIds.length > 0 ? 'mb-24' : ''}`}>
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
            <Th>수신자</Th>
            <Th>제목</Th>
            <Th>차수</Th>
            <Th>상태</Th>
            <Th>등록일</Th>
            <Th className="w-32 text-center">작업</Th>
          </Tr>
        </Thead>
        <Tbody>
          {loading ? (
            <Tr>
              <Td colSpan="8" className="text-center py-8">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                </div>
              </Td>
            </Tr>
          ) : items.length === 0 ? (
            <EmptyState message="대기열이 비어있습니다." />
          ) : (
            items.map((item) => {
              const config = statusConfig[item.status] || statusConfig.waiting;

              return (
                <Tr key={item.id}>
                  <Td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={(e) => onSelect(item.id, e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </Td>
                  <Td className="font-medium">{item.company?.name || '-'}</Td>
                  <Td className="text-gray-600">{item.to_email}</Td>
                  <Td
                    className="max-w-xs truncate text-gray-600 cursor-pointer hover:text-primary-600"
                    onClick={() => onEdit(item)}
                  >
                    {item.subject}
                  </Td>
                  <Td>{item.send_order}차</Td>
                  <Td>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </Td>
                  <Td className="text-gray-500">{formatDateTime(item.created_at)}</Td>
                  <Td className="text-center">
                    <div className="inline-flex gap-1 justify-center">
                      {item.status === 'waiting' && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEdit(item)}
                          >
                            수정
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => onRemove([item.id])}
                          >
                            삭제
                          </Button>
                        </>
                      )}
                      {(item.status === 'complete' || item.status === 'failed') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onEdit(item)}
                        >
                          조회
                        </Button>
                      )}
                      {item.status === 'failed' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-600 hover:text-blue-700"
                          onClick={() => onRetry([item.id])}
                        >
                          재시도
                        </Button>
                      )}
                    </div>
                  </Td>
                </Tr>
              );
            })
          )}
        </Tbody>
      </Table>
      </div>

      {/* Fixed Bottom Action Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <span className="text-lg font-medium text-gray-700">
              {selectedIds.length}개 선택됨
            </span>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="text-red-600 border-red-300 hover:bg-red-50"
                onClick={() => onRemove(selectedIds)}
              >
                대기열에서 제거
              </Button>
              {selectedWaitingIds.length > 0 && (
                <Button
                  size="lg"
                  className="px-8 bg-primary-600 hover:bg-primary-700"
                  onClick={() => onSend(selectedWaitingIds)}
                >
                  {selectedWaitingIds.length}건 발송하기
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
