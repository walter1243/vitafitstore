import type { ReactNode } from 'react';

// Shared visual language for the admin panel — one palette, one card
// style, one button set, reused across every tab so the whole panel
// reads as a single professional product instead of per-tab one-offs.

export const adminInputCls =
  'w-full rounded-lg border border-white/10 bg-[#1c2236] px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40';

export const adminBtnPrimaryCls =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60';

export const adminBtnSecondaryCls =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50';

export const adminBtnDangerCls =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-red-500/40 px-4 py-2 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50';

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-lg font-bold text-white sm:text-xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-white/50">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Card({
  title,
  description,
  action,
  children,
  className = '',
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-[#161b28] p-5 ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="font-semibold text-white">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-white/45">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  accent = 'green',
  onClick,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  accent?: 'green' | 'blue' | 'amber' | 'red';
  onClick?: () => void;
}) {
  const accentCls: Record<string, string> = {
    green: 'border-green-500/25 bg-green-500/10 text-green-400',
    blue: 'border-blue-500/25 bg-blue-500/10 text-blue-400',
    amber: 'border-amber-500/25 bg-amber-500/10 text-amber-400',
    red: 'border-red-500/25 bg-red-500/10 text-red-400',
  };

  const Comp = onClick ? 'button' : 'div';

  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl border border-white/10 bg-[#161b28] p-4 text-left transition-colors ${onClick ? 'cursor-pointer hover:border-white/20' : ''}`}
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${accentCls[accent]}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs text-white/50">{label}</p>
        <p className="text-lg font-bold text-white">{value}</p>
      </div>
    </Comp>
  );
}

export function EmptyState({ icon, title, description, action }: { icon: ReactNode; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/40">
        {icon}
      </span>
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {description && <p className="max-w-sm text-xs text-white/45">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
