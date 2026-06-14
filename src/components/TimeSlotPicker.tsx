'use client';

import { useState, useEffect } from 'react';

interface TimeSlot {
  time: string;
  available: boolean;
  remaining: number;
}

interface Props {
  shopId: string;
  date: string;
  selectedTime: string | null;
  onSelect: (time: string) => void;
}

export default function TimeSlotPicker({ shopId, date, selectedTime, onSelect }: Props) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (!shopId || !date) return;

    setLoading(true);
    setClosed(false);
    fetch(`/api/availability?shop_id=${shopId}&date=${date}`)
      .then((res) => res.json())
      .then((data) => {
        setSlots(data.slots || []);
        setClosed(data.closed || false);
      })
      .catch(() => {
        setSlots([]);
      })
      .finally(() => setLoading(false));
  }, [shopId, date]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-gray-200 border-t-[#FF6B35] rounded-full animate-spin" />
      </div>
    );
  }

  if (closed) {
    return (
      <p className="text-[14px] text-gray-400 text-center py-6">해당 날짜는 휴무일입니다</p>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="text-[14px] text-gray-400 text-center py-6">예약 가능한 시간이 없습니다</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {slots.map((slot) => {
        const isSelected = selectedTime === slot.time;
        return (
          <button
            key={slot.time}
            type="button"
            disabled={!slot.available}
            onClick={() => onSelect(slot.time)}
            className={`
              px-4 h-[40px] rounded-xl text-[14px] font-medium transition-colors
              ${!slot.available ? 'bg-gray-50 text-gray-300 cursor-not-allowed' : ''}
              ${slot.available && !isSelected ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : ''}
              ${isSelected ? 'bg-[#FF6B35] text-white' : ''}
            `}
          >
            {slot.time}
          </button>
        );
      })}
    </div>
  );
}
