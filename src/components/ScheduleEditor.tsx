'use client';

export interface ScheduleDay {
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export interface ScheduleConfig {
  schedules: ScheduleDay[];
  slot_duration_min: number;
  max_per_slot: number;
  advance_days: number;
}

interface Props {
  value: ScheduleConfig;
  onChange: (config: ScheduleConfig) => void;
}

const DAY_NAMES = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
const DURATION_OPTIONS = [30, 60, 90, 120];

export function getDefaultScheduleConfig(): ScheduleConfig {
  return {
    schedules: Array.from({ length: 7 }, (_, i) => ({
      day_of_week: i,
      open_time: '09:00',
      close_time: '18:00',
      is_closed: i === 0, // Sunday closed by default
    })),
    slot_duration_min: 60,
    max_per_slot: 1,
    advance_days: 14,
  };
}

export default function ScheduleEditor({ value, onChange }: Props) {
  function updateDay(dayIndex: number, field: Partial<ScheduleDay>) {
    const newSchedules = value.schedules.map((s) =>
      s.day_of_week === dayIndex ? { ...s, ...field } : s
    );
    onChange({ ...value, schedules: newSchedules });
  }

  return (
    <div className="space-y-6">
      {/* Weekly schedule */}
      <div className="space-y-3">
        {value.schedules.map((day) => (
          <div
            key={day.day_of_week}
            className="flex items-center gap-3 py-2"
          >
            <label className="flex items-center gap-2 min-w-[80px]">
              <input
                type="checkbox"
                checked={!day.is_closed}
                onChange={(e) => updateDay(day.day_of_week, { is_closed: !e.target.checked })}
                className="w-4 h-4 rounded accent-[#FF6B35]"
              />
              <span className={`text-[14px] ${day.is_closed ? 'text-gray-300' : 'text-gray-700'}`}>
                {DAY_NAMES[day.day_of_week]}
              </span>
            </label>

            {!day.is_closed && (
              <div className="flex items-center gap-1.5">
                <input
                  type="time"
                  value={day.open_time}
                  onChange={(e) => updateDay(day.day_of_week, { open_time: e.target.value })}
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-[13px] text-gray-700"
                />
                <span className="text-gray-300 text-[13px]">~</span>
                <input
                  type="time"
                  value={day.close_time}
                  onChange={(e) => updateDay(day.day_of_week, { close_time: e.target.value })}
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-[13px] text-gray-700"
                />
              </div>
            )}
            {day.is_closed && (
              <span className="text-[13px] text-gray-300">휴무</span>
            )}
          </div>
        ))}
      </div>

      {/* Settings */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <div>
          <label className="block text-[13px] text-gray-600 mb-1.5">예약 단위</label>
          <div className="flex gap-2">
            {DURATION_OPTIONS.map((min) => (
              <button
                key={min}
                type="button"
                onClick={() => onChange({ ...value, slot_duration_min: min })}
                className={`
                  px-3 h-[36px] rounded-lg text-[13px] font-medium transition-colors
                  ${value.slot_duration_min === min
                    ? 'bg-[#FF6B35] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                `}
              >
                {min}분
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[13px] text-gray-600 mb-1.5">시간당 최대 예약 수</label>
          <input
            type="number"
            min={1}
            max={100}
            value={value.max_per_slot}
            onChange={(e) => onChange({ ...value, max_per_slot: Math.max(1, Number(e.target.value)) })}
            className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-[14px] text-gray-700"
          />
        </div>

        <div>
          <label className="block text-[13px] text-gray-600 mb-1.5">예약 가능 기간 (일)</label>
          <input
            type="number"
            min={1}
            max={90}
            value={value.advance_days}
            onChange={(e) => onChange({ ...value, advance_days: Math.max(1, Number(e.target.value)) })}
            className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-[14px] text-gray-700"
          />
        </div>
      </div>
    </div>
  );
}
