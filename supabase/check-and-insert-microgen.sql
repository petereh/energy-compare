-- First, let's see what providers exist
SELECT id, name FROM providers ORDER BY name;

-- Check what microgen rates already exist
SELECT
  m.export_rate_cents_per_kwh,
  p.name as provider_name
FROM microgen_export_rates m
JOIN providers p ON m.provider_id = p.id
ORDER BY p.name;

-- Now insert only for providers that exist and don't have rates yet
-- Electric Ireland
INSERT INTO microgen_export_rates (
  provider_id, export_rate_cents_per_kwh, requires_smart_meter,
  additional_requirements, source_url, active
)
SELECT p.id, 19.5, true,
  'Must be Electric Ireland electricity customer',
  'https://www.electricireland.ie/residential/products/microgeneration',
  true
FROM providers p
WHERE p.name = 'Electric Ireland'
AND NOT EXISTS (
  SELECT 1 FROM microgen_export_rates m WHERE m.provider_id = p.id
);

-- SSE Airtricity
INSERT INTO microgen_export_rates (
  provider_id, export_rate_cents_per_kwh, requires_smart_meter,
  additional_requirements, source_url, active
)
SELECT p.id, 19.5, true,
  'Must be SSE Airtricity electricity customer. Payment quarterly as bill credit.',
  'https://www.sseairtricity.com/ie/home/help/solar-panels',
  true
FROM providers p
WHERE p.name = 'SSE Airtricity'
AND NOT EXISTS (
  SELECT 1 FROM microgen_export_rates m WHERE m.provider_id = p.id
);

-- Bord Gáis Energy
INSERT INTO microgen_export_rates (
  provider_id, export_rate_cents_per_kwh, requires_smart_meter,
  additional_requirements, source_url, active
)
SELECT p.id, 18.5, true,
  'Must be Bord Gáis Energy customer. Payment quarterly as bill credit.',
  'https://www.bordgaisenergy.ie/home/microgeneration',
  true
FROM providers p
WHERE p.name = 'Bord Gáis Energy'
AND NOT EXISTS (
  SELECT 1 FROM microgen_export_rates m WHERE m.provider_id = p.id
);

-- Flogas
INSERT INTO microgen_export_rates (
  provider_id, export_rate_cents_per_kwh, requires_smart_meter,
  additional_requirements, source_url, active
)
SELECT p.id, 20.0, true,
  'Must be Flogas electricity customer. Payment every 2 months as bill credit.',
  'https://www.flogas.ie',
  true
FROM providers p
WHERE p.name = 'Flogas'
AND NOT EXISTS (
  SELECT 1 FROM microgen_export_rates m WHERE m.provider_id = p.id
);

-- Pinergy
INSERT INTO microgen_export_rates (
  provider_id, export_rate_cents_per_kwh, requires_smart_meter,
  additional_requirements, source_url, active
)
SELECT p.id, 18.5, true,
  'Must be Pinergy electricity customer. Payment monthly as bill credit.',
  'https://pinergy.ie',
  true
FROM providers p
WHERE p.name = 'Pinergy'
AND NOT EXISTS (
  SELECT 1 FROM microgen_export_rates m WHERE m.provider_id = p.id
);

-- PrepayPower
INSERT INTO microgen_export_rates (
  provider_id, export_rate_cents_per_kwh, requires_smart_meter,
  additional_requirements, source_url, active
)
SELECT p.id, 15.89, true,
  'Must be PrepayPower customer. Payment twice yearly as bill credit.',
  'https://www.prepaypower.ie',
  true
FROM providers p
WHERE p.name = 'PrepayPower'
AND NOT EXISTS (
  SELECT 1 FROM microgen_export_rates m WHERE m.provider_id = p.id
);

-- Yuno Energy
INSERT INTO microgen_export_rates (
  provider_id, export_rate_cents_per_kwh, requires_smart_meter,
  additional_requirements, source_url, active
)
SELECT p.id, 17.16, true,
  'Must be Yuno Energy customer. Payment twice yearly as bill credit.',
  'https://www.yunoenergy.ie',
  true
FROM providers p
WHERE p.name = 'Yuno Energy'
AND NOT EXISTS (
  SELECT 1 FROM microgen_export_rates m WHERE m.provider_id = p.id
);

-- Final check - show all microgen rates
SELECT
  p.name as provider_name,
  m.export_rate_cents_per_kwh as rate_c_per_kwh,
  m.requires_smart_meter,
  m.additional_requirements,
  m.source_url
FROM microgen_export_rates m
JOIN providers p ON m.provider_id = p.id
WHERE m.active = true
ORDER BY m.export_rate_cents_per_kwh DESC;
