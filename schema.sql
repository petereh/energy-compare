-- ============================================
-- PROVIDERS
-- ============================================
create table providers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  logo_url text,
  website_url text,
  created_at timestamp default now()
);

-- ============================================
-- PLANS (current offers you maintain manually)
-- ============================================
create table plans (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references providers(id) not null,
  name text not null,
  fuel_type text not null check (fuel_type in ('electricity','gas','dual_fuel')),

  requires_smart_meter boolean default false,
  meter_type text,                        -- '24hr' | 'day_night' | 'smart_tou'

  standing_charge_daily_rate numeric not null,  -- store daily, compute annual as x365
  vat_rate numeric default 9,

  contract_length_months int,
  exit_fee numeric default 0,
  discount_pct numeric,
  discount_duration_months int,
  discount_applies_to text default 'total',     -- 'total' | 'unit_rate' | 'standing_charge'

  green_energy boolean default false,
  source_url text,
  last_verified_at timestamp default now(),
  active boolean default true,
  created_at timestamp default now()
);

create table plan_rates (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references plans(id) not null,
  band_name text not null,
  band_category text not null check (band_category in ('day','night','peak','offpeak','weekend','24hr','other')),
  rate_cents_per_kwh numeric not null,
  fuel_type text not null check (fuel_type in ('electricity','gas'))
);

-- ============================================
-- BILL UPLOADS
-- ============================================
create table bill_uploads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamp default now(),

  user_id uuid references auth.users(id),

  contract_status text not null check (contract_status in ('in_contract','out_of_contract','not_sure')),
  contract_end_date date,

  original_filename text,

  provider_name text,
  tariff_name text,
  fuel_type text check (fuel_type in ('electricity','gas','dual_fuel')),

  invoice_number text,
  billing_period_start date,
  billing_period_end date,

  total_usage_kwh numeric,
  stated_annual_consumption_kwh numeric,

  total_cost_ex_vat numeric,
  vat_rate numeric default 9,
  source_amounts_were_vat_inclusive boolean default false,

  standing_charge_daily_rate numeric,
  standing_charge_days int,

  additional_charges jsonb,

  raw_extracted_text text,
  raw_llm_response jsonb,
  extraction_confidence text check (extraction_confidence in ('high','medium','low')),
  processing_status text default 'pending' check (processing_status in ('pending','processed','failed')),
  error_message text
);

create table bill_rates (
  id uuid primary key default gen_random_uuid(),
  bill_upload_id uuid references bill_uploads(id) not null,
  band_name text not null,
  band_category text check (band_category in ('day','night','peak','offpeak','weekend','24hr','other')),
  usage_kwh numeric not null,
  rate_cents_per_kwh numeric not null,
  price_change_sequence int default 1
);

-- ============================================
-- COMPARISON RESULTS
-- ============================================
create table comparison_results (
  id uuid primary key default gen_random_uuid(),
  bill_upload_id uuid references bill_uploads(id) not null,
  plan_id uuid references plans(id) not null,
  estimated_annual_cost numeric not null,
  estimated_annual_savings numeric,
  meets_contract_exit_threshold boolean,
  rank int,
  created_at timestamp default now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table providers enable row level security;
alter table plans enable row level security;
alter table plan_rates enable row level security;

create policy "providers are publicly readable" on providers for select using (true);
create policy "plans are publicly readable" on plans for select using (true);
create policy "plan_rates are publicly readable" on plan_rates for select using (true);

alter table bill_uploads enable row level security;
alter table bill_rates enable row level security;
alter table comparison_results enable row level security;

create policy "anyone can insert a bill_upload" on bill_uploads
  for insert with check (true);

create policy "owner or anonymous-by-id can read bill_uploads" on bill_uploads
  for select using (user_id is null or user_id = auth.uid());

create policy "owner can update their bill_uploads" on bill_uploads
  for update using (user_id = auth.uid());

create policy "insert bill_rates via service or owner" on bill_rates
  for insert with check (true);

create policy "read bill_rates if parent bill_upload is readable" on bill_rates
  for select using (
    exists (
      select 1 from bill_uploads b
      where b.id = bill_rates.bill_upload_id
        and (b.user_id is null or b.user_id = auth.uid())
    )
  );

create policy "insert comparison_results via service or owner" on comparison_results
  for insert with check (true);

create policy "read comparison_results if parent bill_upload is readable" on comparison_results
  for select using (
    exists (
      select 1 from bill_uploads b
      where b.id = comparison_results.bill_upload_id
        and (b.user_id is null or b.user_id = auth.uid())
    )
  );
