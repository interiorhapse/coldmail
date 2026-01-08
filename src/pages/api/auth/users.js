import { supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  // Supabase 연결 체크
  if (!supabase) {
    return res.status(500).json({
      success: false,
      message: 'Supabase 환경변수가 설정되지 않았습니다.',
    });
  }

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, role')
      .order('name');

    if (error) throw error;

    return res.status(200).json({ success: true, users: users || [] });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
