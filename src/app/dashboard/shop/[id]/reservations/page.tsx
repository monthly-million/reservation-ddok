'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Reservation, ReservationAnswer } from '@/types/database';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

export default function ReservationsPage() {
  const params = useParams();
  const shopId = params.id as string;
  const supabase = createBrowserClient();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const PAGE_SIZE = 20;

  const fetchReservations = useCallback(async (offset = 0) => {
    const { data } = await supabase
      .from('reservations')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    const rows = (data || []) as Reservation[];
    if (offset === 0) {
      setReservations(rows);
    } else {
      setReservations((prev) => [...prev, ...rows]);
    }
    setHasMore(rows.length === PAGE_SIZE);
    setLoading(false);
  }, [shopId, supabase]);

  useEffect(() => {
    fetchReservations();

    const channel = supabase
      .channel(`reservations:${shopId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'reservations', filter: `shop_id=eq.${shopId}` },
        (payload) => {
          setReservations((prev) => [payload.new as Reservation, ...prev]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReservations, supabase, shopId]);

  async function markConfirmed(id: string) {
    await supabase.from('reservations').update({ status: 'confirmed' }).eq('id', id);
    setReservations((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'confirmed' } : r)),
    );
  }

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
        <h1 className="text-xl font-bold text-gray-900">예약 관리</h1>
        <Link
          href={`/dashboard/shop/${shopId}/edit`}
          className="text-sm text-gray-500 hover:text-[#FF6B35]"
        >
          가게 수정
        </Link>
      </div>

      {reservations.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-gray-600">
            아직 예약이 없어요.<br />
            링크를 SNS에 공유해보세요!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (r.status === 'new') markConfirmed(r.id);
                      }}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        r.status === 'new'
                          ? 'bg-blue-100 text-blue-700 hover:bg-green-100 hover:text-green-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {r.status === 'new' ? '신규' : '확인됨'}
                    </button>
                    <span className="font-medium text-gray-900 text-sm">{r.customer_name}</span>
                  </div>
                  <span className="text-xs text-gray-400">{timeAgo(r.created_at)}</span>
                </div>
                <div className="mt-1">
                  <a
                    href={`tel:${r.customer_phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm text-[#FF6B35] hover:underline"
                  >
                    {r.customer_phone}
                  </a>
                </div>
              </div>

              {expandedId === r.id && r.answers && r.answers.length > 0 && (
                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 space-y-2">
                  {r.answers.map((a: ReservationAnswer, i: number) => (
                    <div key={i}>
                      <p className="text-xs text-gray-500">{a.question_title}</p>
                      {a.type === 'image' ? (
                        <a href={a.value} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                          이미지 보기
                        </a>
                      ) : (
                        <p className="text-sm text-gray-800">{a.value}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {hasMore && (
            <button
              onClick={() => fetchReservations(reservations.length)}
              className="w-full py-3 text-sm text-gray-500 hover:text-[#FF6B35] transition-colors"
            >
              더 보기
            </button>
          )}
        </div>
      )}
    </div>
  );
}
