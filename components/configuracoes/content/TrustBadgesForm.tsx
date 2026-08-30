import { ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react';
import { ICON_OPTIONS, type TrustBadgesContent, type TrustBadge } from '@/lib/site-content-defaults';
import { getIcon } from '@/lib/icon-map';
import { inputCls } from './shared';

export function TrustBadgesForm({ data, onChange }: { data: TrustBadgesContent; onChange: (d: TrustBadgesContent) => void }) {
  function updateBadge(idx: number, patch: Partial<TrustBadge>) {
    onChange({ badges: data.badges.map((b, i) => (i === idx ? { ...b, ...patch } : b)) });
  }

  function moveBadge(idx: number, dir: 'up' | 'down') {
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= data.badges.length) return;
    const badges = [...data.badges];
    [badges[idx], badges[target]] = [badges[target], badges[idx]];
    onChange({ badges });
  }

  function removeBadge(idx: number) {
    onChange({ badges: data.badges.filter((_, i) => i !== idx) });
  }

  function addBadge() {
    onChange({ badges: [...data.badges, { icon: 'star', title: 'Novo selo', desc: 'Descrição curta' }] });
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white/80">Selos de confiança (faixa abaixo do vídeo)</h4>
        <button type="button" onClick={addBadge} className="inline-flex items-center gap-1 rounded-lg border border-green-500/30 bg-green-500/10 px-2.5 py-1.5 text-xs font-semibold text-green-200 hover:bg-green-500/15">
          <Plus size={12} /> Adicionar selo
        </button>
      </div>

      <div className="space-y-3">
        {data.badges.map((b, idx) => {
          const Icon = getIcon(b.icon);
          return (
            <div key={idx} className="rounded-xl border border-white/10 bg-[#0f1117] p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                  <Icon size={14} className="text-green-400" />
                </span>
                <select
                  value={b.icon}
                  onChange={(e) => updateBadge(idx, { icon: e.target.value as TrustBadge['icon'] })}
                  className="flex-1 rounded-lg border border-white/10 bg-[#1c2236] px-2 py-1.5 text-xs text-white outline-none"
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                  ))}
                </select>
                <button type="button" onClick={() => moveBadge(idx, 'up')} className="rounded-lg border border-white/15 p-1.5 text-white/70 hover:bg-white/10"><ArrowUp size={12} /></button>
                <button type="button" onClick={() => moveBadge(idx, 'down')} className="rounded-lg border border-white/15 p-1.5 text-white/70 hover:bg-white/10"><ArrowDown size={12} /></button>
                <button type="button" onClick={() => removeBadge(idx)} className="rounded-lg border border-red-500/40 p-1.5 text-red-300 hover:bg-red-500/15"><Trash2 size={12} /></button>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <input className={inputCls} value={b.title} onChange={(e) => updateBadge(idx, { title: e.target.value })} placeholder="Título" />
                <input className={inputCls} value={b.desc} onChange={(e) => updateBadge(idx, { desc: e.target.value })} placeholder="Descrição curta" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
