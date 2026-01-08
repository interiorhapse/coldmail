import { supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { data, error } = await supabase
      .from('demo_links')
      .select('*')
      .eq('is_active', true)
      .order('created_at');

    if (error) throw error;

    return res.status(200).json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching demo links:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
