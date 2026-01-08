import { supabase } from '@/lib/supabase';
import { validateEmail } from '@/lib/utils';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { data: csvData, industry_id, auto_analyze } = req.body;

    if (!csvData || !Array.isArray(csvData) || csvData.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'CSV 데이터가 없습니다.',
      });
    }

    const results = {
      total: csvData.length,
      success: 0,
      fail: 0,
      errors: [],
    };

    // 수집 로그 생성
    const { data: collectionLog } = await supabase
      .from('collection_logs')
      .insert({
        source: 'csv',
        industry_id,
        total_count: csvData.length,
        status: 'processing',
      })
      .select()
      .single();

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];

      try {
        // 데이터 매핑
        const companyData = {
          name: row.name || row['회사명'] || row['기업명'],
          contact_name: row.contact_name || row['담당자'] || row['담당자명'],
          contact_email: row.contact_email || row['이메일'] || row['담당자이메일'],
          contact_phone: row.contact_phone || row['전화번호'] || row['연락처'],
          contact_title: row.contact_title || row['직책'] || row['직함'],
          website: row.website || row['웹사이트'] || row['홈페이지'],
          industry_id: industry_id || null,
          source: 'csv',
          collection_log_id: collectionLog?.id,
        };

        // 필수 필드 검증
        if (!companyData.name) {
          throw new Error('회사명 누락');
        }
        if (!companyData.contact_email) {
          throw new Error('이메일 누락');
        }
        if (!validateEmail(companyData.contact_email)) {
          throw new Error('이메일 형식 오류');
        }

        // 이메일 중복 체크
        const { data: existing } = await supabase
          .from('companies')
          .select('id')
          .eq('contact_email', companyData.contact_email)
          .single();

        if (existing) {
          throw new Error('이미 등록된 이메일');
        }

        // 저장
        const { error } = await supabase.from('companies').insert(companyData);

        if (error) throw error;

        results.success++;
      } catch (error) {
        results.fail++;
        results.errors.push({
          row: i + 2, // 헤더 + 1-based index
          data: row,
          message: error.message,
        });
      }
    }

    // 수집 로그 업데이트
    await supabase
      .from('collection_logs')
      .update({
        success_count: results.success,
        fail_count: results.fail,
        status: 'completed',
      })
      .eq('id', collectionLog?.id);

    // 활동 로그
    await supabase.from('activity_logs').insert({
      action: 'collect',
      target_type: 'collection_log',
      target_id: collectionLog?.id,
      description: `CSV 업로드 완료 (성공: ${results.success}, 실패: ${results.fail})`,
    });

    return res.status(200).json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('Error uploading CSV:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
