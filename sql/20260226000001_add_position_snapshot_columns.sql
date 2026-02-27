-- Migration: Add position snapshot columns to derived salary tables
-- Description: Stores which position (and rates) were actually used when each
--   flight pay, per diem, and monthly calculation was last computed. Enables
--   auditing, debugging, and correct display of historical position per month.
-- Affected tables: flights, layover_rest_periods, monthly_calculations
-- Date: 2026-02-26
-- Special notes: All columns are nullable for backward compatibility.
--   Existing rows will be backfilled where position can be determined from
--   user_position_history. The application code sets these on every write
--   after Phase 3A is deployed.

-- =====================================================
-- 1. Add snapshot columns to flights
-- =====================================================

-- position_used: the position (CCM/SCCM) used to compute flight_pay for this row
alter table public.flights
  add column if not exists position_used text check (position_used in ('CCM', 'SCCM'));

-- hourly_rate_used: the AED/hour rate used to compute flight_pay
alter table public.flights
  add column if not exists hourly_rate_used numeric(6, 2);

comment on column public.flights.position_used is
  'The crew position used when computing flight_pay for this duty. Set by the calculation pipeline; null for rows created before this feature.';

comment on column public.flights.hourly_rate_used is
  'The hourly rate (AED) used when computing flight_pay for this duty.';

-- =====================================================
-- 2. Add snapshot columns to layover_rest_periods
-- =====================================================

-- position_used: the position used to compute per_diem_pay for this rest period
alter table public.layover_rest_periods
  add column if not exists position_used text check (position_used in ('CCM', 'SCCM'));

-- per_diem_rate_used: the AED/hour rate used to compute per_diem_pay
alter table public.layover_rest_periods
  add column if not exists per_diem_rate_used numeric(6, 2);

comment on column public.layover_rest_periods.position_used is
  'The crew position used when computing per_diem_pay for this rest period. Uses the outbound flight''s month position (by design).';

comment on column public.layover_rest_periods.per_diem_rate_used is
  'The per diem rate (AED/hour) used when computing per_diem_pay for this rest period.';

-- =====================================================
-- 3. Add snapshot column to monthly_calculations
-- =====================================================

-- position_used: the position used when calculating this month's salary totals
alter table public.monthly_calculations
  add column if not exists position_used text check (position_used in ('CCM', 'SCCM'));

comment on column public.monthly_calculations.position_used is
  'The crew position used when computing this month''s salary breakdown. Allows the UI to show the correct historical position badge per month.';

-- =====================================================
-- 4. Backfill snapshot columns from position history
-- =====================================================

-- Backfill monthly_calculations.position_used using the position history resolver.
-- For each monthly calculation, find the latest position history entry effective
-- on or before that month. This mirrors the runtime resolver logic.
update public.monthly_calculations mc
set position_used = (
  select h.position
  from public.user_position_history h
  where
    h.user_id = mc.user_id
    and (
      h.effective_from_year < mc.year
      or (h.effective_from_year = mc.year and h.effective_from_month <= mc.month)
    )
  order by h.effective_from_year desc, h.effective_from_month desc
  limit 1
)
where mc.position_used is null;

-- Backfill flights.position_used and hourly_rate_used.
-- The hourly rate depends on the date-aware rate table (legacy vs new July 2025+).
-- We derive position from history and apply the appropriate rate.
update public.flights f
set
  position_used = (
    select h.position
    from public.user_position_history h
    where
      h.user_id = f.user_id
      and (
        h.effective_from_year < f.year
        or (h.effective_from_year = f.year and h.effective_from_month <= f.month)
      )
    order by h.effective_from_year desc, h.effective_from_month desc
    limit 1
  ),
  hourly_rate_used = case
    -- July 2025+ rates
    when (f.year > 2025 or (f.year = 2025 and f.month >= 7)) then
      case (
        select h.position
        from public.user_position_history h
        where
          h.user_id = f.user_id
          and (
            h.effective_from_year < f.year
            or (h.effective_from_year = f.year and h.effective_from_month <= f.month)
          )
        order by h.effective_from_year desc, h.effective_from_month desc
        limit 1
      )
        when 'CCM' then 50.00
        when 'SCCM' then 62.00
        else null
      end
    -- Legacy rates (before July 2025)
    else
      case (
        select h.position
        from public.user_position_history h
        where
          h.user_id = f.user_id
          and (
            h.effective_from_year < f.year
            or (h.effective_from_year = f.year and h.effective_from_month <= f.month)
          )
        order by h.effective_from_year desc, h.effective_from_month desc
        limit 1
      )
        when 'CCM' then 50.00
        when 'SCCM' then 62.00
        else null
      end
  end
where f.position_used is null;

-- Backfill layover_rest_periods.position_used and per_diem_rate_used.
-- Per diem rate is the same for both positions in all periods (8.82 AED/hr).
-- We still store position_used for auditability.
update public.layover_rest_periods lrp
set
  position_used = (
    select h.position
    from public.user_position_history h
    where
      h.user_id = lrp.user_id
      and (
        h.effective_from_year < lrp.year
        or (h.effective_from_year = lrp.year and h.effective_from_month <= lrp.month)
      )
    order by h.effective_from_year desc, h.effective_from_month desc
    limit 1
  ),
  -- Per diem rate is 8.82 for both CCM and SCCM in all current rate tables
  per_diem_rate_used = 8.82
where lrp.position_used is null;
