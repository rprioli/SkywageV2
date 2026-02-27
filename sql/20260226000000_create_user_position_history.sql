-- Migration: Create user_position_history table
-- Description: Introduces effective-dated position history so salary calculations
--   always use the position that applied in a given month. Prevents promotions from
--   retroactively rewriting historical salary data.
-- Affected tables: user_position_history (new), profiles (trigger update)
-- Date: 2026-02-26

-- =====================================================
-- 1. Create user_position_history table
-- =====================================================

create table public.user_position_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- The position effective from this month forward
  position text not null check (position in ('CCM', 'SCCM')),

  -- Effective from (year + month, 1-indexed month)
  effective_from_year int not null check (
    effective_from_year >= 2000 and effective_from_year <= 2100
  ),
  effective_from_month int not null check (
    effective_from_month between 1 and 12
  ),

  created_at timestamp with time zone default now() not null,

  -- One position change per user per month — prevents ambiguity
  unique (user_id, effective_from_year, effective_from_month)
);

comment on table public.user_position_history is
  'Effective-dated position history for each user. Each row represents a position change effective from a specific month/year. Used by all salary calculations to determine which position (and therefore which rates) apply for a given month.';

comment on column public.user_position_history.position is
  'The crew position: CCM (Cabin Crew Member) or SCCM (Senior Cabin Crew Member).';

comment on column public.user_position_history.effective_from_year is
  'Year from which this position is effective (inclusive).';

comment on column public.user_position_history.effective_from_month is
  'Month from which this position is effective (inclusive, 1-based).';

-- =====================================================
-- 2. Indexes for fast resolver lookup
-- =====================================================

-- Composite index for the "latest effective position for a given month" query:
-- WHERE user_id = ? AND (effective_from_year < ? OR (effective_from_year = ? AND effective_from_month <= ?))
-- ORDER BY effective_from_year DESC, effective_from_month DESC LIMIT 1
create index idx_position_history_user_lookup
  on public.user_position_history (user_id, effective_from_year, effective_from_month);

-- =====================================================
-- 3. Enable Row Level Security
-- =====================================================

alter table public.user_position_history enable row level security;

-- Users can only view their own position history
create policy "Users can view their own position history"
  on public.user_position_history
  for select
  using ((select auth.uid()) = user_id);

-- Users can only insert their own position history
create policy "Users can insert their own position history"
  on public.user_position_history
  for insert
  with check ((select auth.uid()) = user_id);

-- Users can only update their own position history
create policy "Users can update their own position history"
  on public.user_position_history
  for update
  using ((select auth.uid()) = user_id);

-- Users can only delete their own position history
create policy "Users can delete their own position history"
  on public.user_position_history
  for delete
  using ((select auth.uid()) = user_id);

-- =====================================================
-- 4. Backfill baseline records for existing users
-- =====================================================

-- For each existing user with a position set in profiles, insert a baseline
-- history row effective from their earliest month of data. This ensures the
-- resolver always finds a result for historical calculations.
--
-- Effective month priority:
--   1. Earliest month in monthly_calculations (most reliable)
--   2. Earliest month in flights
--   3. Fallback: January 2025 (MIN_SUPPORTED_YEAR)

insert into public.user_position_history (user_id, position, effective_from_year, effective_from_month)
select
  p.id as user_id,
  p.position,
  coalesce(
    -- earliest month from monthly_calculations
    (
      select mc.year
      from public.monthly_calculations mc
      where mc.user_id = p.id
      order by mc.year asc, mc.month asc
      limit 1
    ),
    -- earliest month from flights
    (
      select f.year
      from public.flights f
      where f.user_id = p.id
      order by f.year asc, f.month asc
      limit 1
    ),
    -- fallback
    2025
  ) as effective_from_year,
  coalesce(
    -- earliest month from monthly_calculations
    (
      select mc.month
      from public.monthly_calculations mc
      where mc.user_id = p.id
      order by mc.year asc, mc.month asc
      limit 1
    ),
    -- earliest month from flights
    (
      select f.month
      from public.flights f
      where f.user_id = p.id
      order by f.year asc, f.month asc
      limit 1
    ),
    -- fallback
    1
  ) as effective_from_month
from
  public.profiles p
where
  -- only backfill users who have a position set
  p.position is not null
  and p.position != ''
  -- skip if already has a history row (idempotent)
  and not exists (
    select 1
    from public.user_position_history h
    where h.user_id = p.id
  );

-- =====================================================
-- 5. Update handle_new_user trigger to create baseline history
-- =====================================================

-- When a new user signs up with a position, create their baseline history row
-- effective from the current month. This ensures new users always have a
-- resolvable position in the calculation pipeline.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Insert the user profile row
  insert into public.profiles (id, email, airline, "position", nationality, first_name, last_name, avatar_url, username)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'airline',
    new.raw_user_meta_data->>'position',
    new.raw_user_meta_data->>'nationality',
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'username'
  );

  -- Create the baseline position history row if the user signed up with a position.
  -- Effective from the current month so the resolver always has a result.
  if new.raw_user_meta_data->>'position' is not null
     and new.raw_user_meta_data->>'position' != ''
     and new.raw_user_meta_data->>'position' in ('CCM', 'SCCM') then
    insert into public.user_position_history (user_id, position, effective_from_year, effective_from_month)
    values (
      new.id,
      new.raw_user_meta_data->>'position',
      extract(year from now())::int,
      extract(month from now())::int
    );
  end if;

  return new;
end;
$$;
