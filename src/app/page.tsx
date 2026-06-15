import Link from 'next/link';
import DemoPreview from '@/components/DemoPreview';

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

      {/* Pain → Solution */}
      <section className="bg-[#f7f7f7] px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[520px]">
          <h2 className="text-[22px] md:text-[28px] font-bold text-gray-900">
            이런 고민, 있으셨죠?
          </h2>
          <div className="mt-10 space-y-5">
            <PainCard
              icon="📞"
              pain="전화 예약은 놓치기 쉬워요"
              solution="실시간 푸시 알림으로 절대 놓치지 않아요"
            />
            <PainCard
              icon="💬"
              pain="DM 예약은 정리가 안돼요"
              solution="날짜별 자동 정리 + 한눈에 관리"
            />
            <PainCard
              icon="🏪"
              pain="네이버플레이스는 진입장벽이 높아요"
              solution="가입 30초, 링크 공유만 하면 끝"
            />
          </div>
        </div>
      </section>

      {/* Demo Preview */}
      <DemoPreview />

      {/* Target Audience */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[520px]">
          <h2 className="text-[22px] md:text-[28px] font-bold text-gray-900">
            이런 분들이 사용해요
          </h2>
          <div className="mt-8 flex flex-wrap gap-3">
            <AudiencePill emoji="💅" label="네일샵" />
            <AudiencePill emoji="🎨" label="타투" />
            <AudiencePill emoji="👁" label="속눈썹" />
            <AudiencePill emoji="🎓" label="원데이클래스" />
            <AudiencePill emoji="🧘" label="상담/코칭" />
            <AudiencePill emoji="✂️" label="헤어샵" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-[#f7f7f7] px-6 py-16 md:py-24">
        <div className="mx-auto max-w-[520px]">
          <h2 className="text-[22px] md:text-[28px] font-bold text-gray-900">
            왜 예약똑인가요
          </h2>
          <div className="mt-10 space-y-6">
            <Feature title="완전 무료" desc="숨겨진 요금 없이, 영구적으로 무료입니다" />
            <Feature title="실시간 푸시 알림" desc="새 예약이 들어오면 놓치지 않도록 즉시 알려드려요" />
            <Feature title="어디서든" desc="스마트폰, 태블릿, PC — 어디서든 예약을 관리하세요" />
            <Feature title="고객 자동 관리" desc="재방문 고객을 자동으로 인식하고 이력을 관리해요" />
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 pb-20 pt-16">
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

function PainCard({ icon, pain, solution }: { icon: string; pain: string; solution: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="text-[20px] flex-none">{icon}</span>
        <div className="min-w-0">
          <p className="text-[14px] text-gray-400 line-through">{pain}</p>
          <p className="mt-1.5 text-[15px] font-medium text-gray-900">→ {solution}</p>
        </div>
      </div>
    </div>
  );
}

function AudiencePill({ emoji, label }: { emoji: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-gray-50 border border-gray-100 text-[14px] text-gray-700">
      <span>{emoji}</span>
      {label}
    </span>
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
