import { supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    return getDraft(id, res);
  } else if (req.method === 'PUT') {
    return updateDraft(id, req.body, res);
  } else if (req.method === 'DELETE') {
    return deleteDraft(id, res);
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

async function getDraft(id, res) {
  try {
    const { data, error } = await supabase
      .from('drafts')
      .select(`
        *,
        company:companies(id, name, contact_email, contact_name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching draft:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function updateDraft(id, body, res) {
  try {
    const { subject, body: draftBody, demo_link, status } = body;

    const { data, error } = await supabase
      .from('drafts')
      .update({
        subject,
        body: draftBody,
        demo_link,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error updating draft:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function deleteDraft(id, res) {
  try {
    const { error } = await supabase
      .from('drafts')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting draft:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
