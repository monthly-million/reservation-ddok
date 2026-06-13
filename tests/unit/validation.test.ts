import { describe, it, expect } from 'vitest';

// Validation utility tests for customer reservation form
// These will import from '@/lib/validation' once implemented

describe('Customer Form Validation', () => {
  describe('validateCustomerName', () => {
    it('should reject empty name', async () => {
      const { validateCustomerName } = await import('@/lib/validation');
      const result = validateCustomerName('');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject whitespace-only name', async () => {
      const { validateCustomerName } = await import('@/lib/validation');
      const result = validateCustomerName('   ');
      expect(result.valid).toBe(false);
    });

    it('should accept valid Korean name', async () => {
      const { validateCustomerName } = await import('@/lib/validation');
      const result = validateCustomerName('홍길동');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid English name', async () => {
      const { validateCustomerName } = await import('@/lib/validation');
      const result = validateCustomerName('John Doe');
      expect(result.valid).toBe(true);
    });
  });

  describe('validatePhoneNumber', () => {
    it('should reject empty phone number', async () => {
      const { validatePhoneNumber } = await import('@/lib/validation');
      const result = validatePhoneNumber('');
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject invalid format', async () => {
      const { validatePhoneNumber } = await import('@/lib/validation');
      const result = validatePhoneNumber('12345');
      expect(result.valid).toBe(false);
    });

    it('should accept valid Korean mobile number (010-XXXX-XXXX)', async () => {
      const { validatePhoneNumber } = await import('@/lib/validation');
      const result = validatePhoneNumber('010-1234-5678');
      expect(result.valid).toBe(true);
    });

    it('should accept number without dashes (01012345678)', async () => {
      const { validatePhoneNumber } = await import('@/lib/validation');
      const result = validatePhoneNumber('01012345678');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateReservationForm', () => {
    it('should reject form with missing required fields', async () => {
      const { validateReservationForm } = await import('@/lib/validation');
      const result = validateReservationForm({
        customerName: '',
        customerPhone: '',
        answers: [],
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2); // name + phone
    });

    it('should reject form when required custom question is unanswered', async () => {
      const { validateReservationForm } = await import('@/lib/validation');
      const result = validateReservationForm({
        customerName: '홍길동',
        customerPhone: '010-1234-5678',
        answers: [{ questionId: 'q1', value: '' }],
        questions: [{ id: 'q1', type: 'text', title: '원하는 시간', required: true }],
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ field: 'q1' })
      );
    });

    it('should pass when all required fields are filled', async () => {
      const { validateReservationForm } = await import('@/lib/validation');
      const result = validateReservationForm({
        customerName: '홍길동',
        customerPhone: '010-1234-5678',
        answers: [{ questionId: 'q1', value: '오후 2시' }],
        questions: [{ id: 'q1', type: 'text', title: '원하는 시간', required: true }],
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});

describe('Question Type Validation', () => {
  it('should validate radio type requires at least one option selected', async () => {
    const { validateAnswer } = await import('@/lib/validation');
    const question = { id: 'q1', type: 'radio' as const, title: '인원수', options: ['1명', '2명', '3명'], required: true };
    const result = validateAnswer(question, '');
    expect(result.valid).toBe(false);
  });

  it('should validate text type with non-empty value', async () => {
    const { validateAnswer } = await import('@/lib/validation');
    const question = { id: 'q2', type: 'text' as const, title: '요청사항', required: true };
    const result = validateAnswer(question, '알레르기 있습니다');
    expect(result.valid).toBe(true);
  });

  it('should allow empty answer for optional question', async () => {
    const { validateAnswer } = await import('@/lib/validation');
    const question = { id: 'q3', type: 'text' as const, title: '추가 요청', required: false };
    const result = validateAnswer(question, '');
    expect(result.valid).toBe(true);
  });
});
