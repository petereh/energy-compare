'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MicrogenAdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [providerName, setProviderName] = useState('');
  const [exportRate, setExportRate] = useState('');
  const [planName, setPlanName] = useState('');
  const [minContractMonths, setMinContractMonths] = useState('');
  const [requiresSmartMeter, setRequiresSmartMeter] = useState(true);
  const [additionalRequirements, setAdditionalRequirements] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');

  useEffect(() => {
    if (sessionStorage.getItem('admin_auth') !== 'true') {
      window.location.href = '/admin';
      return;
    }
    setAuthenticated(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch('/api/admin/add-microgen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider_name: providerName,
          export_rate_cents_per_kwh: parseFloat(exportRate),
          plan_name: planName || null,
          minimum_contract_months: minContractMonths ? parseInt(minContractMonths) : null,
          requires_smart_meter: requiresSmartMeter,
          additional_requirements: additionalRequirements || null,
          source_url: sourceUrl,
          valid_from: validFrom || null,
          valid_until: validUntil || null,
          active: true,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to add microgen rate');

      setSuccess(`Microgen rate for ${providerName} added successfully!`);

      // Reset form
      setExportRate('');
      setPlanName('');
      setMinContractMonths('');
      setAdditionalRequirements('');
      setSourceUrl('');
      setValidFrom('');
      setValidUntil('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!authenticated) {
    return <div>Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-[#F7F3EA] text-[#1F3D2B]">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Admin - Add Microgeneration Rate</h1>
          <div className="flex gap-3">
            <Link
              href="/admin"
              className="rounded-md bg-[#1F3D2B]/10 px-4 py-2 text-sm font-semibold hover:bg-[#1F3D2B]/20"
            >
              ← Plans
            </Link>
            <button
              onClick={() => {
                sessionStorage.removeItem('admin_auth');
                window.location.href = '/admin';
              }}
              className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mb-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
          <strong>ℹ️ Microgeneration Rates:</strong> These are feed-in tariff rates that providers pay
          customers for exporting excess solar energy back to the grid. All major Irish providers offer
          these rates for customers with solar panels and smart meters.
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

          {/* Export Rate */}
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Export Rate (c/kWh) *
              <span className="ml-2 font-normal text-[#1F3D2B]/60">
                Rate paid for energy exported to grid
              </span>
            </label>
            <input
              type="number"
              step="0.01"
              value={exportRate}
              onChange={(e) => setExportRate(e.target.value)}
              className="w-full rounded-md border border-[#1F3D2B]/25 bg-white px-4 py-3"
              placeholder="e.g. 24.00"
              required
            />
            <p className="mt-1 text-xs text-[#1F3D2B]/50">
              Typical rates: 20-30c/kWh (as of 2026)
            </p>
          </div>

          {/* Plan Name */}
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Plan Name (Optional)
              <span className="ml-2 font-normal text-[#1F3D2B]/60">
                e.g., "Solar Export Plan", "Microgen Tariff"
              </span>
            </label>
            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="w-full rounded-md border border-[#1F3D2B]/25 bg-white px-4 py-3"
              placeholder="Leave blank if provider uses standard rate"
            />
          </div>

          {/* Requirements */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold">Minimum Contract (months)</label>
              <input
                type="number"
                step="1"
                value={minContractMonths}
                onChange={(e) => setMinContractMonths(e.target.value)}
                className="w-full rounded-md border border-[#1F3D2B]/25 bg-white px-4 py-3"
                placeholder="Leave blank if no minimum"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">Smart Meter Required</label>
              <select
                value={requiresSmartMeter ? 'yes' : 'no'}
                onChange={(e) => setRequiresSmartMeter(e.target.value === 'yes')}
                className="w-full rounded-md border border-[#1F3D2B]/25 bg-white px-4 py-3"
              >
                <option value="yes">Yes (most common)</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>

          {/* Additional Requirements */}
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Additional Requirements (Optional)
            </label>
            <textarea
              value={additionalRequirements}
              onChange={(e) => setAdditionalRequirements(e.target.value)}
              className="w-full rounded-md border border-[#1F3D2B]/25 bg-white px-4 py-3"
              rows={3}
              placeholder="e.g., Must have SEAI-approved solar installation, Maximum system size 6kW"
            />
          </div>

          {/* Source URL */}
          <div>
            <label className="mb-2 block text-sm font-semibold">Source URL *</label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="w-full rounded-md border border-[#1F3D2B]/25 bg-white px-4 py-3"
              placeholder="https://www.provider.ie/solar-export-rate"
              required
            />
          </div>

          {/* Valid Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold">Valid From (Optional)</label>
              <input
                type="date"
                value={validFrom}
                onChange={(e) => setValidFrom(e.target.value)}
                className="w-full rounded-md border border-[#1F3D2B]/25 bg-white px-4 py-3"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">Valid Until (Optional)</label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full rounded-md border border-[#1F3D2B]/25 bg-white px-4 py-3"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-[#1F3D2B] px-6 py-4 font-semibold text-[#F7F3EA] hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Adding Microgen Rate...' : 'Add to Database'}
          </button>
        </form>

        {/* Quick Reference */}
        <div className="mt-6 rounded-lg bg-[#E8A33D]/10 p-4">
          <h3 className="mb-2 font-semibold">🔗 Provider Microgen Pages:</h3>
          <ul className="space-y-1 text-sm">
            <li>
              <strong>Electric Ireland:</strong>{' '}
              <a
                href="https://www.electricireland.ie/residential/products-services/solar-panels"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Solar Panels
              </a>
            </li>
            <li>
              <strong>Energia:</strong>{' '}
              <a
                href="https://www.energia.ie/solar-panels"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Solar
              </a>
            </li>
            <li>
              <strong>Bord Gáis:</strong>{' '}
              <a
                href="https://www.bordgaisenergy.ie/home/solar"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Solar
              </a>
            </li>
            <li>
              <strong>SSE Airtricity:</strong>{' '}
              <a
                href="https://www.sseairtricity.com/ie/home/help/solar-panels"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                Solar Help
              </a>
            </li>
          </ul>
        </div>
      </div>
    </main>
  );
}
