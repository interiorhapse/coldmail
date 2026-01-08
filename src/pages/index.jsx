import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import UserSelect from '@/components/layout/UserSelect';

export default function Login() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 이미 로그인된 경우 대시보드로 이동
    const savedUser = localStorage.getItem('coldmail_user');
    if (savedUser) {
      router.push('/dashboard');
      return;
    }

    fetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/auth/users');
      const data = await res.json();

      if (data.success) {
        setUsers(data.users);
      } else {
        setError(data.message || '사용자 목록을 불러오는데 실패했습니다.');
      }
    } catch (err) {
      setError('서버 연결에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (user) => {
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('coldmail_user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        setError(data.message || '로그인에 실패했습니다.');
        setLoading(false);
      }
    } catch (err) {
      setError('로그인 처리 중 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">ColdMail</h1>
          <p className="text-gray-600">AI 기반 콜드메일 자동화 서비스</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">
            사용자를 선택하세요
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {loading && users.length === 0 ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <UserSelect
              users={users}
              onSelect={handleSelectUser}
              loading={loading}
            />
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-6">
          GPTko AI사업팀 내부 운영툴
        </p>
      </div>
    </div>
  );
}
