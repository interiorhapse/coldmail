import { supabase } from '@/lib/supabase';
import { generateDraft } from '@/lib/gemini';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { company_ids, template_id, demo_link } = req.body;

    if (!company_ids || !Array.isArray(company_ids) || company_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '기업을 선택해주세요.',
      });
    }

    // 템플릿 조회
    let template;
    if (template_id) {
      const { data } = await supabase
        .from('mail_templates')
        .select('*')
        .eq('id', template_id)
        .single();
      template = data;
    } else {
      // 기본 템플릿 사용
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
        message: '템플릿을 찾을 수 없습니다.',
      });
    }

    // 서명 조회
    const { data: signature } = await supabase
      .from('signatures')
      .select('content')
      .eq('is_default', true)
      .single();

    const drafts = [];
    const errors = [];

    for (const companyId of company_ids) {
      try {
        // 기업 정보 조회
        const { data: company, error: fetchError } = await supabase
          .from('companies')
          .select(`
            *,
            industry:industries(id, name)
          `)
          .eq('id', companyId)
          .single();

        if (fetchError || !company) {
          errors.push({ id: companyId, error: '기업을 찾을 수 없습니다.' });
          continue;
        }

        // 현재 발송 차수 계산
        const sendOrder = (company.send_count || 0) + 1;

        // AI 초안 생성
        const draftResult = await generateDraft(
          {
            name: company.name,
            industry: company.industry?.name || '',
            contact_name: company.contact_name || '담당자',
            bm_summary: company.bm_summary || '',
            news_summary: company.news_summary || '',
          },
          template,
          demo_link || 'https://demo.gptko.co.kr',
          process.env.SENDER_NAME || 'GPTko AI사업팀'
        );

        // 서명 추가
        let finalBody = draftResult.body;
        if (signature?.content) {
          finalBody = finalBody.replace('{{sender_signature}}', signature.content);
        }

        // 초안 저장
        const { data: draft, error: insertError } = await supabase
          .from('drafts')
          .insert({
            company_id: companyId,
            template_id: template.id,
            subject: draftResult.subject,
            body: finalBody,
            demo_link: demo_link,
            send_order: sendOrder,
            status: 'draft',
          })
          .select()
          .single();

        if (insertError) throw insertError;

        drafts.push({
          ...draft,
          company_name: company.name,
          contact_email: company.contact_email,
        });

      } catch (error) {
        errors.push({ id: companyId, error: error.message });
      }
    }

    // 활동 로그
    if (drafts.length > 0) {
      await supabase.from('activity_logs').insert({
        action: 'draft',
        target_type: 'draft',
        description: `AI 초안 ${drafts.length}건 생성`,
      });
    }

    return res.status(200).json({
      success: true,
      drafts,
      errors,
      total: company_ids.length,
      successCount: drafts.length,
      failCount: errors.length,
    });
  } catch (error) {
    console.error('Error generating drafts:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
