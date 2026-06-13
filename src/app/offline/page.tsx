export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="rounded-2xl border border-gray-200 bg-white p-10 shadow-sm">
        <p className="mb-2 text-4xl">📡</p>
        <h1 className="mb-2 text-xl font-bold text-gray-900">오프라인 상태</h1>
        <p className="text-gray-600">인터넷 연결을 확인해주세요</p>
      </div>
    </main>
  );
}
