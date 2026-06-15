import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Reservation → Customer Auto-Link Tests
 *
 * When a reservation is created, the system should:
 * 1. Upsert a customer record (by phone + shop_id)
 * 2. Link reservation to customer via customer_id FK
 * 3. Return customer_id in the API response
 */

const mockFrom = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

function mockChain(data: unknown, error: unknown = null) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  return chain;
}

describe('Reservation → Customer auto-link', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('should include customer_id in response when reservation is created', async () => {
    // Mock: shop lookup, idempotency check, slot check (not triggered), customer upsert, reservation insert
    const shopChain = mockChain({ id: 'shop-123', max_per_slot: 5 });
    const idempotencyChain = mockChain(null); // no existing reservation
    idempotencyChain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const customerChain = mockChain({ id: 'cust-abc' });
    const reservationChain = mockChain({ id: 'res-1', reference_code: 'ABCD', customer_id: 'cust-abc' });

    mockFrom
      .mockReturnValueOnce(shopChain)       // shops lookup
      .mockReturnValueOnce(idempotencyChain) // idempotency check
      .mockReturnValueOnce(customerChain)    // customer upsert
      .mockReturnValueOnce(reservationChain); // reservation insert

    const { POST } = await import('@/app/api/reservations/route');

    const request = new Request('http://localhost/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shop_id: 'shop-123',
        customer_name: '김영희',
        customer_phone: '010-9876-5432',
        answers: [],
        idempotency_key: 'customer-link-test-1',
      }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(data.customer_id).toBeDefined();
    expect(typeof data.customer_id).toBe('string');
  });

  it('should link same customer when same phone submits another reservation', async () => {
    // Both reservations upsert the same customer by phone
    const shopChain = mockChain({ id: 'shop-123', max_per_slot: 5 });
    const idempotencyChain = mockChain(null);
    idempotencyChain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const customerChain = mockChain({ id: 'cust-same' });
    const reservationChain1 = mockChain({ id: 'res-1', reference_code: 'AAAA', customer_id: 'cust-same' });
    const reservationChain2 = mockChain({ id: 'res-2', reference_code: 'BBBB', customer_id: 'cust-same' });

    mockFrom
      .mockReturnValueOnce(shopChain)
      .mockReturnValueOnce(idempotencyChain)
      .mockReturnValueOnce(customerChain)
      .mockReturnValueOnce(reservationChain1)
      .mockReturnValueOnce(shopChain)
      .mockReturnValueOnce(idempotencyChain)
      .mockReturnValueOnce(customerChain)
      .mockReturnValueOnce(reservationChain2);

    const { POST } = await import('@/app/api/reservations/route');

    const req1 = new Request('http://localhost/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shop_id: 'shop-123',
        customer_name: '김영희',
        customer_phone: '010-9876-5432',
        answers: [],
        idempotency_key: 'customer-link-test-2a',
      }),
    });

    const res1 = await POST(req1 as any);
    const data1 = await res1.json();

    const req2 = new Request('http://localhost/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shop_id: 'shop-123',
        customer_name: '김영희',
        customer_phone: '010-9876-5432',
        answers: [],
        idempotency_key: 'customer-link-test-2b',
      }),
    });

    const res2 = await POST(req2 as any);
    const data2 = await res2.json();

    // Same phone in same shop → same customer_id
    expect(data2.customer_id).toBe(data1.customer_id);
  });
});
