-- Create customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  visit_count INT NOT NULL DEFAULT 0,
  no_show_count INT NOT NULL DEFAULT 0,
  last_visit TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  memo TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(shop_id, phone)
);

CREATE INDEX idx_customers_shop_phone ON customers(shop_id, phone);
CREATE INDEX idx_customers_shop_name ON customers(shop_id, name);

-- Update reservations status constraint
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check;
ALTER TABLE reservations ADD CONSTRAINT reservations_status_check
  CHECK (status IN ('new', 'confirmed', 'completed', 'no_show', 'cancelled'));

-- Add customer_id and reference_code to reservations
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES customers(id);
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS reference_code TEXT;

-- RLS for customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners read own customers" ON customers FOR SELECT USING (
  auth.uid() = (SELECT owner_id FROM shops WHERE id = customers.shop_id)
);
CREATE POLICY "Owners update own customers" ON customers FOR UPDATE USING (
  auth.uid() = (SELECT owner_id FROM shops WHERE id = customers.shop_id)
);
CREATE POLICY "Owners delete own customers" ON customers FOR DELETE USING (
  auth.uid() = (SELECT owner_id FROM shops WHERE id = customers.shop_id)
);
CREATE POLICY "Service role inserts customers" ON customers FOR INSERT WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER customers_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Backfill: create customer records from existing reservations
INSERT INTO customers (shop_id, name, phone)
SELECT DISTINCT ON (shop_id, customer_phone)
  shop_id, customer_name, customer_phone
FROM reservations
ON CONFLICT (shop_id, phone) DO NOTHING;

-- Backfill: link existing reservations to customers
UPDATE reservations r
SET customer_id = c.id
FROM customers c
WHERE r.shop_id = c.shop_id AND r.customer_phone = c.phone AND r.customer_id IS NULL;

-- Enable realtime for customers
ALTER PUBLICATION supabase_realtime ADD TABLE customers;
