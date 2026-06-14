CREATE TABLE phone_otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false,
  attempts INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_phone_otps_phone_code ON phone_otps(phone, otp_code);

ALTER TABLE phone_otps ENABLE ROW LEVEL SECURITY;
-- No permissive policies: deny all direct access from client
-- Only service_role (Edge Functions) can access this table
