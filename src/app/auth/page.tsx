'use client';

import { useState, useEffect, useCallback } from 'react';
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

    const { error: authError } = await supabase.auth.signInWithOtp({
      phone: e164,
    });

    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }

    setStep('otp');
    setCooldown(60);
  }, [phone, supabase.auth]);

  const handleVerifyOtp = useCallback(async () => {
    setError('');
    if (otp.length !== 6) {
      setError('6자리 인증번호를 입력해주세요');
      return;
    }

    setLoading(true);
    const digits = phone.replace(/\D/g, '');
    const e164 = `+82${digits.slice(1)}`;

    const { error: authError } = await supabase.auth.verifyOtp({
      phone: e164,
      token: otp,
      type: 'sms',
    });

    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }

    router.push('/dashboard');
  }, [otp, phone, supabase.auth, router]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">예약뚝</h1>
          <p className="mt-2 text-gray-600">휴대폰 번호로 로그인</p>
        </div>

        {step === 'phone' ? (
          <div className="space-y-4">
            <input
              type="tel"
              placeholder="010-1234-5678"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              maxLength={13}
              className="w-full rounded-lg border px-4 py-3 focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-3 text-white font-medium disabled:opacity-50"
            >
              {loading ? '전송 중...' : '인증번호 받기'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {phone}로 전송된 인증번호를 입력해주세요
            </p>
            <input
              type="text"
              inputMode="numeric"
              placeholder="인증번호 6자리"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="w-full rounded-lg border px-4 py-3 text-center text-xl tracking-widest focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-3 text-white font-medium disabled:opacity-50"
            >
              {loading ? '확인 중...' : '확인'}
            </button>
            <button
              onClick={handleSendOtp}
              disabled={cooldown > 0 || loading}
              className="w-full text-sm text-gray-500 disabled:opacity-50"
            >
              {cooldown > 0 ? `재전송 (${cooldown}초)` : '인증번호 재전송'}
            </button>
          </div>
        )}

        {error && <p className="text-center text-sm text-red-500">{error}</p>}
      </div>
    </main>
  );
}
