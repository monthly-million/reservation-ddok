import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ slug: string; ref: string }>;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dayName = dayNames[d.getDay()];
  return `${month}월 ${day}일 (${dayName})`;
}

function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5);
}

const statusLabels: Record<string, { text: string; className: string }> = {
  new: { text: '대기중', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  confirmed: { text: '확정', className: 'bg-green-50 text-green-700 border-green-200' },
};

export default async function MyReservationPage({ params }: PageProps) {
  const { slug, ref } = await params;
  const supabase = await createClient();

  const { data: shop } = await supabase
    .from('shops')
    .select('id, name')
    .eq('slug', slug)
    .single();

  if (!shop) {
    notFound();
  }

  const { data: reservation } = await supabase
    .from('reservations')
    .select('*')
    .eq('shop_id', shop.id)
    .eq('reference_code', ref.toUpperCase())
    .maybeSingle();

  if (!reservation) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-5">🔍</div>
          <h1 className="text-[20px] font-bold text-gray-900">
            예약을 찾을 수 없어요
          </h1>
          <p className="mt-3 text-[14px] text-gray-400">
            예약번호를 다시 확인해주세요
          </p>
          <Link
            href={`/r/${slug}`}
            className="inline-block mt-6 text-[14px] text-[#FF6B35] hover:underline"
          >
            ← 돌아가기
          </Link>
        </div>
      </main>
    );
  }

  const status = statusLabels[reservation.status] || statusLabels.new;

  return (
    <main className="min-h-screen bg-white px-6 pt-12 pb-10">
      <div className="mx-auto max-w-[480px]">
        <h1 className="text-[20px] font-bold text-gray-900">{shop.name}</h1>
        <p className="mt-1 text-[13px] text-gray-400">예약 상세</p>

        <div className="mt-8 rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <p className="text-[13px] text-gray-400">예약번호</p>
            <p className="text-[18px] font-bold text-[#FF6B35]">#{ref.toUpperCase()}</p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[14px] text-gray-400">상태</span>
              <span className={`text-[13px] font-medium px-2.5 py-0.5 rounded-full border ${status.className}`}>
                {status.text}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[14px] text-gray-400">이름</span>
              <span className="text-[14px] text-gray-900">{reservation.customer_name}</span>
            </div>
            {reservation.reserved_date && (
              <div className="flex justify-between">
                <span className="text-[14px] text-gray-400">날짜</span>
                <span className="text-[14px] text-gray-900">{formatDate(reservation.reserved_date)}</span>
              </div>
            )}
            {reservation.reserved_time && (
              <div className="flex justify-between">
                <span className="text-[14px] text-gray-400">시간</span>
                <span className="text-[14px] text-gray-900">{formatTime(reservation.reserved_time)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href={`/r/${slug}`}
            className="text-[14px] text-gray-400 hover:underline"
          >
            ← 돌아가기
          </Link>
        </div>
      </div>
    </main>
  );
}
