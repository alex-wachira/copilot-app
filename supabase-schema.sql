-- ============================================================
-- Co-Pilot — Supabase Database Schema
-- Run this in your Supabase SQL editor to set up the database
-- ============================================================

-- Drivers profile (extends Supabase auth.users)
create table public.drivers (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  city text default 'Chicago',
  weekly_goal integer default 1000,
  rating numeric(3,2) default 5.00,
  plan text default 'free', -- 'free' | 'pro'
  streak integer default 0,
  created_at timestamptz default now()
);
alter table public.drivers enable row level security;
create policy "Drivers can read/write own profile"
  on public.drivers for all using (auth.uid() = id);

-- Rides log
create table public.rides (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid references public.drivers on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  base_fare numeric(8,2) default 0,
  surge_multiplier numeric(4,2) default 1.0,
  surge_amount numeric(8,2) default 0,
  tip numeric(8,2) default 0,
  miles numeric(8,2) default 0,
  created_at timestamptz default now()
);
alter table public.rides enable row level security;
create policy "Drivers can manage own rides"
  on public.rides for all using (auth.uid() = driver_id);

-- Mileage log (auto-tracked)
create table public.mileage_log (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid references public.drivers on delete cascade,
  date date not null,
  miles numeric(8,2) not null,
  deduction numeric(8,2) generated always as (miles * 0.67) stored,
  created_at timestamptz default now()
);
alter table public.mileage_log enable row level security;
create policy "Drivers can manage own mileage"
  on public.mileage_log for all using (auth.uid() = driver_id);

-- Expenses (fuel, maintenance, etc.)
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid references public.drivers on delete cascade,
  category text not null, -- 'fuel' | 'maintenance' | 'phone' | 'other'
  amount numeric(8,2) not null,
  note text,
  date date not null default current_date,
  created_at timestamptz default now()
);
alter table public.expenses enable row level security;
create policy "Drivers can manage own expenses"
  on public.expenses for all using (auth.uid() = driver_id);

-- Helpful views
create view public.weekly_earnings as
  select
    driver_id,
    date_trunc('week', started_at) as week_start,
    sum(base_fare + surge_amount + tip) as total,
    count(*) as rides,
    sum(surge_amount) as surge_total,
    sum(tip) as tips_total
  from public.rides
  group by driver_id, week_start;

create view public.daily_mileage as
  select
    driver_id,
    date,
    sum(miles) as total_miles,
    sum(deduction) as total_deduction
  from public.mileage_log
  group by driver_id, date;

-- ============================================================
-- Surge Reports table (add to existing schema)
-- ============================================================

create table public.surge_reports (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid references public.drivers on delete cascade,
  lat numeric(10,7) not null,
  lng numeric(10,7) not null,
  city text not null,
  neighborhood text,
  multiplier numeric(4,2) not null default 1.0,
  source text not null check (source in ('passive','tap','voice')),
  confidence numeric(4,3) default 0.8,
  reported_at timestamptz default now(),
  expires_at timestamptz not null
);

alter table public.surge_reports enable row level security;

create policy "Anyone can read surge reports"
  on public.surge_reports for select using (true);

create policy "Drivers insert own reports"
  on public.surge_reports for insert
  with check (auth.uid() = driver_id);

-- Index for fast city + recency queries
create index idx_surge_city_time
  on public.surge_reports (city, reported_at desc);

-- Auto-delete expired reports (run as cron or pg_cron)
-- delete from public.surge_reports where expires_at < now();
