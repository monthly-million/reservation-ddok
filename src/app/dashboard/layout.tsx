'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createBrowserClient();
  const [loading, setLoading] = useState(true);

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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin h-6 w-6 border-2 border-[#FF6B35] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-[600px] mx-auto px-5 h-[52px] flex items-center justify-between">
          <Link href="/dashboard" className="text-[17px] font-bold text-gray-900">
            예약똑
          </Link>
          <button
            onClick={handleLogout}
            className="text-[14px] text-gray-400 active:text-gray-600"
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-[600px] w-full mx-auto px-5 py-6">
        {children}
      </main>
    </div>
  );
}
