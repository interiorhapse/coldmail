import { supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  // Supabase 연결 체크
  if (!supabase) {
    return res.status(500).json({
      success: false,
      message: 'Supabase 환경변수가 설정되지 않았습니다.',
    });
  }

  if (req.method === 'GET') {
    return getCompanies(req, res);
  } else if (req.method === 'POST') {
    return createCompany(req, res);
  } else if (req.method === 'DELETE') {
    return deleteCompanies(req, res);
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

async function getCompanies(req, res) {
  try {
    const {
      search,
      industry,
      priority,
      sendStatus,
      page = 1,
      limit = 20,
    } = req.query;

    let query = supabase
      .from('companies')
      .select(`
        *,
        industry:industries(id, name)
      `, { count: 'exact' });

    // 검색
    if (search) {
      query = query.or(`name.ilike.%${search}%,contact_name.ilike.%${search}%,contact_email.ilike.%${search}%`);
    }

    // 필터
    if (industry) {
      query = query.eq('industry_id', industry);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }
    if (sendStatus) {
      query = query.eq('send_status', sendStatus);
    }

    // 페이지네이션
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    const { data, count, error } = await query;

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: data || [],
      total: count || 0,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function createCompany(req, res) {
  try {
    const {
      name,
      industry_id,
      website,
      contact_name,
      contact_title,
      contact_email,
      contact_phone,
      memo,
    } = req.body;

    if (!name || !contact_email) {
      return res.status(400).json({
        success: false,
        message: '회사명과 담당자 이메일은 필수입니다.',
      });
    }

    // 이메일 중복 체크
    const { data: existing } = await supabase
      .from('companies')
      .select('id')
      .eq('contact_email', contact_email)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({
        success: false,
        message: '이미 등록된 이메일입니다.',
      });
    }

    const { data, error } = await supabase
      .from('companies')
      .insert({
        name,
        industry_id: industry_id || null,
        website,
        contact_name,
        contact_title,
        contact_email,
        contact_phone,
        memo,
        source: 'manual',
      })
      .select()
      .single();

    if (error) throw error;

    // 활동 로그 (실패해도 무시)
    try {
      await supabase.from('activity_logs').insert({
        action: 'create',
        target_type: 'company',
        target_id: data.id,
        description: `${name} 기업 추가`,
      });
    } catch (e) {
      // 무시
    }

    return res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Error creating company:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function deleteCompanies(req, res) {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '삭제할 기업 ID가 필요합니다.',
      });
    }

    const { error } = await supabase
      .from('companies')
      .delete()
      .in('id', ids);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: `${ids.length}개 기업 삭제 완료`,
      deletedCount: ids.length,
    });
  } catch (error) {
    console.error('Error deleting companies:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
