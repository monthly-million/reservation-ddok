import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center">
        <div className="text-6xl mb-6">🤔</div>
        <h1 className="text-2xl font-bold text-gray-900">
          존재하지 않는 페이지입니다
        </h1>
        <p className="mt-3 text-gray-500">
          주소를 다시 확인해주세요
        </p>
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-[#FF6B35] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#e55a2b] active:scale-95"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </main>
  );
}
