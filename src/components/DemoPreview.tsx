export default function DemoPreview() {
  return (
    <section className="bg-[#f7f7f7] px-6 py-16 md:py-24">
      <div className="mx-auto max-w-[520px]">
        <h2 className="text-[22px] md:text-[28px] font-bold text-gray-900 text-center">
          이렇게 보여요
        </h2>
        <div className="mt-10 flex flex-col md:flex-row gap-6 md:gap-4 items-center md:items-start justify-center">
          {/* Customer view */}
          <div className="w-full max-w-[240px]">
            <p className="text-[13px] font-medium text-gray-500 text-center mb-3">고객이 보는 화면</p>
            <PhoneMockup>
              <div className="p-4">
                <div className="h-3 w-20 bg-gray-200 rounded mb-4" />
                <div className="space-y-3">
                  <div>
                    <div className="h-2.5 w-12 bg-gray-200 rounded mb-1.5" />
                    <div className="h-8 rounded-lg border border-gray-200 bg-white" />
                  </div>
                  <div>
                    <div className="h-2.5 w-14 bg-gray-200 rounded mb-1.5" />
                    <div className="h-8 rounded-lg border border-gray-200 bg-white px-2 flex items-center">
                      <span className="text-[10px] text-gray-400">010-0000-0000</span>
                    </div>
                  </div>
                  <div>
                    <div className="h-2.5 w-16 bg-gray-200 rounded mb-1.5" />
                    <div className="grid grid-cols-7 gap-0.5">
                      {Array.from({ length: 14 }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-4 w-4 rounded text-[6px] flex items-center justify-center ${
                            i === 9 ? 'bg-[#FF6B35] text-white' : 'bg-gray-50 text-gray-400'
                          }`}
                        >
                          {i + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="h-8 rounded-xl bg-[#FF6B35] flex items-center justify-center">
                    <span className="text-[10px] font-semibold text-white">예약하기</span>
                  </div>
                </div>
              </div>
            </PhoneMockup>
          </div>

          {/* Owner view */}
          <div className="w-full max-w-[240px]">
            <p className="text-[13px] font-medium text-gray-500 text-center mb-3">사장님이 보는 화면</p>
            <PhoneMockup>
              <div className="p-4">
                <div className="h-3 w-24 bg-gray-200 rounded mb-4" />
                <div className="space-y-2">
                  <ReservationRow name="김지은" time="14:00" status="confirmed" />
                  <ReservationRow name="박서연" time="15:30" status="new" />
                  <ReservationRow name="이하준" time="16:00" status="new" />
                </div>
              </div>
            </PhoneMockup>
          </div>
        </div>
      </div>
    </section>
  );
}

function PhoneMockup({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[28px] border-[6px] border-gray-800 bg-white overflow-hidden shadow-lg">
      <div className="h-4 bg-gray-800 flex justify-center items-end pb-0.5">
        <div className="w-16 h-1.5 rounded-full bg-gray-600" />
      </div>
      <div className="min-h-[280px]">{children}</div>
    </div>
  );
}

function ReservationRow({ name, time, status }: { name: string; time: string; status: string }) {
  const isConfirmed = status === 'confirmed';
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
      <div>
        <p className="text-[11px] font-medium text-gray-800">{name}</p>
        <p className="text-[9px] text-gray-400">{time}</p>
      </div>
      <span
        className={`text-[8px] font-medium px-1.5 py-0.5 rounded-full ${
          isConfirmed
            ? 'bg-green-50 text-green-600 border border-green-200'
            : 'bg-yellow-50 text-yellow-600 border border-yellow-200'
        }`}
      >
        {isConfirmed ? '확정' : '대기'}
      </span>
    </div>
  );
}
