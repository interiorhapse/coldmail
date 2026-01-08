import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from './Navbar';

export default function Layout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('coldmail_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    } else if (router.pathname !== '/') {
      router.push('/');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('coldmail_user');
    setUser(null);
    router.push('/');
  };

  // 로그인 페이지는 레이아웃 없이 표시
  if (router.pathname === '/') {
    return <>{children}</>;
  }

  // 로그인되지 않은 경우 로딩
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
