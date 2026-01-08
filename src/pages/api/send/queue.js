import { supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return getQueue(req, res);
  } else if (req.method === 'POST') {
    return addToQueue(req, res);
  } else if (req.method === 'PUT') {
    return updateQueue(req, res);
  } else if (req.method === 'DELETE') {
    return removeFromQueue(req, res);
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

async function getQueue(req, res) {
  try {
    const { status, search, from_date, to_date, industry } = req.query;

    let query = supabase
      .from('send_queue')
      .select(`
        *,
        draft:drafts(*),
        company:companies(id, name, contact_email, industry:industries(id, name))
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`to_email.ilike.%${search}%,subject.ilike.%${search}%`);
    }

    if (from_date) {
      query = query.gte('created_at', from_date);
    }

    if (to_date) {
      query = query.lte('created_at', to_date);
    }

    const { data, error } = await query;

    if (error) throw error;

    return res.status(200).json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching queue:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function addToQueue(req, res) {
  try {
    const { draft_ids } = req.body;

    if (!draft_ids || !Array.isArray(draft_ids) || draft_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '초안을 선택해주세요.',
      });
    }

    const results = [];

    for (const draftId of draft_ids) {
      // 초안 조회
      const { data: draft, error: fetchError } = await supabase
        .from('drafts')
        .select(`
          *,
          company:companies(id, name, contact_email)
        `)
        .eq('id', draftId)
        .single();

      if (fetchError || !draft) {
        results.push({ id: draftId, success: false, error: '초안을 찾을 수 없습니다.' });
        continue;
      }

      // 대기열에 추가
      const { error: insertError } = await supabase
        .from('send_queue')
        .insert({
          draft_id: draftId,
          company_id: draft.company_id,
          to_email: draft.company.contact_email,
          subject: draft.subject,
          body: draft.body,
          send_order: draft.send_order,
          status: 'waiting',
          from_email: process.env.SENDER_EMAIL,
          from_name: process.env.SENDER_NAME,
        });

      if (insertError) {
        results.push({ id: draftId, success: false, error: insertError.message });
        continue;
      }

      // 초안 상태 업데이트
      await supabase
        .from('drafts')
        .update({ status: 'queued' })
        .eq('id', draftId);

      results.push({ id: draftId, success: true });
    }

    return res.status(200).json({
      success: true,
      results,
      successCount: results.filter((r) => r.success).length,
      failCount: results.filter((r) => !r.success).length,
    });
  } catch (error) {
    console.error('Error adding to queue:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function updateQueue(req, res) {
  try {
    const { id, subject, body } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID가 필요합니다.',
      });
    }

    const { data, error } = await supabase
      .from('send_queue')
      .update({ subject, body })
      .eq('id', id)
      .eq('status', 'waiting')
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error updating queue:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function removeFromQueue(req, res) {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID가 필요합니다.',
      });
    }

    // 대기열 항목 조회
    const { data: queueItem } = await supabase
      .from('send_queue')
      .select('draft_id, status')
      .eq('id', id)
      .single();

    if (queueItem && queueItem.status === 'waiting') {
      // 초안 상태 복원
      await supabase
        .from('drafts')
        .update({ status: 'draft' })
        .eq('id', queueItem.draft_id);
    }

    // 삭제
    const { error } = await supabase
      .from('send_queue')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error removing from queue:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
