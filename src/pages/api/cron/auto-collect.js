import { supabase } from '@/lib/supabase';
import { spawn } from 'child_process';
import path from 'path';

export default async function handler(req, res) {
  // Vercel Cron 인증 확인
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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

    if (!settings?.enabled && req.query.force !== 'true') {
      return res.status(200).json({
        success: true,
        message: '자동 수집이 비활성화되어 있습니다.',
        skipped: true,
      });
    }

    // Python 크롤러 실행
    const crawlerPath = path.join(process.cwd(), 'scripts', 'crawler');
    const sources = settings?.sources?.join(',') || 'saramin';
    const limit = settings?.daily_limit || 200;

    const result = await runPythonCrawler(crawlerPath, sources, limit);

    // 마지막 수집 시간 업데이트
    await supabase
      .from('settings')
      .upsert({
        key: 'last_auto_collect',
        value: {
          executed_at: new Date().toISOString(),
          result: result,
        },
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

    // 활동 로그
    await supabase.from('activity_logs').insert({
      action: 'collect',
      description: `수집 완료 (${result.success}건 성공, ${result.fail}건 실패)`,
    });

    return res.status(200).json({
      success: true,
      message: `수집 완료: ${result.success}건 성공`,
      results: result,
    });
  } catch (error) {
    console.error('Error in auto-collect:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

function runPythonCrawler(crawlerPath, sources, limit) {
  return new Promise((resolve, reject) => {
    const args = [
      'main.py',
      '--source', sources.includes(',') ? 'all' : sources,
      '--limit', String(limit),
    ];

    const python = spawn('python', args, {
      cwd: crawlerPath,
      shell: true,
    });

    let stdout = '';
    let stderr = '';

    python.stdout.on('data', (data) => {
      stdout += data.toString();
      console.log(`[Crawler] ${data}`);
    });

    python.stderr.on('data', (data) => {
      stderr += data.toString();
      console.error(`[Crawler Error] ${data}`);
    });

    python.on('close', (code) => {
      if (code === 0) {
        // stdout에서 결과 파싱 시도
        const successMatch = stdout.match(/성공:\s*(\d+)/);
        const failMatch = stdout.match(/실패:\s*(\d+)/);

        resolve({
          success: successMatch ? parseInt(successMatch[1]) : 0,
          fail: failMatch ? parseInt(failMatch[1]) : 0,
          total: (successMatch ? parseInt(successMatch[1]) : 0) + (failMatch ? parseInt(failMatch[1]) : 0),
          output: stdout.slice(-500), // 마지막 500자만
        });
      } else {
        reject(new Error(`Python 크롤러 실패 (code: ${code}): ${stderr}`));
      }
    });

    python.on('error', (error) => {
      reject(new Error(`Python 실행 오류: ${error.message}`));
    });

    // 5분 타임아웃
    setTimeout(() => {
      python.kill();
      resolve({
        success: 0,
        fail: 0,
        total: 0,
        output: '타임아웃 (5분)',
        timeout: true,
      });
    }, 5 * 60 * 1000);
  });
}
