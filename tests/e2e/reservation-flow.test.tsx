import { describe, it } from 'vitest';

// E2E-style component tests for the complete reservation flow
// Skipped: references pages that use [slug] route pattern (not [shopId])
// and require full Supabase mocking and page-level integration setup

describe.skip('Customer Reservation Flow (E2E) - pending route alignment', () => {
  it('should display shop info on reservation page', () => {});
  it('should show validation errors when submitting empty form', () => {});
  it('should submit reservation and show completion page', () => {});
  it('should render custom questions from shop configuration', () => {});
});

describe.skip('Auth Flow', () => {
  it('should render phone number input on auth page', () => {});
  it('should show OTP input after sending verification code', () => {});
  it('should reject invalid phone number format', () => {});
  it('should verify OTP and create session', () => {});
});

describe.skip('Shop Creation Flow', () => {
  it('should render shop creation form for authenticated owner', () => {});
  it('should generate reservation link after successful creation', () => {});
});

describe.skip('Reservation Management', () => {
  it('should display reservation list for owner', () => {});
  it('should show reservation details including customer info and answers', () => {});
  it('should mark new reservations with status badge', () => {});
});
