import { ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react';
import { ICON_OPTIONS, type DestaquesContent, type DestaqueFeature } from '@/lib/site-content-defaults';
import { getIcon } from '@/lib/icon-map';
import { Field, inputCls, textareaCls } from './shared';

export function DestaquesForm({ data, onChange }: { data: DestaquesContent; onChange: (d: DestaquesContent) => void }) {
  function set<K extends keyof DestaquesContent>(key: K, value: DestaquesContent[K]) {
    onChange({ ...data, [key]: value });
  }

  function updateFeature(idx: number, patch: Partial<DestaqueFeature>) {
    const features = data.features.map((f, i) => (i === idx ? { ...f, ...patch } : f));
    set('features', features);
  }

  function moveFeature(idx: number, dir: 'up' | 'down') {
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= data.features.length) return;
    const features = [...data.features];
    [features[idx], features[target]] = [features[target], features[idx]];
    set('features', features);
  }

  function removeFeature(idx: number) {
    set('features', data.features.filter((_, i) => i !== idx));
  }

  function addFeature() {
    set('features', [...data.features, { icon: 'sparkles', title: 'Novo destaque', desc: 'Descrição do destaque.' }]);
  }

  return (
    <div>
      <Field label="Chamada pequena (acima do título)">
        <input className={inputCls} value={data.eyebrow} onChange={(e) => set('eyebrow', e.target.value)} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Título">
          <input className={inputCls} value={data.title} onChange={(e) => set('title', e.target.value)} />
        </Field>
        <Field label="Palavra em destaque (verde)">
          <input className={inputCls} value={data.highlight} onChange={(e) => set('highlight', e.target.value)} />
        </Field>
      </div>

      <Field label="Subtítulo">
        <input className={inputCls} value={data.subtitle} onChange={(e) => set('subtitle', e.target.value)} />
      </Field>

      <div className="mb-2 mt-5 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white/80">Cards de destaque</h4>
        <button type="button" onClick={addFeature} className="inline-flex items-center gap-1 rounded-lg border border-green-500/30 bg-green-500/10 px-2.5 py-1.5 text-xs font-semibold text-green-200 hover:bg-green-500/15">
          <Plus size={12} /> Adicionar card
        </button>
      </div>

      <div className="space-y-3">
        {data.features.map((f, idx) => {
          const Icon = getIcon(f.icon);
          return (
            <div key={idx} className="rounded-xl border border-white/10 bg-[#0f1117] p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5">
                  <Icon size={14} className="text-green-400" />
                </span>
                <select
                  value={f.icon}
                  onChange={(e) => updateFeature(idx, { icon: e.target.value as DestaqueFeature['icon'] })}
                  className="flex-1 rounded-lg border border-white/10 bg-[#1c2236] px-2 py-1.5 text-xs text-white outline-none"
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                  ))}
                </select>
                <button type="button" onClick={() => moveFeature(idx, 'up')} className="rounded-lg border border-white/15 p-1.5 text-white/70 hover:bg-white/10"><ArrowUp size={12} /></button>
                <button type="button" onClick={() => moveFeature(idx, 'down')} className="rounded-lg border border-white/15 p-1.5 text-white/70 hover:bg-white/10"><ArrowDown size={12} /></button>
                <button type="button" onClick={() => removeFeature(idx)} className="rounded-lg border border-red-500/40 p-1.5 text-red-300 hover:bg-red-500/15"><Trash2 size={12} /></button>
              </div>
              <input
                className={`${inputCls} mb-2`}
                value={f.title}
                onChange={(e) => updateFeature(idx, { title: e.target.value })}
                placeholder="Título do card"
              />
              <textarea
                className={textareaCls}
                rows={2}
                value={f.desc}
                onChange={(e) => updateFeature(idx, { desc: e.target.value })}
                placeholder="Descrição do card"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
