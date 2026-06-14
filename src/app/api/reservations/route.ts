import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop_id, customer_name, customer_phone, answers, idempotency_key } = body;

    if (!customer_name?.trim() || !customer_phone?.trim()) {
      return NextResponse.json(
        { error: '이름과 전화번호는 필수입니다' },
        { status: 400 }
      );
    }

    if (!shop_id || !idempotency_key) {
      return NextResponse.json(
        { error: '잘못된 요청입니다' },
        { status: 400 }
      );
    }

    const phoneDigits = customer_phone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      return NextResponse.json(
        { error: '올바른 전화번호를 입력해주세요' },
        { status: 400 }
      );
    }

    // Verify shop exists
    const { data: shop } = await supabase
      .from('shops')
      .select('id')
      .eq('id', shop_id)
      .single();

    if (!shop) {
      return NextResponse.json(
        { error: '존재하지 않는 매장입니다' },
        { status: 400 }
      );
    }

    // Check idempotency
    const { data: existing } = await supabase
      .from('reservations')
      .select('id')
      .eq('idempotency_key', idempotency_key)
      .single();

    if (existing) {
      return NextResponse.json({ success: true, id: existing.id });
    }

    // Insert reservation
    const { data, error } = await supabase
      .from('reservations')
      .insert({
        shop_id,
        customer_name: customer_name.trim(),
        customer_phone: phoneDigits,
        answers: answers || [],
        idempotency_key,
        status: 'new',
      })
      .select('id')
      .single();

    if (error) {
      console.error('Reservation insert error:', error);
      return NextResponse.json(
        { error: '예약에 실패했습니다. 다시 시도해주세요.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
