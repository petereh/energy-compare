-- First, run the migration to create the table (if not already done)
-- Copy and run supabase/migrations/20260829_add_microgen_rates.sql first

-- Then insert Energia's microgen rate
INSERT INTO microgen_export_rates (
  provider_id,
  export_rate_cents_per_kwh,
  plan_name,
  minimum_contract_months,
  requires_smart_meter,
  additional_requirements,
  source_url,
  active,
  valid_from,
  valid_until
)
SELECT
  p.id,
  18.5,
  NULL,
  NULL,
  true,
  'Must be registered Energia electricity customer',
  'https://www.energia.ie/home-upgrades/energia-and-the-microgeneration-scheme',
  true,
  NULL,
  NULL
FROM providers p
WHERE p.name = 'Energia'
ON CONFLICT DO NOTHING;
