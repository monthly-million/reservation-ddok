'use client';

import { useState } from 'react';

interface Props {
  selectedDate: string | null;
  onSelect: (date: string) => void;
  advanceDays: number;
  closedDays?: number[];
  closedDates?: string[];
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

export default function Calendar({
  selectedDate,
  onSelect,
  advanceDays,
  closedDays = [],
  closedDates = [],
}: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + advanceDays);

  const firstDay = new Date(viewYear, viewMonth, 1);
  const lastDay = new Date(viewYear, viewMonth + 1, 0);
  const startOffset = firstDay.getDay();

  const canGoPrev = viewYear > today.getFullYear() || (viewYear === today.getFullYear() && viewMonth > today.getMonth());
  const canGoNext = new Date(viewYear, viewMonth + 1, 1) <= maxDate;

  function goMonth(delta: number) {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
  }

  function formatDate(year: number, month: number, day: number): string {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  function isDisabled(day: number): boolean {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(0, 0, 0, 0);
    if (d < today) return true;
    if (d > maxDate) return true;
    if (closedDays.includes(d.getDay())) return true;
    if (closedDates.includes(formatDate(viewYear, viewMonth, day))) return true;
    return false;
  }

  const days: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let i = 1; i <= lastDay.getDate(); i++) days.push(i);

  const monthLabel = `${viewYear}년 ${viewMonth + 1}월`;

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => goMonth(-1)}
          disabled={!canGoPrev}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 disabled:opacity-30 hover:bg-gray-50"
        >
          ‹
        </button>
        <span className="text-[15px] font-semibold text-gray-900">{monthLabel}</span>
        <button
          type="button"
          onClick={() => goMonth(1)}
          disabled={!canGoNext}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 disabled:opacity-30 hover:bg-gray-50"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((label, i) => (
          <div key={i} className="text-center text-[12px] text-gray-400 py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day, idx) => {
          if (day === null) return <div key={idx} />;
          const dateStr = formatDate(viewYear, viewMonth, day);
          const disabled = isDisabled(day);
          const isSelected = selectedDate === dateStr;
          const isToday =
            viewYear === today.getFullYear() &&
            viewMonth === today.getMonth() &&
            day === today.getDate();

          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(dateStr)}
              className={`
                relative w-full aspect-square flex items-center justify-center rounded-full text-[14px] transition-colors
                ${disabled ? 'text-gray-200 cursor-not-allowed' : 'text-gray-900 hover:bg-gray-50'}
                ${isSelected ? 'bg-[#FF6B35] text-white hover:bg-[#FF6B35]' : ''}
                ${isToday && !isSelected ? 'font-bold' : ''}
              `}
            >
              {day}
              {isToday && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#FF6B35]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
