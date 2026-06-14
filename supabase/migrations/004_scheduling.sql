-- Add scheduling columns to shops
ALTER TABLE shops ADD COLUMN IF NOT EXISTS slot_duration_min INT DEFAULT 60;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS max_per_slot INT DEFAULT 1;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS advance_days INT DEFAULT 14;

-- Add date/time to reservations
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS reserved_date DATE;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS reserved_time TIME;

-- Shop schedules (weekly operating hours)
CREATE TABLE shop_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time TIME NOT NULL DEFAULT '09:00',
  close_time TIME NOT NULL DEFAULT '18:00',
  is_closed BOOLEAN DEFAULT false,
  UNIQUE(shop_id, day_of_week)
);

-- Shop closures (temporary holidays)
CREATE TABLE shop_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  closed_date DATE NOT NULL,
  reason TEXT,
  UNIQUE(shop_id, closed_date)
);

-- Indexes
CREATE INDEX idx_shop_schedules_shop ON shop_schedules(shop_id);
CREATE INDEX idx_shop_closures_shop_date ON shop_closures(shop_id, closed_date);
CREATE INDEX idx_reservations_date ON reservations(shop_id, reserved_date);

-- RLS
ALTER TABLE shop_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_closures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage schedules" ON shop_schedules FOR ALL USING (
  auth.uid() = (SELECT owner_id FROM shops WHERE id = shop_schedules.shop_id)
);
CREATE POLICY "Public read schedules" ON shop_schedules FOR SELECT USING (true);

CREATE POLICY "Owners manage closures" ON shop_closures FOR ALL USING (
  auth.uid() = (SELECT owner_id FROM shops WHERE id = shop_closures.shop_id)
);
CREATE POLICY "Public read closures" ON shop_closures FOR SELECT USING (true);
