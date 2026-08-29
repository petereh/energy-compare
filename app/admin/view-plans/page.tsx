'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Plan {
  id: string;
  provider_name: string;
  name: string;
  fuel_type: string;
  standing_charge_daily_rate: number;
  vat_rate: number;
  discount_pct: number | null;
  exit_fee: number;
  contract_length_months: number | null;
  source_url: string;
  active: boolean;
  plan_rates: any[];
}

export default function ViewPlansPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (sessionStorage.getItem('admin_auth') !== 'true') {
      window.location.href = '/admin';
      return;
    }
    setAuthenticated(true);
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const res = await fetch('/api/admin/get-plans');
      const data = await res.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (planId: string, currentActive: boolean) => {
    try {
      const res = await fetch('/api/admin/toggle-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_id: planId, active: !currentActive }),
      });

      if (res.ok) {
        loadPlans();
      }
    } catch (error) {
      console.error('Failed to toggle plan:', error);
    }
  };

  if (!authenticated) {
    return <div>Loading...</div>;
  }

  const filteredPlans = filter === 'all' ? plans : plans.filter((p) => p.fuel_type === filter);

  return (
    <main className="min-h-screen bg-[#F7F3EA] text-[#1F3D2B]">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">All Plans ({filteredPlans.length})</h1>
          <div className="flex gap-3">
            <Link
              href="/admin"
              className="rounded-md bg-[#E8A33D] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              + Add New Plan
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

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          {['all', 'electricity', 'gas', 'dual_fuel'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-4 py-2 text-sm font-semibold ${
                filter === f
                  ? 'bg-[#1F3D2B] text-white'
                  : 'bg-white text-[#1F3D2B] hover:bg-[#1F3D2B]/10'
              }`}
            >
              {f === 'all' ? 'All' : f.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-[#1F3D2B]/60">Loading plans...</p>
        ) : (
          <div className="space-y-4">
            {filteredPlans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-lg border border-[#1F3D2B]/15 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold">{plan.name}</h3>
                      <span className="rounded-full bg-[#E8A33D]/20 px-3 py-1 text-xs font-semibold text-[#E8A33D]">
                        {plan.fuel_type.replace('_', ' ')}
                      </span>
                      {!plan.active && (
                        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-[#1F3D2B]/60">{plan.provider_name}</p>

                    <div className="mt-3 grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                      <div>
                        <span className="text-[#1F3D2B]/60">Standing Charge:</span>
                        <span className="ml-2 font-semibold">{plan.standing_charge_daily_rate}c/day</span>
                      </div>
                      <div>
                        <span className="text-[#1F3D2B]/60">VAT:</span>
                        <span className="ml-2 font-semibold">{plan.vat_rate}%</span>
                      </div>
                      {plan.discount_pct && (
                        <div>
                          <span className="text-[#1F3D2B]/60">Discount:</span>
                          <span className="ml-2 font-semibold">{plan.discount_pct}%</span>
                        </div>
                      )}
                      <div>
                        <span className="text-[#1F3D2B]/60">Exit Fee:</span>
                        <span className="ml-2 font-semibold">€{plan.exit_fee}</span>
                      </div>
                    </div>

                    {plan.plan_rates && plan.plan_rates.length > 0 && (
                      <div className="mt-3">
                        <span className="text-sm font-semibold text-[#1F3D2B]/60">Rates:</span>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {plan.plan_rates.map((rate: any, idx: number) => (
                            <span
                              key={idx}
                              className="rounded-md bg-[#1F3D2B]/5 px-3 py-1 text-sm"
                            >
                              {rate.band_name}: {rate.rate_cents_per_kwh}c/kWh
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => toggleActive(plan.id, plan.active)}
                      className={`rounded-md px-3 py-1 text-sm font-semibold ${
                        plan.active
                          ? 'bg-red-100 text-red-800 hover:bg-red-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {plan.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <a
                      href={plan.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md bg-[#1F3D2B]/10 px-3 py-1 text-center text-sm font-semibold text-[#1F3D2B] hover:bg-[#1F3D2B]/20"
                    >
                      Source
                    </a>
                  </div>
                </div>
              </div>
            ))}

            {filteredPlans.length === 0 && (
              <p className="text-center text-[#1F3D2B]/60">No plans found</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
