import { supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    return getTemplate(id, res);
  } else if (req.method === 'PUT') {
    return updateTemplate(id, req.body, res);
  } else if (req.method === 'DELETE') {
    return deleteTemplate(id, res);
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

async function getTemplate(id, res) {
  try {
    const { data, error } = await supabase
      .from('mail_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ success: false, message: '템플릿을 찾을 수 없습니다.' });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching template:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function updateTemplate(id, body, res) {
  try {
    const { name, subject, body: templateBody, is_default } = body;

    // 기본 템플릿 설정 시 기존 기본 템플릿 해제
    if (is_default) {
      await supabase
        .from('mail_templates')
        .update({ is_default: false })
        .eq('is_default', true)
        .neq('id', id);
    }

    const { data, error } = await supabase
      .from('mail_templates')
      .update({
        name,
        subject,
        body: templateBody,
        is_default,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error updating template:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function deleteTemplate(id, res) {
  try {
    // 기본 템플릿은 삭제 불가
    const { data: template } = await supabase
      .from('mail_templates')
      .select('is_default')
      .eq('id', id)
      .single();

    if (template?.is_default) {
      return res.status(400).json({
        success: false,
        message: '기본 템플릿은 삭제할 수 없습니다.',
      });
    }

    const { error } = await supabase
      .from('mail_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
