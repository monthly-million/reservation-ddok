import Link from 'next/link';

interface PageProps {
  params: { slug: string };
  searchParams: { name?: string; phone?: string };
}

export default function CompletePage({ params, searchParams }: PageProps) {
  const name = searchParams.name || '';
  const phone = searchParams.phone || '';

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-sm text-center">
        <div className="animate-fade-in">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900">
            예약이 완료되었습니다!
          </h1>
          <p className="mt-3 text-gray-500">
            사장님이 곧 연락드릴 예정입니다
          </p>
        </div>

        {(name || phone) && (
          <div className="animate-fade-in-delay-1 mt-8 rounded-xl bg-white border border-gray-100 p-5 text-left">
            <p className="text-xs font-medium text-gray-400 mb-3">예약 정보</p>
            {name && (
              <p className="text-sm text-gray-700">
                <span className="text-gray-400 mr-2">이름</span> {name}
              </p>
            )}
            {phone && (
              <p className="text-sm text-gray-700 mt-1.5">
                <span className="text-gray-400 mr-2">연락처</span> {phone}
              </p>
            )}
          </div>
        )}

        <div className="animate-fade-in-delay-2 mt-8">
          <Link
            href={`/r/${params.slug}`}
            className="text-sm text-[#FF6B35] hover:underline"
          >
            ← 돌아가기
          </Link>
        </div>
      </div>
    </main>
  );
}
