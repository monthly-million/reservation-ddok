import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const VALID_TRANSITIONS: Record<string, string[]> = {
  new: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'no_show', 'cancelled'],
};

function getAuthSupabase(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const supabase = getAuthSupabase(authHeader.slice(7));
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const { id } = await params;
    const { status } = await request.json();

    if (!status) {
      return NextResponse.json({ error: 'status는 필수입니다' }, { status: 400 });
    }

    // Get reservation (RLS ensures only owner's shop reservations are visible)
    const { data: reservation } = await supabase
      .from('reservations')
      .select('id, status, customer_id')
      .eq('id', id)
      .single();

    if (!reservation) {
      return NextResponse.json({ error: '예약을 찾을 수 없습니다' }, { status: 404 });
    }

    // Validate transition
    const allowed = VALID_TRANSITIONS[reservation.status];
    if (!allowed || !allowed.includes(status)) {
      return NextResponse.json(
        { error: `${reservation.status}에서 ${status}(으)로 변경할 수 없습니다` },
        { status: 422 }
      );
    }

    const serviceSupabase = getServiceSupabase();

    // Update reservation status
    const { error: updateErr } = await serviceSupabase
      .from('reservations')
      .update({ status })
      .eq('id', id);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Update customer counters
    if (reservation.customer_id) {
      if (status === 'completed') {
        const { data: cust } = await serviceSupabase
          .from('customers')
          .select('visit_count')
          .eq('id', reservation.customer_id)
          .single();
        if (cust) {
          await serviceSupabase
            .from('customers')
            .update({ visit_count: cust.visit_count + 1, last_visit: new Date().toISOString() })
            .eq('id', reservation.customer_id);
        }
      } else if (status === 'no_show') {
        const { data: cust } = await serviceSupabase
          .from('customers')
          .select('no_show_count')
          .eq('id', reservation.customer_id)
          .single();
        if (cust) {
          await serviceSupabase
            .from('customers')
            .update({ no_show_count: cust.no_show_count + 1 })
            .eq('id', reservation.customer_id);
        }
      }
    }

    return NextResponse.json({ success: true, status });
  } catch (err) {
    console.error('Status update error:', err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
