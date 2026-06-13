'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase/client';
import QuestionBuilder, { type QuestionItem } from '@/components/QuestionBuilder';
import type { Shop, Question } from '@/types/database';

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

export default function ShopEditPage() {
  const router = useRouter();
  const params = useParams();
  const shopId = params.id as string;
  const supabase = createBrowserClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [hours, setHours] = useState('');
  const [message, setMessage] = useState('');
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [originalQuestionIds, setOriginalQuestionIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const { data: shop } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopId)
        .single();

      if (!shop) {
        router.replace('/dashboard');
        return;
      }

      setName(shop.name);
      setPhone(shop.phone || '');
      setLocation(shop.location || '');
      setHours(shop.hours || '');
      setMessage(shop.message || '');
      setExistingImages(shop.menu_images || []);

      const { data: qs } = await supabase
        .from('questions')
        .select('*')
        .eq('shop_id', shopId)
        .order('sort_order');

      if (qs) {
        const mapped: QuestionItem[] = qs.map((q: Question) => ({
          id: q.id,
          type: q.type,
          title: q.title,
          options: q.options || [''],
          required: q.required,
        }));
        setQuestions(mapped);
        setOriginalQuestionIds(qs.map((q: Question) => q.id));
      }
      setLoading(false);
    }
    load();
  }, [shopId, supabase, router]);

  function handleNewImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    const total = existingImages.length + newImages.length + files.length;
    if (total > 5) {
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
    setNewImages([...newImages, ...files]);
    setNewPreviews([...newPreviews, ...files.map((f) => URL.createObjectURL(f))]);
  }

  function removeExistingImage(index: number) {
    setExistingImages(existingImages.filter((_, i) => i !== index));
  }

  function removeNewImage(index: number) {
    URL.revokeObjectURL(newPreviews[index]);
    setNewImages(newImages.filter((_, i) => i !== index));
    setNewPreviews(newPreviews.filter((_, i) => i !== index));
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

      // Upload new images
      const uploadedUrls: string[] = [];
      for (const file of newImages) {
        const resized = await resizeImage(file, 1200);
        const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('menu-images')
          .upload(path, resized, { contentType: 'image/jpeg' });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('menu-images').getPublicUrl(path);
        uploadedUrls.push(urlData.publicUrl);
      }

      const allImages = [...existingImages, ...uploadedUrls];

      // Update shop
      const { error: shopError } = await supabase
        .from('shops')
        .update({
          name: name.trim(),
          phone: phone.trim(),
          location: location.trim(),
          hours: hours.trim(),
          message: message.trim() || null,
          menu_images: allImages,
          updated_at: new Date().toISOString(),
        })
        .eq('id', shopId);
      if (shopError) throw shopError;

      // Handle questions: delete removed, upsert existing/new
      const currentIds = questions.filter((q) => originalQuestionIds.includes(q.id)).map((q) => q.id);
      const deletedIds = originalQuestionIds.filter((id) => !currentIds.includes(id));

      if (deletedIds.length > 0) {
        await supabase.from('questions').delete().in('id', deletedIds);
      }

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const row = {
          shop_id: shopId,
          type: q.type,
          title: q.title,
          options: q.type === 'radio' ? q.options.filter(Boolean) : null,
          sort_order: i,
          required: q.required,
        };
        if (originalQuestionIds.includes(q.id)) {
          await supabase.from('questions').update(row).eq('id', q.id);
        } else {
          await supabase.from('questions').insert(row);
        }
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || '오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-8 w-8 border-4 border-[#FF6B35] border-t-transparent rounded-full" />
      </div>
    );
  }

  const totalImages = existingImages.length + newImages.length;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-12">
      <h1 className="text-xl font-bold text-gray-900">가게 정보 수정</h1>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
      )}

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-gray-800">기본정보</h2>

        <div>
          <label className="block text-sm text-gray-700 mb-1">가게명 <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">가게 전화번호</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">가게 위치</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">영업시간</label>
          <input
            type="text"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">사장님 전달내용</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
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
            onChange={handleNewImageSelect}
            className="hidden"
          />
          <div className="flex flex-wrap gap-2 mb-2">
            {existingImages.map((src, i) => (
              <div key={`existing-${i}`} className="relative w-20 h-20">
                <img src={src} alt="" className="w-full h-full object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => removeExistingImage(i)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            ))}
            {newPreviews.map((src, i) => (
              <div key={`new-${i}`} className="relative w-20 h-20">
                <img src={src} alt="" className="w-full h-full object-cover rounded-lg" />
                <button
                  type="button"
                  onClick={() => removeNewImage(i)}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          {totalImages < 5 && (
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

      <section className="space-y-4">
        <h2 className="text-base font-semibold text-gray-800">사전예약질문</h2>
        <QuestionBuilder questions={questions} onChange={setQuestions} />
      </section>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-[#FF6B35] text-white py-3.5 rounded-xl font-medium text-base hover:bg-[#e55a2b] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? '저장 중...' : '변경사항 저장'}
      </button>
    </form>
  );
}
