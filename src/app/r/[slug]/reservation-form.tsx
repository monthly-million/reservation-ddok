'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Shop, Question } from '@/types/database';

interface Props {
  shop: Shop;
  questions: Question[];
}

export default function ReservationForm({ shop, questions }: Props) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setIdempotencyKey(crypto.randomUUID());
  }, []);

  function updateAnswer(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function formatPhone(value: string): string {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    const form = e.currentTarget;
    const honeypot = (form.elements.namedItem('website') as HTMLInputElement)?.value;
    if (honeypot) return;

    if (!name.trim() || !phone.trim()) {
      setError('이름과 전화번호를 입력해주세요');
      return;
    }

    setSubmitting(true);
    setError('');

    const formattedAnswers = questions.map((q) => ({
      question_id: q.id,
      question_title: q.title,
      type: q.type,
      value: answers[q.id] || '',
    }));

    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shop_id: shop.id,
          customer_name: name.trim(),
          customer_phone: phone.replace(/\D/g, ''),
          answers: formattedAnswers,
          idempotency_key: idempotencyKey,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '예약에 실패했습니다');
      }

      router.push(`/r/${shop.slug}/complete?name=${encodeURIComponent(name.trim())}&phone=${encodeURIComponent(phone)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '예약에 실패했습니다. 다시 시도해주세요.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-lg font-bold text-gray-900">예약 정보 입력</h2>

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
          이름 <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="홍길동"
          required
          className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-base outline-none transition focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100"
        />
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
          전화번호 <span className="text-red-500">*</span>
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          placeholder="010-1234-5678"
          required
          className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-base outline-none transition focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100"
        />
      </div>

      {/* Dynamic questions */}
      {questions.map((q) => (
        <div key={q.id}>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {q.title}
            {q.required && <span className="text-red-500"> *</span>}
          </label>

          {q.type === 'text' && (
            <textarea
              value={answers[q.id] || ''}
              onChange={(e) => updateAnswer(q.id, e.target.value)}
              required={q.required}
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-base outline-none transition focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-100 resize-none"
            />
          )}

          {q.type === 'radio' && q.options && (
            <div className="space-y-2">
              {q.options.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3.5 cursor-pointer transition hover:border-[#FF6B35] has-[:checked]:border-[#FF6B35] has-[:checked]:bg-orange-50"
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={option}
                    checked={answers[q.id] === option}
                    onChange={(e) => updateAnswer(q.id, e.target.value)}
                    required={q.required}
                    className="h-4 w-4 accent-[#FF6B35]"
                  />
                  <span className="text-base text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          )}

          {q.type === 'image' && (
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    updateAnswer(q.id, file.name);
                  }
                }}
                required={q.required}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-[#FF6B35] hover:file:bg-orange-100"
              />
              {answers[q.id] && (
                <p className="mt-1 text-xs text-gray-400">{answers[q.id]}</p>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Honeypot */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2">{error}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-[#FF6B35] py-4 text-lg font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-[#e55a2b] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? '예약 중...' : '예약하기'}
      </button>
    </form>
  );
}
