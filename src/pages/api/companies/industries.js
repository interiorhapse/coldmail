import { supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { data, error } = await supabase
      .from('industries')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;

    return res.status(200).json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching industries:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
