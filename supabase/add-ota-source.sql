-- OTAソースの識別用カラムを bookings に追加
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS ota_source TEXT,         -- 'beds24' | 'airhost' | null（手動/自己登録）
  ADD COLUMN IF NOT EXISTS airhost_booking_id TEXT; -- Airhost予約ID

-- Airhost APIキーを profiles に追加
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS airhost_api_key TEXT;
