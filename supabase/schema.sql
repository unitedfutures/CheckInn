-- プロフィール（事業者情報）
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  company_name text,
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_status text default 'inactive', -- inactive | active | past_due | canceled
  plan text default 'free', -- free | starter | pro
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 施設
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  address text,
  description text,
  qr_slug text unique not null default encode(gen_random_bytes(8), 'hex'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 予約
create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  reservation_code text not null,
  guest_name text,
  guest_email text,
  guest_phone text,
  checkin_date date not null,
  checkout_date date not null,
  num_guests integer default 1,
  pin_code text not null,
  guest_token text unique not null default encode(gen_random_bytes(16), 'hex'),
  guest_info_submitted boolean default false,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS有効化
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.reservations enable row level security;

-- profiles ポリシー
create policy "自分のプロフィールのみ参照"
  on public.profiles for select using (auth.uid() = id);
create policy "自分のプロフィールのみ更新"
  on public.profiles for update using (auth.uid() = id);

-- properties ポリシー
create policy "自分の施設のみ参照"
  on public.properties for select using (auth.uid() = user_id);
create policy "自分の施設のみ作成"
  on public.properties for insert with check (auth.uid() = user_id);
create policy "自分の施設のみ更新"
  on public.properties for update using (auth.uid() = user_id);
create policy "自分の施設のみ削除"
  on public.properties for delete using (auth.uid() = user_id);

-- reservations ポリシー
create policy "自分の予約のみ参照"
  on public.reservations for select using (auth.uid() = user_id);
create policy "自分の予約のみ作成"
  on public.reservations for insert with check (auth.uid() = user_id);
create policy "自分の予約のみ更新"
  on public.reservations for update using (auth.uid() = user_id);
create policy "自分の予約のみ削除"
  on public.reservations for delete using (auth.uid() = user_id);

-- guest_token で予約参照（宿泊者用・認証不要）
create policy "guest_tokenで予約参照可"
  on public.reservations for select using (true);

-- qr_slug で施設参照（宿泊者用・認証不要）
create policy "qr_slugで施設参照可"
  on public.properties for select using (true);

-- ユーザー作成時にprofileを自動生成
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
