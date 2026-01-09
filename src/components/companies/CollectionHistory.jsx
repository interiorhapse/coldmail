import { useState, useEffect } from 'react';
import { Table, Thead, Tbody, Th, Td } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import { formatDateTime } from '@/lib/utils';

export default function CollectionHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/companies/collection-logs?page=${page}&limit=${limit}`);
      const data = await res.json();

      if (data.success) {
        setLogs(data.data);
        setTotal(data.total);
      }
    } catch (error) {
      console.error('Error fetching collection logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  const getStatusBadge = (status) => {
    const styles = {
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      running: 'bg-blue-100 text-blue-800',
    };

    const labels = {
      completed: '완료',
      failed: '실패',
      running: '진행중',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getSourceLabel = (source) => {
    const labels = {
      saramin: '사람인',
      rocketpunch: '로켓펀치',
      wanted: '원티드',
      manual: '수동',
    };
    return labels[source] || source;
  };

  if (loading && logs.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
        로딩 중...
      </div>
    );
  }

  if (!loading && logs.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center text-gray-500">
        수집 이력이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <Table>
          <Thead>
            <tr>
              <Th>수집일시</Th>
              <Th>소스</Th>
              <Th>시도</Th>
              <Th>성공</Th>
              <Th>실패</Th>
              <Th>상태</Th>
            </tr>
          </Thead>
          <Tbody>
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50">
                <Td>{formatDateTime(log.created_at)}</Td>
                <Td>{getSourceLabel(log.source)}</Td>
                <Td>{log.total_count || 0}</Td>
                <Td className="text-green-600 font-medium">{log.success_count || 0}</Td>
                <Td className="text-red-600 font-medium">{log.fail_count || 0}</Td>
                <Td>{getStatusBadge(log.status)}</Td>
              </tr>
            ))}
          </Tbody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            이전
          </Button>
          <span className="px-4 py-2 text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            다음
          </Button>
        </div>
      )}
    </div>
  );
}
