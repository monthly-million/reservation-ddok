import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Shop, Question } from '@/types/database';
import ReservationForm from './reservation-form';

export const revalidate = 60;

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

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-6">
        <div className="mx-auto max-w-lg">
          <h1 className="text-2xl font-bold text-gray-900">{shop.name}</h1>
          <div className="mt-3 space-y-1 text-sm text-gray-500">
            {shop.location && (
              <p className="flex items-center gap-2">
                <span>📍</span> {shop.location}
              </p>
            )}
            {shop.hours && (
              <p className="flex items-center gap-2">
                <span>🕐</span> {shop.hours}
              </p>
            )}
            {shop.phone && (
              <p className="flex items-center gap-2">
                <span>📞</span> {shop.phone}
              </p>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-6 py-6">
        {/* Menu images carousel */}
        {shop.menu_images && shop.menu_images.length > 0 && (
          <div className="mb-6">
            <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide">
              {shop.menu_images.map((url, i) => (
                <div
                  key={i}
                  className="flex-none w-64 h-44 snap-center rounded-xl overflow-hidden bg-gray-100"
                >
                  <img
                    src={url}
                    alt={`메뉴 ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
            {shop.menu_images.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-2">
                {shop.menu_images.map((_, i) => (
                  <div key={i} className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Owner message */}
        {shop.message && (
          <div className="mb-6 rounded-xl bg-orange-50 border border-orange-100 p-4">
            <p className="text-xs font-medium text-[#FF6B35] mb-1">사장님 전달내용</p>
            <p className="text-sm text-gray-700 leading-relaxed">{shop.message}</p>
          </div>
        )}

        {/* Reservation form */}
        <ReservationForm shop={shop} questions={questions || []} />
      </div>
    </main>
  );
}
