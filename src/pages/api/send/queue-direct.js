import { supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { company_ids, template_id } = req.body;

    if (!company_ids || !Array.isArray(company_ids) || company_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '기업을 선택해주세요.',
      });
    }

    // 템플릿 조회 (없으면 기본 템플릿)
    let template;
    if (template_id) {
      const { data } = await supabase
        .from('mail_templates')
        .select('*')
        .eq('id', template_id)
        .single();
      template = data;
    }

    if (!template) {
      const { data } = await supabase
        .from('mail_templates')
        .select('*')
        .eq('is_default', true)
        .single();
      template = data;
    }

    if (!template) {
      return res.status(400).json({
        success: false,
        message: '사용 가능한 템플릿이 없습니다.',
      });
    }

    // 기본 서명 조회
    const { data: signatureData } = await supabase
      .from('signatures')
      .select('content')
      .eq('is_default', true)
      .single();

    const signature = signatureData?.content || `${process.env.SENDER_NAME || ''}\nEmail: ${process.env.SENDER_EMAIL || ''}`;

    const results = [];

    for (const companyId of company_ids) {
      try {
        // 기업 정보 조회
        const { data: company, error: companyError } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .single();

        if (companyError || !company) {
          results.push({ id: companyId, success: false, error: '기업을 찾을 수 없습니다.' });
          continue;
        }

        // 템플릿 변수 치환
        const subject = replaceVariables(template.subject, company, signature);
        const body = replaceVariables(template.body, company, signature);

        // send_order 결정 (현재 발송 횟수 + 1)
        const sendOrder = (company.send_count || 0) + 1;

        // 대기열에 추가
        const { error: insertError } = await supabase
          .from('send_queue')
          .insert({
            company_id: companyId,
            to_email: company.contact_email,
            subject,
            body,
            send_order: sendOrder,
            status: 'waiting',
            from_email: process.env.SENDER_EMAIL,
            from_name: process.env.SENDER_NAME,
          });

        if (insertError) {
          results.push({ id: companyId, success: false, error: insertError.message });
          continue;
        }

        results.push({ id: companyId, success: true, company: company.name });

      } catch (err) {
        results.push({ id: companyId, success: false, error: err.message });
      }
    }

    return res.status(200).json({
      success: true,
      results,
      successCount: results.filter((r) => r.success).length,
      failCount: results.filter((r) => !r.success).length,
    });
  } catch (error) {
    console.error('Error adding to queue directly:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

function replaceVariables(text, company, signature) {
  if (!text) return '';

  const senderName = process.env.SENDER_NAME || '';
  const senderEmail = process.env.SENDER_EMAIL || '';

  return text
    .replace(/\{\{company_name\}\}/g, company.name || '')
    .replace(/\{\{contact_name\}\}/g, company.contact_name || '담당자')
    .replace(/\{\{contact_title\}\}/g, company.contact_title || '')
    .replace(/\{\{bm_summary\}\}/g, company.bm_summary || '')
    .replace(/\{\{news_summary\}\}/g, company.news_summary || '')
    .replace(/\{\{sender_name\}\}/g, senderName)
    .replace(/\{\{sender_email\}\}/g, senderEmail)
    .replace(/\{\{custom_intro\}\}/g, '')
    .replace(/\{\{custom_proposal\}\}/g, '')
    .replace(/\{\{demo_link\}\}/g, '')
    .replace(/\{\{sender_signature\}\}/g, signature || senderName);
}
