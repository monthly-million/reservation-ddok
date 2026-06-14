'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Reservation, ReservationAnswer } from '@/types/database';

type DateFilter = 'all' | 'today' | 'tomorrow' | 'week';

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

function getDateStr(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function getEndOfWeek(): string {
  const d = new Date();
  const dayOfWeek = d.getDay();
  const daysUntilSunday = 7 - dayOfWeek;
  d.setDate(d.getDate() + daysUntilSunday);
  return d.toISOString().slice(0, 10);
}

function formatReservedDateTime(date: string | null, time: string | null): string | null {
  if (!date) return null;
  const d = new Date(date + 'T00:00:00');
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const timeStr = time ? ` ${time.slice(0, 5)}` : '';
  return `${month}/${day}${timeStr}`;
}

export default function ReservationsPage() {
  const params = useParams();
  const shopId = params.id as string;
  const supabase = createBrowserClient();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const PAGE_SIZE = 20;

  const fetchReservations = useCallback(async (offset = 0) => {
    let query = supabase
      .from('reservations')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    if (dateFilter === 'today') {
      query = query.eq('reserved_date', getDateStr(0));
    } else if (dateFilter === 'tomorrow') {
      query = query.eq('reserved_date', getDateStr(1));
    } else if (dateFilter === 'week') {
      query = query.gte('reserved_date', getDateStr(0)).lte('reserved_date', getEndOfWeek());
    }

    const { data } = await query.range(offset, offset + PAGE_SIZE - 1);

    const rows = (data || []) as Reservation[];
    if (offset === 0) {
      setReservations(rows);
    } else {
      setReservations((prev) => [...prev, ...rows]);
    }
    setHasMore(rows.length === PAGE_SIZE);
    setLoading(false);
  }, [shopId, supabase, dateFilter]);

  useEffect(() => {
    setLoading(true);
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

  const filters: { key: DateFilter; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'today', label: '오늘' },
    { key: 'tomorrow', label: '내일' },
    { key: 'week', label: '이번 주' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-[#FF6B35] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">예약 관리</h1>
        <Link
          href={`/dashboard/shop/${shopId}/edit`}
          className="text-sm text-gray-500 hover:text-[#FF6B35]"
        >
          가게 수정
        </Link>
      </div>

      {/* Date filter tabs */}
      <div className="flex gap-2 mb-6">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setDateFilter(f.key)}
            className={`px-3 h-[32px] rounded-full text-[13px] font-medium transition-colors ${
              dateFilter === f.key
                ? 'bg-[#FF6B35] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {reservations.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-gray-600">
            {dateFilter === 'all' ? '아직 예약이 없어요.' : '해당 기간에 예약이 없어요.'}
            <br />
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
                <div className="mt-1 flex items-center gap-3">
                  {formatReservedDateTime(r.reserved_date, r.reserved_time) && (
                    <span className="text-[13px] font-medium text-gray-700">
                      {formatReservedDateTime(r.reserved_date, r.reserved_time)}
                    </span>
                  )}
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
