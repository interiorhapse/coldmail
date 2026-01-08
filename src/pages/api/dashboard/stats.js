import { supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    // 전체 기업 수
    const { count: totalCompanies } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true });

    // 총 발송 수
    const { count: totalSent } = await supabase
      .from('mail_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent');

    // 오늘 발송 수
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: todaySent } = await supabase
      .from('mail_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent')
      .gte('sent_at', today.toISOString());

    // 대기열 대기 수
    const { count: queueWaiting } = await supabase
      .from('send_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'waiting');

    // 발송 실패 수
    const { count: sendFailed } = await supabase
      .from('send_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed');

    // 우선순위 높음 미발송
    const { count: highUnsent } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .eq('priority', 'high')
      .eq('send_status', '미발송');

    // 우선순위별 통계
    const priorityStats = {};
    for (const priority of ['high', 'medium', 'low']) {
      const { count: total } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('priority', priority);

      const { count: unsent } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('priority', priority)
        .eq('send_status', '미발송');

      priorityStats[priority] = { total: total || 0, unsent: unsent || 0 };
    }

    // 최근 활동
    const { data: activityLogs } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    const activity = (activityLogs || []).map((log) => ({
      type: log.action,
      text: log.description,
      time: formatRelativeTime(log.created_at),
    }));

    // 발송 설정에서 일일 한도 가져오기
    const { data: sendSettings } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'send_settings')
      .single();

    const dailyLimit = sendSettings?.value?.daily_limit || 100;

    return res.status(200).json({
      success: true,
      kpi: {
        total_companies: totalCompanies || 0,
        total_sent: totalSent || 0,
        today_sent: todaySent || 0,
        today_limit: dailyLimit,
        queue_waiting: queueWaiting || 0,
        send_failed: sendFailed || 0,
      },
      todo: {
        high_unsent: highUnsent || 0,
        queue_waiting: queueWaiting || 0,
        failed: sendFailed || 0,
      },
      priority: priorityStats,
      activity,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

function formatRelativeTime(date) {
  if (!date) return '-';

  const d = new Date(date);
  const now = new Date();
  const diff = now - d;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;

  return date;
}
