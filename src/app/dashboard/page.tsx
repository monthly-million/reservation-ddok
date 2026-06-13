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

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-[#FF6B35] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">내 가게</h1>
        <Link
          href="/dashboard/shop/new"
          className="bg-[#FF6B35] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#e55a2b] transition-colors"
        >
          + 새 예약링크 만들기
        </Link>
      </div>

      {shops.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🏪</div>
          <p className="text-gray-600 mb-6">
            아직 가게가 없어요.<br />
            첫 예약링크를 만들어보세요!
          </p>
          <Link
            href="/dashboard/shop/new"
            className="inline-block bg-[#FF6B35] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#e55a2b] transition-colors"
          >
            예약링크 만들기
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {shops.map((shop) => (
            <div key={shop.id} className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-gray-900 truncate">{shop.name}</h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    /r/{shop.slug}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  {reservationCounts[shop.id] > 0 && (
                    <span className="bg-[#FF6B35] text-white text-xs font-bold px-2 py-1 rounded-full">
                      {reservationCounts[shop.id]}
                    </span>
                  )}
                  <Link
                    href={`/dashboard/shop/${shop.id}/reservations`}
                    className="text-sm text-[#FF6B35] font-medium px-3 py-1.5 border border-[#FF6B35] rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    관리
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
