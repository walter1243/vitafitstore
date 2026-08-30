import type { ReactNode } from 'react';

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-xs font-medium text-white/60">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-white/35">{hint}</p>}
    </div>
  );
}

export const inputCls =
  'w-full rounded-lg border border-white/10 bg-[#1c2236] px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40';

export const textareaCls = `${inputCls} resize-none`;
