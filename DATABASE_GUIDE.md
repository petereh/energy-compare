# Database Management Guide

All data management is done directly in Supabase SQL Editor for security.

## Access Supabase

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in left sidebar

## Quick Reference Queries

### View All Plans
```sql
SELECT
  p.name as plan_name,
  pr.name as provider,
  p.fuel_type,
  p.standing_charge_daily_rate,
  p.active
FROM plans p
JOIN providers pr ON p.provider_id = pr.id
ORDER BY pr.name, p.name;
```

### View All Microgen Rates
```sql
SELECT
  pr.name as provider,
  m.export_rate_cents_per_kwh as rate_c_per_kwh,
  m.requires_smart_meter,
  m.active
FROM microgen_export_rates m
JOIN providers pr ON m.provider_id = pr.id
ORDER BY m.export_rate_cents_per_kwh DESC;
```

### View Plan Rates
```sql
SELECT
  pr.name as provider,
  p.name as plan,
  r.band_name,
  r.band_category,
  r.rate_cents_per_kwh
FROM plan_rates r
JOIN plans p ON r.plan_id = p.id
JOIN providers pr ON p.provider_id = pr.id
ORDER BY pr.name, p.name, r.price_change_sequence;
```

## Adding New Data

### 1. Add Provider (if new)
```sql
INSERT INTO providers (name, active)
VALUES ('Provider Name', true)
RETURNING id;
```

### 2. Add Energy Plan
```sql
-- First get provider_id
SELECT id FROM providers WHERE name = 'Electric Ireland';

-- Then insert plan
INSERT INTO plans (
  provider_id,
  name,
  fuel_type,
  standing_charge_daily_rate,
  vat_rate,
  discount_pct,
  exit_fee,
  contract_length_months,
  source_url,
  active
) VALUES (
  'PROVIDER_ID_FROM_ABOVE',
  'Smart 24 Hour',
  'electricity',
  245.0,
  9.0,
  NULL,
  50.0,
  12,
  'https://www.electricireland.ie/...',
  true
) RETURNING id;
```

### 3. Add Plan Rates
```sql
-- Get plan_id from above, then insert rates
INSERT INTO plan_rates (plan_id, band_name, band_category, rate_cents_per_kwh, price_change_sequence)
VALUES
  ('PLAN_ID', '24 Hour', '24hr', 31.95, 1);

-- For day/night plans
INSERT INTO plan_rates (plan_id, band_name, band_category, rate_cents_per_kwh, price_change_sequence)
VALUES
  ('PLAN_ID', 'Day', 'day', 34.12, 1),
  ('PLAN_ID', 'Night', 'night', 16.83, 2);
```

### 4. Add Microgen Rate
```sql
INSERT INTO microgen_export_rates (
  provider_id,
  export_rate_cents_per_kwh,
  requires_smart_meter,
  additional_requirements,
  source_url,
  active
)
SELECT
  p.id,
  19.5,
  true,
  'Must be provider electricity customer',
  'https://provider.ie/solar',
  true
FROM providers p
WHERE p.name = 'Electric Ireland';
```

## Updating Data

### Deactivate a Plan
```sql
UPDATE plans
SET active = false
WHERE name = 'Old Plan Name';
```

### Update Microgen Rate
```sql
UPDATE microgen_export_rates m
SET export_rate_cents_per_kwh = 20.0
FROM providers p
WHERE m.provider_id = p.id
AND p.name = 'Flogas';
```

### Update Plan Rate
```sql
UPDATE plan_rates r
SET rate_cents_per_kwh = 32.50
FROM plans p
WHERE r.plan_id = p.id
AND p.name = 'Smart 24 Hour';
```

## Common Tasks

### Find All Active Plans for a Provider
```sql
SELECT * FROM plans p
JOIN providers pr ON p.provider_id = pr.id
WHERE pr.name = 'Electric Ireland'
AND p.active = true;
```

### Delete a Plan (and its rates)
```sql
-- Rates are deleted automatically via CASCADE
DELETE FROM plans WHERE id = 'PLAN_ID';
```

## Band Categories Reference

- `24hr` - Single 24-hour rate
- `day` - Daytime rate (usually 8am-11pm)
- `night` - Night rate (usually 11pm-8am)
- `peak` - Peak hours
- `off_peak` - Off-peak hours
- `ev` - Electric vehicle charging rate
- `other` - Other/custom rates

## Fuel Types

- `electricity`
- `gas`
- `dual_fuel`

## Notes

- All monetary values in cents (e.g., 31.95 = 31.95c/kWh)
- Standing charge is daily rate in cents (e.g., 245 = €2.45/day)
- VAT rate is percentage (e.g., 9 = 9%)
- Changes are live immediately on the website
- Always use transactions for complex multi-table changes
