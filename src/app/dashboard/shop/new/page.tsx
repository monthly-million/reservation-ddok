'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import { generateSlug } from '@/lib/utils';
import QuestionBuilder, { type QuestionItem } from '@/components/QuestionBuilder';
import ScheduleEditor, { type ScheduleConfig, getDefaultScheduleConfig } from '@/components/ScheduleEditor';

function resizeImage(file: File, maxWidth: number): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width;
      let h = img.height;
      if (w > maxWidth) {
        h = (h * maxWidth) / w;
        w = maxWidth;
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.85);
    };
    img.src = URL.createObjectURL(file);
  });
}

export default function ShopNewPage() {
  const router = useRouter();
  const supabase = createBrowserClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [hours, setHours] = useState('');
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [schedule, setSchedule] = useState<ScheduleConfig>(getDefaultScheduleConfig());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successSlug, setSuccessSlug] = useState('');

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const totalCount = images.length + files.length;
    if (totalCount > 5) {
      setError('이미지는 최대 5장까지 업로드할 수 있어요.');
      return;
    }
    for (const f of files) {
      if (f.size > 2 * 1024 * 1024) {
        setError('각 이미지는 2MB 이하여야 해요.');
        return;
      }
    }
    setError('');
    const newImages = [...images, ...files];
    setImages(newImages);
    const newPreviews = [...previews, ...files.map((f) => URL.createObjectURL(f))];
    setPreviews(newPreviews);
  }

  function removeImage(index: number) {
    URL.revokeObjectURL(previews[index]);
    setImages(images.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError('가게명은 필수입니다.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('인증 정보가 없습니다.');

      // Upload images
      const imageUrls: string[] = [];
      for (const file of images) {
        const resized = await resizeImage(file, 1200);
        const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('menu-images')
          .upload(path, resized, { contentType: 'image/jpeg' });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(path);
        imageUrls.push(urlData.publicUrl);
      }

      // Create shop
      const slug = generateSlug();
      const { data: shop, error: shopError } = await supabase
        .from('shops')
        .insert({
          owner_id: user.id,
          name: name.trim(),
          slug,
          phone: phone.trim(),
          location: location.trim(),
          hours: hours.trim(),
          message: message.trim() || null,
          menu_images: imageUrls,
          slot_duration_min: schedule.slot_duration_min,
          max_per_slot: schedule.max_per_slot,
          advance_days: schedule.advance_days,
        })
        .select()
        .single();
      if (shopError) throw shopError;

      // Create questions
      if (questions.length > 0) {
        const questionRows = questions.map((q, i) => ({
          shop_id: shop.id,
          type: q.type,
          title: q.title,
          options: q.type === 'radio' ? q.options.filter(Boolean) : null,
          sort_order: i,
          required: q.required,
        }));
        const { error: qError } = await supabase.from('questions').insert(questionRows);
        if (qError) throw qError;
      }

      // Create schedule rows
      const scheduleRows = schedule.schedules.map((s) => ({
        shop_id: shop.id,
        day_of_week: s.day_of_week,
        open_time: s.open_time,
        close_time: s.close_time,
        is_closed: s.is_closed,
      }));
      const { error: schedError } = await supabase.from('shop_schedules').insert(scheduleRows);
      if (schedError) throw schedError;

      setSuccessSlug(slug);
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  if (successSlug) {
    const link = `${window.location.origin}/r/${successSlug}`;
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">예약링크가 생성되었어요!</h2>
        <p className="text-sm text-gray-500 mb-6">아래 링크를 고객에게 공유하세요</p>
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4 max-w-sm mx-auto">
          <p className="text-sm text-gray-800 break-all font-mono">{link}</p>
        </div>
        <button
          onClick={() => {
            navigator.clipboard.writeText(link);
            alert('복사되었습니다!');
          }}
          className="bg-[#FF6B35] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#e55a2b] transition-colors mb-3"
        >
          링크 복사하기
        </button>
        <br />
        <button
          onClick={() => router.push('/dashboard')}
          className="text-sm text-gray-500 hover:text-gray-700 mt-4"
        >
          대시보드로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-12">
      <h1 className="text-xl font-bold text-gray-900">새 예약링크 만들기</h1>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
      )}

      {/* Section 1: 기본정보 */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-gray-800">기본정보</h2>

        <div>
          <label className="block text-sm text-gray-700 mb-1">가게명 <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 맛있는 삼겹살집"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">가게 전화번호</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="02-1234-5678"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">가게 위치</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="서울시 강남구 역삼동 123-4"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">영업시간</label>
          <input
            type="text"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="매일 10:00-22:00"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">사장님 전달내용</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="예약 시 고객에게 전달할 메시지를 적어주세요"
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">메뉴판 사진 (최대 5장)</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageSelect}
            className="hidden"
          />
          {previews.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {previews.map((src, i) => (
                <div key={i} className="relative w-20 h-20">
                  <img src={src} alt="" className="w-full h-full object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {images.length < 5 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-500 hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
            >
              + 사진 추가
            </button>
          )}
        </div>
      </section>

      {/* Section 2: 사전예약질문 */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-gray-800">사전예약질문</h2>
        <p className="text-xs text-gray-500">고객이 예약 시 답변할 질문을 만들어주세요</p>
        <QuestionBuilder questions={questions} onChange={setQuestions} />
      </section>

      {/* Section 3: 예약 스케줄 설정 */}
      <section className="space-y-4">
        <h2 className="text-base font-semibold text-gray-800">예약 스케줄</h2>
        <p className="text-xs text-gray-500">영업 시간과 예약 단위를 설정해주세요</p>
        <ScheduleEditor value={schedule} onChange={setSchedule} />
      </section>

      {/* Submit */}
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-[#FF6B35] text-white py-3.5 rounded-xl font-medium text-base hover:bg-[#e55a2b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? '생성 중...' : '링크 생성하기'}
      </button>
    </form>
  );
}
