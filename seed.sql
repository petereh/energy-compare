-- Seed data for Irish energy providers and plans
-- Based on typical rates as of 2024 (these should be updated with real current rates)

-- Insert providers
INSERT INTO providers (name, website_url) VALUES
  ('Electric Ireland', 'https://www.electricireland.ie'),
  ('Energia', 'https://www.energia.ie'),
  ('Bord Gáis Energy', 'https://www.bordgaisenergy.ie')
ON CONFLICT (name) DO NOTHING;

-- Get provider IDs for reference
DO $$
DECLARE
  ei_id uuid;
  energia_id uuid;
  bge_id uuid;
  plan_id uuid;
BEGIN
  SELECT id INTO ei_id FROM providers WHERE name = 'Electric Ireland';
  SELECT id INTO energia_id FROM providers WHERE name = 'Energia';
  SELECT id INTO bge_id FROM providers WHERE name = 'Bord Gáis Energy';

  -- Electric Ireland Plans
  INSERT INTO plans (provider_id, name, fuel_type, standing_charge_daily_rate, vat_rate, contract_length_months, exit_fee)
  VALUES (ei_id, 'Home Electric+ 24 Hour', 'electricity', 0.50, 9, NULL, 0)
  RETURNING id INTO plan_id;

  INSERT INTO plan_rates (plan_id, band_name, band_category, rate_cents_per_kwh, fuel_type)
  VALUES (plan_id, '24 Hour', '24hr', 42.45, 'electricity');

  INSERT INTO plans (provider_id, name, fuel_type, standing_charge_daily_rate, vat_rate, contract_length_months, exit_fee)
  VALUES (ei_id, 'Home Electric+ Day/Night', 'electricity', 0.50, 9, NULL, 0)
  RETURNING id INTO plan_id;

  INSERT INTO plan_rates (plan_id, band_name, band_category, rate_cents_per_kwh, fuel_type)
  VALUES
    (plan_id, 'Day Rate', 'day', 47.17, 'electricity'),
    (plan_id, 'Night Rate', 'night', 23.44, 'electricity');

  INSERT INTO plans (provider_id, name, fuel_type, standing_charge_daily_rate, vat_rate, contract_length_months, exit_fee)
  VALUES (ei_id, 'Home Gas', 'gas', 0.39, 9, NULL, 0)
  RETURNING id INTO plan_id;

  INSERT INTO plan_rates (plan_id, band_name, band_category, rate_cents_per_kwh, fuel_type)
  VALUES (plan_id, '24 Hour', '24hr', 11.95, 'gas');

  -- Energia Plans
  INSERT INTO plans (provider_id, name, fuel_type, standing_charge_daily_rate, vat_rate, contract_length_months, exit_fee, discount_pct)
  VALUES (energia_id, 'Smart Drive Electric 24hr', 'electricity', 0.48, 9, 12, 0, 15)
  RETURNING id INTO plan_id;

  INSERT INTO plan_rates (plan_id, band_name, band_category, rate_cents_per_kwh, fuel_type)
  VALUES (plan_id, '24 Hour', '24hr', 40.82, 'electricity');

  INSERT INTO plans (provider_id, name, fuel_type, standing_charge_daily_rate, vat_rate, contract_length_months, exit_fee, discount_pct)
  VALUES (energia_id, 'Smart Drive Electric Day/Night', 'electricity', 0.48, 9, 12, 0, 15)
  RETURNING id INTO plan_id;

  INSERT INTO plan_rates (plan_id, band_name, band_category, rate_cents_per_kwh, fuel_type)
  VALUES
    (plan_id, 'Day Rate', 'day', 45.29, 'electricity'),
    (plan_id, 'Night Rate', 'night', 22.51, 'electricity');

  INSERT INTO plans (provider_id, name, fuel_type, standing_charge_daily_rate, vat_rate, contract_length_months, exit_fee)
  VALUES (energia_id, 'Value Gas', 'gas', 0.37, 9, NULL, 0)
  RETURNING id INTO plan_id;

  INSERT INTO plan_rates (plan_id, band_name, band_category, rate_cents_per_kwh, fuel_type)
  VALUES (plan_id, '24 Hour', '24hr', 11.47, 'gas');

  -- Bord Gáis Energy Plans
  INSERT INTO plans (provider_id, name, fuel_type, standing_charge_daily_rate, vat_rate, contract_length_months, exit_fee)
  VALUES (bge_id, 'Standard Electricity 24hr', 'electricity', 0.49, 9, NULL, 0)
  RETURNING id INTO plan_id;

  INSERT INTO plan_rates (plan_id, band_name, band_category, rate_cents_per_kwh, fuel_type)
  VALUES (plan_id, '24 Hour', '24hr', 41.95, 'electricity');

  INSERT INTO plans (provider_id, name, fuel_type, standing_charge_daily_rate, vat_rate, contract_length_months, exit_fee)
  VALUES (bge_id, 'Standard Electricity Day/Night', 'electricity', 0.49, 9, NULL, 0)
  RETURNING id INTO plan_id;

  INSERT INTO plan_rates (plan_id, band_name, band_category, rate_cents_per_kwh, fuel_type)
  VALUES
    (plan_id, 'Day Rate', 'day', 46.53, 'electricity'),
    (plan_id, 'Night Rate', 'night', 23.12, 'electricity');

  INSERT INTO plans (provider_id, name, fuel_type, standing_charge_daily_rate, vat_rate, contract_length_months, exit_fee)
  VALUES (bge_id, 'Standard Gas', 'gas', 0.38, 9, NULL, 0)
  RETURNING id INTO plan_id;

  INSERT INTO plan_rates (plan_id, band_name, band_category, rate_cents_per_kwh, fuel_type)
  VALUES (plan_id, '24 Hour', '24hr', 11.74, 'gas');

  INSERT INTO plans (provider_id, name, fuel_type, standing_charge_daily_rate, vat_rate, contract_length_months, exit_fee, discount_pct)
  VALUES (bge_id, 'Green Electricity 24hr', 'electricity', 0.49, 9, 12, 30, 10)
  RETURNING id INTO plan_id;

  INSERT INTO plan_rates (plan_id, band_name, band_category, rate_cents_per_kwh, fuel_type)
  VALUES (plan_id, '24 Hour', '24hr', 43.20, 'electricity');

  UPDATE plans SET green_energy = true WHERE name LIKE '%Green%';

END $$;
