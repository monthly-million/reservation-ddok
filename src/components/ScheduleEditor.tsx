'use client';

import { useState } from 'react';

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
  auto_close_holidays: boolean;
  closures: string[];
}

interface Props {
  value: ScheduleConfig;
  onChange: (config: ScheduleConfig) => void;
}

const DAY_NAMES = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
const DURATION_OPTIONS = [
  { value: 30, label: '30분' },
  { value: 60, label: '1시간' },
  { value: 90, label: '1시간 30분' },
  { value: 120, label: '2시간' },
];
const ADVANCE_OPTIONS = [
  { value: 14, label: '2주 (14일)' },
  { value: 30, label: '1개월 (30일)' },
  { value: 60, label: '2개월 (60일)' },
];

export function getDefaultScheduleConfig(): ScheduleConfig {
  return {
    schedules: Array.from({ length: 7 }, (_, i) => ({
      day_of_week: i,
      open_time: '09:00',
      close_time: '18:00',
      is_closed: i === 0,
    })),
    slot_duration_min: 60,
    max_per_slot: 1,
    advance_days: 14,
    auto_close_holidays: false,
    closures: [],
  };
}

export default function ScheduleEditor({ value, onChange }: Props) {
  const [showBulkSet, setShowBulkSet] = useState(false);
  const [bulkOpen, setBulkOpen] = useState('09:00');
  const [bulkClose, setBulkClose] = useState('18:00');
  const [closureInput, setClosureInput] = useState('');

  function updateDay(dayIndex: number, field: Partial<ScheduleDay>) {
    const newSchedules = value.schedules.map((s) =>
      s.day_of_week === dayIndex ? { ...s, ...field } : s
    );
    onChange({ ...value, schedules: newSchedules });
  }

  function applyBulkTime() {
    const newSchedules = value.schedules.map((s) =>
      s.is_closed ? s : { ...s, open_time: bulkOpen, close_time: bulkClose }
    );
    onChange({ ...value, schedules: newSchedules });
    setShowBulkSet(false);
  }

  function addClosure() {
    if (!closureInput || value.closures.includes(closureInput)) return;
    onChange({ ...value, closures: [...value.closures, closureInput].sort() });
    setClosureInput('');
  }

  function removeClosure(date: string) {
    onChange({ ...value, closures: value.closures.filter((d) => d !== date) });
  }

  function formatClosureDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    return `${month}/${day} (${dayNames[d.getDay()]})`;
  }

  return (
    <div className="space-y-6">
      {/* Bulk set button */}
      <div>
        <button
          type="button"
          onClick={() => setShowBulkSet(!showBulkSet)}
          className="text-[13px] text-[#FF6B35] font-medium hover:underline"
        >
          일괄 설정
        </button>
        {showBulkSet && (
          <div className="mt-3 p-4 bg-gray-50 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={bulkOpen}
                onChange={(e) => setBulkOpen(e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-[13px] text-gray-700"
              />
              <span className="text-gray-300 text-[13px]">~</span>
              <input
                type="time"
                value={bulkClose}
                onChange={(e) => setBulkClose(e.target.value)}
                className="border border-gray-200 rounded-lg px-2 py-1.5 text-[13px] text-gray-700"
              />
              <button
                type="button"
                onClick={applyBulkTime}
                className="px-3 h-[32px] rounded-lg bg-[#FF6B35] text-white text-[13px] font-medium"
              >
                전체 적용
              </button>
            </div>
            <p className="text-[12px] text-gray-400">휴무일을 제외한 모든 요일에 적용됩니다</p>
          </div>
        )}
      </div>

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
      <div className="space-y-5 pt-4 border-t border-gray-100">
        {/* Slot duration - pill buttons */}
        <div>
          <label className="block text-[13px] text-gray-600 mb-2">예약 단위</label>
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ ...value, slot_duration_min: opt.value })}
                className={`
                  px-4 h-[36px] rounded-full text-[13px] font-medium transition-colors
                  ${value.slot_duration_min === opt.value
                    ? 'bg-[#FF6B35] text-white'
                    : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}
                `}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Max per slot */}
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

        {/* Advance days - pill selector */}
        <div>
          <label className="block text-[13px] text-gray-600 mb-2">예약 가능 기간</label>
          <div className="flex flex-wrap gap-2">
            {ADVANCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange({ ...value, advance_days: opt.value })}
                className={`
                  px-4 h-[36px] rounded-full text-[13px] font-medium transition-colors
                  ${value.advance_days === opt.value
                    ? 'bg-[#FF6B35] text-white'
                    : 'border border-gray-200 text-gray-600 hover:bg-gray-50'}
                `}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[12px] text-gray-400">오늘부터 선택한 기간까지 고객이 예약할 수 있습니다</p>
        </div>
      </div>

      {/* Holidays & closures */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <h3 className="text-[14px] font-medium text-gray-800">휴무 설정</h3>

        {/* Auto-close holidays toggle */}
        <label className="flex items-center justify-between py-2">
          <div>
            <span className="text-[14px] text-gray-700">공휴일 자동 휴무</span>
            <p className="text-[12px] text-gray-400 mt-0.5">대한민국 공휴일에 자동으로 휴무 처리</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={value.auto_close_holidays}
            onClick={() => onChange({ ...value, auto_close_holidays: !value.auto_close_holidays })}
            className={`relative w-[44px] h-[24px] rounded-full transition-colors ${
              value.auto_close_holidays ? 'bg-[#FF6B35]' : 'bg-gray-200'
            }`}
          >
            <span
              className={`absolute top-[2px] left-[2px] w-[20px] h-[20px] bg-white rounded-full transition-transform ${
                value.auto_close_holidays ? 'translate-x-[20px]' : ''
              }`}
            />
          </button>
        </label>

        {/* Manual closures */}
        <div>
          <label className="block text-[13px] text-gray-600 mb-2">수동 휴무일 추가</label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={closureInput}
              onChange={(e) => setClosureInput(e.target.value)}
              min={new Date().toISOString().slice(0, 10)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-[13px] text-gray-700"
            />
            <button
              type="button"
              onClick={addClosure}
              disabled={!closureInput}
              className="px-3 h-[36px] rounded-lg bg-gray-100 text-[13px] font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-40"
            >
              추가
            </button>
          </div>
          {value.closures.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {value.closures.map((date) => (
                <span
                  key={date}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-full text-[13px] text-gray-600"
                >
                  {formatClosureDate(date)}
                  <button
                    type="button"
                    onClick={() => removeClosure(date)}
                    className="text-gray-400 hover:text-red-500 ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
