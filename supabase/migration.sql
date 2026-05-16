-- ============================================================
-- CheckInn マイグレーションSQL
-- 旧テーブル削除 → 新テーブル追加
-- ※ すでにprofilesテーブルが存在する環境用
-- ============================================================

-- 旧テーブルを削除（存在する場合のみ）
drop table if exists public.reservations cascade;
drop table if exists public.properties cascade;

-- 旧トリガー・関数を削除（再作成のため）
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- ============================================================
-- 新テーブル作成（IF NOT EXISTS で安全に実行）
-- ============================================================

-- 施設マスタ
create table if not exists public.facilities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  address text,
  qr_slug text unique not null default encode(gen_random_bytes(8), 'hex'),
  beds24_property_id text,
  remote_lock_device_id text,
  emergency_contact text,
  checkin_instructions text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 予約（Beds24から同期 or 手動登録）
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  facility_id uuid references public.facilities on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  beds24_booking_id text unique,
  guest_email text,
  guest_name text,
  checkin_date date not null,
  checkout_date date not null,
  num_guests integer default 1,
  status text default 'pending',
  pre_checkin_token text unique not null default encode(gen_random_bytes(16), 'hex'),
  guest_qr_token text unique not null default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 宿泊者名簿（旅館業法準拠・3年保存）
create table if not exists public.guest_records (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings on delete cascade not null,
  facility_id uuid references public.facilities not null,
  full_name text not null,
  address text not null,
  phone text not null,
  email text not null,
  num_guests integer not null default 1,
  is_foreign boolean default false,
  nationality text,
  passport_number text,
  passport_image_path text,
  terms_agreed_at timestamptz,
  terms_ip_address text,
  face_photo_path text,
  checkin_qr_scanned_at timestamptz,
  checkin_ip_address text,
  checkin_completed_at timestamptz,
  delete_after date not null default (current_date + interval '3 years'),
  created_at timestamptz default now()
);

-- 暗証番号発行ログ
create table if not exists public.access_codes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings on delete cascade not null,
  facility_id uuid references public.facilities not null,
  code text not null,
  issued_at timestamptz default now(),
  expires_at timestamptz,
  remote_lock_response jsonb,
  is_manual boolean default false
);

-- ============================================================
-- RLS有効化
-- ============================================================
alter table public.profiles enable row level security;
alter table public.facilities enable row level security;
alter table public.bookings enable row level security;
alter table public.guest_records enable row level security;
alter table public.access_codes enable row level security;

-- ============================================================
-- RLSポリシー（既存があれば削除して再作成）
-- ============================================================

-- profiles
drop policy if exists "profiles: 本人のみ" on public.profiles;
create policy "profiles: 本人のみ" on public.profiles
  for all using (auth.uid() = id);

-- facilities
drop policy if exists "facilities: 本人のみ参照" on public.facilities;
drop policy if exists "facilities: 本人のみ作成" on public.facilities;
drop policy if exists "facilities: 本人のみ更新" on public.facilities;
drop policy if exists "facilities: 本人のみ削除" on public.facilities;
drop policy if exists "facilities: qr_slugで公開参照（宿泊者用）" on public.facilities;
create policy "facilities: 本人のみ参照" on public.facilities for select using (auth.uid() = user_id);
create policy "facilities: 本人のみ作成" on public.facilities for insert with check (auth.uid() = user_id);
create policy "facilities: 本人のみ更新" on public.facilities for update using (auth.uid() = user_id);
create policy "facilities: 本人のみ削除" on public.facilities for delete using (auth.uid() = user_id);
create policy "facilities: qr_slugで公開参照（宿泊者用）" on public.facilities for select using (true);

-- bookings
drop policy if exists "bookings: 本人のみ" on public.bookings;
drop policy if exists "bookings: pre_checkin_tokenで参照（宿泊者用）" on public.bookings;
create policy "bookings: 本人のみ" on public.bookings for all using (auth.uid() = user_id);
create policy "bookings: pre_checkin_tokenで参照（宿泊者用）" on public.bookings for select using (true);

-- guest_records
drop policy if exists "guest_records: 管理者のみ" on public.guest_records;
create policy "guest_records: 管理者のみ" on public.guest_records
  for all using (
    auth.uid() = (select user_id from public.bookings where id = booking_id)
  );

-- access_codes
drop policy if exists "access_codes: 管理者のみ" on public.access_codes;
create policy "access_codes: 管理者のみ" on public.access_codes
  for all using (
    auth.uid() = (select user_id from public.bookings where id = booking_id)
  );

-- ============================================================
-- 関数・トリガー（再作成）
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Storageバケットはダッシュボードから手動作成
-- バケット名: passport-images（Private）
-- バケット名: face-photos（Private）
-- ============================================================
