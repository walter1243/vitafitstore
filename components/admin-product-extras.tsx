'use client';
import { useEffect, useState } from 'react';
import { LayoutGrid, PenLine } from 'lucide-react';
import { MediaUploadField } from '@/components/configuracoes/content/shared';
import { NamePreview } from '@/components/personalize/name-personalizer';
import { PERSONALIZE_FONTS, parsePersonalize, type Personalize } from '@/lib/personalize';
import { type Sector } from '@/lib/sectors-shared';

const STYLE_LABEL: Record<string, string> = { infantil: 'Infantil', hogar: 'Casa / Hogar', llaveros: 'Chaveiros', mascotas: 'Mascotas / Pet' };
const card = 'rounded-2xl border border-white/10 bg-[#0f1117] p-5 shadow-none';
const chip = (on: boolean) =>
  `rounded-xl border px-3 py-2 text-left text-sm font-semibold transition ${on ? 'border-green-500/60 bg-green-500/10 text-white' : 'border-white/10 text-white/60 hover:bg-white/5'}`;

// Admin → Produtos: em que setor/colecao o produto aparece no site.
// "Automático" = pela categoria (regra antiga, palavras da colecao).
export function ProductPlacement({ value, onChange, category, onCategory }: {
  value: string;
  onChange: (slug: string, name?: string) => void;
  // 3o passo: categoria dentro da colecao escolhida.
  category: string;
  onCategory: (name: string) => void;
}) {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [sectorId, setSectorId] = useState<number | null>(null);
  const [products, setProducts] = useState<{ category?: string; collectionSlug?: string }[]>([]);
  const [newCat, setNewCat] = useState('');

  useEffect(() => {
    fetch('/api/products', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : []))
      .then((p) => { if (Array.isArray(p)) setProducts(p); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/sectors?all=1', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : []))
      .then((s) => { if (Array.isArray(s)) setSectors(s); })
      .catch(() => {});
  }, []);

  // Abre no setor da colecao ja escolhida.
  useEffect(() => {
    if (!value || sectors.length === 0) return;
    const owner = sectors.find((s) => s.collections.some((c) => c.slug === value));
    if (owner) setSectorId(owner.id);
  }, [value, sectors]);

  const current = sectors.find((s) => s.id === sectorId);
  const chosen = sectors.flatMap((s) => s.collections.map((c) => ({ c, s }))).find((x) => x.c.slug === value);

  return (
    <section className={card}>
      <div className="mb-1 flex items-center gap-2">
        <LayoutGrid size={16} className="text-green-500" />
        <h3 className="text-sm font-semibold text-white">Onde aparece no site</h3>
      </div>
      <p className="mb-4 text-xs text-white/50">
        Escolha o setor (Infantil, Casa, Chaveiros, Pet…) e a coleção. O produto aparece nessa coleção, no visual daquele setor. Setores e coleções novos são criados em “Setores e coleções”.
      </p>

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">1. Setor</p>
      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        <button type="button" onClick={() => { setSectorId(null); onChange(''); }} className={chip(!value && sectorId === null)}>
          Automático
          <span className="block text-[11px] font-normal text-white/45">pela categoria</span>
        </button>
        {sectors.map((s) => (
          <button key={s.id} type="button" onClick={() => setSectorId(s.id)} className={chip(sectorId === s.id)}>
            {s.name}
            <span className="block text-[11px] font-normal text-white/45">Visual: {STYLE_LABEL[s.style] ?? s.style}{!s.enabled ? ' · oculto' : ''}</span>
          </button>
        ))}
      </div>

      {current && (
        <>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">2. Coleção em {current.name}</p>
          {current.collections.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/10 px-4 py-4 text-xs text-white/45">Esse setor ainda não tem coleções. Crie uma em “Setores e coleções”.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {current.collections.map((c) => (
                <button key={c.slug} type="button" onClick={() => onChange(c.slug, c.name)} className={`${chip(value === c.slug)} flex items-center gap-3`}>
                  <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white/5">
                    {(c.imageUrl || c.photoUrl) && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.imageUrl || c.photoUrl} alt="" className="h-full w-full object-cover" />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate">{c.name}</span>
                    <span className="block truncate text-[11px] font-normal text-white/45">{c.interactive === 'nombre' ? 'com nome personalizado' : c.tagline}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {chosen && (() => {
        // Categorias ja usadas nessa colecao + o nome da propria colecao.
        const used = [...new Set([chosen.c.name, ...products.filter((p) => p.collectionSlug === chosen.c.slug && p.category).map((p) => String(p.category).trim())])];
        const all = category && !used.includes(category) ? [...used, category] : used;
        return (
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">3. Categoria em {chosen.c.name}</p>
            <div className="flex flex-wrap gap-2">
              {all.map((name) => (
                <button key={name} type="button" onClick={() => onCategory(name)} className={chip(category === name)}>
                  {name}
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && newCat.trim()) { e.preventDefault(); onCategory(newCat.trim()); setNewCat(''); } }}
                placeholder="Nova categoria (ex: Jarrones, Comederos, Llaveros de letras)"
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#1c2236] px-3 py-2 text-sm text-white placeholder:text-white/30"
              />
              <button
                type="button"
                disabled={!newCat.trim()}
                onClick={() => { onCategory(newCat.trim()); setNewCat(''); }}
                className="rounded-xl bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-40"
              >
                Usar
              </button>
            </div>
            <p className="mt-1 text-[11px] text-white/40">A categoria vira um filtro dentro da coleção (ex: em Decoración: Jarrones, Macetas…).</p>
          </div>
        );
      })()}

      <p className="mt-5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
        {chosen
          ? <>Vai aparecer em <strong className="text-white">{chosen.s.name} → {chosen.c.name}{category ? ` → ${category}` : ''}</strong>.</>
          : 'Automático: entra na coleção cuja categoria bate com a do produto.'}
      </p>
    </section>
  );
}

// Admin → Produtos: personalizacao com nome (chaveiro, placa de pet).
// Previa ao vivo do jeito que o cliente vai ver.
export function PersonalizeEditor({ value, onChange, productImage }: { value: string; onChange: (json: string) => void; productImage?: string | null }) {
  const cfg = parsePersonalize(value);
  const [sample, setSample] = useState('Lucía');
  const set = <K extends keyof Personalize>(k: K, v: Personalize[K]) => onChange(JSON.stringify({ ...cfg, [k]: v }));
  const range = (k: 'x' | 'y' | 'size', label: string, min: number, max: number) => (
    <label className="block text-xs text-white/60">
      {label}: <span className="font-semibold text-white">{Math.round(cfg[k])}%</span>
      <input type="range" min={min} max={max} step={0.5} value={cfg[k]} onChange={(e) => set(k, Number(e.target.value))} className="mt-1 w-full accent-green-500" />
    </label>
  );

  return (
    <section className={card}>
      <div className="mb-1 flex items-center gap-2">
        <PenLine size={16} className="text-green-500" />
        <h3 className="text-sm font-semibold text-white">Personalização com nome</h3>
      </div>
      <p className="mb-4 text-xs text-white/50">
        Para chaveiros, placas de pet e afins: o cliente escreve o nome, vê na hora no modelo, escolhe a quantidade e adiciona. O nome chega no pedido para você imprimir.
      </p>

      <label className="mb-4 flex items-center gap-2 text-sm text-white/80">
        <input type="checkbox" checked={cfg.enabled} onChange={(e) => set('enabled', e.target.checked)} /> Este produto é personalizado com nome
      </label>

      {cfg.enabled && (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs text-white/60">
                Texto do campo
                <input className="mt-1 w-full rounded-lg border border-white/10 bg-[#1c2236] px-3 py-2 text-sm text-white" value={cfg.label} onChange={(e) => set('label', e.target.value)} placeholder="Nombre" />
              </label>
              <label className="block text-xs text-white/60">
                Máximo de letras
                <input type="number" min={2} max={30} className="mt-1 w-full rounded-lg border border-white/10 bg-[#1c2236] px-3 py-2 text-sm text-white" value={cfg.maxLength} onChange={(e) => set('maxLength', Number(e.target.value))} />
              </label>
            </div>

            <div>
              <p className="mb-1.5 text-xs text-white/60">Formato (se não subir foto)</p>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => set('shape', 'llavero')} className={chip(cfg.shape === 'llavero')}>Chaveiro</button>
                <button type="button" onClick={() => set('shape', 'chapa')} className={chip(cfg.shape === 'chapa')}>Placa de pet (osso)</button>
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-xs text-white/60">Letra do nome</p>
              <div className="grid grid-cols-3 gap-2">
                {PERSONALIZE_FONTS.map((f) => (
                  <button key={f.key} type="button" onClick={() => set('font', f.key)} className={chip(cfg.font === f.key)} style={{ fontFamily: f.css }}>{f.label}</button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-3 text-xs text-white/60">
              Cor do nome
              <input type="color" value={cfg.color} onChange={(e) => set('color', e.target.value)} className="h-9 w-12 cursor-pointer rounded" />
            </label>

            <MediaUploadField
              label="Foto do modelo SEM nome (opcional)"
              hint="O nome é desenhado por cima, no lugar que você ajustar abaixo. Sem foto, usamos o desenho do formato."
              value={cfg.previewImage}
              onChange={(url) => set('previewImage', url)}
              kind="image"
            />
            {!cfg.previewImage && productImage && (
              <button type="button" onClick={() => set('previewImage', productImage)} className="text-xs font-semibold text-green-400 hover:underline">
                Usar a imagem principal do produto
              </button>
            )}
            {cfg.previewImage && (
              <div className="grid grid-cols-3 gap-3">
                {range('x', 'Horizontal', 0, 100)}
                {range('y', 'Vertical', 0, 100)}
                {range('size', 'Tamanho', 3, 40)}
              </div>
            )}
          </div>

          <div>
            <p className="mb-1.5 text-xs text-white/60">Prévia (como o cliente vê)</p>
            <NamePreview cfg={cfg} text={sample} placeholder="Lucía" swingKey={sample.length} stage="linear-gradient(160deg,#EEF2FF,#FFE7D6)" />
            <input
              value={sample}
              onChange={(e) => setSample(e.target.value.slice(0, cfg.maxLength))}
              className="mt-3 w-full rounded-lg border border-white/10 bg-[#1c2236] px-3 py-2 text-sm text-white"
              placeholder="Teste um nome"
            />
          </div>
        </div>
      )}
    </section>
  );
}
