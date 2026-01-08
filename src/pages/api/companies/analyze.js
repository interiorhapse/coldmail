import { supabase } from '@/lib/supabase';
import { analyzeCompany } from '@/lib/gemini';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { company_ids } = req.body;

    if (!company_ids || !Array.isArray(company_ids) || company_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '분석할 기업을 선택해주세요.',
      });
    }

    const results = [];

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
          results.push({
            id: companyId,
            success: false,
            error: '기업을 찾을 수 없습니다.',
          });
          continue;
        }

        // AI 분석 실행
        const analysis = await analyzeCompany({
          name: company.name,
          industry: company.industry?.name || '',
          website: company.website,
        });

        // 결과 저장
        const { error: updateError } = await supabase
          .from('companies')
          .update({
            priority: analysis.priority,
            bm_summary: analysis.bm_summary,
            news_summary: analysis.news_summary,
            news_urls: analysis.news_urls || [],
            analysis_status: 'completed',
            analyzed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', companyId);

        if (updateError) throw updateError;

        // 활동 로그
        await supabase.from('activity_logs').insert({
          action: 'analyze',
          target_type: 'company',
          target_id: companyId,
          description: `${company.name} AI 분석 완료 (우선순위: ${analysis.priority})`,
        });

        results.push({
          id: companyId,
          name: company.name,
          success: true,
          analysis,
        });
      } catch (error) {
        results.push({
          id: companyId,
          success: false,
          error: error.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      results,
      total: company_ids.length,
      successCount: results.filter((r) => r.success).length,
      failCount: results.filter((r) => !r.success).length,
    });
  } catch (error) {
    console.error('Error analyzing companies:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
