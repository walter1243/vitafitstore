import type { FooterContent } from '@/lib/site-content-defaults';
import { Field, inputCls, textareaCls } from './shared';

export function FooterForm({ data, onChange }: { data: FooterContent; onChange: (d: FooterContent) => void }) {
  function set<K extends keyof FooterContent>(key: K, value: FooterContent[K]) {
    onChange({ ...data, [key]: value });
  }

  function setSection(key: 'empresa' | 'ayuda' | 'legal', patch: Partial<FooterContent['empresa']>) {
    onChange({ ...data, [key]: { ...data[key], ...patch } });
  }

  return (
    <div>
      <Field label="Descrição da marca (abaixo do logo)">
        <textarea className={textareaCls} rows={3} value={data.brandDescription} onChange={(e) => set('brandDescription', e.target.value)} />
      </Field>

      <Field label="Nota de direitos autorais" hint="Aparece depois de “© 2026 {nome da loja}.”">
        <input className={inputCls} value={data.copyrightNote} onChange={(e) => set('copyrightNote', e.target.value)} />
      </Field>

      {([
        { key: 'empresa' as const, label: 'Coluna: Empresa' },
        { key: 'ayuda' as const, label: 'Coluna: Ajuda e SAC' },
        { key: 'legal' as const, label: 'Coluna: Legal' },
      ]).map(({ key, label }) => (
        <div key={key} className="mt-4 rounded-xl border border-white/10 bg-[#0f1117] p-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-green-300/80">{label}</h4>
          <Field label="Título da coluna">
            <input className={inputCls} value={data[key].title} onChange={(e) => setSection(key, { title: e.target.value })} />
          </Field>
          <Field label="Descrição da coluna">
            <input className={inputCls} value={data[key].description} onChange={(e) => setSection(key, { description: e.target.value })} />
          </Field>
        </div>
      ))}
    </div>
  );
}
