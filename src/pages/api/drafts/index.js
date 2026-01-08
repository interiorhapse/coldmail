import { supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return getDrafts(req, res);
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

async function getDrafts(req, res) {
  try {
    const { status, company_id } = req.query;

    let query = supabase
      .from('drafts')
      .select(`
        *,
        company:companies(id, name, contact_email, contact_name)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (company_id) {
      query = query.eq('company_id', company_id);
    }

    const { data, error } = await query;

    if (error) throw error;

    return res.status(200).json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
