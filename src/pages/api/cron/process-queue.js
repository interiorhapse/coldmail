import { supabase } from '@/lib/supabase';
import { sendEmail } from '@/lib/resend';

export default async function handler(req, res) {
  // Vercel Cron 인증 확인
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
  }

  try {
    // 발송 설정 조회
    const { data: sendSettings } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'send_settings')
      .single();

    const dailyLimit = sendSettings?.value?.daily_limit || 100;

    // 오늘 발송 수 확인
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: todaySent } = await supabase
      .from('mail_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent')
      .gte('sent_at', today.toISOString());

    if ((todaySent || 0) >= dailyLimit) {
      return res.status(200).json({
        success: true,
        message: '일일 발송 한도에 도달했습니다.',
        skipped: true,
        todaySent,
        dailyLimit,
      });
    }

    // 대기중인 항목 조회 (1건씩 처리)
    const { data: queueItem, error: fetchError } = await supabase
      .from('send_queue')
      .select('*')
      .eq('status', 'waiting')
      .order('created_at')
      .limit(1)
      .single();

    if (fetchError || !queueItem) {
      return res.status(200).json({
        success: true,
        message: '처리할 대기열 항목이 없습니다.',
        processed: 0,
      });
    }

    // 발송 처리 중으로 상태 변경
    await supabase
      .from('send_queue')
      .update({ status: 'processing', attempted_at: new Date().toISOString() })
      .eq('id', queueItem.id);

    try {
      // 이메일 발송
      const emailResult = await sendEmail({
        to: queueItem.to_email,
        subject: queueItem.subject,
        text: queueItem.body,
        html: queueItem.body.replace(/\n/g, '<br>'),
      });

      // 발송 성공
      await supabase
        .from('send_queue')
        .update({
          status: 'complete',
          sent_at: new Date().toISOString(),
          external_id: emailResult.data?.id,
        })
        .eq('id', queueItem.id);

      // 발송 로그 저장
      await supabase.from('mail_logs').insert({
        company_id: queueItem.company_id,
        draft_id: queueItem.draft_id,
        to_email: queueItem.to_email,
        from_email: queueItem.from_email,
        from_name: queueItem.from_name,
        subject: queueItem.subject,
        body: queueItem.body,
        send_order: queueItem.send_order,
        status: 'sent',
        external_id: emailResult.data?.id,
        sent_at: new Date().toISOString(),
      });

      // 기업 발송 상태 업데이트
      const sendStatusMap = { 1: '1차완료', 2: '2차완료', 3: '3차완료' };
      await supabase
        .from('companies')
        .update({
          send_status: sendStatusMap[queueItem.send_order] || '3차완료',
          send_count: queueItem.send_order,
          last_send_date: new Date().toISOString(),
        })
        .eq('id', queueItem.company_id);

      // 초안 상태 업데이트
      await supabase
        .from('drafts')
        .update({ status: 'sent' })
        .eq('id', queueItem.draft_id);

      return res.status(200).json({
        success: true,
        message: '발송 완료',
        processed: 1,
        email: queueItem.to_email,
      });

    } catch (sendError) {
      // 발송 실패
      await supabase
        .from('send_queue')
        .update({
          status: 'failed',
          error_message: sendError.message,
          retry_count: (queueItem.retry_count || 0) + 1,
        })
        .eq('id', queueItem.id);

      return res.status(200).json({
        success: false,
        message: '발송 실패',
        error: sendError.message,
      });
    }
  } catch (error) {
    console.error('Error in process-queue:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
