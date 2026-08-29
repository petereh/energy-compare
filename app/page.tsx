'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const router = useRouter();
  const [electricityFile, setElectricityFile] = useState<File | null>(null);
  const [gasFile, setGasFile] = useState<File | null>(null);
  const [contractStatus, setContractStatus] = useState<string>('');
  const [contractEndDate, setContractEndDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActiveElec, setDragActiveElec] = useState(false);
  const [dragActiveGas, setDragActiveGas] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if ((!electricityFile && !gasFile) || !contractStatus) {
      setError('Upload at least one bill and select your contract status to continue.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Upload electricity bill if present
      let electricityId: string | null = null;
      if (electricityFile) {
        const formData = new FormData();
        formData.append('file', electricityFile);
        formData.append('contract_status', contractStatus);
        if (contractEndDate) formData.append('contract_end_date', contractEndDate);

        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to process electricity bill');
        electricityId = data.id;
      }

      // Upload gas bill if present
      let gasId: string | null = null;
      if (gasFile) {
        const formData = new FormData();
        formData.append('file', gasFile);
        formData.append('contract_status', contractStatus);
        if (contractEndDate) formData.append('contract_end_date', contractEndDate);

        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to process gas bill');
        gasId = data.id;
      }

      // Navigate to results with both IDs (or just one)
      const ids = [electricityId, gasId].filter(Boolean).join(',');
      router.push(`/results/${ids}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  function FileDropZone({
    label,
    file,
    setFile,
    dragActive,
    setDragActive,
  }: {
    label: string;
    file: File | null;
    setFile: (f: File | null) => void;
    dragActive: boolean;
    setDragActive: (a: boolean) => void;
  }) {
    return (
      <div>
        <label className="mb-2 block text-sm font-semibold">{label}</label>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            const dropped = e.dataTransfer.files?.[0];
            if (dropped) setFile(dropped);
          }}
          className={`relative rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors ${
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
            <div className="flex items-center justify-between">
              <p className="font-medium text-sm">{file.name}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="text-xs text-[#1F3D2B]/50 hover:text-[#1F3D2B] underline"
              >
                Remove
              </button>
            </div>
          ) : (
            <>
              <p className="font-medium text-sm">Drop PDF here or click to browse</p>
              <p className="mt-1 text-xs text-[#1F3D2B]/50">Optional • Up to 10MB</p>
            </>
          )}
        </div>
      </div>
    );
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
          Upload your <strong>electricity and/or gas bills</strong>. We'll analyze your usage and
          rates, then compare against every plan on the Irish market — including dual-fuel bundles
          from your current provider.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          {/* Bill uploads */}
          <div className="space-y-4">
            <FileDropZone
              label="Electricity bill (PDF)"
              file={electricityFile}
              setFile={setElectricityFile}
              dragActive={dragActiveElec}
              setDragActive={setDragActiveElec}
            />
            <FileDropZone
              label="Gas bill (PDF)"
              file={gasFile}
              setFile={setGasFile}
              dragActive={dragActiveGas}
              setDragActive={setDragActiveGas}
            />
          </div>

          <p className="text-sm text-[#1F3D2B]/60">
            💡 <strong>Tip:</strong> Upload both bills to see dual-fuel bundle savings
          </p>

          {/* Contract status */}
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Are you currently in contract with your provider?
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                { value: 'in_contract', label: 'Yes, in contract' },
                { value: 'out_of_contract', label: 'No, free to switch' },
                { value: 'not_sure', label: 'Not sure' },
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
            {loading ? 'Reading your bills…' : 'Compare plans'}
          </button>
        </form>

        <div className="mt-8 space-y-2 text-center text-xs text-[#1F3D2B]/40">
          <p>
            Your bills are read once to extract rates and usage, then discarded from active
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
