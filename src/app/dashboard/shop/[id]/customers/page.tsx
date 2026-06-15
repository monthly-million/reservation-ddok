'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import type { Customer, Reservation } from '@/types/database';

const PRESET_TAGS = ['VIP', '단골', '노쇼주의'];
const PAGE_SIZE = 20;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${m}/${day}`;
}

function statusLabel(status: string): { text: string; className: string } {
  switch (status) {
    case 'new': return { text: '신규', className: 'bg-blue-100 text-blue-700' };
    case 'confirmed': return { text: '확인', className: 'bg-green-100 text-green-700' };
    case 'completed': return { text: '완료', className: 'bg-gray-100 text-gray-700' };
    case 'no_show': return { text: '노쇼', className: 'bg-red-100 text-red-700' };
    case 'cancelled': return { text: '취소', className: 'bg-yellow-100 text-yellow-700' };
    default: return { text: status, className: 'bg-gray-100 text-gray-600' };
  }
}

function tagColor(tag: string): string {
  if (tag === 'VIP') return 'bg-amber-100 text-amber-800';
  if (tag === '단골') return 'bg-green-100 text-green-800';
  if (tag === '노쇼주의') return 'bg-red-100 text-red-800';
  return 'bg-purple-100 text-purple-800';
}

export default function CustomersPage() {
  const params = useParams();
  const shopId = params.id as string;
  const supabase = createBrowserClient();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchCustomers = useCallback(async (offset = 0) => {
    const params = new URLSearchParams({
      shop_id: shopId,
      offset: String(offset),
      limit: String(PAGE_SIZE),
    });
    if (search) params.set('search', search);
    if (activeTag) params.set('tag', activeTag);

    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`/api/customers?${params}`, {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    const json = await res.json();

    if (offset === 0) {
      setCustomers(json.customers || []);
    } else {
      setCustomers((prev) => [...prev, ...(json.customers || [])]);
    }
    setHasMore(json.hasMore || false);
    setLoading(false);
  }, [shopId, search, activeTag, supabase]);

  useEffect(() => {
    setLoading(true);
    setExpandedId(null);
    const timer = setTimeout(() => fetchCustomers(), 300);
    return () => clearTimeout(timer);
  }, [fetchCustomers]);

  const allTags = ['전체', ...PRESET_TAGS];

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-4">고객 관리</h1>

      {/* Search */}
      <div className="relative mb-3">
        <input
          type="text"
          placeholder="이름 또는 전화번호 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-[42px] pl-10 pr-4 rounded-xl border border-gray-200 bg-white text-[14px] focus:outline-none focus:border-[#FF6B35] transition-colors"
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {/* Tag filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {allTags.map((tag) => (
          <button
            key={tag}
            onClick={() => setActiveTag(tag === '전체' ? '' : tag)}
            className={`px-3 h-[32px] rounded-full text-[13px] font-medium whitespace-nowrap transition-colors active:scale-[0.97] ${
              (tag === '전체' && !activeTag) || activeTag === tag
                ? 'bg-[#FF6B35] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-[#FF6B35] border-t-transparent rounded-full" />
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">👥</div>
          <p className="text-gray-600">
            {search || activeTag ? '조건에 맞는 고객이 없어요.' : '아직 고객이 없어요.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {customers.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              expanded={expandedId === customer.id}
              onToggle={() => setExpandedId(expandedId === customer.id ? null : customer.id)}
              shopId={shopId}
              supabase={supabase}
              onUpdate={(updated) => {
                setCustomers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
              }}
            />
          ))}

          {hasMore && (
            <button
              onClick={() => fetchCustomers(customers.length)}
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

function CustomerCard({
  customer,
  expanded,
  onToggle,
  shopId,
  supabase,
  onUpdate,
}: {
  customer: Customer;
  expanded: boolean;
  onToggle: () => void;
  shopId: string;
  supabase: ReturnType<typeof createBrowserClient>;
  onUpdate: (c: Customer) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-4 cursor-pointer active:bg-gray-50 transition-colors" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[16px] text-gray-900">{customer.name}</span>
            <span className="text-[13px] text-gray-400">방문 {customer.visit_count}회</span>
          </div>
          <a
            href={`tel:${customer.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="text-[13px] text-[#FF6B35] hover:underline"
          >
            {customer.phone}
          </a>
        </div>
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          {customer.tags.map((tag) => (
            <span key={tag} className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${tagColor(tag)}`}>
              {tag}
            </span>
          ))}
          {customer.last_visit && (
            <span className="text-[12px] text-gray-400 ml-auto">
              최근 {formatDate(customer.last_visit)}
            </span>
          )}
        </div>
      </div>

      {expanded && (
        <CustomerDetail
          customer={customer}
          shopId={shopId}
          supabase={supabase}
          onUpdate={onUpdate}
        />
      )}
    </div>
  );
}

function CustomerDetail({
  customer,
  shopId,
  supabase,
  onUpdate,
}: {
  customer: Customer;
  shopId: string;
  supabase: ReturnType<typeof createBrowserClient>;
  onUpdate: (c: Customer) => void;
}) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [memo, setMemo] = useState(customer.memo || '');
  const [saving, setSaving] = useState(false);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    async function fetchHistory() {
      const { data } = await supabase
        .from('reservations')
        .select('id, reserved_date, reserved_time, status, created_at')
        .eq('shop_id', shopId)
        .eq('customer_phone', customer.phone)
        .order('created_at', { ascending: false })
        .limit(10);
      setReservations((data || []) as Reservation[]);
      setLoadingHistory(false);
    }
    fetchHistory();
  }, [supabase, shopId, customer.phone]);

  async function saveMemo() {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/customers', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ id: customer.id, memo }),
    });
    if (res.ok) {
      const json = await res.json();
      onUpdate(json);
    }
    setSaving(false);
  }

  async function updateTags(tags: string[]) {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/customers', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ id: customer.id, tags }),
    });
    if (res.ok) {
      const json = await res.json();
      onUpdate(json);
    }
  }

  function addTag(tag: string) {
    if (!tag.trim() || customer.tags.includes(tag.trim())) return;
    updateTags([...customer.tags, tag.trim()]);
    setNewTag('');
  }

  function removeTag(tag: string) {
    updateTags(customer.tags.filter((t) => t !== tag));
  }

  return (
    <div className="border-t border-gray-100 bg-[#fafafa] px-4 py-4 space-y-5">
      {/* Reservation history */}
      <div>
        <h3 className="text-[13px] font-semibold text-gray-700 mb-2">예약 이력</h3>
        {loadingHistory ? (
          <div className="text-[13px] text-gray-400">불러오는 중...</div>
        ) : reservations.length === 0 ? (
          <div className="text-[13px] text-gray-400">예약 이력이 없습니다.</div>
        ) : (
          <div className="space-y-1.5">
            {reservations.map((r) => {
              const { text, className } = statusLabel(r.status);
              return (
                <div key={r.id} className="flex items-center gap-2 text-[13px]">
                  <span className="text-gray-700">
                    {r.reserved_date ? formatDate(r.reserved_date) : formatDate(r.created_at)}
                  </span>
                  {r.reserved_time && (
                    <span className="text-gray-500">{r.reserved_time.slice(0, 5)}</span>
                  )}
                  <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${className}`}>
                    {text}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tags */}
      <div>
        <h3 className="text-[13px] font-semibold text-gray-700 mb-2">태그</h3>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {customer.tags.map((tag) => (
            <span key={tag} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${tagColor(tag)}`}>
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="ml-0.5 hover:text-red-600"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
        {/* Preset suggestions */}
        <div className="flex gap-1.5 mb-2">
          {PRESET_TAGS.filter((t) => !customer.tags.includes(t)).map((tag) => (
            <button
              key={tag}
              onClick={() => addTag(tag)}
              className="px-2 py-0.5 rounded-full text-[11px] border border-dashed border-gray-300 text-gray-400 hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
            >
              + {tag}
            </button>
          ))}
        </div>
        {/* Custom tag input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addTag(newTag); }}
            placeholder="새 태그 입력"
            className="flex-1 h-[32px] px-3 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#FF6B35]"
          />
          <button
            onClick={() => addTag(newTag)}
            className="px-3 h-[32px] rounded-lg bg-[#FF6B35] text-white text-[13px] font-medium active:scale-[0.97] transition"
          >
            추가
          </button>
        </div>
      </div>

      {/* Memo */}
      <div>
        <h3 className="text-[13px] font-semibold text-gray-700 mb-2">메모</h3>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="고객 메모를 입력하세요"
          rows={3}
          className="w-full p-3 rounded-xl border border-gray-200 text-[13px] resize-none focus:outline-none focus:border-[#FF6B35]"
        />
        <button
          onClick={saveMemo}
          disabled={saving}
          className="mt-2 px-4 h-[34px] rounded-xl bg-[#FF6B35] text-white text-[13px] font-medium active:scale-[0.97] transition disabled:opacity-50"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
      </div>

      {/* Phone call */}
      <a
        href={`tel:${customer.phone}`}
        className="inline-flex items-center gap-2 px-4 h-[36px] rounded-xl bg-gray-100 text-gray-700 text-[13px] font-medium hover:bg-gray-200 active:scale-[0.97] transition"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
        전화 걸기
      </a>
    </div>
  );
}
