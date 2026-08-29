-- Microgeneration (Solar Export) Rates Table
-- Stores feed-in tariff rates that providers pay customers for exporting solar energy to the grid

CREATE TABLE IF NOT EXISTS microgen_export_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  export_rate_cents_per_kwh NUMERIC(10, 2) NOT NULL, -- Rate paid for exported energy
  plan_name TEXT, -- Optional: Some providers have specific microgen plan names
  minimum_contract_months INTEGER, -- Optional: Minimum contract length required
  requires_smart_meter BOOLEAN DEFAULT true, -- Most microgen requires smart meter
  additional_requirements TEXT, -- e.g., "Must have approved solar installation"
  source_url TEXT NOT NULL, -- URL to provider's microgen/solar page
  active BOOLEAN DEFAULT true,
  valid_from DATE, -- When rate becomes effective
  valid_until DATE, -- When rate expires (if known)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for active rates lookup
CREATE INDEX idx_microgen_active ON microgen_export_rates(active, provider_id);

-- Index for rate comparison
CREATE INDEX idx_microgen_rate ON microgen_export_rates(export_rate_cents_per_kwh DESC);

-- Enable Row Level Security
ALTER TABLE microgen_export_rates ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active rates
CREATE POLICY "Public can view active microgen rates"
  ON microgen_export_rates
  FOR SELECT
  USING (active = true);

-- Policy: Service role can do everything
CREATE POLICY "Service role can manage microgen rates"
  ON microgen_export_rates
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add helpful comment
COMMENT ON TABLE microgen_export_rates IS 'Feed-in tariff rates paid by providers for customer solar exports';
COMMENT ON COLUMN microgen_export_rates.export_rate_cents_per_kwh IS 'Rate in cents per kWh that provider pays for exported solar energy';
