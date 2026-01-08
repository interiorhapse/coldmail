import { supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return getTemplates(req, res);
  } else if (req.method === 'POST') {
    return createTemplate(req, res);
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

async function getTemplates(req, res) {
  try {
    const { data, error } = await supabase
      .from('mail_templates')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.status(200).json({ success: true, data: data || [] });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function createTemplate(req, res) {
  try {
    const { name, subject, body, is_default } = req.body;

    if (!name || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: '템플릿 이름, 제목, 본문은 필수입니다.',
      });
    }

    // 기본 템플릿 설정 시 기존 기본 템플릿 해제
    if (is_default) {
      await supabase
        .from('mail_templates')
        .update({ is_default: false })
        .eq('is_default', true);
    }

    const { data, error } = await supabase
      .from('mail_templates')
      .insert({
        name,
        subject,
        body,
        is_default: is_default || false,
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Error creating template:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
