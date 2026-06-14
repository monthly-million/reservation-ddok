import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Shop, Question, ShopSchedule } from '@/types/database';
import ReservationForm from './reservation-form';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ReservationPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: shop } = await supabase
    .from('shops')
    .select('*')
    .eq('slug', slug)
    .single<Shop>();

  if (!shop) {
    notFound();
  }

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('shop_id', shop.id)
    .order('sort_order', { ascending: true })
    .returns<Question[]>();

  const { data: schedules } = await supabase
    .from('shop_schedules')
    .select('*')
    .eq('shop_id', shop.id)
    .order('day_of_week', { ascending: true })
    .returns<ShopSchedule[]>();

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 pt-12 pb-6">
        <div className="mx-auto max-w-[480px]">
          <h1 className="text-[24px] font-bold text-gray-900">{shop.name}</h1>
          <div className="mt-3 space-y-1">
            {shop.location && (
              <p className="text-[14px] text-gray-500">{shop.location}</p>
            )}
            {shop.hours && (
              <p className="text-[14px] text-gray-400">{shop.hours}</p>
            )}
            {shop.phone && (
              <a href={`tel:${shop.phone}`} className="text-[14px] text-[#FF6B35]">
                {shop.phone}
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[480px] px-6 pb-10">
        {/* Menu images */}
        {shop.menu_images && shop.menu_images.length > 0 && (
          <div className="mb-8">
            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-6 px-6">
              {shop.menu_images.map((url, i) => (
                <div
                  key={i}
                  className="flex-none w-[260px] h-[180px] snap-center rounded-2xl overflow-hidden bg-gray-100"
                >
                  <img
                    src={url}
                    alt={`메뉴 ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Owner message */}
        {shop.message && (
          <div className="mb-8 rounded-2xl bg-[#f7f7f7] p-5">
            <p className="text-[13px] font-medium text-gray-400 mb-1">사장님 메시지</p>
            <p className="text-[15px] text-gray-700 leading-relaxed">{shop.message}</p>
          </div>
        )}

        {/* Form */}
        <ReservationForm shop={shop} questions={questions || []} schedules={schedules || []} />
      </div>
    </main>
  );
}
