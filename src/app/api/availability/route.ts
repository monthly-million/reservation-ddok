import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

function generateTimeSlots(openTime: string, closeTime: string, durationMin: number): string[] {
  const slots: string[] = [];
  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);

  let currentMin = openH * 60 + openM;
  const endMin = closeH * 60 + closeM;

  while (currentMin + durationMin <= endMin) {
    const h = Math.floor(currentMin / 60);
    const m = currentMin % 60;
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    currentMin += durationMin;
  }

  return slots;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopId = searchParams.get('shop_id');
    const date = searchParams.get('date');

    if (!shopId || !date) {
      return NextResponse.json({ error: 'shop_id and date are required' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Get shop settings
    const { data: shop, error: shopErr } = await supabase
      .from('shops')
      .select('slot_duration_min, max_per_slot')
      .eq('id', shopId)
      .single();

    if (shopErr || !shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    // Check if date is a closure
    const { data: closure } = await supabase
      .from('shop_closures')
      .select('id')
      .eq('shop_id', shopId)
      .eq('closed_date', date)
      .maybeSingle();

    if (closure) {
      return NextResponse.json({ slots: [], closed: true });
    }

    // Get schedule for this day of week
    const dayOfWeek = new Date(date + 'T00:00:00').getDay();
    const { data: schedule } = await supabase
      .from('shop_schedules')
      .select('open_time, close_time, is_closed')
      .eq('shop_id', shopId)
      .eq('day_of_week', dayOfWeek)
      .maybeSingle();

    if (!schedule || schedule.is_closed) {
      return NextResponse.json({ slots: [], closed: true });
    }

    // Generate all possible slots
    const allSlots = generateTimeSlots(
      schedule.open_time,
      schedule.close_time,
      shop.slot_duration_min
    );

    // Get existing reservations for this date
    const { data: reservations } = await supabase
      .from('reservations')
      .select('reserved_time')
      .eq('shop_id', shopId)
      .eq('reserved_date', date)
      .in('status', ['new', 'confirmed']);

    // Count bookings per slot
    const bookingCount: Record<string, number> = {};
    if (reservations) {
      for (const r of reservations) {
        if (r.reserved_time) {
          const timeKey = r.reserved_time.slice(0, 5);
          bookingCount[timeKey] = (bookingCount[timeKey] || 0) + 1;
        }
      }
    }

    // Build slot availability
    const slots = allSlots.map((time) => ({
      time,
      available: (bookingCount[time] || 0) < shop.max_per_slot,
      remaining: shop.max_per_slot - (bookingCount[time] || 0),
    }));

    return NextResponse.json({ slots, closed: false });
  } catch (err) {
    console.error('Availability API error:', err);
    return NextResponse.json(
      { error: `서버 오류: ${err instanceof Error ? err.message : 'unknown'}` },
      { status: 500 }
    );
  }
}
