-- guest_records にパスキー列追加
ALTER TABLE guest_records
  ADD COLUMN IF NOT EXISTS passkey_credential_id TEXT,
  ADD COLUMN IF NOT EXISTS passkey_public_key TEXT,
  ADD COLUMN IF NOT EXISTS passkey_counter BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS passkey_registered_at TIMESTAMPTZ;

-- チャレンジ一時保存テーブル
CREATE TABLE IF NOT EXISTS passkey_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge TEXT NOT NULL,
  type TEXT NOT NULL, -- 'registration' | 'authentication'
  guest_record_id UUID REFERENCES guest_records(id) ON DELETE CASCADE,
  facility_id UUID REFERENCES facilities(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '10 minutes'
);
