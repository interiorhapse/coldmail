import Table, { Thead, Tbody, Tr, Th, Td, EmptyState } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import { formatDateTime } from '@/lib/utils';

const statusConfig = {
  sent: { label: '발송완료', variant: 'success' },
  failed: { label: '실패', variant: 'danger' },
  opened: { label: '열람', variant: 'primary' },
  clicked: { label: '클릭', variant: 'primary' },
  replied: { label: '답장', variant: 'success' },
};

export default function SendHistory({ items, loading, onResend }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <Table>
        <Thead>
          <Tr>
            <Th>기업명</Th>
            <Th>수신자</Th>
            <Th>제목</Th>
            <Th>차수</Th>
            <Th>상태</Th>
            <Th>발송일</Th>
            <Th className="w-20">작업</Th>
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
          ) : items.length === 0 ? (
            <EmptyState message="발송 이력이 없습니다." />
          ) : (
            items.map((item) => {
              const config = statusConfig[item.status] || statusConfig.sent;

              return (
                <Tr key={item.id}>
                  <Td className="font-medium">{item.company?.name || '-'}</Td>
                  <Td className="text-gray-600">{item.to_email}</Td>
                  <Td className="max-w-xs truncate text-gray-600">{item.subject}</Td>
                  <Td>{item.send_order || 1}차</Td>
                  <Td>
                    <Badge variant={config.variant}>{config.label}</Badge>
                  </Td>
                  <Td className="text-gray-500">{formatDateTime(item.sent_at)}</Td>
                  <Td>
                    {item.status === 'failed' && (
                      <button
                        onClick={() => onResend(item)}
                        className="text-sm text-primary-600 hover:underline"
                      >
                        재발송
                      </button>
                    )}
                  </Td>
                </Tr>
              );
            })
          )}
        </Tbody>
      </Table>
    </div>
  );
}
