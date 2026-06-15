import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function getAuthSupabase(accessToken: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const supabase = getAuthSupabase(token);

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const shop_id = searchParams.get('shop_id');
    if (!shop_id) {
      return NextResponse.json({ error: 'shop_id는 필수입니다' }, { status: 400 });
    }

    // Verify shop ownership
    const { data: shop } = await supabase
      .from('shops')
      .select('id')
      .eq('id', shop_id)
      .eq('owner_id', user.id)
      .single();

    if (!shop) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
    }

    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    let query = supabase
      .from('customers')
      .select('*')
      .eq('shop_id', shop_id)
      .order('created_at', { ascending: false });

    const search = searchParams.get('search');
    if (search) {
      const sanitized = search.replace(/[%_]/g, '\\$&');
      query = query.or(`name.ilike.%${sanitized}%,phone.ilike.%${sanitized}%`);
    }

    const tag = searchParams.get('tag');
    if (tag) {
      query = query.contains('tags', [tag]);
    }

    const { data, error } = await query.range(offset, offset + limit);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = data || [];
    const hasMore = rows.length > limit;
    const customers = hasMore ? rows.slice(0, limit) : rows;

    return NextResponse.json({ customers, hasMore });
  } catch (err) {
    console.error('Customers GET error:', err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const supabase = getAuthSupabase(token);

    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 });
    }

    const body = await request.json();
    const { id, tags, memo } = body;

    if (!id) {
      return NextResponse.json({ error: 'id는 필수입니다' }, { status: 400 });
    }

    // Verify customer belongs to user's shop
    const { data: customer } = await supabase
      .from('customers')
      .select('id, shop_id')
      .eq('id', id)
      .single();

    if (!customer) {
      return NextResponse.json({ error: '고객을 찾을 수 없습니다' }, { status: 404 });
    }

    const { data: shop } = await supabase
      .from('shops')
      .select('id')
      .eq('id', customer.shop_id)
      .eq('owner_id', user.id)
      .single();

    if (!shop) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 });
    }

    const updates: Record<string, unknown> = {};
    if (tags !== undefined) updates.tags = tags;
    if (memo !== undefined) updates.memo = memo;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: '수정할 내용이 없습니다' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('Customers PATCH error:', err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shop_id, name, phone } = body;

    if (!shop_id?.trim()) {
      return NextResponse.json({ error: 'shop_id는 필수입니다' }, { status: 400 });
    }
    if (!name?.trim()) {
      return NextResponse.json({ error: '이름은 필수입니다' }, { status: 400 });
    }
    if (!phone?.trim()) {
      return NextResponse.json({ error: '전화번호는 필수입니다' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { data, error } = await supabase
      .from('customers')
      .upsert(
        { shop_id, name: name.trim(), phone: phone.replace(/\D/g, '') },
        { onConflict: 'shop_id,phone' }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('Customers POST error:', err);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
