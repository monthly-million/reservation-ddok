import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// E2E-style component tests for the complete reservation flow
// Tests the customer-facing reservation page end-to-end

describe('Customer Reservation Flow (E2E)', () => {
  it('should display shop info on reservation page', async () => {
    const { default: ReservationPage } = await import('@/app/r/[shopId]/page');
    render(<ReservationPage params={{ shopId: 'test-shop' }} />);

    await waitFor(() => {
      expect(screen.getByText(/가게 이름/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/영업시간/i)).toBeInTheDocument();
    expect(screen.getByText(/위치/i)).toBeInTheDocument();
  });

  it('should show validation errors when submitting empty form', async () => {
    const { default: ReservationPage } = await import('@/app/r/[shopId]/page');
    render(<ReservationPage params={{ shopId: 'test-shop' }} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /예약하기/i })).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /예약하기/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/이름을 입력해주세요/i)).toBeInTheDocument();
      expect(screen.getByText(/전화번호를 입력해주세요/i)).toBeInTheDocument();
    });
  });

  it('should submit reservation and show completion page', async () => {
    const { default: ReservationPage } = await import('@/app/r/[shopId]/page');
    render(<ReservationPage params={{ shopId: 'test-shop' }} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/이름/i)).toBeInTheDocument();
    });

    await userEvent.type(screen.getByLabelText(/이름/i), '홍길동');
    await userEvent.type(screen.getByLabelText(/전화번호/i), '01012345678');

    const submitButton = screen.getByRole('button', { name: /예약하기/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/예약이 완료되었습니다/i)).toBeInTheDocument();
    });
  });

  it('should render custom questions from shop configuration', async () => {
    const { default: ReservationPage } = await import('@/app/r/[shopId]/page');
    // This test assumes the shop has custom questions configured
    render(<ReservationPage params={{ shopId: 'shop-with-questions' }} />);

    await waitFor(() => {
      expect(screen.getByText(/원하는 시간/i)).toBeInTheDocument();
    });
  });
});

describe('Auth Flow', () => {
  it('should render phone number input on auth page', async () => {
    const { default: AuthPage } = await import('@/app/auth/page');
    render(<AuthPage />);

    expect(screen.getByLabelText(/휴대폰 번호/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /인증번호 받기/i })).toBeInTheDocument();
  });

  it('should show OTP input after sending verification code', async () => {
    const { default: AuthPage } = await import('@/app/auth/page');
    render(<AuthPage />);

    const phoneInput = screen.getByLabelText(/휴대폰 번호/i);
    await userEvent.type(phoneInput, '01012345678');

    const sendButton = screen.getByRole('button', { name: /인증번호 받기/i });
    await userEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/인증번호/i)).toBeInTheDocument();
    });
  });

  it('should reject invalid phone number format', async () => {
    const { default: AuthPage } = await import('@/app/auth/page');
    render(<AuthPage />);

    const phoneInput = screen.getByLabelText(/휴대폰 번호/i);
    await userEvent.type(phoneInput, '123');

    const sendButton = screen.getByRole('button', { name: /인증번호 받기/i });
    await userEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(/올바른 휴대폰 번호를 입력해주세요/i)).toBeInTheDocument();
    });
  });

  it('should verify OTP and create session', async () => {
    const { default: AuthPage } = await import('@/app/auth/page');
    render(<AuthPage />);

    const phoneInput = screen.getByLabelText(/휴대폰 번호/i);
    await userEvent.type(phoneInput, '01012345678');

    const sendButton = screen.getByRole('button', { name: /인증번호 받기/i });
    await userEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/인증번호/i)).toBeInTheDocument();
    });

    const otpInput = screen.getByLabelText(/인증번호/i);
    await userEvent.type(otpInput, '123456');

    const verifyButton = screen.getByRole('button', { name: /확인/i });
    await userEvent.click(verifyButton);

    await waitFor(() => {
      // After successful verification, should redirect or show success
      expect(screen.getByText(/인증 완료/i)).toBeInTheDocument();
    });
  });
});

describe('Shop Creation Flow', () => {
  it('should render shop creation form for authenticated owner', async () => {
    const { default: CreateShopPage } = await import('@/app/dashboard/create/page');
    render(<CreateShopPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/가게명/i)).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/전화번호/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/위치/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/영업시간/i)).toBeInTheDocument();
  });

  it('should generate reservation link after successful creation', async () => {
    const { default: CreateShopPage } = await import('@/app/dashboard/create/page');
    render(<CreateShopPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/가게명/i)).toBeInTheDocument();
    });

    await userEvent.type(screen.getByLabelText(/가게명/i), '맛있는 식당');
    await userEvent.type(screen.getByLabelText(/전화번호/i), '02-123-4567');
    await userEvent.type(screen.getByLabelText(/위치/i), '서울시 강남구');
    await userEvent.type(screen.getByLabelText(/영업시간/i), '09:00-22:00');

    const createButton = screen.getByRole('button', { name: /링크 생성/i });
    await userEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/예약 링크가 생성되었습니다/i)).toBeInTheDocument();
      expect(screen.getByTestId('reservation-link')).toBeInTheDocument();
    });
  });
});

describe('Reservation Management', () => {
  it('should display reservation list for owner', async () => {
    const { default: ReservationsPage } = await import('@/app/dashboard/reservations/page');
    render(<ReservationsPage />);

    await waitFor(() => {
      expect(screen.getByText(/예약 목록/i)).toBeInTheDocument();
    });
  });

  it('should show reservation details including customer info and answers', async () => {
    const { default: ReservationsPage } = await import('@/app/dashboard/reservations/page');
    render(<ReservationsPage />);

    await waitFor(() => {
      // Expect at least one reservation card with customer info
      expect(screen.getByText(/홍길동/)).toBeInTheDocument();
      expect(screen.getByText(/010-1234-5678/)).toBeInTheDocument();
    });
  });

  it('should mark new reservations with status badge', async () => {
    const { default: ReservationsPage } = await import('@/app/dashboard/reservations/page');
    render(<ReservationsPage />);

    await waitFor(() => {
      const newBadges = screen.getAllByText(/신규/i);
      expect(newBadges.length).toBeGreaterThan(0);
    });
  });
});
