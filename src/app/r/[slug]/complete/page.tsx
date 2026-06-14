import Link from 'next/link';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ name?: string; phone?: string; date?: string; time?: string }>;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dayName = dayNames[d.getDay()];
  return `${month}월 ${day}일 (${dayName})`;
}

function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5);
}

export default async function CompletePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { name = '', phone = '', date = '', time = '' } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm text-center">
        <div className="animate-fade-in">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-[22px] font-bold text-gray-900">
            예약이 완료되었습니다!
          </h1>
          <p className="mt-3 text-[14px] text-gray-400">
            사장님이 곧 연락드릴 예정입니다
          </p>
        </div>

        {date && time && (
          <div className="animate-fade-in-delay-1 mt-8 py-5 px-6 rounded-2xl bg-gray-50">
            <p className="text-[22px] font-bold text-gray-900">
              {formatDate(date)} {formatTime(time)}
            </p>
          </div>
        )}

        {(name || phone) && (
          <div className="animate-fade-in-delay-1 mt-4 rounded-xl bg-white border border-gray-100 p-5 text-left">
            <p className="text-[12px] font-medium text-gray-400 mb-3">예약 정보</p>
            {name && (
              <p className="text-[14px] text-gray-700">
                <span className="text-gray-400 mr-2">이름</span> {name}
              </p>
            )}
            {phone && (
              <p className="text-[14px] text-gray-700 mt-1.5">
                <span className="text-gray-400 mr-2">연락처</span> {phone}
              </p>
            )}
          </div>
        )}

        <div className="animate-fade-in-delay-2 mt-8">
          <Link
            href={`/r/${slug}`}
            className="text-[14px] text-[#FF6B35] hover:underline"
          >
            ← 돌아가기
          </Link>
        </div>
      </div>
    </main>
  );
}
