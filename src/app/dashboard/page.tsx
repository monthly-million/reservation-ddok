'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Shop } from '@/types/database';

export default function DashboardPage() {
  const supabase = createBrowserClient();
  const [shops, setShops] = useState<Shop[]>([]);
  const [reservationCounts, setReservationCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    async function loadShops() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('shops')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      const shopList = data || [];
      setShops(shopList);

      if (shopList.length > 0) {
        const counts: Record<string, number> = {};
        for (const shop of shopList) {
          const { count } = await supabase
            .from('reservations')
            .select('*', { count: 'exact', head: true })
            .eq('shop_id', shop.id)
            .eq('status', 'new');
          counts[shop.id] = count || 0;
        }
        setReservationCounts(counts);
      }

      setLoading(false);
    }
    loadShops();
  }, [supabase]);

  function handleCopy(shop: Shop) {
    const url = `${window.location.origin}/r/${shop.slug}`;
    navigator.clipboard.writeText(url);
    setCopied(shop.id);
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin h-6 w-6 border-2 border-[#FF6B35] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[22px] font-bold text-gray-900">내 가게</h1>
        <Link
          href="/dashboard/shop/new"
          className="h-[36px] inline-flex items-center px-4 rounded-full bg-[#FF6B35] text-[13px] font-semibold text-white active:scale-[0.95] transition"
        >
          + 새 링크
        </Link>
      </div>

      {shops.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-[15px] text-gray-400 leading-relaxed">
            아직 가게가 없어요<br />
            첫 예약링크를 만들어보세요
          </p>
          <Link
            href="/dashboard/shop/new"
            className="mt-6 inline-flex h-[48px] items-center px-6 rounded-2xl bg-[#FF6B35] text-[15px] font-semibold text-white active:scale-[0.97] transition"
          >
            예약링크 만들기
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {shops.map((shop) => (
            <div key={shop.id} className="rounded-2xl border border-gray-100 bg-[#fafafa] p-5">
              {/* 가게 정보 */}
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <h2 className="text-[17px] font-semibold text-gray-900 truncate">{shop.name}</h2>
                  <p className="mt-1 text-[13px] text-gray-400">/r/{shop.slug}</p>
                </div>
                {reservationCounts[shop.id] > 0 && (
                  <span className="flex-none ml-3 px-2.5 py-1 rounded-full bg-red-500 text-white text-[12px] font-bold">
                    {reservationCounts[shop.id]}건
                  </span>
                )}
              </div>

              {/* 버튼 영역 */}
              <div className="mt-4 flex gap-2">
                <Link
                  href={`/dashboard/shop/${shop.id}/reservations`}
                  className="flex-1 h-[44px] flex items-center justify-center rounded-xl bg-gray-900 text-[14px] font-medium text-white active:scale-[0.97] transition"
                >
                  예약 관리
                </Link>
                <button
                  onClick={() => handleCopy(shop)}
                  className="flex-1 h-[44px] flex items-center justify-center rounded-xl border border-gray-200 bg-white text-[14px] font-medium text-gray-700 active:scale-[0.97] transition"
                >
                  {copied === shop.id ? (
                    <span className="text-[#FF6B35]">복사됨!</span>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      링크 복사
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
