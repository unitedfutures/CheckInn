-- 施設の最大宿泊人数カラムを追加
ALTER TABLE public.facilities
  ADD COLUMN IF NOT EXISTS max_guests INTEGER NOT NULL DEFAULT 10;
