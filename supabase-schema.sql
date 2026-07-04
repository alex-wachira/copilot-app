-- ============================================================
-- Co-Pilot Full Database Schema v2
-- Run this in Supabase SQL Editor
-- ============================================================

-- ── Users (extends Supabase auth) ────────────────────────────
create table if not exists public.drivers (
  id                  uuid references auth.users on delete cascade primary key,
  name                text not null default '',
  city                text default 'Chicago',
  weekly_goal         integer default 1000,
  target_hourly_rate  numeric(8,2) default 18.00,
  minimum_per_mile    numeric(8,2) default 1.20,
  rating              numeric(3,2) default 5.00,
  plan                text default 'free',
  streak              integer default 0,
  avatar_url          text,
  platforms           text[] default array['uber'],
  created_at          timestamptz default now()
);
alter table public.drivers enable row level security;
create policy "Drivers manage own profile"
  on public.drivers for all using (auth.uid() = id);

-- ── Shifts (session tracking) ─────────────────────────────────
create table if not exists public.shifts (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references public.drivers on delete cascade not null,
  start_time        timestamptz not null default now(),
  end_time          timestamptz,
  starting_mileage  numeric(10,2) default 0,
  ending_mileage    numeric(10,2) default 0,
  total_miles       numeric(10,2) generated always as (
                      coalesce(ending_mileage, 0) - coalesce(starting_mileage, 0)
                    ) stored,
  notes             text,
  created_at        timestamptz default now()
);
alter table public.shifts enable row level security;
create policy "Drivers manage own shifts"
  on public.shifts for all using (auth.uid() = user_id);

-- ── Trips (individual gig deliveries/rides) ──────────────────
create type if not exists platform_enum as enum (
  'uber', 'lyft', 'doordash', 'ubereats', 'grubhub', 'instacart', 'other'
);

create table if not exists public.trips (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references public.drivers on delete cascade not null,
  shift_id          uuid references public.shifts on delete set null,
  platform          platform_enum not null,
  gross_payout      numeric(8,2) not null default 0,
  base_fare         numeric(8,2) default 0,
  tip_amount        numeric(8,2) default 0,
  surge_amount      numeric(8,2) default 0,
  active_miles      numeric(8,2) default 0,
  total_miles       numeric(8,2) default 0,
  estimated_taxes   numeric(8,2) generated always as (
                      round(gross_payout * 0.2533, 2)
                    ) stored,
  net_payout        numeric(8,2) generated always as (
                      round(gross_payout * 0.7467, 2)
                    ) stored,
  pickup_location   text,
  dropoff_location  text,
  restaurant_name   text,
  wait_time_mins    integer default 0,
  status            text default 'completed',
  started_at        timestamptz default now(),
  completed_at      timestamptz,
  created_at        timestamptz default now()
);
alter table public.trips enable row level security;
create policy "Drivers manage own trips"
  on public.trips for all using (auth.uid() = user_id);
create index idx_trips_user_date on public.trips (user_id, started_at desc);
create index idx_trips_platform on public.trips (user_id, platform);

-- ── Offer evaluations (auto-accept/decline log) ───────────────
create table if not exists public.offer_evaluations (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references public.drivers on delete cascade not null,
  platform          platform_enum not null,
  offered_payout    numeric(8,2) not null,
  offered_miles     numeric(8,2) not null,
  payout_per_mile   numeric(8,2) generated always as (
                      case when offered_miles > 0
                        then round(offered_payout / offered_miles, 2)
                      else 0 end
                    ) stored,
  pickup_location   text,
  restaurant_name   text,
  decision          text not null,  -- 'accepted' | 'declined' | 'manual'
  decline_reason    text,           -- 'below_rate' | 'blacklisted' | 'too_far'
  surge_zone        text,
  evaluated_at      timestamptz default now()
);
alter table public.offer_evaluations enable row level security;
create policy "Drivers manage own evaluations"
  on public.offer_evaluations for all using (auth.uid() = user_id);

-- ── Expenses (tax deductions) ─────────────────────────────────
create type if not exists expense_category as enum (
  'fuel', 'maintenance', 'phone', 'tolls', 'insurance',
  'car_wash', 'parking', 'supplies', 'other'
);

create table if not exists public.expenses (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.drivers on delete cascade not null,
  category      expense_category not null default 'other',
  amount        numeric(8,2) not null,
  description   text,
  receipt_url   text,
  date          date not null default current_date,
  created_at    timestamptz default now()
);
alter table public.expenses enable row level security;
create policy "Drivers manage own expenses"
  on public.expenses for all using (auth.uid() = user_id);

-- ── Mileage log ───────────────────────────────────────────────
create table if not exists public.mileage_log (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.drivers on delete cascade not null,
  date            date not null default current_date,
  miles           numeric(8,2) not null,
  deduction       numeric(8,2) generated always as (round(miles * 0.67, 2)) stored,
  trip_id         uuid references public.trips on delete set null,
  created_at      timestamptz default now()
);
alter table public.mileage_log enable row level security;
create policy "Drivers manage own mileage"
  on public.mileage_log for all using (auth.uid() = user_id);

-- ── Blacklisted restaurants ───────────────────────────────────
create table if not exists public.blacklisted_restaurants (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.drivers on delete cascade not null,
  restaurant_name text not null,
  location        text,
  reason          text,  -- 'long_wait' | 'bad_tip' | 'rude_staff' | 'other'
  avg_wait_mins   integer,
  created_at      timestamptz default now(),
  unique(user_id, restaurant_name)
);
alter table public.blacklisted_restaurants enable row level security;
create policy "Drivers manage own blacklist"
  on public.blacklisted_restaurants for all using (auth.uid() = user_id);

-- ── Surge reports (crowdsourced) ──────────────────────────────
create table if not exists public.surge_reports (
  id            uuid primary key default gen_random_uuid(),
  driver_id     uuid references public.drivers on delete cascade,
  lat           numeric(10,7) not null,
  lng           numeric(10,7) not null,
  city          text not null,
  neighborhood  text,
  multiplier    numeric(4,2) not null default 1.0,
  source        text not null check (source in ('passive','tap','voice')),
  confidence    numeric(4,3) default 0.8,
  reported_at   timestamptz default now(),
  expires_at    timestamptz not null
);
alter table public.surge_reports enable row level security;
create policy "Anyone can read surge reports"
  on public.surge_reports for select using (true);
create policy "Drivers insert own reports"
  on public.surge_reports for insert with check (auth.uid() = driver_id);
create index idx_surge_city_time on public.surge_reports (city, reported_at desc);

-- ── Useful views ──────────────────────────────────────────────
create or replace view public.weekly_earnings as
  select
    user_id,
    date_trunc('week', started_at) as week_start,
    platform,
    sum(gross_payout) as gross_total,
    sum(net_payout) as net_total,
    sum(tip_amount) as tips_total,
    sum(surge_amount) as surge_total,
    count(*) as trip_count,
    sum(active_miles) as total_miles,
    round(sum(gross_payout) / nullif(sum(active_miles), 0), 2) as per_mile,
    round(sum(gross_payout) / nullif(extract(epoch from sum(completed_at - started_at))/3600, 0), 2) as per_hour
  from public.trips
  where status = 'completed'
  group by user_id, week_start, platform;

create or replace view public.tax_summary as
  select
    t.user_id,
    extract(year from t.started_at) as year,
    extract(quarter from t.started_at) as quarter,
    sum(t.gross_payout) as gross_income,
    sum(t.estimated_taxes) as estimated_taxes,
    coalesce(e.total_expenses, 0) as total_expenses,
    coalesce(m.total_mileage_deduction, 0) as mileage_deduction,
    sum(t.gross_payout)
      - coalesce(e.total_expenses, 0)
      - coalesce(m.total_mileage_deduction, 0) as taxable_income
  from public.trips t
  left join (
    select user_id, extract(year from date) as year,
           extract(quarter from date) as quarter,
           sum(amount) as total_expenses
    from public.expenses group by 1,2,3
  ) e on e.user_id = t.user_id
    and e.year = extract(year from t.started_at)
    and e.quarter = extract(quarter from t.started_at)
  left join (
    select user_id, extract(year from date) as year,
           extract(quarter from date) as quarter,
           sum(deduction) as total_mileage_deduction
    from public.mileage_log group by 1,2,3
  ) m on m.user_id = t.user_id
    and m.year = extract(year from t.started_at)
    and m.quarter = extract(quarter from t.started_at)
  where t.status = 'completed'
  group by t.user_id, year, quarter, e.total_expenses, m.total_mileage_deduction;

-- ── Storage bucket for avatars + receipts ────────────────────
insert into storage.buckets (id, name, public)
values ('driver-avatars', 'driver-avatars', true)
on conflict do nothing;

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict do nothing;

create policy "Drivers upload own avatar"
  on storage.objects for insert
  with check (bucket_id = 'driver-avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Avatars publicly viewable"
  on storage.objects for select using (bucket_id = 'driver-avatars');

create policy "Drivers manage own receipts"
  on storage.objects for all
  using (bucket_id = 'receipts' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- Account deletion RPC (privacy / right-to-deletion)
-- Lets a signed-in user permanently delete their own account.
-- All tables cascade-delete via foreign keys.
-- ============================================================
create or replace function public.delete_user()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = auth.uid();
$$;

revoke execute on function public.delete_user() from public;
grant execute on function public.delete_user() to authenticated;
