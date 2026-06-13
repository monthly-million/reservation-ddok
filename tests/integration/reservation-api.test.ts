import { describe, it, expect, vi, beforeEach } from 'vitest';

// Integration tests for reservation submission API
// Tests aligned with actual POST handler implementation

describe('POST /api/reservations', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should return 400 when customer name is missing', async () => {
    const { POST } = await import('@/app/api/reservations/route');

    const request = new Request('http://localhost/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shop_id: 'shop-123',
        customer_name: '',
        customer_phone: '010-1234-5678',
        answers: [],
        idempotency_key: 'key-1',
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
  });

  it('should return 400 when phone number is missing', async () => {
    const { POST } = await import('@/app/api/reservations/route');

    const request = new Request('http://localhost/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shop_id: 'shop-123',
        customer_name: '홍길동',
        customer_phone: '',
        answers: [],
        idempotency_key: 'key-2',
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
  });

  it('should return 400 when shop_id is missing', async () => {
    const { POST } = await import('@/app/api/reservations/route');

    const request = new Request('http://localhost/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shop_id: '',
        customer_name: '홍길동',
        customer_phone: '010-1234-5678',
        answers: [],
        idempotency_key: 'key-3',
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
  });

  it('should return 400 when idempotency_key is missing', async () => {
    const { POST } = await import('@/app/api/reservations/route');

    const request = new Request('http://localhost/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shop_id: 'shop-123',
        customer_name: '홍길동',
        customer_phone: '010-1234-5678',
        answers: [],
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
  });

  it('should return 400 when phone number is invalid format', async () => {
    const { POST } = await import('@/app/api/reservations/route');

    const request = new Request('http://localhost/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shop_id: 'shop-123',
        customer_name: '홍길동',
        customer_phone: '123',
        answers: [],
        idempotency_key: 'key-4',
      }),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
  });
});

// GET handler not yet implemented — these are TDD red-phase tests
describe.skip('GET /api/reservations (not yet implemented)', () => {
  it('should return reservations for authenticated owner', async () => {
    // Will be implemented when GET handler is added
  });

  it('should return 401 when not authenticated', async () => {
    // Will be implemented when GET handler is added
  });
});
