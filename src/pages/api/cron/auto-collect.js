import { supabase } from '@/lib/supabase';

export default async function handler(req, res) {
  // Vercel Cron 인증 확인
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // 개발 환경에서는 통과
    if (process.env.NODE_ENV === 'production') {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
  }

  try {
    // 설정 조회
    const { data: settingsData } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'auto_collect')
      .single();

    const settings = settingsData?.value;

    if (!settings?.enabled) {
      return res.status(200).json({
        success: true,
        message: '자동 수집이 비활성화되어 있습니다.',
        skipped: true,
      });
    }

    // 수집 로직 (실제 API 연동 필요)
    const results = {
      total: 0,
      success: 0,
      fail: 0,
    };

    // 각 업종별로 수집
    for (const industryId of settings.industries || []) {
      try {
        // TODO: 실제 공공데이터/Apollo API 연동
        // 현재는 더미 로직
        const count = settings.count_per_industry || 20;

        // 수집 로그 생성
        await supabase.from('collection_logs').insert({
          source: 'auto',
          industry_id: industryId,
          total_count: count,
          success_count: count,
          fail_count: 0,
          status: 'completed',
        });

        results.total += count;
        results.success += count;
      } catch (error) {
        results.fail++;
        console.error(`Error collecting for industry ${industryId}:`, error);
      }
    }

    // 마지막 수집 시간 업데이트
    await supabase
      .from('settings')
      .upsert({
        key: 'last_auto_collect',
        value: {
          executed_at: new Date().toISOString(),
          result: results,
        },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

    // 활동 로그
    await supabase.from('activity_logs').insert({
      action: 'collect',
      description: `자동 수집 완료 (${results.success}건)`,
    });

    return res.status(200).json({
      success: true,
      message: '자동 수집 완료',
      results,
    });
  } catch (error) {
    console.error('Error in auto-collect:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
