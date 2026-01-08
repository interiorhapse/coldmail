import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDate, formatRelativeTime, priorityConfig } from '@/lib/utils';

function KpiCard({ title, value, subValue, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-700',
    green: 'bg-green-50 text-green-700',
    yellow: 'bg-yellow-50 text-yellow-700',
    red: 'bg-red-50 text-red-700',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
      {subValue && (
        <p className={`mt-1 text-sm ${colors[color]} px-2 py-0.5 rounded inline-block`}>
          {subValue}
        </p>
      )}
    </div>
  );
}

function TodoItem({ icon, text, count, color, href }) {
  return (
    <Link href={href} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
      <div className="flex items-center">
        <span className="text-xl mr-3">{icon}</span>
        <span className="text-sm text-gray-700">{text}</span>
      </div>
      <span className={`text-sm font-semibold ${color}`}>{count}건</span>
    </Link>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const kpi = stats?.kpi || {};
  const todo = stats?.todo || {};
  const priority = stats?.priority || {};
  const activity = stats?.activity || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard title="전체 기업" value={kpi.total_companies || 0} />
        <KpiCard title="총 발송" value={kpi.total_sent || 0} />
        <KpiCard
          title="오늘 발송"
          value={kpi.today_sent || 0}
          subValue={`/${kpi.today_limit || 100} 건`}
          color="primary"
        />
        <KpiCard
          title="대기중"
          value={kpi.queue_waiting || 0}
          color="yellow"
        />
        <KpiCard
          title="발송 실패"
          value={kpi.send_failed || 0}
          color={kpi.send_failed > 0 ? 'red' : 'green'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Todo List */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">오늘 할 일</h2>
          <div className="space-y-2">
            <TodoItem
              icon="🔥"
              text="우선순위 높음 미발송"
              count={todo.high_unsent || 0}
              color="text-red-600"
              href="/companies?priority=high&sendStatus=미발송"
            />
            <TodoItem
              icon="📬"
              text="발송 대기중"
              count={todo.queue_waiting || 0}
              color="text-yellow-600"
              href="/send?status=waiting"
            />
            <TodoItem
              icon="❌"
              text="발송 실패"
              count={todo.failed || 0}
              color="text-red-600"
              href="/send?status=failed"
            />
          </div>
        </div>

        {/* Priority Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">우선순위별 현황</h2>
          <div className="space-y-4">
            {['high', 'medium', 'low'].map((p) => {
              const data = priority[p] || { total: 0, unsent: 0 };
              const config = priorityConfig[p];
              const percent = data.total > 0 ? ((data.total - data.unsent) / data.total) * 100 : 0;

              return (
                <div key={p}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={`font-medium ${config.text}`}>{config.label}</span>
                    <span className="text-gray-500">
                      {data.total - data.unsent}/{data.total}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${config.bg.replace('50', '500')} rounded-full`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">최근 활동</h2>
          <div className="space-y-3">
            {activity.length > 0 ? (
              activity.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-start">
                  <span className="text-lg mr-2">
                    {item.type === 'send' && '📧'}
                    {item.type === 'collect' && '📥'}
                    {item.type === 'analyze' && '🤖'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 truncate">{item.text}</p>
                    <p className="text-xs text-gray-400">{item.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">최근 활동이 없습니다.</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 작업</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/companies?action=add"
            className="px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 text-sm font-medium"
          >
            + 기업 추가
          </Link>
          <Link
            href="/companies?action=csv"
            className="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm font-medium"
          >
            CSV 업로드
          </Link>
          <Link
            href="/companies?action=collect"
            className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-sm font-medium"
          >
            API 수집
          </Link>
          <Link
            href="/send"
            className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium"
          >
            발송 관리
          </Link>
        </div>
      </div>
    </div>
  );
}
