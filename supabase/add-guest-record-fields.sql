-- 事前登録フォームの追加項目に対応するカラムを追加
ALTER TABLE public.guest_records
  ADD COLUMN IF NOT EXISTS checkin_time      TEXT,        -- チェックイン予定時刻
  ADD COLUMN IF NOT EXISTS checkout_time     TEXT,        -- チェックアウト予定時刻
  ADD COLUMN IF NOT EXISTS previous_location TEXT,        -- 前出発地
  ADD COLUMN IF NOT EXISTS next_destination  TEXT,        -- 行き先地
  ADD COLUMN IF NOT EXISTS age               INTEGER;     -- 年齢（代表者）
-- 国籍(nationality) は外国人対応で既に存在するため追加不要
