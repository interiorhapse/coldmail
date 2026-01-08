import { supabase } from '@/lib/supabase';
import { sendEmail } from '@/lib/resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { draft_ids, queue_ids } = req.body;

    // queue_ids가 있으면 대기열에서, 없으면 draft_ids로 직접 발송
    const targetIds = queue_ids || draft_ids;

    if (!targetIds || !Array.isArray(targetIds) || targetIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '발송할 항목을 선택해주세요.',
      });
    }

    const results = [];
    const isQueueSend = !!queue_ids;

    for (const id of targetIds) {
      try {
        let sendData;
        let companyId;
        let draftId;

        if (isQueueSend) {
          // 대기열에서 조회
          const { data: queueItem, error } = await supabase
            .from('send_queue')
            .select('*')
            .eq('id', id)
            .single();

          if (error || !queueItem) {
            results.push({ id, success: false, error: '대기열 항목을 찾을 수 없습니다.' });
            continue;
          }

          sendData = queueItem;
          companyId = queueItem.company_id;
          draftId = queueItem.draft_id;
        } else {
          // 초안에서 직접 조회
          const { data: draft, error } = await supabase
            .from('drafts')
            .select(`
              *,
              company:companies(id, contact_email)
            `)
            .eq('id', id)
            .single();

          if (error || !draft) {
            results.push({ id, success: false, error: '초안을 찾을 수 없습니다.' });
            continue;
          }

          sendData = {
            to_email: draft.company.contact_email,
            subject: draft.subject,
            body: draft.body,
            send_order: draft.send_order,
          };
          companyId = draft.company_id;
          draftId = draft.id;
        }

        // 이메일 발송
        const emailResult = await sendEmail({
          to: sendData.to_email,
          subject: sendData.subject,
          text: sendData.body,
          html: sendData.body.replace(/\n/g, '<br>'),
        });

        // 발송 로그 저장
        await supabase.from('mail_logs').insert({
          company_id: companyId,
          draft_id: draftId,
          to_email: sendData.to_email,
          from_email: process.env.SENDER_EMAIL,
          from_name: process.env.SENDER_NAME,
          subject: sendData.subject,
          body: sendData.body,
          send_order: sendData.send_order,
          status: 'sent',
          external_id: emailResult.data?.id,
          sent_at: new Date().toISOString(),
        });

        // 기업 발송 상태 업데이트
        const sendStatusMap = {
          1: '1차완료',
          2: '2차완료',
          3: '3차완료',
        };
        const newStatus = sendStatusMap[sendData.send_order] || '3차완료';

        await supabase
          .from('companies')
          .update({
            send_status: newStatus,
            send_count: sendData.send_order,
            last_send_date: new Date().toISOString(),
          })
          .eq('id', companyId);

        // 초안 상태 업데이트
        await supabase
          .from('drafts')
          .update({ status: 'sent' })
          .eq('id', draftId);

        // 대기열 상태 업데이트 (대기열 발송인 경우)
        if (isQueueSend) {
          await supabase
            .from('send_queue')
            .update({
              status: 'complete',
              sent_at: new Date().toISOString(),
            })
            .eq('id', id);
        }

        results.push({ id, success: true, email: sendData.to_email });

      } catch (error) {
        // 실패 로그 저장
        if (isQueueSend) {
          await supabase
            .from('send_queue')
            .update({
              status: 'failed',
              error_message: error.message,
              attempted_at: new Date().toISOString(),
              retry_count: supabase.raw('retry_count + 1'),
            })
            .eq('id', id);
        }

        results.push({ id, success: false, error: error.message });
      }
    }

    // 활동 로그
    const successCount = results.filter((r) => r.success).length;
    if (successCount > 0) {
      await supabase.from('activity_logs').insert({
        action: 'send',
        description: `이메일 ${successCount}건 발송 완료`,
      });
    }

    return res.status(200).json({
      success: true,
      results,
      successCount,
      failCount: results.filter((r) => !r.success).length,
    });
  } catch (error) {
    console.error('Error sending emails:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
