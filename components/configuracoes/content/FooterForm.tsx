import type { FooterContent, FooterItemContent } from '@/lib/site-content-defaults';
import { Plus, Trash2 } from 'lucide-react';
import { Field, inputCls, textareaCls } from './shared';

export function FooterForm({ data, onChange }: { data: FooterContent; onChange: (d: FooterContent) => void }) {
  function set<K extends keyof FooterContent>(key: K, value: FooterContent[K]) {
    onChange({ ...data, [key]: value });
  }

  function setSection(key: 'ayuda' | 'legal', patch: Partial<FooterContent['ayuda']>) {
    onChange({ ...data, [key]: { ...data[key], ...patch } });
  }

  function setAyudaItems(items: FooterItemContent[]) {
    setSection('ayuda', { items });
  }

  function updateAyudaItem(index: number, patch: Partial<FooterItemContent>) {
    const items = [...(data.ayuda.items ?? [])];
    items[index] = { ...items[index], ...patch };
    setAyudaItems(items);
  }

  function addAyudaItem() {
    setAyudaItems([...(data.ayuda.items ?? []), { title: '', description: '', href: '' }]);
  }

  function removeAyudaItem(index: number) {
    setAyudaItems((data.ayuda.items ?? []).filter((_, i) => i !== index));
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
        { key: 'ayuda' as const, label: 'Coluna: Ajuda e Suporte' },
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

          {key === 'ayuda' && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-white/50">Itens (aparecem ao expandir a coluna no site)</p>
                <button
                  type="button"
                  onClick={addAyudaItem}
                  className="flex items-center gap-1 rounded-lg border border-green-500/30 px-2 py-1 text-[11px] font-medium text-green-300 hover:bg-green-500/10"
                >
                  <Plus size={12} /> Adicionar item
                </button>
              </div>
              {(data.ayuda.items ?? []).map((item, i) => (
                <div key={i} className="rounded-lg border border-white/10 bg-[#161b28] p-2.5 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      className={inputCls}
                      placeholder="Título (ex: Atención por WhatsApp)"
                      value={item.title}
                      onChange={(e) => updateAyudaItem(i, { title: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => removeAyudaItem(i)}
                      className="shrink-0 rounded-lg border border-red-500/20 p-2 text-red-300 hover:bg-red-500/10"
                      aria-label="Remover item"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <input
                    className={inputCls}
                    placeholder="Descrição curta"
                    value={item.description}
                    onChange={(e) => updateAyudaItem(i, { description: e.target.value })}
                  />
                  <input
                    className={inputCls}
                    placeholder="Link (opcional, ex: /legal/envios)"
                    value={item.href ?? ''}
                    onChange={(e) => updateAyudaItem(i, { href: e.target.value })}
                  />
                </div>
              ))}
              {(data.ayuda.items ?? []).length === 0 && (
                <p className="text-xs text-white/40">Nenhum item ainda — clique em &quot;Adicionar item&quot;.</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
