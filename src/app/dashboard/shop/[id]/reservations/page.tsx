'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Reservation, ReservationAnswer } from '@/types/database';

type DateFilter = 'all' | 'today' | 'tomorrow' | 'week';
type StatusFilter = 'all' | 'new' | 'confirmed' | 'completed' | 'no_show' | 'cancelled';

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

const STATUS_LABELS: Record<string, string> = {
  new: '신규',
  confirmed: '확인',
  completed: '완료',
  no_show: '노쇼',
  cancelled: '취소',
};

const STATUS_STYLES: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  no_show: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-400',
};

export default function ReservationsPage() {
  const params = useParams();
  const shopId = params.id as string;
  const supabase = createBrowserClient();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMenuId, setStatusMenuId] = useState<string | null>(null);
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

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().replace(/[%_]/g, '\\$&');
      query = query.or(`customer_name.ilike.%${q}%,customer_phone.ilike.%${q}%`);
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
  }, [shopId, supabase, dateFilter, statusFilter, searchQuery]);

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

  async function updateStatus(id: string, newStatus: 'confirmed' | 'completed' | 'no_show' | 'cancelled') {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`/api/reservations/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)),
      );
    }
    setStatusMenuId(null);
  }

  // Check if customer has no-show history (via joined customer or inline)
  function getNoShowCount(r: Reservation): number {
    return (r as Reservation & { customer?: { no_show_count?: number } }).customer?.no_show_count ?? 0;
  }

  const dateFilters: { key: DateFilter; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'today', label: '오늘' },
    { key: 'tomorrow', label: '내일' },
    { key: 'week', label: '이번 주' },
  ];

  const statusFilters: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'new', label: '신규' },
    { key: 'confirmed', label: '확인' },
    { key: 'completed', label: '완료' },
    { key: 'no_show', label: '노쇼' },
    { key: 'cancelled', label: '취소' },
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
      <h1 className="text-xl font-bold text-gray-900 mb-4">예약 관리</h1>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="이름 또는 전화번호 검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 h-[40px] rounded-xl border border-gray-200 text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35]"
        />
      </div>

      {/* Date filter */}
      <div className="flex gap-2 mb-3">
        {dateFilters.map((f) => (
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

      {/* Status filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {statusFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`px-3 h-[28px] rounded-full text-[12px] font-medium transition-colors whitespace-nowrap ${
              statusFilter === f.key
                ? 'bg-gray-900 text-white'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
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
            {dateFilter === 'all' && statusFilter === 'all' && !searchQuery
              ? '아직 예약이 없어요.'
              : '조건에 맞는 예약이 없어요.'}
            <br />
            {dateFilter === 'all' && statusFilter === 'all' && !searchQuery && '링크를 SNS에 공유해보세요!'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => {
            const noShowCount = getNoShowCount(r);
            return (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Status badge / action */}
                      {r.status === 'new' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatus(r.id, 'confirmed');
                          }}
                          className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-100 text-blue-700 hover:bg-green-100 hover:text-green-700"
                        >
                          신규
                        </button>
                      ) : r.status === 'confirmed' ? (
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setStatusMenuId(statusMenuId === r.id ? null : r.id);
                            }}
                            className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 text-green-700 hover:bg-green-200"
                          >
                            확인됨 ▾
                          </button>
                          {statusMenuId === r.id && (
                            <div className="absolute top-6 left-0 z-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[80px]">
                              <button
                                onClick={(e) => { e.stopPropagation(); updateStatus(r.id, 'completed'); }}
                                className="block w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                              >
                                완료
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); updateStatus(r.id, 'no_show'); }}
                                className="block w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
                              >
                                노쇼
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[r.status]}`}>
                          {STATUS_LABELS[r.status]}
                        </span>
                      )}
                      <span className="font-medium text-gray-900 text-sm">{r.customer_name}</span>
                      {noShowCount > 0 && (
                        <span className="text-[11px] text-red-500 font-medium">⚠ 노쇼 {noShowCount}회</span>
                      )}
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
                    {r.reference_code && (
                      <span className="text-[11px] text-gray-400 font-mono">#{r.reference_code}</span>
                    )}
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
            );
          })}

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
