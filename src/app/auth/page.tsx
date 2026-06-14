'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const otpRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  };

  const validatePhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    return /^01[0-9]{8,9}$/.test(digits);
  };

  const handleSendOtp = useCallback(async () => {
    setError('');
    if (!validatePhone(phone)) {
      setError('올바른 휴대폰 번호를 입력해주세요');
      return;
    }
    setLoading(true);
    const digits = phone.replace(/\D/g, '');
    const e164 = `+82${digits.slice(1)}`;

    try {
      const { data, error: fnError } = await supabase.functions.invoke('send-phone-otp', {
        body: { phone: e164 },
      });
      if (fnError) throw new Error(data?.error || '인증번호 발송 실패');
    } catch (err: any) {
      setLoading(false);
      setError(err.message || '인증번호 발송 실패');
      return;
    }
    setLoading(false);
    setStep('otp');
    setOtp('');
    setCooldown(60);
    setTimeout(() => otpRef.current?.focus(), 100);
  }, [phone, supabase.functions]);

  const handleVerifyOtp = useCallback(async () => {
    setError('');
    if (otp.length !== 6) {
      setError('6자리 인증번호를 입력해주세요');
      return;
    }
    setLoading(true);
    const digits = phone.replace(/\D/g, '');
    const e164 = `+82${digits.slice(1)}`;

    try {
      const { data, error: fnError } = await supabase.functions.invoke('verify-phone-otp', {
        body: { phone: e164, otp },
      });
      if (fnError || !data?.token_hash) throw new Error(data?.error || '인증 확인 실패');

      const { error: authError } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: 'magiclink',
      });
      if (authError) throw new Error(authError.message || '로그인 실패');
      router.push('/dashboard');
    } catch (err: any) {
      setLoading(false);
      setError(err.message || '인증 확인 실패');
    }
  }, [otp, phone, supabase.functions, supabase.auth, router]);

  useEffect(() => {
    if (step === 'otp' && otp.length === 6 && !loading) handleVerifyOtp();
  }, [otp, step, loading, handleVerifyOtp]);

  return (
    <main className="min-h-screen flex flex-col bg-white px-6 pt-[120px] pb-10">
      <div className="w-full max-w-[400px] mx-auto flex-1 flex flex-col">
        {step === 'phone' ? (
          <>
            <h1 className="text-[26px] font-bold text-gray-900 leading-tight">
              휴대폰 번호를<br />입력해 주세요
            </h1>
            <p className="mt-3 text-[15px] text-gray-400">
              인증번호가 문자로 전송됩니다
            </p>

            <div className="mt-10">
              <input
                type="tel"
                placeholder="010-0000-0000"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                maxLength={13}
                autoFocus
                className="w-full text-[24px] font-medium text-gray-900 placeholder:text-gray-200 border-b-2 border-gray-200 pb-3 outline-none transition-colors focus:border-[#FF6B35] bg-transparent"
              />
            </div>

            {error && <p className="mt-4 text-[13px] text-red-500">{error}</p>}
          </>
        ) : (
          <>
            <h1 className="text-[26px] font-bold text-gray-900 leading-tight">
              인증번호를<br />입력해 주세요
            </h1>
            <p className="mt-3 text-[15px] text-gray-400">
              {phone}으로 전송된 6자리 번호
            </p>

            <div className="mt-10">
              <input
                ref={otpRef}
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="w-full text-[32px] font-bold text-gray-900 placeholder:text-gray-200 border-b-2 border-gray-200 pb-3 outline-none tracking-[0.3em] transition-colors focus:border-[#FF6B35] bg-transparent"
              />
            </div>

            <div className="mt-4 flex items-center gap-4">
              <button
                onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                className="text-[14px] text-gray-400"
              >
                번호 변경
              </button>
              <button
                onClick={handleSendOtp}
                disabled={cooldown > 0 || loading}
                className="text-[14px] text-[#FF6B35] font-medium disabled:text-gray-300"
              >
                {cooldown > 0 ? `재전송 ${cooldown}초` : '재전송'}
              </button>
            </div>

            {error && <p className="mt-4 text-[13px] text-red-500">{error}</p>}
          </>
        )}
      </div>

      {/* Fixed bottom CTA */}
      <div className="w-full max-w-[400px] mx-auto safe-bottom">
        <button
          onClick={step === 'phone' ? handleSendOtp : handleVerifyOtp}
          disabled={loading || (step === 'phone' ? !validatePhone(phone) : otp.length !== 6)}
          className="w-full h-[56px] rounded-2xl bg-[#FF6B35] text-[16px] font-semibold text-white transition-all active:scale-[0.97] disabled:bg-gray-100 disabled:text-gray-300"
        >
          {loading ? '처리 중...' : step === 'phone' ? '인증번호 받기' : '확인'}
        </button>
      </div>
    </main>
  );
}
