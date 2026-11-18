'use client';

// Admin → Lojas. Cria e edita lojas próprias (ex.: VICE CITY STORE): nome,
// link próprio (seusite.com/slug — o do Instagram), logo, tema neon, textos e o produto
// da capa (o que brilha). Cada loja tem catálogo próprio — os produtos entram
// pelo seletor de loja no topo + aba Produtos. Mesmo login e mesmo checkout.

import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, Image as ImageIcon, Instagram, Loader2, Plus, Rocket, Settings2, Sparkles, Star, Trash2, X } from 'lucide-react';
import { dataUrlToBlobUrl, isDataUrl } from '@/lib/upload-data-url';
import { useHoverPaste } from '@/lib/use-hover-paste';
import { LOGO_HEIGHT_MAX, LOGO_HEIGHT_MIN, SALES_PAGE_THEMES, THEME_ART, THEME_ICONS, clampHeroLogo, clampLogoHeight, storeArt, storePath, type SalesPageConfig } from '@/lib/sales-pages-shared';

type AdminProduct = { id: number; name: string; price: number; image?: string; mainImage?: string; category?: string };

const inputCls = 'w-full rounded-lg border border-white/10 bg-[#1c2236] px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-green-500/40 focus:ring-2 focus:ring-green-500/40';
const labelCls = 'mb-1.5 block text-xs font-medium text-white/50';

const EMPTY: SalesPageConfig = {
  slug: '', title: 'Nova loja', theme: 'vice-city', enabled: true, logoImage: '', iconImage: '', logoHeight: 72, heroLogoSize: 0, whatsappEnabled: true, whatsappNumber: '', instagram: '', collections: [],
  eyebrow: 'EDICIÓN LIMITADA', heading: 'VICE CITY STORE',
  subtitle: 'Llaveros y piezas 3D con alma retro de los 80.',
  ctaLabel: 'Comprar ahora', badge: 'NUEVO DROP', heroImage: '', heroVideo: '', backgroundImage: '',
  countdownTo: null, countdownLabel: 'El drop termina en',
  coverProductId: null, coverTagline: 'La pieza que enciende la colección',
  productIds: [], featureTitle: 'El llavero que brilla',
  featureText: 'Contornos de neón y ese brillo inconfundible.',
  neonPrimary: '#ff2d9b', neonSecondary: '#00e5ff',
  footerNote: 'Impreso en 3D en España · Envío con seguimiento',
};

// Corta as bordas vazias do logo (transparentes ou da cor do fundo): logo com
// muita margem em volta fica minúsculo no topo. Devolve PNG em data URL.
async function trimLogo(src: string): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    i.src = src;
  });
  const w = img.naturalWidth, h = img.naturalHeight;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  if (!ctx) return src;
  ctx.drawImage(img, 0, 0);
  const { data } = ctx.getImageData(0, 0, w, h);
  const hasAlpha = data[3] < 250 || data[(w * h - 1) * 4 + 3] < 250;
  const [r0, g0, b0] = [data[0], data[1], data[2]];
  const empty = (i: number) => hasAlpha
    ? data[i + 3] < 12
    : Math.abs(data[i] - r0) + Math.abs(data[i + 1] - g0) + Math.abs(data[i + 2] - b0) < 30;
  let top = h, left = w, right = -1, bottom = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!empty((y * w + x) * 4)) { if (x < left) left = x; if (x > right) right = x; if (y < top) top = y; if (y > bottom) bottom = y; }
  }
  if (right < 0) return src; // imagem vazia
  const pad = Math.round(Math.max(right - left, bottom - top) * 0.02);
  left = Math.max(0, left - pad); top = Math.max(0, top - pad);
  right = Math.min(w - 1, right + pad); bottom = Math.min(h - 1, bottom + pad);
  const out = document.createElement('canvas');
  out.width = right - left + 1; out.height = bottom - top + 1;
  out.getContext('2d')!.drawImage(cv, left, top, out.width, out.height, 0, 0, out.width, out.height);
  return out.toDataURL('image/png');
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

// editSlug: abre direto o editor dessa loja (Admin → Editar loja com a loja
// selecionada no topo). onSaved(slug): avisa o painel (nome/logo/link mudaram).
// onManage(slug): troca o painel para essa loja (produtos, pedidos, dashboard).
export default function AdminSalesPages({ products, editSlug, onSaved, onManage }: {
  products: AdminProduct[];
  editSlug?: string;
  onSaved?: (slug: string) => void;
  onManage?: (slug: string) => void;
}) {
  const [pages, setPages] = useState<SalesPageConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<(SalesPageConfig & { originalSlug?: string }) | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/sales-pages', { cache: 'no-store' });
      const d = await r.json();
      setPages(Array.isArray(d) ? d : []);
    } catch { setMsg({ ok: false, text: 'Não foi possível carregar as páginas.' }); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  // Modo "Editar loja": abre o editor da loja selecionada assim que a lista chega.
  useEffect(() => {
    if (!editSlug || loading || editing) return;
    const pg = pages.find((x) => x.slug === editSlug);
    if (pg) setEditing({ ...pg, originalSlug: pg.slug });
  }, [editSlug, loading, pages, editing]);

  const [copied, setCopied] = useState(false);
  // Coleções da loja (abas de filtro na loja; o produto escolhe uma no cadastro)
  const [newCol, setNewCol] = useState('');
  const setCols = (fn: (cols: string[]) => string[]) => setEditing((e) => (e ? { ...e, collections: fn(e.collections ?? []) } : e));
  const addCol = () => {
    const name = newCol.trim().replace(/\s+/g, ' ').slice(0, 40);
    if (!name) return;
    setCols((cols) => (cols.some((x) => x.toLowerCase() === name.toLowerCase()) ? cols : [...cols, name]));
    setNewCol('');
  };
  const moveCol = (i: number, d: number) => setCols((cols) => {
    const j = i + d;
    if (j < 0 || j >= cols.length) return cols;
    const next = [...cols];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });
  const removeCol = (i: number) => setCols((cols) => cols.filter((_, k) => k !== i));
  const fullLink = (slug: string) => (typeof window !== 'undefined' ? `${window.location.origin}${storePath(slug)}` : storePath(slug));
  async function copyLink(slug: string) {
    try { await navigator.clipboard.writeText(fullLink(slug)); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  }

  const up = <K extends keyof SalesPageConfig>(k: K, v: SalesPageConfig[K]) => setEditing((e) => (e ? { ...e, [k]: v } : e));

  const heroPaste = useHoverPaste<HTMLDivElement>((t) => /^image\//.test(t), async (files) => {
    if (files[0]) up('heroImage', await readAsDataUrl(files[0]));
  });

  // overrides: ex. { enabled: true } = publicar e salvar num clique só.
  async function save(overrides?: Partial<SalesPageConfig>) {
    if (!editing) return;
    const ed = { ...editing, ...(overrides ?? {}) };
    setSaving(true); setMsg(null);
    try {
      const heroImage = isDataUrl(ed.heroImage) ? await dataUrlToBlobUrl(ed.heroImage, 'lojas') : ed.heroImage;
      const logoImage = isDataUrl(ed.logoImage) ? await dataUrlToBlobUrl(ed.logoImage, 'lojas') : ed.logoImage;
      const iconImage = isDataUrl(ed.iconImage) ? await dataUrlToBlobUrl(ed.iconImage, 'lojas') : ed.iconImage;
      const backgroundImage = isDataUrl(ed.backgroundImage) ? await dataUrlToBlobUrl(ed.backgroundImage, 'lojas') : ed.backgroundImage;
      const r = await fetch('/api/sales-pages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...ed, heroImage, logoImage, iconImage, backgroundImage }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d?.error || 'Erro ao salvar.');
      setMsg({ ok: true, text: `Salvo. "${d.title}" ${d.enabled ? 'publicada' : 'em rascunho'} em ${storePath(d.slug)}` });
      // No "Editar loja" o editor continua aberto; na lista de lojas volta para a lista.
      setEditing(editSlug ? { ...d, originalSlug: d.slug } : null);
      await load();
      onSaved?.(d.slug);
    } catch (e: any) { setMsg({ ok: false, text: e?.message || 'Erro ao salvar.' }); }
    finally { setSaving(false); }
  }

  async function remove(slug: string) {
    if (!confirm(`Apagar a loja ${storePath(slug)}? A página sai do ar (os produtos e pedidos dela continuam no banco). Isto não pode ser desfeito.`)) return;
    try {
      const r = await fetch(`/api/sales-pages?slug=${encodeURIComponent(slug)}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('Erro ao apagar.');
      setMsg({ ok: true, text: 'Página apagada.' });
      if (editing?.originalSlug === slug) setEditing(null);
      await load();
    } catch (e: any) { setMsg({ ok: false, text: e?.message || 'Erro ao apagar.' }); }
  }

  // Produtos desta loja (para escolher o da capa — o que brilha). A loja mostra
  // todos os produtos dela sozinha; os produtos entram pelo seletor de loja no
  // topo + aba Produtos. Loja nova (ainda sem slug salvo) não tem produtos.
  const [storeProducts, setStoreProducts] = useState<AdminProduct[]>([]);
  const editingSlug = editing?.originalSlug;
  useEffect(() => {
    if (!editingSlug) { setStoreProducts([]); return; }
    fetch(`/api/products?store=${encodeURIComponent(editingSlug)}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setStoreProducts(Array.isArray(d) ? d : []))
      .catch(() => setStoreProducts([]));
  }, [editingSlug]);
  void products;

  // ---------- Editor ----------
  if (editing) {
    const dateVal = editing.countdownTo ? editing.countdownTo.slice(0, 10) : '';
    return (
      <div className="rounded-2xl border border-white/10 bg-[#161b28] p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-semibold text-white"><Rocket size={16} className="text-pink-400" /> {editing.originalSlug ? 'Editar loja' : 'Nova loja'}</h2>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => up('enabled', !editing.enabled)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${editing.enabled ? 'border-green-500/50 bg-green-500/15 text-green-300' : 'border-white/15 bg-white/5 text-white/60'}`}>
              <span className={`h-2 w-2 rounded-full ${editing.enabled ? 'bg-green-400' : 'bg-white/30'}`} />
              {editing.enabled ? 'Publicada' : 'Rascunho'}
            </button>
            {!editSlug && <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/60 hover:bg-white/5">Voltar</button>}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {/* Coluna textos */}
          <div className="space-y-3">
            {editing.originalSlug && (
              <div className="rounded-xl border border-pink-500/30 bg-pink-500/10 p-3">
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-pink-200"><Instagram size={14} /> Link da loja (para o Instagram)</p>
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-lg bg-black/30 px-2.5 py-2 text-xs text-white">{fullLink(editing.originalSlug)}</code>
                  <button type="button" onClick={() => copyLink(editing.originalSlug!)}
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-white ${copied ? 'bg-green-600' : 'bg-pink-600 hover:bg-pink-700'}`}>
                    {copied ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> Copiar</>}
                  </button>
                </div>
                {!editing.enabled && <p className="mt-1.5 text-[11px] text-amber-200">Em rascunho: só você (logado) vê. Clique em “Rascunho” → “Publicada” e salve para o link funcionar para todos.</p>}
              </div>
            )}
            {/* Logo do topo (largo, com o nome) + tamanho */}
            <div className="rounded-xl border border-white/10 bg-[#0f1117] p-3">
              <p className="text-sm font-semibold text-white">Logo do topo (com o nome)</p>
              <p className="text-[11px] text-white/40">Aparece na barra de cima da loja, nos produtos e no checkout. Horizontal, PNG com fundo transparente. Ao enviar, as bordas vazias são cortadas sozinhas.</p>
              {/* prévia no tamanho real escolhido, numa barra igual à da loja */}
              <div className="relative mt-2 flex items-center overflow-hidden rounded-xl border border-white/15 bg-[#0d0418] px-3" style={{ height: Math.max(72, clampLogoHeight(editing.logoHeight) + 16) }}>
                {editing.logoImage
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={editing.logoImage} alt="" style={{ height: clampLogoHeight(editing.logoHeight) }} className="w-auto max-w-[85%] object-contain" />
                  : <span className="text-xs text-white/40">Sem logo: mostra o nome da loja em neon</span>}
                <span className="ml-auto rounded-lg border border-white/15 px-2.5 py-1.5 text-[11px] text-white/60">Carrito</span>
                {editing.logoImage && <button type="button" onClick={() => up('logoImage', '')} title="Remover logo" className="absolute right-1.5 top-1.5 rounded-lg bg-black/60 p-1.5 text-white/80 hover:bg-red-600"><Trash2 size={13} /></button>}
              </div>
              <label className="mt-3 block">
                <span className="mb-1 flex items-center justify-between text-xs font-medium text-white/60">
                  <span>Tamanho do logo no topo</span>
                  <span className="tabular-nums text-white">{clampLogoHeight(editing.logoHeight)} px</span>
                </span>
                <input type="range" min={LOGO_HEIGHT_MIN} max={LOGO_HEIGHT_MAX} step={2}
                  value={clampLogoHeight(editing.logoHeight)}
                  onChange={(e) => up('logoHeight', Number(e.target.value))}
                  className="w-full cursor-pointer accent-pink-500" />
                <span className="mt-0.5 flex justify-between text-[10px] text-white/35"><span>pequeno</span><span>no celular fica 80% deste tamanho</span><span>grande</span></span>
              </label>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input type="file" accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (!f) return;
                    const raw = await readAsDataUrl(f);
                    up('logoImage', await trimLogo(raw).catch(() => raw));
                  }}
                  className="min-w-0 flex-1 text-xs text-white/60" />
                {editing.logoImage && (
                  <button type="button"
                    onClick={async () => {
                      try { up('logoImage', await trimLogo(editing.logoImage)); setMsg({ ok: true, text: 'Bordas vazias do logo cortadas. Clique em Salvar loja.' }); }
                      catch { setMsg({ ok: false, text: 'Não foi possível cortar este logo. Envie o arquivo de novo.' }); }
                    }}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/5">
                    Cortar bordas vazias
                  </button>
                )}
              </div>
            </div>
            {/* Logo grande na capa, no lugar do título — tamanho em relação à página */}
            <div className="rounded-xl border border-white/10 bg-[#0f1117] p-3">
              <p className="text-sm font-semibold text-white">Logo na capa (no lugar do título)</p>
              <p className="text-[11px] text-white/40">Mostra o logo grande na capa da loja. 0% = mostra o título escrito.</p>
              {/* prévia: proporção de uma tela, com a coluna do título à esquerda */}
              <div className="relative mt-2 aspect-[16/9] overflow-hidden rounded-lg border border-white/15 bg-[#0b0614]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={editing.backgroundImage || storeArt(editing).hero} alt="" className="absolute inset-0 h-full w-full object-cover object-[38%_55%] opacity-90" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(270deg, #0b0614 0%, #0b0614e0 22%, #0b061480 40%, transparent 60%)' }} />
                <div className="absolute inset-y-0 right-[4%] flex w-[40%] flex-col justify-center">
                  {editing.logoImage && clampHeroLogo(editing.heroLogoSize) > 0
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={editing.logoImage} alt="" style={{ width: `${clampHeroLogo(editing.heroLogoSize)}%` }} className="h-auto max-w-full" />
                    : <span className="text-[clamp(14px,3vw,26px)] font-black uppercase leading-none text-white">{editing.heading || editing.title}</span>}
                  <span className="mt-2 h-1.5 w-2/3 rounded bg-white/25" />
                  <span className="mt-1 h-1.5 w-1/2 rounded bg-white/15" />
                  <span className="mt-2 h-3 w-1/4 rounded bg-white/70" />
                </div>
              </div>
              <label className="mt-3 block">
                <span className="mb-1 flex items-center justify-between text-xs font-medium text-white/60">
                  <span>Tamanho do logo na capa</span>
                  <span className="tabular-nums text-white">{clampHeroLogo(editing.heroLogoSize) ? `${clampHeroLogo(editing.heroLogoSize)}%` : 'desligado'}</span>
                </span>
                <input type="range" min={0} max={100} step={5}
                  value={clampHeroLogo(editing.heroLogoSize)}
                  disabled={!editing.logoImage}
                  onChange={(e) => up('heroLogoSize', Number(e.target.value) < 15 ? 0 : Number(e.target.value))}
                  className="w-full cursor-pointer accent-pink-500 disabled:cursor-not-allowed disabled:opacity-40" />
                <span className="mt-0.5 flex justify-between text-[10px] text-white/35"><span>título escrito</span><span>{editing.logoImage ? '% da largura do texto da capa (no celular, da tela)' : 'envie o logo do topo primeiro'}</span><span>100%</span></span>
              </label>
            </div>
            {/* Ícone (quadrado): favicon da aba + prévia do link no Instagram/WhatsApp */}
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0f1117] p-3">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-[#0d0418]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={editing.iconImage || THEME_ICONS[editing.theme]?.icon192} alt="" className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">Ícone da loja (quadrado)</p>
                <p className="text-[11px] text-white/40">Ícone da aba do navegador e imagem que aparece ao compartilhar o link no Instagram/WhatsApp. Quadrado, ex.: 512×512. {editing.iconImage ? '' : 'Agora: ícone padrão do tema.'}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={async (e) => { const f = e.target.files?.[0]; if (f) up('iconImage', await readAsDataUrl(f)); e.target.value = ''; }}
                    className="min-w-0 flex-1 text-xs text-white/60" />
                  {editing.iconImage && <button type="button" onClick={() => up('iconImage', '')} title="Voltar ao ícone do tema" className="rounded-lg p-1.5 text-white/50 hover:bg-red-500/15 hover:text-red-300"><Trash2 size={13} /></button>}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><label className={labelCls}>Nome da loja</label><input value={editing.title} onChange={(e) => up('title', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Link · seusite.com/…</label><input value={editing.slug} onChange={(e) => up('slug', e.target.value)} placeholder="vice-city" className={`${inputCls} font-mono`} /></div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><label className={labelCls}>Selo (badge)</label><input value={editing.badge} onChange={(e) => up('badge', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Linha fina (eyebrow)</label><input value={editing.eyebrow} onChange={(e) => up('eyebrow', e.target.value)} className={inputCls} /></div>
            </div>
            <div><label className={labelCls}>Título grande (neon)</label><input value={editing.heading} onChange={(e) => up('heading', e.target.value)} className={`${inputCls} font-black`} /></div>
            <div><label className={labelCls}>Subtítulo</label><textarea value={editing.subtitle} onChange={(e) => up('subtitle', e.target.value)} rows={3} className={inputCls} /></div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><label className={labelCls}>Texto do botão</label><input value={editing.ctaLabel} onChange={(e) => up('ctaLabel', e.target.value)} className={inputCls} /></div>
              <div><label className={labelCls}>Tema</label>
                <select value={editing.theme} onChange={(e) => up('theme', e.target.value as any)} className={`${inputCls} [color-scheme:dark]`}>
                  {SALES_PAGE_THEMES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><label className={labelCls}>Cor neon 1</label><input type="color" value={editing.neonPrimary} onChange={(e) => up('neonPrimary', e.target.value)} className="h-10 w-full cursor-pointer rounded-lg border border-white/10 bg-[#1c2236]" /></div>
              <div><label className={labelCls}>Cor neon 2</label><input type="color" value={editing.neonSecondary} onChange={(e) => up('neonSecondary', e.target.value)} className="h-10 w-full cursor-pointer rounded-lg border border-white/10 bg-[#1c2236]" /></div>
            </div>
            <div className="grid grid-cols-[1fr_auto] items-end gap-3">
              <div><label className={labelCls}>Contagem regressiva termina em (opcional)</label>
                <input type="date" value={dateVal} onChange={(e) => up('countdownTo', e.target.value ? new Date(`${e.target.value}T23:59:59`).toISOString() : null)} className={`${inputCls} [color-scheme:dark]`} />
              </div>
              {dateVal && <button type="button" onClick={() => up('countdownTo', null)} className="mb-0.5 rounded-lg border border-white/10 px-2 py-2 text-white/60 hover:bg-white/10"><X size={14} /></button>}
            </div>
            <div><label className={labelCls}>Rodapé (selos de confiança)</label><input value={editing.footerNote} onChange={(e) => up('footerNote', e.target.value)} className={inputCls} /></div>
            {/* Coleções da loja */}
            <div className="space-y-3 rounded-xl border border-white/10 bg-[#0f1117] p-3">
              <div>
                <p className="text-sm font-semibold text-white">Coleções da loja</p>
                <p className="text-[11px] text-white/40">Viram as abas de filtro na loja, nesta ordem. No cadastro do produto você escolhe uma delas. Salve a loja depois de mudar.</p>
              </div>
              {(editing.collections ?? []).length > 0 && (
                <ul className="space-y-1.5">
                  {(editing.collections ?? []).map((name, i, arr) => (
                    <li key={name} className="flex items-center gap-1.5 rounded-lg bg-[#1c2236] py-1.5 pl-3 pr-1.5 text-sm text-white">
                      <span className="min-w-0 flex-1 truncate">{name}</span>
                      <button type="button" onClick={() => moveCol(i, -1)} disabled={i === 0} aria-label="Subir" className="h-8 w-8 rounded-md text-white/60 hover:bg-white/10 disabled:opacity-25">↑</button>
                      <button type="button" onClick={() => moveCol(i, 1)} disabled={i === arr.length - 1} aria-label="Descer" className="h-8 w-8 rounded-md text-white/60 hover:bg-white/10 disabled:opacity-25">↓</button>
                      <button type="button" onClick={() => removeCol(i)} aria-label={`Remover ${name}`} className="flex h-8 w-8 items-center justify-center rounded-md text-white/50 hover:bg-red-500/15 hover:text-red-300"><Trash2 size={13} /></button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <input value={newCol} onChange={(e) => setNewCol(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCol(); } }}
                  placeholder="Nova coleção (ex.: Llaveros, Figuras)" className={inputCls} />
                <button type="button" onClick={addCol} className="shrink-0 rounded-lg bg-green-600 px-3 text-xs font-semibold text-white hover:bg-green-700">Adicionar</button>
              </div>
            </div>
            {/* WhatsApp e Instagram da loja */}
            <div className="space-y-3 rounded-xl border border-white/10 bg-[#0f1117] p-3">
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={editing.whatsappEnabled !== false} onChange={(e) => up('whatsappEnabled', e.target.checked)} className="mt-0.5 h-4 w-4 accent-green-500" />
                <span>
                  <span className="block text-sm font-semibold text-white">WhatsApp na loja</span>
                  <span className="block text-[11px] text-white/40">Botão do WhatsApp nas páginas da loja e “¿Prefieres pedirlo por WhatsApp?” nos produtos personalizados com nome (a mensagem já vai com o produto e o nome escrito).</span>
                </span>
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div><label className={labelCls}>Número do WhatsApp</label><input value={editing.whatsappNumber} onChange={(e) => up('whatsappNumber', e.target.value)} placeholder="Vazio = o mesmo da Kitoys" inputMode="tel" className={inputCls} /></div>
                <div><label className={labelCls}>Instagram da loja</label><input value={editing.instagram} onChange={(e) => up('instagram', e.target.value)} placeholder="@vicecitystore" className={inputCls} /></div>
              </div>
            </div>
          </div>

          {/* Coluna capa + produtos */}
          <div className="space-y-3">
            <div className="rounded-xl border border-white/10 bg-[#0f1117] p-3">
              <div className="mb-2 flex items-center gap-2"><ImageIcon size={15} className="text-white/60" /><p className="text-sm font-semibold text-white">Foto de fundo da capa</p></div>
              <div className="relative mx-auto aspect-[9/16] max-w-[150px] overflow-hidden rounded-lg border border-white/10 bg-[#1c2236]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={editing.backgroundImage || THEME_ART[editing.theme]?.hero} alt="" className="h-full w-full object-cover" />
                {editing.backgroundImage
                  ? <button type="button" onClick={() => up('backgroundImage', '')} title="Voltar para a arte do tema" className="absolute right-1.5 top-1.5 rounded-lg bg-black/60 p-1.5 text-white/80 hover:bg-red-600"><Trash2 size={13} /></button>
                  : <span className="absolute inset-x-1.5 bottom-1.5 rounded bg-black/60 px-1.5 py-0.5 text-center text-[10px] text-white/80">arte do tema</span>}
              </div>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={async (e) => { const f = e.target.files?.[0]; if (f) up('backgroundImage', await readAsDataUrl(f)); e.target.value = ''; }}
                className="mt-2 w-full text-xs text-white/60" />
              <p className="mt-1 text-[11px] text-white/40">Vertical (ex.: 1080×1920) fica melhor: no celular ocupa a tela toda. Sem foto, usa a arte do tema.</p>
            </div>
            <div ref={heroPaste.ref} className="rounded-xl border border-white/10 bg-[#0f1117] p-3">
              <div className="mb-2 flex items-center gap-2"><ImageIcon size={15} className="text-white/60" /><p className="text-sm font-semibold text-white">Imagem da capa (opcional)</p></div>
              <div className="relative mx-auto flex aspect-square max-w-[200px] items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#1c2236]">
                {editing.heroImage
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={editing.heroImage} alt="" className="h-full w-full object-cover" />
                  : <span className="px-3 text-center text-xs text-white/40">Sem imagem: usa a foto do produto da capa</span>}
                {editing.heroImage && <button type="button" onClick={() => up('heroImage', '')} className="absolute right-1.5 top-1.5 rounded-lg bg-black/60 p-1.5 text-white/80 hover:bg-red-600"><Trash2 size={13} /></button>}
              </div>
              <input type="file" accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={async (e) => { const f = e.target.files?.[0]; if (f) up('heroImage', await readAsDataUrl(f)); e.target.value = ''; }}
                className="mt-2 w-full text-xs text-white/60" />
              <p className="mt-1 text-[11px] text-white/40">Cole com Ctrl+V passando o mouse por cima, ou escolha o arquivo.</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div><label className={labelCls}>Chamada da capa</label><input value={editing.coverTagline} onChange={(e) => up('coverTagline', e.target.value)} className={inputCls} /></div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#0f1117] p-3">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-white"><Star size={14} className="text-yellow-400" /> Produto da capa (o que brilha)</p>
              {editingSlug ? (
                storeProducts.length > 0 ? (
                  <>
                    <select value={editing.coverProductId ?? ''} onChange={(e) => up('coverProductId', e.target.value ? Number(e.target.value) : null)} className={`${inputCls} [color-scheme:dark]`}>
                      <option value="">Automático (primeiro produto da loja)</option>
                      {storeProducts.map((p) => <option key={p.id} value={p.id}>{p.name} · €{Number(p.price).toFixed(2)}</option>)}
                    </select>
                    <p className="mt-2 text-[11px] text-white/45">Esta loja tem {storeProducts.length} produto(s). A capa é a peça em destaque com os LEDs passando.</p>
                  </>
                ) : (
                  <p className="text-[11px] leading-relaxed text-white/50">Esta loja ainda não tem produtos. No seletor do topo, escolha <strong className="text-white/80">{editing.title}</strong> e cadastre os produtos na aba <strong className="text-white/80">Produtos</strong> — eles aparecem aqui automaticamente.</p>
                )
              ) : (
                <p className="text-[11px] leading-relaxed text-white/50">Salve a loja primeiro. Depois, no seletor do topo, escolha esta loja e cadastre os produtos na aba <strong className="text-white/80">Produtos</strong>.</p>
              )}
            </div>
          </div>
        </div>

        {/* Publicar: em rascunho só o admin vê; cliente e Instagram recebem "página não encontrada" */}
        {editing.originalSlug && (editing.enabled ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-4">
            <p className="text-sm text-green-200"><strong className="text-green-100">Loja publicada.</strong> Qualquer pessoa vê em {storePath(editing.originalSlug)} — pode colocar o link no Instagram.</p>
            <button type="button" onClick={() => save({ enabled: false })} disabled={saving}
              className="rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/5 disabled:opacity-60">
              Voltar para rascunho
            </button>
          </div>
        ) : (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/40 bg-amber-400/10 p-4">
            <p className="text-sm text-amber-100"><strong className="text-amber-50">Loja em rascunho:</strong> só você (logado no painel) vê. Clientes e o Instagram recebem “página não encontrada” (404).</p>
            <button type="button" onClick={() => save({ enabled: true })} disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-black hover:bg-amber-300 disabled:opacity-60">
              {saving ? <Loader2 size={15} className="animate-spin" /> : null} Publicar loja
            </button>
          </div>
        ))}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" onClick={() => save()} disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Salvar loja
          </button>
          {editing.originalSlug && (
            <a href={storePath(editing.originalSlug)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2.5 text-xs text-white/70 hover:bg-white/5"><ExternalLink size={13} /> Ver página de vendas</a>
          )}
          {msg && <span className={`text-xs ${msg.ok ? 'text-green-300' : 'text-red-300'}`}>{msg.text}</span>}
        </div>
      </div>
    );
  }

  // ---------- Lista ----------
  return (
    <div className="rounded-2xl border border-white/10 bg-[#161b28] p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-white"><Sparkles size={16} className="text-pink-400" /> Lojas</h2>
          <p className="mt-0.5 text-xs text-white/50">Outras lojas com nome, cara e catálogo próprios (ex.: VICE CITY STORE). Mesmo login e mesmo checkout. Depois de criar, escolha a loja no seletor do topo para cadastrar os produtos dela.</p>
        </div>
        <button type="button" onClick={() => setEditing({ ...EMPTY })}
          className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-pink-700">
          <Plus size={14} /> Nova loja
        </button>
      </div>

      {msg && <p className={`mb-3 text-xs ${msg.ok ? 'text-green-300' : 'text-red-300'}`}>{msg.text}</p>}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-white/60"><Loader2 size={16} className="animate-spin" /> Carregando…</div>
      ) : pages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-white/50">Nenhuma loja extra ainda. Crie a primeira — a VICE CITY STORE já vem pronta de exemplo.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {pages.map((p) => (
            <div key={p.slug} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-[#0f1117] p-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-black" style={{ background: `linear-gradient(135deg, ${p.neonSecondary}, ${p.neonPrimary})` }}>
                <Rocket size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-white">{p.title}</p>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.enabled ? 'bg-green-500/15 text-green-300' : 'bg-white/10 text-white/50'}`}>{p.enabled ? 'Publicada' : 'Rascunho'}</span>
                </div>
                <p className="truncate text-xs text-white/45">{storePath(p.slug)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <a href={storePath(p.slug)} target="_blank" rel="noopener noreferrer" title="Ver página de vendas" className="rounded-lg p-2 text-white/60 hover:bg-white/5 hover:text-white"><ExternalLink size={15} /></a>
                <button type="button" onClick={() => copyLink(p.slug)} title="Copiar link (Instagram)" className="rounded-lg p-2 text-white/60 hover:bg-white/5 hover:text-white"><Copy size={15} /></button>
                <button type="button" onClick={() => setEditing({ ...p, originalSlug: p.slug })} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/5">Editar</button>
                {onManage && (
                  <button type="button" onClick={() => onManage(p.slug)} title="Trocar o painel para esta loja (produtos, pedidos, dashboard)"
                    className="inline-flex items-center gap-1 rounded-lg bg-pink-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-pink-700"><Settings2 size={13} /> Gerenciar</button>
                )}
                <button type="button" onClick={() => remove(p.slug)} title="Apagar" className="rounded-lg p-2 text-white/40 hover:bg-red-500/15 hover:text-red-300"><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
