'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface PlanRate {
  band_name: string;
  band_category: '24hr' | 'day' | 'night' | 'peak' | 'off_peak' | 'ev' | 'other';
  usage_kwh?: number;
  rate_cents_per_kwh: number;
  price_change_sequence: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Plan form state
  const [providerName, setProviderName] = useState('');
  const [planName, setPlanName] = useState('');
  const [fuelType, setFuelType] = useState<'electricity' | 'gas' | 'dual_fuel'>('electricity');
  const [standingCharge, setStandingCharge] = useState('');
  const [vatRate, setVatRate] = useState('9');
  const [discountPct, setDiscountPct] = useState('');
  const [exitFee, setExitFee] = useState('50');
  const [contractLength, setContractLength] = useState('12');
  const [sourceUrl, setSourceUrl] = useState('');
  const [planRates, setPlanRates] = useState<PlanRate[]>([
    { band_name: '24 Hour', band_category: '24hr', rate_cents_per_kwh: 0, price_change_sequence: 1 }
  ]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple password check (in production, use proper auth)
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD || password === 'admin123') {
      setAuthenticated(true);
      sessionStorage.setItem('admin_auth', 'true');
    } else {
      setError('Invalid password');
    }
  };

  useEffect(() => {
    // Check if already authenticated
    if (sessionStorage.getItem('admin_auth') === 'true') {
      setAuthenticated(true);
    }
  }, []);

  const addRate = () => {
    setPlanRates([
      ...planRates,
      {
        band_name: 'New Rate',
        band_category: '24hr',
        rate_cents_per_kwh: 0,
        price_change_sequence: planRates.length + 1,
      },
    ]);
  };

  const removeRate = (index: number) => {
    setPlanRates(planRates.filter((_, i) => i !== index));
  };

  const updateRate = (index: number, field: string, value: any) => {
    const updated = [...planRates];
    (updated[index] as any)[field] = value;
    setPlanRates(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/admin/add-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_name: providerName,
          name: planName,
          fuel_type: fuelType,
          standing_charge_daily_rate: parseFloat(standingCharge),
          vat_rate: parseFloat(vatRate),
          discount_pct: discountPct ? parseFloat(discountPct) : null,
          exit_fee: parseFloat(exitFee),
          contract_length_months: contractLength ? parseInt(contractLength) : null,
          source_url: sourceUrl,
          active: true,
          plan_rates: planRates.map((r) => ({
            ...r,
            rate_cents_per_kwh: parseFloat(r.rate_cents_per_kwh as any),
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to add plan');

      setSuccess(`Plan "${planName}" added successfully!`);

      // Reset form
      setPlanName('');
      setSourceUrl('');
      setDiscountPct('');
      setPlanRates([
        { band_name: '24 Hour', band_category: '24hr', rate_cents_per_kwh: 0, price_change_sequence: 1 },
      ]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F3EA]">
        <div className="w-full max-w-md rounded-lg border border-[#1F3D2B]/20 bg-white p-8 shadow-lg">
          <h1 className="mb-6 text-2xl font-bold text-[#1F3D2B]">Admin Login</h1>
          <form onSubmit={handleAuth}>
            <label className="mb-2 block text-sm font-semibold text-[#1F3D2B]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mb-4 w-full rounded-md border border-[#1F3D2B]/25 bg-white px-4 py-3"
              required
            />
            {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              className="w-full rounded-md bg-[#1F3D2B] px-6 py-3 font-semibold text-[#F7F3EA] hover:opacity-90"
            >
              Login
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7F3EA] text-[#1F3D2B]">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin - Add Energy Plan</h1>
          <button
            onClick={() => {
              sessionStorage.removeItem('admin_auth');
              setAuthenticated(false);
            }}
            className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        )}

        {success && (
          <div className="mb-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">{success}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-white p-6 shadow">
          {/* Provider Name */}
          <div>
            <label className="mb-2 block text-sm font-semibold">Provider Name *</label>
            <select
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              className="w-full rounded-md border border-[#1F3D2B]/25 bg-white px-4 py-3"
              required
            >
              <option value="">Select Provider</option>
              <option value="Electric Ireland">Electric Ireland</option>
              <option value="SSE Airtricity">SSE Airtricity</option>
              <option value="Energia">Energia</option>
              <option value="Bord Gáis Energy">Bord Gáis Energy</option>
              <option value="Flogas">Flogas</option>
              <option value="Yuno Energy">Yuno Energy</option>
              <option value="PrepayPower">PrepayPower</option>
              <option value="Pinergy">Pinergy</option>
            </select>
          </div>

          {/* Plan Name */}
          <div>
            <label className="mb-2 block text-sm font-semibold">Plan Name *</label>
            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="w-full rounded-md border border-[#1F3D2B]/25 bg-white px-4 py-3"
              placeholder="e.g. Smart 24 Hour"
              required
            />
          </div>

          {/* Fuel Type */}
          <div>
            <label className="mb-2 block text-sm font-semibold">Fuel Type *</label>
            <div className="flex gap-4">
              {(['electricity', 'gas', 'dual_fuel'] as const).map((type) => (
                <label key={type} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="fuelType"
                    value={type}
                    checked={fuelType === type}
                    onChange={(e) => setFuelType(e.target.value as any)}
                  />
                  <span className="capitalize">{type.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Standing Charge */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold">Standing Charge (c/day) *</label>
              <input
                type="number"
                step="0.01"
                value={standingCharge}
                onChange={(e) => setStandingCharge(e.target.value)}
                className="w-full rounded-md border border-[#1F3D2B]/25 bg-white px-4 py-3"
                placeholder="245"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">VAT Rate (%) *</label>
              <select
                value={vatRate}
                onChange={(e) => setVatRate(e.target.value)}
                className="w-full rounded-md border border-[#1F3D2B]/25 bg-white px-4 py-3"
              >
                <option value="9">9% (Electricity)</option>
                <option value="13.5">13.5% (Gas)</option>
              </select>
            </div>
          </div>

          {/* Discount & Exit Fee */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold">Discount (%)</label>
              <input
                type="number"
                step="1"
                value={discountPct}
                onChange={(e) => setDiscountPct(e.target.value)}
                className="w-full rounded-md border border-[#1F3D2B]/25 bg-white px-4 py-3"
                placeholder="0"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">Exit Fee (€) *</label>
              <input
                type="number"
                step="1"
                value={exitFee}
                onChange={(e) => setExitFee(e.target.value)}
                className="w-full rounded-md border border-[#1F3D2B]/25 bg-white px-4 py-3"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">Contract (months)</label>
              <input
                type="number"
                step="1"
                value={contractLength}
                onChange={(e) => setContractLength(e.target.value)}
                className="w-full rounded-md border border-[#1F3D2B]/25 bg-white px-4 py-3"
                placeholder="12"
              />
            </div>
          </div>

          {/* Source URL */}
          <div>
            <label className="mb-2 block text-sm font-semibold">Source URL *</label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="w-full rounded-md border border-[#1F3D2B]/25 bg-white px-4 py-3"
              placeholder="https://www.energia.ie/..."
              required
            />
          </div>

          {/* Plan Rates */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-semibold">Plan Rates *</label>
              <button
                type="button"
                onClick={addRate}
                className="rounded-md bg-[#E8A33D] px-3 py-1 text-sm text-white hover:opacity-90"
              >
                + Add Rate
              </button>
            </div>

            <div className="space-y-3">
              {planRates.map((rate, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 rounded-md border border-[#1F3D2B]/15 p-3">
                  <input
                    type="text"
                    value={rate.band_name}
                    onChange={(e) => updateRate(idx, 'band_name', e.target.value)}
                    className="col-span-3 rounded border border-[#1F3D2B]/25 px-2 py-1 text-sm"
                    placeholder="Band Name"
                  />
                  <select
                    value={rate.band_category}
                    onChange={(e) => updateRate(idx, 'band_category', e.target.value)}
                    className="col-span-3 rounded border border-[#1F3D2B]/25 px-2 py-1 text-sm"
                  >
                    <option value="24hr">24 Hour</option>
                    <option value="day">Day</option>
                    <option value="night">Night</option>
                    <option value="peak">Peak</option>
                    <option value="off_peak">Off Peak</option>
                    <option value="ev">EV</option>
                    <option value="other">Other</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    value={rate.rate_cents_per_kwh}
                    onChange={(e) => updateRate(idx, 'rate_cents_per_kwh', e.target.value)}
                    className="col-span-3 rounded border border-[#1F3D2B]/25 px-2 py-1 text-sm"
                    placeholder="c/kWh"
                  />
                  <input
                    type="number"
                    value={rate.price_change_sequence}
                    onChange={(e) => updateRate(idx, 'price_change_sequence', e.target.value)}
                    className="col-span-2 rounded border border-[#1F3D2B]/25 px-2 py-1 text-sm"
                    placeholder="Seq"
                  />
                  {planRates.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRate(idx)}
                      className="col-span-1 text-red-600 hover:text-red-800"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-[#1F3D2B] px-6 py-4 font-semibold text-[#F7F3EA] hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Adding Plan...' : 'Add Plan to Database'}
          </button>
        </form>
      </div>
    </main>
  );
}
