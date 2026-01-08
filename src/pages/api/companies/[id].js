import { supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    return getCompany(id, res);
  } else if (req.method === 'PUT') {
    return updateCompany(id, req.body, res);
  } else if (req.method === 'DELETE') {
    return deleteCompany(id, res);
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

async function getCompany(id, res) {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select(`
        *,
        industry:industries(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ success: false, message: '기업을 찾을 수 없습니다.' });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching company:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function updateCompany(id, body, res) {
  try {
    const {
      name,
      industry_id,
      website,
      contact_name,
      contact_title,
      contact_email,
      contact_phone,
      priority,
      memo,
    } = body;

    const { data, error } = await supabase
      .from('companies')
      .update({
        name,
        industry_id,
        website,
        contact_name,
        contact_title,
        contact_email,
        contact_phone,
        priority,
        memo,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error updating company:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function deleteCompany(id, res) {
  try {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting company:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
