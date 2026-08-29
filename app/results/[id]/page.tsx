'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface PlanResult {
  plan_id: string;
  plan_name: string;
  provider_name: string;
  fuel_type: string;
  estimated_annual_cost: number;
  estimated_annual_savings: number | null;
  meets_contract_exit_threshold: boolean;
  exit_fee: number;
  rank: number;
  source_url: string | null;
}

interface CompareResponse {
  current_annual_cost: number | null;
  current_provider: string | null;
  contract_status: string;
  results: PlanResult[];
}

function euro(n: number | null) {
  if (n === null) return '—';
  return `€${n.toLocaleString('en-IE', { maximumFractionDigits: 0 })}`;
}

export default function ResultsPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<CompareResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Handle tilde-separated IDs (for dual uploads) - just use the first one for now
    const firstId = id.split('~')[0].trim();
    console.log(`[Results] Full ID param: ${id}`);
    console.log(`[Results] Using first ID: ${firstId}`);
    fetch(`/api/compare?bill_upload_id=${firstId}`)
      .then(async (res) => {
        const json = await res.json();
        console.log(`[Results] API response:`, json);
        if (!res.ok) throw new Error(json.error || 'Could not load comparison');
        setData(json);
      })
      .catch((err) => {
        console.error(`[Results] Error:`, err);
        setError(err.message);
      });
  }, [id]);

  if (error) {
    return (
      <main className="min-h-screen bg-[#F7F3EA] px-6 py-24 text-center text-[#1F3D2B]">
        <p className="text-lg font-medium">{error}</p>
        <a href="/" className="mt-4 inline-block underline">Try another bill</a>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7F3EA] text-[#1F3D2B]">
        <p className="animate-pulse text-lg">Comparing plans across every provider…</p>
      </main>
    );
  }

  const top = data.results[0];
  const bestSavings = top?.estimated_annual_savings ?? null;

  return (
    <main className="min-h-screen bg-[#F7F3EA] text-[#1F3D2B]">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <a href="/" className="text-sm text-[#1F3D2B]/50 hover:underline">← Check another bill</a>

        <div className="mt-4 mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#1F3D2B]/60">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#E8A33D]" />
          Comparison complete
        </div>

        {bestSavings !== null && bestSavings > 0 ? (
          <h1 className="font-serif text-4xl leading-[1.1] md:text-5xl">
            You could save {euro(bestSavings)} a year
          </h1>
        ) : (
          <h1 className="font-serif text-4xl leading-[1.1] md:text-5xl">
            You're already on a strong rate
          </h1>
        )}

        <p className="mt-4 text-lg text-[#1F3D2B]/70">
          Currently with <strong>{data.current_provider ?? 'your provider'}</strong>, estimated at{' '}
          <strong>{euro(data.current_annual_cost)}</strong> a year.
        </p>

        {data.contract_status === 'in_contract' && (
          <p className="mt-2 rounded-md bg-[#E8A33D]/15 px-4 py-3 text-sm text-[#1F3D2B]/80">
            You told us you're still in contract — plans below are flagged if the savings
            outweigh your exit fee.
          </p>
        )}

        <div className="mt-10 space-y-4">
          {data.results.length === 0 && (
            <p className="text-[#1F3D2B]/60">
              No comparable plans found yet for this fuel type — check back soon as we add more providers.
            </p>
          )}

          {data.results.map((r) => (
            <div
              key={r.plan_id}
              className="relative overflow-hidden rounded-lg border border-[#1F3D2B]/15 bg-white/70 px-6 py-5 shadow-sm"
            >
              {/* torn-ticket notches */}
              <div className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[#F7F3EA]" />
              <div className="absolute -right-2 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[#F7F3EA]" />

              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#1F3D2B]/50">
                    #{r.rank} · {r.provider_name}
                  </div>
                  <div className="mt-1 text-lg font-semibold">{r.plan_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{euro(r.estimated_annual_cost)}</div>
                  <div className="text-xs text-[#1F3D2B]/50">estimated per year</div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                {r.estimated_annual_savings !== null && r.estimated_annual_savings > 0 && (
                  <span className="rounded-full bg-[#1F3D2B] px-3 py-1 font-medium text-[#F7F3EA]">
                    Save {euro(r.estimated_annual_savings)}/yr
                  </span>
                )}
                {!r.meets_contract_exit_threshold && (
                  <span className="rounded-full bg-red-100 px-3 py-1 font-medium text-red-800">
                    Exit fee (€{r.exit_fee}) may outweigh savings
                  </span>
                )}
                {r.source_url && (
                  <a
                    href={r.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-[#1F3D2B]/50 underline hover:text-[#1F3D2B]"
                  >
                    View plan
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-[#1F3D2B]/40">
          Estimates are based on your bill's stated usage and each provider's published
          rates. Actual savings depend on your future consumption.
        </p>
      </div>
    </main>
  );
}
