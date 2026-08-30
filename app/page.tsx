'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [contractStatus, setContractStatus] = useState<string>('');
  const [contractEndDate, setContractEndDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  function handleFileChange(newFiles: FileList | null) {
    if (!newFiles) return;
    const fileArray = Array.from(newFiles);
    // Limit to 2 files max (electricity + gas)
    setFiles((prev) => [...prev, ...fileArray].slice(0, 2));
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (files.length === 0 || !contractStatus) {
      setError('Upload at least one bill and select your contract status to continue.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const uploadedIds: string[] = [];

      // Upload each bill (Claude will auto-detect if it's electricity or gas)
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('contract_status', contractStatus);
        if (contractEndDate) formData.append('contract_end_date', contractEndDate);

        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Failed to process ${file.name}`);
        uploadedIds.push(data.id);
      }

      // Navigate to results with all IDs (use ~ as separator to avoid URL encoding issues)
      const ids = uploadedIds.join('~');
      router.push(`/results/${ids}`);
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
          Upload your <strong>electricity and/or gas bills</strong>. We'll automatically detect
          the fuel type, analyze your usage and rates, then compare against every plan on the
          Irish market.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-6">
          {/* Single file drop zone */}
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Your energy bills (PDF) — up to 2 files
            </label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                handleFileChange(e.dataTransfer.files);
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
                multiple
                onChange={(e) => handleFileChange(e.target.files)}
                className={`absolute inset-0 h-full w-full cursor-pointer opacity-0 ${
                  files.length >= 2 ? 'pointer-events-none' : ''
                }`}
              />
              {files.length > 0 ? (
                <div className="space-y-2">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-md bg-white/60 px-4 py-2"
                    >
                      <p className="text-sm font-medium">{file.name}</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeFile(idx);
                        }}
                        className="text-xs text-[#1F3D2B]/50 hover:text-[#1F3D2B] underline"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  {files.length < 2 && (
                    <p className="pt-2 text-xs text-[#1F3D2B]/50">
                      Click or drop to add {files.length === 1 ? 'another' : 'more'} bill
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <p className="font-medium">Drop your bills here, or click to browse</p>
                  <p className="mt-1 text-sm text-[#1F3D2B]/50">
                    We'll automatically detect electricity vs gas • Up to 2 PDFs, 10MB each
                  </p>
                </>
              )}
            </div>
          </div>

          {files.length > 0 && (
            <p className="text-sm text-[#1F3D2B]/60">
              💡 <strong>Tip:</strong> Upload both electricity and gas bills to see dual-fuel
              bundle options
            </p>
          )}

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
      </div>
    </main>
  );
}
