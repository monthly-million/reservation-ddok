import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero */}
      <section className="px-6 pt-20 pb-16 md:pt-32 md:pb-24">
        <div className="mx-auto max-w-[520px]">
          <h1 className="text-[32px] md:text-[44px] font-bold text-gray-900 leading-[1.2] tracking-tight">
            예약 관리,<br />
            이제 <span className="text-[#FF6B35]">링크 하나</span>로
          </h1>
          <p className="mt-5 text-[16px] md:text-[18px] text-gray-500 leading-relaxed">
            네이버플레이스 등록 없이<br className="md:hidden" />
            SNS에 링크만 달면 예약을 받을 수 있어요
          </p>
          <div className="mt-10">
            <Link
              href="/auth"
              className="inline-flex h-[56px] items-center rounded-2xl bg-[#FF6B35] px-8 text-[16px] font-semibold text-white transition active:scale-[0.97]"
            >
              무료로 시작하기
            </Link>
            <p className="mt-3 text-[13px] text-gray-300">가입비 없음 · 카드 등록 없음</p>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="bg-[#f7f7f7] px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[520px]">
          <h2 className="text-[22px] md:text-[28px] font-bold text-gray-900">
            이렇게 간단해요
          </h2>
          <div className="mt-10 space-y-8">
            <Step num="1" title="가게 정보 입력" desc="이름, 영업시간, 질문 항목을 입력하면 예약 링크가 만들어져요" />
            <Step num="2" title="링크 공유" desc="인스타 프로필, 카톡 자동응답, 어디든 붙여넣으세요" />
            <Step num="3" title="알림 받기" desc="고객이 예약하면 즉시 푸시 알림으로 알려드려요" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[520px]">
          <h2 className="text-[22px] md:text-[28px] font-bold text-gray-900">
            왜 예약똑인가요
          </h2>
          <div className="mt-10 space-y-6">
            <Feature title="완전 무료" desc="숨겨진 요금 없이, 영구적으로 무료입니다" />
            <Feature title="실시간 푸시 알림" desc="새 예약이 들어오면 놓치지 않도록 즉시 알려드려요" />
            <Feature title="어디서든" desc="스마트폰, 태블릿, PC — 어디서든 예약을 관리하세요" />
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 pb-20 pt-8">
        <div className="mx-auto max-w-[520px] text-center">
          <h2 className="text-[22px] font-bold text-gray-900">
            30초면 시작할 수 있어요
          </h2>
          <div className="mt-6">
            <Link
              href="/auth"
              className="inline-flex h-[56px] items-center rounded-2xl bg-[#FF6B35] px-8 text-[16px] font-semibold text-white transition active:scale-[0.97]"
            >
              지금 시작하기
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-8">
        <p className="text-center text-[13px] text-gray-300">
          © 2026 예약똑
        </p>
      </footer>
    </main>
  );
}

function Step({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-none w-8 h-8 rounded-full bg-[#FF6B35] flex items-center justify-center text-[13px] font-bold text-white">
        {num}
      </div>
      <div className="pt-0.5">
        <h3 className="text-[16px] font-semibold text-gray-900">{title}</h3>
        <p className="mt-1 text-[14px] text-gray-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-none w-1.5 h-1.5 rounded-full bg-[#FF6B35] mt-2.5" />
      <div>
        <h3 className="text-[16px] font-semibold text-gray-900">{title}</h3>
        <p className="mt-0.5 text-[14px] text-gray-400">{desc}</p>
      </div>
    </div>
  );
}
