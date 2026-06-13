-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shops table (with slug!)
CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  hours TEXT,
  message TEXT,
  menu_images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('text', 'radio', 'image')),
  title TEXT NOT NULL,
  options JSONB DEFAULT '[]',
  sort_order INTEGER NOT NULL DEFAULT 0,
  required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reservations table (answers include question snapshots)
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  answers JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed')),
  idempotency_key TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Push subscriptions
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_shops_owner ON shops(owner_id);
CREATE INDEX idx_shops_slug ON shops(slug);
CREATE INDEX idx_questions_shop ON questions(shop_id);
CREATE INDEX idx_reservations_shop ON reservations(shop_id);
CREATE INDEX idx_reservations_created ON reservations(created_at DESC);
CREATE INDEX idx_push_subscriptions_shop ON push_subscriptions(shop_id);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only read/update their own
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Shops: owners CRUD their own, public can read by slug
CREATE POLICY "Owners manage own shops" ON shops FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Public can read shops" ON shops FOR SELECT USING (true);

-- Questions: owners CRUD, public can read
CREATE POLICY "Owners manage own questions" ON questions FOR ALL USING (
  auth.uid() = (SELECT owner_id FROM shops WHERE id = questions.shop_id)
);
CREATE POLICY "Public can read questions" ON questions FOR SELECT USING (true);

-- Reservations: owners read own shop's, public can insert
CREATE POLICY "Owners read own reservations" ON reservations FOR SELECT USING (
  auth.uid() = (SELECT owner_id FROM shops WHERE id = reservations.shop_id)
);
CREATE POLICY "Owners update own reservations" ON reservations FOR UPDATE USING (
  auth.uid() = (SELECT owner_id FROM shops WHERE id = reservations.shop_id)
);
CREATE POLICY "Public can create reservations" ON reservations FOR INSERT WITH CHECK (true);

-- Push subscriptions: owners manage their own
CREATE POLICY "Owners manage push subs" ON push_subscriptions FOR ALL USING (
  auth.uid() = (SELECT owner_id FROM shops WHERE id = push_subscriptions.shop_id)
);

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, phone)
  VALUES (NEW.id, NEW.phone);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger: updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER shops_updated_at BEFORE UPDATE ON shops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable realtime for reservations
ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
