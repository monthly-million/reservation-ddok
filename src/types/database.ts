export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  phone: string;
  location: string;
  hours: string;
  message: string | null;
  menu_images: string[];
  slot_duration_min: number;
  max_per_slot: number;
  advance_days: number;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  shop_id: string;
  type: 'text' | 'radio' | 'image';
  title: string;
  options: string[] | null;
  sort_order: number;
  required: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  shop_id: string;
  name: string;
  phone: string;
  visit_count: number;
  no_show_count: number;
  last_visit: string | null;
  tags: string[];
  memo: string;
  created_at: string;
  updated_at: string;
}

export const RESERVATION_STATUSES = ['new', 'confirmed', 'completed', 'no_show', 'cancelled'] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export interface Reservation {
  id: string;
  shop_id: string;
  customer_id: string | null;
  customer_name: string;
  customer_phone: string;
  answers: ReservationAnswer[];
  reserved_date: string | null;
  reserved_time: string | null;
  status: ReservationStatus;
  reference_code: string | null;
  idempotency_key: string;
  created_at: string;
}

export interface ReservationAnswer {
  question_id: string;
  question_title: string;
  type: 'text' | 'radio' | 'image';
  value: string;
}

export interface ShopSchedule {
  id: string;
  shop_id: string;
  day_of_week: number;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

export interface ShopClosure {
  id: string;
  shop_id: string;
  closed_date: string;
  reason: string | null;
}
