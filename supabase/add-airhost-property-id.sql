-- 施設テーブルに Airhost Property ID カラムを追加
ALTER TABLE public.facilities
  ADD COLUMN IF NOT EXISTS airhost_property_id TEXT;
