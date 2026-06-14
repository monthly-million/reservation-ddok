'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Shop, Question, ShopSchedule } from '@/types/database';
import Calendar from '@/components/Calendar';
import TimeSlotPicker from '@/components/TimeSlotPicker';

interface Props {
  shop: Shop;
  questions: Question[];
  schedules: ShopSchedule[];
}

export default function ReservationForm({ shop, questions, schedules }: Props) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const hasSchedules = schedules.length > 0;
  const closedDays = schedules.filter((s) => s.is_closed).map((s) => s.day_of_week);

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

    if (hasSchedules && (!selectedDate || !selectedTime)) {
      setError('날짜와 시간을 선택해주세요');
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
          reserved_date: selectedDate || null,
          reserved_time: selectedTime || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '예약에 실패했습니다');
      }

      const params = new URLSearchParams({
        name: name.trim(),
        phone,
        ...(selectedDate && { date: selectedDate }),
        ...(selectedTime && { time: selectedTime }),
      });
      router.push(`/r/${shop.slug}/complete?${params.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '예약에 실패했습니다');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-[18px] font-bold text-gray-900">예약 정보</h2>

      {/* Date & Time selection */}
      {hasSchedules && (
        <>
          <div>
            <label className="block text-[14px] font-medium text-gray-600 mb-3">날짜 선택</label>
            <Calendar
              selectedDate={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                setSelectedTime(null);
              }}
              advanceDays={shop.advance_days}
              closedDays={closedDays}
            />
          </div>

          {selectedDate && (
            <div>
              <label className="block text-[14px] font-medium text-gray-600 mb-3">시간 선택</label>
              <TimeSlotPicker
                shopId={shop.id}
                date={selectedDate}
                selectedTime={selectedTime}
                onSelect={setSelectedTime}
              />
            </div>
          )}
        </>
      )}

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-[14px] font-medium text-gray-600 mb-2">
          이름
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="홍길동"
          required
          className="w-full h-[50px] rounded-xl border border-gray-200 px-4 text-[16px] text-gray-900 placeholder:text-gray-300 outline-none transition focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-50"
        />
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-[14px] font-medium text-gray-600 mb-2">
          전화번호
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          placeholder="010-0000-0000"
          required
          className="w-full h-[50px] rounded-xl border border-gray-200 px-4 text-[16px] text-gray-900 placeholder:text-gray-300 outline-none transition focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-50"
        />
      </div>

      {/* Dynamic questions */}
      {questions.map((q) => (
        <div key={q.id}>
          <label className="block text-[14px] font-medium text-gray-600 mb-2">
            {q.title}
            {q.required && <span className="text-red-400 ml-0.5">*</span>}
          </label>

          {q.type === 'text' && (
            <textarea
              value={answers[q.id] || ''}
              onChange={(e) => updateAnswer(q.id, e.target.value)}
              required={q.required}
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-[16px] text-gray-900 placeholder:text-gray-300 outline-none transition focus:border-[#FF6B35] focus:ring-2 focus:ring-orange-50 resize-none"
            />
          )}

          {q.type === 'radio' && q.options && (
            <div className="space-y-2">
              {q.options.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-3 h-[48px] rounded-xl border border-gray-200 px-4 cursor-pointer transition has-[:checked]:border-[#FF6B35] has-[:checked]:bg-orange-50/50"
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
                  <span className="text-[15px] text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          )}

          {q.type === 'image' && (
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) updateAnswer(q.id, file.name);
              }}
              required={q.required}
              className="w-full text-[14px] text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[13px] file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
          )}
        </div>
      ))}

      {/* Honeypot */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {/* Error */}
      {error && (
        <p className="text-[13px] text-red-500">{error}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full h-[56px] rounded-2xl bg-[#FF6B35] text-[16px] font-semibold text-white transition active:scale-[0.97] disabled:bg-gray-100 disabled:text-gray-300"
      >
        {submitting ? '예약 중...' : '예약하기'}
      </button>
    </form>
  );
}
