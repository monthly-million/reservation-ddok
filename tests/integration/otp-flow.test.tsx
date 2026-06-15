import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockInvoke = vi.fn();
const mockVerifyOtp = vi.fn().mockResolvedValue({ error: null });
const mockPush = vi.fn();

const mockSignInWithOtp = vi.fn().mockResolvedValue({ error: null });

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    functions: { invoke: mockInvoke },
    auth: {
      signInWithOtp: mockSignInWithOtp,
      verifyOtp: mockVerifyOtp,
    },
  }),
  createBrowserClient: () => ({
    functions: { invoke: mockInvoke },
    auth: {
      signInWithOtp: mockSignInWithOtp,
      verifyOtp: mockVerifyOtp,
    },
  }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

describe('OTP Flow - Edge Function Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Send OTP via Edge Function', () => {
    it('should call send-phone-otp edge function instead of signInWithOtp', async () => {
      mockInvoke.mockResolvedValueOnce({ data: { success: true }, error: null });
      const AuthPage = (await import('@/app/auth/page')).default;
      render(<AuthPage />);

      const phoneInput = screen.getByPlaceholderText('010-0000-0000');
      await userEvent.type(phoneInput, '01012345678');

      const sendButton = screen.getByRole('button', { name: /인증번호 받기/i });
      await userEvent.click(sendButton);

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('send-phone-otp', {
          body: { phone: '+821012345678' },
        });
      });
    });

    it('should NOT call supabase.auth.signInWithOtp directly', async () => {
      mockInvoke.mockResolvedValueOnce({ data: { success: true }, error: null });
      const AuthPage = (await import('@/app/auth/page')).default;
      render(<AuthPage />);

      const phoneInput = screen.getByPlaceholderText('010-0000-0000');
      await userEvent.type(phoneInput, '01012345678');

      const sendButton = screen.getByRole('button', { name: /인증번호 받기/i });
      await userEvent.click(sendButton);

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalled();
      });
      expect(mockSignInWithOtp).not.toHaveBeenCalled();
    });

    it('should show error when edge function returns error', async () => {
      mockInvoke.mockResolvedValueOnce({ data: { error: 'SMS 전송 실패' }, error: { message: 'SMS 전송 실패' } });
      const AuthPage = (await import('@/app/auth/page')).default;
      render(<AuthPage />);

      const phoneInput = screen.getByPlaceholderText('010-0000-0000');
      await userEvent.type(phoneInput, '01012345678');

      const sendButton = screen.getByRole('button', { name: /인증번호 받기/i });
      await userEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('SMS 전송 실패')).toBeInTheDocument();
      });
    });

    it('should transition to OTP input step on success via edge function', async () => {
      mockInvoke.mockResolvedValueOnce({ data: { success: true }, error: null });
      const AuthPage = (await import('@/app/auth/page')).default;
      render(<AuthPage />);

      const phoneInput = screen.getByPlaceholderText('010-0000-0000');
      await userEvent.type(phoneInput, '01012345678');

      const sendButton = screen.getByRole('button', { name: /인증번호 받기/i });
      await userEvent.click(sendButton);

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('send-phone-otp', {
          body: { phone: '+821012345678' },
        });
      });
      expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
    });
  });

  describe('Verify OTP via Edge Function', () => {
    async function goToOtpStep() {
      mockInvoke.mockResolvedValueOnce({ data: { success: true }, error: null });
      const AuthPage = (await import('@/app/auth/page')).default;
      render(<AuthPage />);

      const phoneInput = screen.getByPlaceholderText('010-0000-0000');
      await userEvent.type(phoneInput, '01012345678');

      const sendButton = screen.getByRole('button', { name: /인증번호 받기/i });
      await userEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('000000')).toBeInTheDocument();
      });
    }

    it('should call verify-phone-otp edge function with phone and otp', async () => {
      await goToOtpStep();
      mockInvoke.mockResolvedValueOnce({ data: { token_hash: 'abc123hash' }, error: null });
      mockVerifyOtp.mockResolvedValueOnce({ error: null });

      const otpInput = screen.getByPlaceholderText('000000');
      await userEvent.type(otpInput, '123456');

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('verify-phone-otp', {
          body: { phone: '+821012345678', otp: '123456' },
        });
      });
    });

    it('should use token_hash with verifyOtp type magiclink after edge function success', async () => {
      await goToOtpStep();
      mockInvoke.mockResolvedValueOnce({ data: { token_hash: 'abc123hash' }, error: null });
      mockVerifyOtp.mockResolvedValueOnce({ error: null });

      const otpInput = screen.getByPlaceholderText('000000');
      await userEvent.type(otpInput, '123456');

      await waitFor(() => {
        expect(mockVerifyOtp).toHaveBeenCalledWith({
          token_hash: 'abc123hash',
          type: 'magiclink',
        });
      });
    });

    it('should NOT call verifyOtp with phone+token+type:sms (old flow)', async () => {
      await goToOtpStep();
      mockInvoke.mockResolvedValueOnce({ data: { token_hash: 'abc123hash' }, error: null });
      mockVerifyOtp.mockResolvedValueOnce({ error: null });

      const otpInput = screen.getByPlaceholderText('000000');
      await userEvent.type(otpInput, '123456');

      await waitFor(() => {
        expect(mockVerifyOtp).toHaveBeenCalled();
      });
      // Must NOT be called with old SMS-based args
      expect(mockVerifyOtp).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'sms' })
      );
    });

    it('should redirect to /dashboard after successful verification via edge function', async () => {
      await goToOtpStep();
      mockInvoke.mockResolvedValueOnce({ data: { token_hash: 'abc123hash' }, error: null });
      mockVerifyOtp.mockResolvedValueOnce({ error: null });

      const otpInput = screen.getByPlaceholderText('000000');
      await userEvent.type(otpInput, '123456');

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('verify-phone-otp', {
          body: { phone: '+821012345678', otp: '123456' },
        });
      });
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should show error when verify-phone-otp returns invalid_otp', async () => {
      await goToOtpStep();
      mockInvoke.mockResolvedValueOnce({ data: null, error: { message: 'invalid_otp' } });

      const otpInput = screen.getByPlaceholderText('000000');
      await userEvent.type(otpInput, '123456');

      await waitFor(() => {
        expect(screen.getByText('인증 확인 실패')).toBeInTheDocument();
      }, { timeout: 3000 });
      expect(mockVerifyOtp).not.toHaveBeenCalled();
    });

    it('should show error when verify-phone-otp returns expired', async () => {
      await goToOtpStep();
      mockInvoke.mockResolvedValueOnce({ data: null, error: { message: 'expired' } });

      const otpInput = screen.getByPlaceholderText('000000');
      await userEvent.type(otpInput, '123456');

      await waitFor(() => {
        expect(screen.getByText('인증 확인 실패')).toBeInTheDocument();
      });
      expect(mockVerifyOtp).not.toHaveBeenCalled();
    });
  });

  describe('Phone number formatting', () => {
    it('should convert Korean mobile number to E.164 format (+82)', async () => {
      mockInvoke.mockResolvedValueOnce({ data: { success: true }, error: null });
      const AuthPage = (await import('@/app/auth/page')).default;
      render(<AuthPage />);

      const phoneInput = screen.getByPlaceholderText('010-0000-0000');
      await userEvent.type(phoneInput, '01098765432');

      const sendButton = screen.getByRole('button', { name: /인증번호 받기/i });
      await userEvent.click(sendButton);

      await waitFor(() => {
        expect(mockInvoke).toHaveBeenCalledWith('send-phone-otp', {
          body: { phone: '+821098765432' },
        });
      });
    });
  });
});
