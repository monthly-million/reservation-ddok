import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function generateReferenceCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase env vars');
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop_id, customer_name, customer_phone, answers, idempotency_key, reserved_date, reserved_time } = body;

    if (!customer_name?.trim() || !customer_phone?.trim()) {
      return NextResponse.json({ error: '이름과 전화번호는 필수입니다' }, { status: 400 });
    }

    if (!shop_id || !idempotency_key) {
      return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 });
    }

    const phoneDigits = customer_phone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      return NextResponse.json({ error: '올바른 전화번호를 입력해주세요' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Verify shop exists
    const { data: shop, error: shopErr } = await supabase
      .from('shops')
      .select('id, max_per_slot')
      .eq('id', shop_id)
      .single();

    if (shopErr || !shop) {
      console.error('Shop lookup error:', shopErr);
      return NextResponse.json({ error: '존재하지 않는 매장입니다' }, { status: 400 });
    }

    // Check idempotency
    const { data: existing } = await supabase
      .from('reservations')
      .select('id, reference_code')
      .eq('idempotency_key', idempotency_key)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: true, id: existing.id, reference_code: existing.reference_code });
    }

    // Validate slot availability if date/time provided
    if (reserved_date && reserved_time) {
      const { data: existingBookings } = await supabase
        .from('reservations')
        .select('id')
        .eq('shop_id', shop_id)
        .eq('reserved_date', reserved_date)
        .eq('reserved_time', reserved_time)
        .in('status', ['new', 'confirmed']);

      if (existingBookings && existingBookings.length >= shop.max_per_slot) {
        return NextResponse.json({ error: '해당 시간은 이미 예약이 마감되었습니다' }, { status: 409 });
      }
    }

    // Upsert customer
    const { data: customer, error: customerErr } = await supabase
      .from('customers')
      .upsert(
        { shop_id, name: customer_name.trim(), phone: phoneDigits },
        { onConflict: 'shop_id,phone' }
      )
      .select('id')
      .single();

    if (customerErr || !customer) {
      console.error('Customer upsert error:', customerErr);
      return NextResponse.json({ error: '고객 정보 처리 실패' }, { status: 500 });
    }

    // Insert reservation
    const reference_code = generateReferenceCode();
    const { data, error } = await supabase
      .from('reservations')
      .insert({
        shop_id,
        customer_name: customer_name.trim(),
        customer_phone: phoneDigits,
        customer_id: customer.id,
        reference_code,
        answers: answers || [],
        idempotency_key,
        reserved_date: reserved_date || null,
        reserved_time: reserved_time || null,
        status: 'new',
      })
      .select('id, reference_code, customer_id')
      .single();

    if (error) {
      console.error('Reservation insert error:', JSON.stringify(error));
      return NextResponse.json(
        { error: `예약 실패: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data.id, reference_code: data.reference_code, customer_id: data.customer_id });
  } catch (err) {
    console.error('Reservation API error:', err);
    return NextResponse.json(
      { error: `서버 오류: ${err instanceof Error ? err.message : 'unknown'}` },
      { status: 500 }
    );
  }
}
