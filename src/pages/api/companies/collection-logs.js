import { supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  if (!supabase) {
    return res.status(500).json({
      success: false,
      message: 'Supabase 환경변수가 설정되지 않았습니다.',
    });
  }

  if (req.method === 'GET') {
    return getCollectionLogs(req, res);
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

async function getCollectionLogs(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { data, count, error } = await supabase
      .from('collection_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: data || [],
      total: count || 0,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Error fetching collection logs:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
