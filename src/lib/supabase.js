import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 클라이언트 사이드용
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// 서버 사이드용 (Service Role Key)
export function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
  }

  return createClient(url, key);
}

// 환경변수 체크 헬퍼
export function checkSupabaseConfig() {
  if (!supabaseUrl) {
    return { ok: false, error: 'NEXT_PUBLIC_SUPABASE_URL 미설정' };
  }
  if (!supabaseAnonKey) {
    return { ok: false, error: 'NEXT_PUBLIC_SUPABASE_ANON_KEY 미설정' };
  }
  return { ok: true };
}
