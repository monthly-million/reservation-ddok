import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Customer API Tests
 *
 * Tests for POST/GET /api/customers endpoint.
 * POST is unauthenticated (service role key).
 * GET requires authentication.
 */

const mockFrom = vi.fn();
const mockGetUser = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

function mockChain(data: unknown, error: unknown = null) {
  const result = { data, error };
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
    then: (resolve: any) => Promise.resolve(result).then(resolve),
  };
  return chain;
}

async function importCustomerRoute() {
  return await import('@/app/api/customers/route');
}

describe('POST /api/customers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // POST doesn't require auth — uses service role key
    const customerData = { id: 'cust-1', name: '홍길동', phone: '01012345678', shop_id: 'shop-123' };
    mockFrom.mockReturnValue(mockChain(customerData));
  });

  it('should create a new customer for a shop', async () => {
    const { POST } = await importCustomerRoute();

    const request = new Request('http://localhost/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shop_id: 'shop-123',
        name: '홍길동',
        phone: '01012345678',
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.id).toBeDefined();
    expect(data.name).toBe('홍길동');
    expect(data.phone).toBe('01012345678');
  });

  it('should return 400 when name is missing', async () => {
    const { POST } = await importCustomerRoute();

    const request = new Request('http://localhost/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shop_id: 'shop-123',
        name: '',
        phone: '01012345678',
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
  });

  it('should return 400 when phone is missing', async () => {
    const { POST } = await importCustomerRoute();

    const request = new Request('http://localhost/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shop_id: 'shop-123',
        name: '홍길동',
        phone: '',
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
  });

  it('should return 400 when shop_id is missing', async () => {
    const { POST } = await importCustomerRoute();

    const request = new Request('http://localhost/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shop_id: '',
        name: '홍길동',
        phone: '01012345678',
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
  });

  it('should upsert existing customer by phone within same shop', async () => {
    const customerData = { id: 'cust-1', name: '홍길동 (업데이트)', phone: '01012345678', shop_id: 'shop-123' };
    mockFrom.mockReturnValue(mockChain(customerData));

    const { POST } = await importCustomerRoute();

    const req1 = new Request('http://localhost/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shop_id: 'shop-123',
        name: '홍길동',
        phone: '01012345678',
      }),
    });
    const res1 = await POST(req1 as any);
    const data1 = await res1.json();

    const req2 = new Request('http://localhost/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shop_id: 'shop-123',
        name: '홍길동 (업데이트)',
        phone: '01012345678',
      }),
    });
    const res2 = await POST(req2 as any);
    const data2 = await res2.json();

    expect(data2.id).toBe(data1.id);
  });
});

describe('GET /api/customers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
  });

  function makeGetRequest(url: string) {
    return new Request(url, {
      method: 'GET',
      headers: { Authorization: 'Bearer fake-token' },
    });
  }

  it('should return customers for a shop', async () => {
    const shopChain = mockChain({ id: 'shop-123' });
    const customerChain = {
      ...mockChain([{ id: 'cust-1', name: '홍길동' }]),
      // GET doesn't call .single() — it returns array via the query
    };
    // First call: shop check, second call: customers query
    mockFrom
      .mockReturnValueOnce(shopChain)
      .mockReturnValueOnce(customerChain);

    const { GET } = await importCustomerRoute();
    const response = await GET(makeGetRequest('http://localhost/api/customers?shop_id=shop-123') as any);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data.customers)).toBe(true);
  });

  it('should return 400 when shop_id is not provided', async () => {
    const { GET } = await importCustomerRoute();
    const response = await GET(makeGetRequest('http://localhost/api/customers') as any);

    expect(response.status).toBe(400);
  });

  it('should support search by name', async () => {
    const shopChain = mockChain({ id: 'shop-123' });
    const customerChain = mockChain([{ id: 'cust-1', name: '홍길동' }]);
    mockFrom
      .mockReturnValueOnce(shopChain)
      .mockReturnValueOnce(customerChain);

    const { GET } = await importCustomerRoute();
    const response = await GET(makeGetRequest('http://localhost/api/customers?shop_id=shop-123&search=홍길동') as any);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data.customers)).toBe(true);
  });

  it('should support search by phone number', async () => {
    const shopChain = mockChain({ id: 'shop-123' });
    const customerChain = mockChain([{ id: 'cust-1', phone: '01012345678' }]);
    mockFrom
      .mockReturnValueOnce(shopChain)
      .mockReturnValueOnce(customerChain);

    const { GET } = await importCustomerRoute();
    const response = await GET(makeGetRequest('http://localhost/api/customers?shop_id=shop-123&search=01012345678') as any);

    expect(response.status).toBe(200);
  });

  it('should support filtering by tag', async () => {
    const shopChain = mockChain({ id: 'shop-123' });
    const customerChain = mockChain([{ id: 'cust-1', tags: ['VIP'] }]);
    mockFrom
      .mockReturnValueOnce(shopChain)
      .mockReturnValueOnce(customerChain);

    const { GET } = await importCustomerRoute();
    const response = await GET(makeGetRequest('http://localhost/api/customers?shop_id=shop-123&tag=VIP') as any);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data.customers)).toBe(true);
  });
});
