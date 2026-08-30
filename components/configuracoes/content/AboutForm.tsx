import { ArrowUp, ArrowDown, Trash2, Plus } from 'lucide-react';
import { ICON_OPTIONS, type AboutContent, type AboutFeature, type AboutStat } from '@/lib/site-content-defaults';
import { getIcon } from '@/lib/icon-map';
import { Field, inputCls, textareaCls } from './shared';

export function AboutForm({ data, onChange }: { data: AboutContent; onChange: (d: AboutContent) => void }) {
  function set<K extends keyof AboutContent>(key: K, value: AboutContent[K]) {
    onChange({ ...data, [key]: value });
  }

  function updateFeature(idx: number, patch: Partial<AboutFeature>) {
    onChange({ ...data, features: data.features.map((f, i) => (i === idx ? { ...f, ...patch } : f)) });
  }

  function moveFeature(idx: number, dir: 'up' | 'down') {
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= data.features.length) return;
    const features = [...data.features];
    [features[idx], features[target]] = [features[target], features[idx]];
    onChange({ ...data, features });
  }

  function removeFeature(idx: number) {
    onChange({ ...data, features: data.features.filter((_, i) => i !== idx) });
  }

  function addFeature() {
    onChange({ ...data, features: [...data.features, { icon: 'sparkles', title: 'Novo diferencial', desc: 'Descrição do diferencial.' }] });
  }

  function updateStat(idx: number, patch: Partial<AboutStat>) {
    onChange({ ...data, stats: data.stats.map((s, i) => (i === idx ? { ...s, ...patch } : s)) });
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Título (parte antes do destaque)">
          <input className={inputCls} value={data.title} onChange={(e) => set('title', e.target.value)} placeholder="¿Por qué elegir" />
        </Field>
        <Field label="Palavra em destaque (verde)">
          <input className={inputCls} value={data.highlight} onChange={(e) => set('highlight', e.target.value)} placeholder="nuestra tienda" />
        </Field>
      </div>

      <Field label="Primeiro parágrafo">
        <textarea className={textareaCls} rows={3} value={data.paragraph1} onChange={(e) => set('paragraph1', e.target.value)} />
      </Field>
      <Field label="Segundo parágrafo">
        <textarea className={textareaCls} rows={3} value={data.paragraph2} onChange={(e) => set('paragraph2', e.target.value)} />
      </Field>

      <div className="mb-2 mt-5 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white/80">Diferenciais (cards)</h4>
        <button type="button" onClick={addFeature} className="inline-flex items-center gap-1 rounded-lg border border-green-500/30 bg-green-500/10 px-2.5 py-1.5 text-xs font-semibold text-green-200 hover:bg-green-500/15">
          <Plus size={12} /> Adicionar
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
                  onChange={(e) => updateFeature(idx, { icon: e.target.value as AboutFeature['icon'] })}
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
              <input className={`${inputCls} mb-2`} value={f.title} onChange={(e) => updateFeature(idx, { title: e.target.value })} placeholder="Título" />
              <textarea className={textareaCls} rows={2} value={f.desc} onChange={(e) => updateFeature(idx, { desc: e.target.value })} placeholder="Descrição" />
            </div>
          );
        })}
      </div>

      <h4 className="mb-2 mt-5 text-sm font-semibold text-white/80">Cartão visual</h4>
      <Field label="Frase abaixo do ícone">
        <input className={inputCls} value={data.tagline} onChange={(e) => set('tagline', e.target.value)} />
      </Field>

      <div className="grid gap-2 sm:grid-cols-3">
        {data.stats.map((stat, idx) => (
          <div key={idx} className="rounded-lg border border-white/10 bg-[#0f1117] p-2">
            <input className={`${inputCls} mb-1.5 text-center`} value={stat.value} onChange={(e) => updateStat(idx, { value: e.target.value })} placeholder="5+" />
            <input className={`${inputCls} text-center`} value={stat.label} onChange={(e) => updateStat(idx, { label: e.target.value })} placeholder="Años" />
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Selo flutuante — valor (ex: avaliação)">
          <input className={inputCls} value={data.ratingValue} onChange={(e) => set('ratingValue', e.target.value)} placeholder="4.9/5" />
        </Field>
        <Field label="Selo flutuante — legenda">
          <input className={inputCls} value={data.ratingLabel} onChange={(e) => set('ratingLabel', e.target.value)} placeholder="Satisfacción" />
        </Field>
        <Field label="Selo de origem — título">
          <input className={inputCls} value={data.originBadgeTitle} onChange={(e) => set('originBadgeTitle', e.target.value)} placeholder="🇪🇸 Made in Spain" />
        </Field>
        <Field label="Selo de origem — subtítulo">
          <input className={inputCls} value={data.originBadgeSubtitle} onChange={(e) => set('originBadgeSubtitle', e.target.value)} placeholder="Fabricado en España" />
        </Field>
      </div>
    </div>
  );
}
