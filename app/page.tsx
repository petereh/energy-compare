'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [contractStatus, setContractStatus] = useState<string>('');
  const [contractEndDate, setContractEndDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !contractStatus) {
      setError('Add your bill and let us know your contract status to continue.');
      return;
    }
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('contract_status', contractStatus);
    if (contractEndDate) formData.append('contract_end_date', contractEndDate);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong reading your bill.');
      router.push(`/results/${data.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F3EA] text-[#1F3D2B]">
      <div className="mx-auto max-w-2xl px-6 py-16 md:py-24">
        {/* Eyebrow */}
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#1F3D2B]/60">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#E8A33D]" />
          For Irish households
        </div>

        <h1 className="font-serif text-4xl leading-[1.1] md:text-5xl">
          Is your energy provider quietly overcharging you?
        </h1>
        <p className="mt-4 text-lg text-[#1F3D2B]/70">
          Upload your <strong>electricity or gas bill</strong>. We'll analyze your usage and rates,
          then compare against every plan on the Irish market — no account, no phone calls.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-8">
          {/* File drop zone */}
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Your electricity or gas bill (PDF)
            </label>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                const dropped = e.dataTransfer.files?.[0];
                if (dropped) setFile(dropped);
              }}
              className={`relative rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors ${
                dragActive
                  ? 'border-[#E8A33D] bg-[#E8A33D]/5'
                  : 'border-[#1F3D2B]/25 bg-white/40'
              }`}
            >
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              {file ? (
                <p className="font-medium">{file.name}</p>
              ) : (
                <>
                  <p className="font-medium">Drop your bill here, or click to browse</p>
                  <p className="mt-1 text-sm text-[#1F3D2B]/50">PDF only, up to 10MB</p>
                </>
              )}
            </div>
          </div>

          {/* Contract status */}
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Are you currently in contract with your provider?
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                { value: 'in_contract', label: 'Yes, in contract' },
                { value: 'out_of_contract', label: 'No, free to switch' },
                { value: 'not_sure', label: "Not sure" },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setContractStatus(opt.value)}
                  className={`rounded-md border px-4 py-3 text-sm font-medium transition-colors ${
                    contractStatus === opt.value
                      ? 'border-[#1F3D2B] bg-[#1F3D2B] text-[#F7F3EA]'
                      : 'border-[#1F3D2B]/25 bg-white/40 hover:border-[#1F3D2B]/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {contractStatus === 'in_contract' && (
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Contract end date <span className="font-normal text-[#1F3D2B]/50">(optional)</span>
              </label>
              <input
                type="date"
                value={contractEndDate}
                onChange={(e) => setContractEndDate(e.target.value)}
                className="w-full rounded-md border border-[#1F3D2B]/25 bg-white/60 px-4 py-3 text-sm"
              />
            </div>
          )}

          {error && (
            <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-[#1F3D2B] px-6 py-4 font-semibold text-[#F7F3EA] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Reading your bill…' : 'Check for a better deal'}
          </button>
        </form>

        <div className="mt-8 space-y-2 text-center text-xs text-[#1F3D2B]/40">
          <p>
            Your bill is read once to extract rates and usage, then discarded from active
            processing. We never contact your provider or share your details.
          </p>
          <p>
            <strong>Have solar panels?</strong> No problem — we compare based on your unit rates,
            not bill totals, so solar credits won't affect the comparison.
          </p>
        </div>
      </div>
    </main>
  );
}
