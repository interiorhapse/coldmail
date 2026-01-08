import { supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return getSettings(res);
  } else if (req.method === 'PUT') {
    return updateSettings(req.body, res);
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

async function getSettings(res) {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*');

    if (error) throw error;

    // 키-값 객체로 변환
    const settings = {};
    (data || []).forEach((item) => {
      settings[item.key] = item.value;
    });

    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function updateSettings(body, res) {
  try {
    const updates = Object.entries(body);

    for (const [key, value] of updates) {
      await supabase
        .from('settings')
        .upsert({
          key,
          value,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
