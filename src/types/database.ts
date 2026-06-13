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

export interface Reservation {
  id: string;
  shop_id: string;
  customer_name: string;
  customer_phone: string;
  answers: ReservationAnswer[];
  status: 'new' | 'confirmed';
  idempotency_key: string;
  created_at: string;
}

export interface ReservationAnswer {
  question_id: string;
  question_title: string;
  type: 'text' | 'radio' | 'image';
  value: string;
}
