import { supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { search, status, from_date, to_date, page = 1, limit = 20 } = req.query;

    let query = supabase
      .from('mail_logs')
      .select(`
        *,
        company:companies(id, name, industry:industries(id, name))
      `, { count: 'exact' })
      .order('sent_at', { ascending: false });

    if (search) {
      query = query.or(`to_email.ilike.%${search}%,subject.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (from_date) {
      query = query.gte('sent_at', from_date);
    }

    if (to_date) {
      query = query.lte('sent_at', to_date);
    }

    // 페이지네이션
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: data || [],
      total: count || 0,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
