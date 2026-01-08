import { supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, message: '사용자 ID가 필요합니다.' });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('id', userId)
      .single();

    if (error) throw error;

    if (!user) {
      return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
    }

    return res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Error logging in:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
