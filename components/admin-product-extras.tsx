'use client';
import { useEffect, useRef, useState } from 'react';
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
        <h3 className="text-sm font-semibold text-white">Onde aparece no site *</h3>
      </div>
      <p className="mb-4 text-xs text-white/50">
        Escolha o setor (Infantil, Casa, Chaveiros, Pet…) e a coleção. O produto aparece nessa coleção, no visual daquele setor. Setores e coleções novos são criados em “Setores e coleções”.
      </p>

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">1. Setor</p>
      <div className="mb-4 grid gap-2 sm:grid-cols-3">
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
          : 'Escolha o setor e a coleção — obrigatório para cadastrar o produto.'}
      </p>
    </section>
  );
}

// Admin → Produtos: personalizacao com nome em QUALQUER produto (chaveiro,
// placa, quadro, caneca...). A foto do produto aparece e voce clica/arrasta
// nela pra marcar onde o nome fica; o cliente escreve o nome dele e ve
// exatamente ali.
export function PersonalizeEditor({ value, onChange, productImage }: { value: string; onChange: (json: string) => void; productImage?: string | null }) {
  const cfg = parsePersonalize(value);
  const [sample, setSample] = useState('Lucía');
  const stageRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const write = (next: Personalize) => onChange(JSON.stringify(next));
  const set = <K extends keyof Personalize>(k: K, v: Personalize[K]) => write({ ...cfg, [k]: v });

  // Ligar: ja usa a foto principal do produto como base.
  function toggle(on: boolean) {
    write({ ...cfg, enabled: on, previewImage: on && !cfg.previewImage && productImage ? productImage : cfg.previewImage });
  }

  // Clique/arraste na foto = posicao do nome (em % da foto).
  function place(e: React.PointerEvent) {
    const r = stageRef.current?.getBoundingClientRect();
    if (!r) return;
    const x = Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100));
    write({ ...cfg, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
  }

  const slider = (k: 'size' | 'rotate' | 'skew' | 'squash', label: string, min: number, max: number, unit: string) => (
    <label className="block text-xs text-white/60">
      {label}: <span className="font-semibold text-white">{Math.round(cfg[k])}{unit}</span>
      <input type="range" min={min} max={max} step={1} value={cfg[k]} onChange={(e) => set(k, Number(e.target.value))} className="mt-1 w-full accent-green-500" />
    </label>
  );

  return (
    <section className={card}>
      <div className="mb-1 flex items-center gap-2">
        <PenLine size={16} className="text-green-500" />
        <h3 className="text-sm font-semibold text-white">Personalização com nome</h3>
      </div>
      <p className="mb-4 text-xs text-white/50">
        Serve para qualquer produto (chaveiro, placa, quadro, caneca…): o cliente escreve o nome que quiser, vê na hora no lugar que você marcar na foto, escolhe a quantidade e adiciona. O nome chega no pedido para você imprimir.
      </p>

      <label className="mb-4 flex items-center gap-2 text-sm text-white/80">
        <input type="checkbox" checked={cfg.enabled} onChange={(e) => toggle(e.target.checked)} /> Este produto aceita nome personalizado
      </label>

      {cfg.enabled && (
        <div className="space-y-5">
          {/* 1. Foto + marcar o lugar */}
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-white/40">1. Arraste o nome na foto até o lugar certo (ou clique onde ele deve ficar)</p>
            {cfg.previewImage ? (
              <div
                ref={stageRef}
                className="relative cursor-grab touch-none select-none overflow-hidden rounded-2xl border border-white/10 active:cursor-grabbing"
                onPointerDown={(e) => { dragging.current = true; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); place(e); }}
                onPointerMove={(e) => { if (dragging.current) place(e); }}
                onPointerUp={() => { dragging.current = false; }}
              >
                <NamePreview cfg={cfg} text={sample} placeholder="Lucía" swingKey={0} stage="#ffffff" />
                {/* marcador do ponto escolhido */}
                <span
                  className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-green-400 bg-green-400/20"
                  style={{ left: `${cfg.x}%`, top: `${cfg.y}%` }}
                  aria-hidden="true"
                />
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-white/15 px-4 py-6 text-center text-xs text-white/50">
                Suba a imagem principal do produto (ao lado) ou uma foto abaixo — ela aparece aqui para você marcar o lugar do nome.
              </p>
            )}
            <input
              value={sample}
              onChange={(e) => setSample(e.target.value.slice(0, cfg.maxLength))}
              className="mt-3 w-full rounded-lg border border-white/10 bg-[#1c2236] px-3 py-2 text-sm text-white"
              placeholder="Teste um nome"
            />
          </div>

          {/* 2. Aparencia do nome */}
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-white/40">2. Como o nome aparece</p>
            <div className="grid grid-cols-2 gap-3">
              {slider('size', 'Tamanho', 3, 40, '%')}
              {slider('rotate', 'Girar', -90, 90, '°')}
              {slider('skew', 'Perspectiva (inclinar letras)', -45, 45, '°')}
              {slider('squash', 'Achatar / esticar', 40, 160, '%')}
            </div>
            <label className="mt-3 flex items-center gap-2 text-xs text-white/70">
              <input type="checkbox" checked={cfg.relief} onChange={(e) => set('relief', e.target.checked)} />
              Relevo 3D nas letras (parece filamento impresso em alto-relevo)
            </label>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PERSONALIZE_FONTS.map((f) => (
                <button key={f.key} type="button" onClick={() => set('font', f.key)} className={chip(cfg.font === f.key)} style={{ fontFamily: f.css }}>{f.label}</button>
              ))}
            </div>
            <label className="mt-3 flex items-center gap-3 text-xs text-white/60">
              Cor do nome
              <input type="color" value={cfg.color} onChange={(e) => set('color', e.target.value)} className="h-9 w-12 cursor-pointer rounded" />
            </label>
          </div>

          {/* Foto que ja vem com nome escrito */}
          {cfg.previewImage && (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <label className="flex items-center gap-2 text-sm text-white/80">
                <input type="checkbox" checked={cfg.cover} onChange={(e) => set('cover', e.target.checked)} />
                A foto já tem um nome escrito (ex: “BUDDY”) — apagar e trocar pelo do cliente
              </label>
              {cfg.cover && (
                <div className="mt-3 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block text-xs text-white/60">
                      Largura da área: <span className="font-semibold text-white">{Math.round(cfg.coverW)}%</span>
                      <input type="range" min={2} max={100} value={cfg.coverW} onChange={(e) => set('coverW', Number(e.target.value))} className="mt-1 w-full accent-green-500" />
                    </label>
                    <label className="block text-xs text-white/60">
                      Altura da área: <span className="font-semibold text-white">{Math.round(cfg.coverH)}%</span>
                      <input type="range" min={2} max={100} value={cfg.coverH} onChange={(e) => set('coverH', Number(e.target.value))} className="mt-1 w-full accent-green-500" />
                    </label>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
                    Cor da peça (fundo do nome)
                    <input type="color" value={cfg.coverColor} onChange={(e) => set('coverColor', e.target.value)} className="h-9 w-12 cursor-pointer rounded" />
                    <button
                      type="button"
                      onClick={async () => {
                        const ED = (window as any).EyeDropper;
                        if (!ED) { alert('Seu navegador não tem conta-gotas. Use o Chrome ou escolha a cor no quadradinho.'); return; }
                        try { const r = await new ED().open(); if (r?.sRGBHex) set('coverColor', r.sRGBHex); } catch {}
                      }}
                      className="rounded-lg border border-white/15 px-3 py-1.5 font-semibold text-white/80 hover:bg-white/5"
                    >
                      Pegar cor da foto (conta-gotas)
                    </button>
                  </div>
                  <p className="text-[11px] text-white/40">Ajuste a área até cobrir o nome antigo; o nome do cliente aparece por cima, no mesmo lugar.</p>
                </div>
              )}
            </div>
          )}

          {/* 3. Campo pro cliente */}
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-white/40">3. O que o cliente vê</p>
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
          </div>

          {/* Outra foto (opcional) */}
          <MediaUploadField
            label="Usar outra foto (opcional)"
            hint="Por padrão usamos a imagem principal. Se tiver uma foto do produto SEM nome, use aqui — fica mais real."
            value={cfg.previewImage}
            onChange={(url) => set('previewImage', url)}
            kind="image"
          />
          {productImage && cfg.previewImage !== productImage && (
            <button type="button" onClick={() => set('previewImage', productImage)} className="text-xs font-semibold text-green-400 hover:underline">
              Voltar para a imagem principal
            </button>
          )}
        </div>
      )}
    </section>
  );
}

