import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="overflow-hidden">
      {/* Hero */}
      <section className="relative px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="animate-fade-in">
            <div className="mb-6 text-5xl">📱✨</div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
              예약 링크,{' '}
              <span className="text-[#FF6B35]">30초</span>면 끝
            </h1>
          </div>
          <p className="animate-fade-in-delay-1 mt-6 text-lg text-gray-600 md:text-xl leading-relaxed">
            복잡한 네이버플레이스 등록 없이,<br className="md:hidden" />
            SNS에 링크 하나만 달면 예약 완료
          </p>
          <div className="animate-fade-in-delay-2 mt-10">
            <Link
              href="/auth"
              className="inline-flex items-center rounded-full bg-[#FF6B35] px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-[#e55a2b] hover:shadow-xl active:scale-95"
            >
              무료로 시작하기
            </Link>
            <p className="mt-3 text-sm text-gray-400">가입비 없음 · 카드 등록 없음</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="animate-fade-in text-center text-2xl font-bold text-gray-900 md:text-3xl">
            이렇게 쉬워요
          </h2>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            <StepCard
              num="1"
              emoji="✍️"
              title="가게 정보 입력"
              desc="가게 이름, 영업시간, 예약 질문을 입력하면 예약 링크가 생성돼요"
              delay={0}
            />
            <StepCard
              num="2"
              emoji="🔗"
              title="SNS에 링크 달기"
              desc="인스타 프로필, 자동응답, 카톡 등 어디든 링크를 붙여넣으세요"
              delay={1}
            />
            <StepCard
              num="3"
              emoji="🔔"
              title="알림으로 확인"
              desc="고객이 예약하면 푸시 알림으로 바로 확인할 수 있어요"
              delay={2}
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold text-gray-900 md:text-3xl">
            왜 예약뚝?
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <FeatureCard
              emoji="💰"
              title="완전 무료"
              desc="어려워하는 지인을 위해 만들었는데, 모두에게 공개합니다"
            />
            <FeatureCard
              emoji="⚡"
              title="푸시 알림"
              desc="새 예약이 들어오면 즉시 알림이 울려요. 놓칠 일 없어요"
            />
            <FeatureCard
              emoji="📲"
              title="어디서든 관리"
              desc="스마트폰, PC 어디서든 예약을 확인하고 관리할 수 있어요"
            />
          </div>
        </div>
      </section>

      {/* SNS Tip */}
      <section className="bg-orange-50 px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-3xl mb-4">💡</div>
          <h3 className="text-lg font-bold text-gray-900 md:text-xl">
            인스타그램 꿀팁
          </h3>
          <p className="mt-3 text-gray-600 leading-relaxed">
            인스타그램 자동응답에 예약 링크를 넣어두면,<br className="md:hidden" />
            DM이 올 때 자동으로 예약 안내가 나가요.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            &ldquo;예약&rdquo;이라는 키워드에 반응하도록 설정하면 완벽!
          </p>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="px-6 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
          지금 바로 시작하세요
        </h2>
        <p className="mt-3 text-gray-500">30초면 예약 링크가 만들어집니다</p>
        <div className="mt-8">
          <Link
            href="/auth"
            className="inline-flex items-center rounded-full bg-[#FF6B35] px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-[#e55a2b] hover:shadow-xl active:scale-95"
          >
            지금 바로 시작하기
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-8 text-center text-sm text-gray-400">
        <p>© 2026 예약뚝. 소상공인을 응원합니다.</p>
      </footer>
    </main>
  );
}

function StepCard({
  num,
  emoji,
  title,
  desc,
  delay,
}: {
  num: string;
  emoji: string;
  title: string;
  desc: string;
  delay: number;
}) {
  const delayClass = delay === 0
    ? 'animate-fade-in-delay-1'
    : delay === 1
    ? 'animate-fade-in-delay-2'
    : 'animate-fade-in-delay-3';

  return (
    <div className={`${delayClass} rounded-2xl bg-white p-6 text-center shadow-sm border border-gray-100`}>
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#FF6B35] text-sm font-bold text-white">
        {num}
      </div>
      <div className="mt-4 text-3xl">{emoji}</div>
      <h3 className="mt-3 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function FeatureCard({
  emoji,
  title,
  desc,
}: {
  emoji: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 p-6 text-center">
      <div className="text-3xl">{emoji}</div>
      <h3 className="mt-3 font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
  );
}
