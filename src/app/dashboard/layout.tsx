'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const supabase = createBrowserClient();
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/auth');
      } else {
        setLoading(false);
      }
    });
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#FF6B35] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="font-bold text-lg text-[#FF6B35]">
            예약뚝
          </Link>
          <div className="hidden sm:flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-gray-700 hover:text-[#FF6B35]">
              내 가게
            </Link>
            <button onClick={handleLogout} className="text-sm text-gray-500 hover:text-gray-700">
              로그아웃
            </button>
          </div>
          <button
            className="sm:hidden p-2"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="메뉴"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        {menuOpen && (
          <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-3">
            <Link href="/dashboard" className="block text-sm text-gray-700" onClick={() => setMenuOpen(false)}>
              내 가게
            </Link>
            <button onClick={handleLogout} className="block text-sm text-gray-500">
              로그아웃
            </button>
          </div>
        )}
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
