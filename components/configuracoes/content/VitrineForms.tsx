'use client';
// Formulários do Admin → Editar loja para o modelo atual da vitrine
// (faixa do topo, banner, categorias, seções de produtos, banner promocional e rodapé).
// Campo vazio = automático (nome/descrição do setor, foto do primeiro produto).
import { useEffect, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ChevronsUp, Plus, Trash2, Wand2 } from 'lucide-react';
import { Field, inputCls, textareaCls, MediaUploadField } from './shared';
import {
  SLIDE_COLORS,
  type BannerContent,
  type Branding,
  type CabecalhoContent,
  type CategoriasContent,
  type FooterLinkItem,
  type HomeSlide,
  type PromoContent,
  type RodapeContent,
  type SecoesContent,
  type TopbarContent,
} from '@/lib/site-content-defaults';

export type SectorLite = { slug: string; name: string; tagline: string; imageUrl?: string };

// ------------------------------------------------------------------ peças comuns

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="mb-3 flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 cursor-pointer accent-green-500" />
      <span className="text-sm text-white/85">
        {label}
        {hint && <span className="block text-[11px] text-white/40">{hint}</span>}
      </span>
    </label>
  );
}

function Color({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 cursor-pointer rounded border border-white/10 bg-transparent" />
        <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} placeholder="#000000" />
      </div>
    </Field>
  );
}

function Txt({ label, hint, value, onChange, placeholder, area }: { label: string; hint?: string; value: string; onChange: (v: string) => void; placeholder?: string; area?: boolean }) {
  return (
    <Field label={label} hint={hint}>
      {area
        ? <textarea rows={2} className={textareaCls} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
        : <input className={inputCls} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />}
    </Field>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-5 border-t border-white/10 pt-4 first:border-t-0 first:pt-0">
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-green-300/80">{title}</h4>
      {children}
    </div>
  );
}

function ItemBar({ index, total, onMove, onRemove, children }: { index: number; total: number; onMove: (d: -1 | 1 | 'top') => void; onRemove?: () => void; children?: ReactNode }) {
  const btn = 'flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-white/10 text-white/60 transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30';
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="min-w-0 flex-1 text-sm font-semibold text-white">{children}</div>
      <div className="flex shrink-0 gap-1">
        {index > 0 && (
          <button type="button" className={`${btn} w-auto gap-1 px-2 text-[11px] font-semibold`} onClick={() => onMove('top')} title="Colocar em primeiro">
            <ChevronsUp size={14} /> 1º
          </button>
        )}
        <button type="button" className={btn} disabled={index === 0} onClick={() => onMove(-1)} aria-label="Subir"><ArrowUp size={14} /></button>
        <button type="button" className={btn} disabled={index === total - 1} onClick={() => onMove(1)} aria-label="Descer"><ArrowDown size={14} /></button>
        {onRemove && <button type="button" className={`${btn} hover:border-red-500/40 hover:text-red-300`} onClick={onRemove} aria-label="Remover"><Trash2 size={14} /></button>}
      </div>
    </div>
  );
}

function move<T>(list: T[], i: number, d: -1 | 1 | 'top'): T[] {
  if (d === 'top') return i <= 0 ? list : [list[i], ...list.slice(0, i), ...list.slice(i + 1)];
  const j = i + d;
  if (j < 0 || j >= list.length) return list;
  const out = list.slice();
  [out[i], out[j]] = [out[j], out[i]];
  return out;
}

function SectorSelect({ sectors, value, onChange, allowNone }: { sectors: SectorLite[]; value: string; onChange: (v: string) => void; allowNone?: boolean }) {
  return (
    <select className={`${inputCls} cursor-pointer`} value={value} onChange={(e) => onChange(e.target.value)}>
      {allowNone && <option value="">Nenhum</option>}
      {sectors.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
    </select>
  );
}

// Junta a lista salva com os setores atuais: mantém a ordem salva e põe os setores novos no fim.
function mergeRows<T extends { sector: string }>(sectors: SectorLite[], items: T[], blank: (s: SectorLite) => T): T[] {
  const slugs = sectors.map((s) => s.slug);
  const kept = items.filter((i) => slugs.includes(i.sector));
  for (const s of sectors) if (!kept.some((k) => k.sector === s.slug)) kept.push(blank(s));
  return kept;
}

// Rola até o item clicado na cópia da loja (story, seção ou slide) e destaca.
function useFocusItem(focus?: string) {
  useEffect(() => {
    if (!focus) return;
    const t = setTimeout(() => document.getElementById(`vf-${focus}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
    return () => clearTimeout(t);
  }, [focus]);
}
const focusCls = (on: boolean) => (on ? ' ring-2 ring-green-400/70' : '');

// ------------------------------------------------------------------ cabeçalho / logo

export function CabecalhoForm({ data, onChange, branding, onBranding }: { data: CabecalhoContent; onChange: (d: CabecalhoContent) => void; branding: Branding; onBranding: (b: Branding) => void }) {
  const set = (p: Partial<CabecalhoContent>) => onChange({ ...data, ...p });
  const setB = (p: Partial<Branding>) => onBranding({ ...branding, ...p });
  return (
    <div>
      <Group title="Logo">
        <Field label="Como o logo aparece">
          <div className="grid grid-cols-2 gap-2">
            {([['logo_direto', 'Só a imagem', 'o logo do jeito que ele é'], ['icone_nome', 'Ícone + nome', 'quadradinho colorido e o nome da loja']] as const).map(([id, t, d]) => (
              <button key={id} type="button" onClick={() => setB({ logoStyle: id })}
                className={`cursor-pointer rounded-lg border px-3 py-2.5 text-left transition-colors ${branding.logoStyle === id ? 'border-green-500/60 bg-green-500/10' : 'border-white/10 hover:border-white/25'}`}>
                <span className="block text-sm font-semibold text-white">{t}</span>
                <span className="block text-[11px] text-white/45">{d}</span>
              </button>
            ))}
          </div>
        </Field>
        {branding.logoStyle === 'logo_direto' ? (
          <>
            <MediaUploadField label="Logo da loja (cabeçalho e rodapé)" hint="PNG sem fundo fica melhor. Vazio = logo original da Kitoys." value={data.logoImage} onChange={(v) => set({ logoImage: v })} kind="image" />
            {data.logoImage && (
              <button type="button" onClick={() => set({ logoImage: '' })} className="-mt-2 mb-4 cursor-pointer text-[12px] font-semibold text-green-300 hover:underline">Voltar ao logo original da Kitoys</button>
            )}
          </>
        ) : (
          <MediaUploadField label="Ícone (quadradinho ao lado do nome)" hint="Vazio = carinha sorrindo na cor principal." value={branding.logoUrl} onChange={(v) => setB({ logoUrl: v })} kind="image" />
        )}
        {branding.logoStyle === 'logo_direto' && (
          <Field label={`Tamanho do logo: ${data.logoHeight}px no computador`} hint="No celular fica um pouco menor sozinho.">
            <input type="range" min={28} max={68} step={1} value={data.logoHeight} onChange={(e) => set({ logoHeight: +e.target.value })} className="w-full cursor-pointer accent-green-500" />
          </Field>
        )}
        <Txt label="Nome da loja" hint="Aparece no modo Ícone + nome, nas abas do navegador e nos e-mails." value={branding.storeName} onChange={(v) => setB({ storeName: v })} />
        <Color label="Cor principal (fundo do ícone)" value={branding.themeColor} onChange={(v) => setB({ themeColor: v })} />
      </Group>
      <Group title="Busca e menu">
        <Txt label="Texto dentro da busca" value={data.searchPlaceholder} onChange={(v) => set({ searchPlaceholder: v })} placeholder="Buscar juguetes, llaveros, jarrones…" />
        <div className="grid grid-cols-2 gap-3">
          <Txt label="Menu: início" hint="Vazio = &quot;Inicio&quot; (traduzido)" value={data.homeLabel} onChange={(v) => set({ homeLabel: v })} placeholder="Inicio" />
          <Txt label="Menu: coleções" hint="Vazio = &quot;Colecciones&quot;" value={data.collectionsLabel} onChange={(v) => set({ collectionsLabel: v })} placeholder="Colecciones" />
        </div>
      </Group>
    </div>
  );
}

// ------------------------------------------------------------------ faixa do topo

export function TopbarForm({ data, onChange }: { data: TopbarContent; onChange: (d: TopbarContent) => void }) {
  const set = (p: Partial<TopbarContent>) => onChange({ ...data, ...p });
  return (
    <div>
      <div className="mb-4 overflow-hidden rounded-lg border border-white/10">
        <div className="px-4 py-2 text-center text-[12px]" style={{ background: data.bg, color: data.color }}>{data.enabled ? data.text || '(vazio)' : '(faixa desligada)'}</div>
      </div>
      <Toggle label="Mostrar a faixa no topo do site" checked={data.enabled} onChange={(v) => set({ enabled: v })} />
      <Txt label="Texto" value={data.text} onChange={(v) => set({ text: v })} placeholder="Envío gratis en pedidos +50€ · España" />
      <Txt label="Link (opcional)" hint="Ao clicar na faixa. Ex.: /legal/envios" value={data.href} onChange={(v) => set({ href: v })} />
      <div className="grid grid-cols-2 gap-3">
        <Color label="Cor de fundo" value={data.bg} onChange={(v) => set({ bg: v })} />
        <Color label="Cor do texto" value={data.color} onChange={(v) => set({ color: v })} />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ banner (slides)

function SlidePreview({ s, sector }: { s: HomeSlide; sector?: SectorLite }) {
  const img = s.image;
  return (
    <div className="relative mb-3 flex h-28 items-center overflow-hidden rounded-lg" style={{ background: `linear-gradient(120deg,${s.bgFrom} 0%,${s.bgTo} 100%)` }}>
      <div className="relative z-10 w-3/5 pl-4">
        {s.eyebrow && <p className="text-[9px] font-bold uppercase tracking-widest text-[#7cc4ff]">{s.eyebrow}</p>}
        <p className="text-base font-extrabold uppercase leading-tight text-white">{s.title || sector?.name || 'Título'}</p>
        <p className="line-clamp-1 text-[10px] text-white/80">{s.subtitle || sector?.tagline}</p>
        {s.ctaText && <span className="mt-1.5 inline-block rounded-full bg-[#0071e3] px-2.5 py-0.5 text-[9px] font-bold uppercase text-white">{s.ctaText}</span>}
      </div>
      {img
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={img} alt="" className="absolute inset-y-0 right-0 h-full w-1/2 object-cover" />
        : <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-white/50">foto do 1º produto do setor</span>}
    </div>
  );
}

export function BannerForm({ data, onChange, sectors, focus }: { data: BannerContent; onChange: (d: BannerContent) => void; sectors: SectorLite[]; focus?: string }) {
  useFocusItem(focus);
  const set = (p: Partial<BannerContent>) => onChange({ ...data, ...p });
  const setSlide = (i: number, p: Partial<HomeSlide>) => set({ slides: data.slides.map((s, k) => (k === i ? { ...s, ...p } : s)) });
  const newSlide = (sector: SectorLite | undefined, k: number): HomeSlide => ({
    id: `s${Date.now().toString(36)}${k}`, enabled: true, sector: sector?.slug ?? '', eyebrow: k === 0 ? 'Novedades' : 'Colección',
    title: '', subtitle: '', ctaText: data.ctaText || 'Comprar ahora', ctaHref: '', image: '', bgFrom: SLIDE_COLORS[k % SLIDE_COLORS.length][0], bgTo: SLIDE_COLORS[k % SLIDE_COLORS.length][1],
  });
  return (
    <div>
      <Toggle label="Mostrar o banner no topo da home" checked={data.enabled} onChange={(v) => set({ enabled: v })} />
      <Field label="Como montar os slides">
        <div className="grid grid-cols-2 gap-2">
          {([['auto', 'Automático', 'um slide por setor, com a foto dos produtos'], ['custom', 'Personalizado', 'você escolhe cada slide, texto e foto']] as const).map(([id, t, d]) => (
            <button key={id} type="button" onClick={() => set({ mode: id, slides: id === 'custom' && !data.slides.length ? sectors.slice(0, 5).map((s, k) => newSlide(s, k)) : data.slides })}
              className={`cursor-pointer rounded-lg border px-3 py-2.5 text-left transition-colors ${data.mode === id ? 'border-green-500/60 bg-green-500/10' : 'border-white/10 hover:border-white/25'}`}>
              <span className="block text-sm font-semibold text-white">{t}</span>
              <span className="block text-[11px] text-white/45">{d}</span>
            </button>
          ))}
        </div>
      </Field>
      <Field label="Tempo de cada slide (segundos)" hint="0 = não passa sozinho">
        <input type="number" min={0} step={0.5} className={inputCls} value={data.autoplay} onChange={(e) => set({ autoplay: Math.max(0, parseFloat(e.target.value) || 0) })} />
      </Field>

      {data.mode === 'auto' ? (
        <Group title="Slides automáticos">
          <Txt label="Texto pequeno do 1º slide" hint="Vazio = &quot;Novedades&quot; (traduzido no seletor de idioma)" value={data.firstEyebrow} onChange={(v) => set({ firstEyebrow: v })} placeholder="Novedades" />
          <Txt label="Texto pequeno dos outros slides" hint="Vazio = &quot;Colección&quot;" value={data.eyebrow} onChange={(v) => set({ eyebrow: v })} placeholder="Colección" />
          <Txt label="Texto do botão" value={data.ctaText} onChange={(v) => set({ ctaText: v })} placeholder="Comprar ahora" />
          <Field label="Máximo de slides">
            <input type="number" min={1} max={10} className={inputCls} value={data.maxSlides} onChange={(e) => set({ maxSlides: Math.max(1, Math.min(10, parseInt(e.target.value) || 1)) })} />
          </Field>
          <Toggle label="Navidad primeiro" hint="Durante a temporada, o setor de Natal abre o banner." checked={data.christmasFirst} onChange={(v) => set({ christmasFirst: v })} />
          <p className="text-[11px] text-white/40">Título e frase de cada slide vêm do nome e da descrição do setor (Admin → Setores e coleções). Para escrever outro texto, use o modo Personalizado.</p>
        </Group>
      ) : (
        <Group title={`Slides (${data.slides.length})`}>
          {data.slides.map((s, i) => {
            const sec = sectors.find((x) => x.slug === s.sector);
            return (
              <div key={s.id} id={`vf-${s.id}`} className={`mb-4 scroll-mt-4 rounded-xl border p-3 ${s.enabled ? 'border-white/10 bg-white/[0.02]' : 'border-white/5 opacity-60'}${focusCls(focus === s.id)}`}>
                <ItemBar index={i} total={data.slides.length} onMove={(d) => set({ slides: move(data.slides, i, d) })} onRemove={() => set({ slides: data.slides.filter((_, k) => k !== i) })}>
                  Slide {i + 1}{sec ? ` · ${sec.name}` : ''}
                </ItemBar>
                <SlidePreview s={s} sector={sec} />
                <Toggle label="Mostrar este slide" checked={s.enabled} onChange={(v) => setSlide(i, { enabled: v })} />
                <Field label="Setor" hint="Dá o título, a frase e a foto automáticos, e o botão filtra os produtos dele.">
                  <SectorSelect sectors={sectors} value={s.sector} allowNone onChange={(v) => setSlide(i, { sector: v })} />
                </Field>
                <Txt label="Texto pequeno (acima do título)" value={s.eyebrow} onChange={(v) => setSlide(i, { eyebrow: v })} placeholder="Colección" />
                <Txt label="Título" hint="Vazio = nome do setor" value={s.title} onChange={(v) => setSlide(i, { title: v })} placeholder={sec?.name} />
                <Txt label="Frase" hint="Vazio = descrição do setor" value={s.subtitle} onChange={(v) => setSlide(i, { subtitle: v })} placeholder={sec?.tagline} area />
                <div className="grid grid-cols-2 gap-3">
                  <Txt label="Texto do botão" hint="Vazio = sem botão" value={s.ctaText} onChange={(v) => setSlide(i, { ctaText: v })} />
                  <Txt label="Link do botão" hint="Vazio = mostra os produtos do setor" value={s.ctaHref} onChange={(v) => setSlide(i, { ctaHref: v })} placeholder="/sector/hogar" />
                </div>
                <MediaUploadField label="Foto do slide" hint="Vazio = foto do primeiro produto do setor." value={s.image} onChange={(v) => setSlide(i, { image: v })} kind="image" />
                <div className="grid grid-cols-2 gap-3">
                  <Color label="Fundo (esquerda)" value={s.bgFrom} onChange={(v) => setSlide(i, { bgFrom: v })} />
                  <Color label="Fundo (direita)" value={s.bgTo} onChange={(v) => setSlide(i, { bgTo: v })} />
                </div>
              </div>
            );
          })}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => set({ slides: [...data.slides, newSlide(sectors[data.slides.length % Math.max(1, sectors.length)], data.slides.length)] })}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-green-500/30 px-3 py-2 text-xs font-semibold text-green-300 hover:bg-green-500/10">
              <Plus size={14} /> Adicionar slide
            </button>
            <button type="button" onClick={() => set({ slides: sectors.slice(0, 5).map((s, k) => newSlide(s, k)) })}
              className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/5">
              <Wand2 size={14} /> Refazer pelos setores
            </button>
          </div>
        </Group>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ categorias (bolinhas)

export function CategoriasForm({ data, onChange, sectors, focus }: { data: CategoriasContent; onChange: (d: CategoriasContent) => void; sectors: SectorLite[]; focus?: string }) {
  useFocusItem(focus);
  const set = (p: Partial<CategoriasContent>) => onChange({ ...data, ...p });
  const rows = mergeRows(sectors, data.items, (s) => ({ sector: s.slug, label: '', image: '', hidden: false }));
  const setRow = (i: number, p: Partial<CategoriasContent['items'][number]>) => set({ items: rows.map((r, k) => (k === i ? { ...r, ...p } : r)) });
  return (
    <div>
      <Toggle label="Mostrar as categorias (bolinhas) embaixo do banner" checked={data.enabled} onChange={(v) => set({ enabled: v })} />
      <Group title="Primeira bolinha">
        <Toggle label="Mostrar a bolinha &quot;Todo&quot;" checked={data.showAll} onChange={(v) => set({ showAll: v })} />
        {data.showAll && <Txt label="Nome" value={data.allLabel} onChange={(v) => set({ allLabel: v })} placeholder="Todo" />}
      </Group>
      <Group title="Setores (na ordem em que aparecem)">
        {rows.map((r, i) => {
          const sec = sectors.find((s) => s.slug === r.sector);
          return (
            <div key={r.sector} id={`vf-${r.sector}`} className={`mb-3 scroll-mt-4 rounded-xl border p-3 ${r.hidden ? 'border-white/5 opacity-60' : 'border-white/10 bg-white/[0.02]'}${focusCls(focus === r.sector)}`}>
              <ItemBar index={i} total={rows.length} onMove={(d) => set({ items: move(rows, i, d) })}>{sec?.name}</ItemBar>
              <Toggle label="Esconder esta categoria" checked={r.hidden} onChange={(v) => setRow(i, { hidden: v })} />
              {!r.hidden && (
                <>
                  <Txt label="Nome na bolinha" hint="Vazio = nome do setor" value={r.label} onChange={(v) => setRow(i, { label: v })} placeholder={sec?.name} />
                  <MediaUploadField label="Foto da bolinha" hint="Vazio = foto do primeiro produto do setor." value={r.image} onChange={(v) => setRow(i, { image: v })} kind="image" />
                </>
              )}
            </div>
          );
        })}
      </Group>
      <Group title="Última bolinha (personalizados)">
        <Toggle label="Mostrar a bolinha dos produtos com nome" hint="Só aparece se houver produto personalizável." checked={data.showPersonalized} onChange={(v) => set({ showPersonalized: v })} />
        {data.showPersonalized && (
          <>
            <Txt label="Nome" value={data.personalizedLabel} onChange={(v) => set({ personalizedLabel: v })} placeholder="Con nombre" />
            <MediaUploadField label="Foto" hint="Vazio = foto de um produto personalizável." value={data.personalizedImage} onChange={(v) => set({ personalizedImage: v })} kind="image" />
          </>
        )}
      </Group>
    </div>
  );
}

// ------------------------------------------------------------------ seções de produtos

export function SecoesForm({ data, onChange, sectors, focus }: { data: SecoesContent; onChange: (d: SecoesContent) => void; sectors: SectorLite[]; focus?: string }) {
  useFocusItem(focus);
  const set = (p: Partial<SecoesContent>) => onChange({ ...data, ...p });
  const rows = mergeRows(sectors, data.items, (s) => ({ sector: s.slug, title: '', tagline: '', hidden: false }));
  const setRow = (i: number, p: Partial<SecoesContent['items'][number]>) => set({ items: rows.map((r, k) => (k === i ? { ...r, ...p } : r)) });
  return (
    <div>
      <Group title="Aparência">
        <Field label="Como mostrar os produtos de cada seção">
          <div className="grid grid-cols-2 gap-2">
            {([['carousel', 'Carrossel', 'uma linha que arrasta para o lado'], ['grid', 'Grade', 'todos os produtos em linhas']] as const).map(([id, t, d]) => (
              <button key={id} type="button" onClick={() => set({ layout: id })}
                className={`cursor-pointer rounded-lg border px-3 py-2.5 text-left transition-colors ${data.layout === id ? 'border-green-500/60 bg-green-500/10' : 'border-white/10 hover:border-white/25'}`}>
                <span className="block text-sm font-semibold text-white">{t}</span>
                <span className="block text-[11px] text-white/45">{d}</span>
              </button>
            ))}
          </div>
        </Field>
        <Txt label="Texto do link de cada seção" value={data.viewAllText} onChange={(v) => set({ viewAllText: v })} placeholder="Ver todo" />
      </Group>
      <Group title="Seções (uma por setor, nesta ordem)">
        {rows.map((r, i) => {
          const sec = sectors.find((s) => s.slug === r.sector);
          return (
            <div key={r.sector} id={`vf-${r.sector}`} className={`mb-3 scroll-mt-4 rounded-xl border p-3 ${r.hidden ? 'border-white/5 opacity-60' : 'border-white/10 bg-white/[0.02]'}${focusCls(focus === r.sector)}`}>
              <ItemBar index={i} total={rows.length} onMove={(d) => set({ items: move(rows, i, d) })}>{sec?.name}</ItemBar>
              <Toggle label="Esconder esta seção na home" checked={r.hidden} onChange={(v) => setRow(i, { hidden: v })} />
              {!r.hidden && (
                <>
                  <Txt label="Título" hint="Vazio = nome do setor" value={r.title} onChange={(v) => setRow(i, { title: v })} placeholder={sec?.name} />
                  <Txt label="Frase embaixo do título" hint="Vazio = descrição do setor" value={r.tagline} onChange={(v) => setRow(i, { tagline: v })} placeholder={sec?.tagline} />
                </>
              )}
            </div>
          );
        })}
        <p className="text-[11px] text-white/40">Setor sem produto ativo não aparece na home.</p>
      </Group>
      <Group title="Produtos sem setor">
        <Toggle label="Mostrar no fim da home" checked={data.showMore} onChange={(v) => set({ showMore: v })} />
        {data.showMore && (
          <>
            <Txt label="Título" value={data.moreTitle} onChange={(v) => set({ moreTitle: v })} />
            <Txt label="Frase" value={data.moreTagline} onChange={(v) => set({ moreTagline: v })} />
          </>
        )}
      </Group>
      <Group title="Lista dos personalizados (ao tocar em &quot;Con nombre&quot;)">
        <Txt label="Título" value={data.personalizedTitle} onChange={(v) => set({ personalizedTitle: v })} />
        <Txt label="Frase" value={data.personalizedTagline} onChange={(v) => set({ personalizedTagline: v })} />
      </Group>
    </div>
  );
}

// ------------------------------------------------------------------ banner promocional ("Con su nombre")

export function PromoForm({ data, onChange, sectionsCount }: { data: PromoContent; onChange: (d: PromoContent) => void; sectionsCount: number }) {
  const set = (p: Partial<PromoContent>) => onChange({ ...data, ...p });
  return (
    <div>
      <div className="relative mb-4 flex h-28 items-center overflow-hidden rounded-lg" style={{ background: `linear-gradient(120deg,${data.bgFrom} 0%,${data.bgTo} 100%)` }}>
        <div className="relative z-10 w-3/5 pl-4">
          {data.eyebrow && <p className="text-[9px] font-bold uppercase tracking-widest text-[#7cc4ff]">{data.eyebrow}</p>}
          <p className="text-base font-extrabold uppercase leading-tight text-white">{data.title}</p>
          <p className="line-clamp-1 text-[10px] text-white/80">{data.text}</p>
          {data.ctaText && <span className="mt-1.5 inline-block rounded-full bg-white px-2.5 py-0.5 text-[9px] font-bold uppercase text-[#0071e3]">{data.ctaText}</span>}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {data.image && <img src={data.image} alt="" className="absolute inset-y-0 right-0 h-full w-1/2 object-cover" />}
      </div>
      <Toggle label="Mostrar o banner promocional no meio da home" checked={data.enabled} onChange={(v) => set({ enabled: v })} />
      <Txt label="Texto pequeno" value={data.eyebrow} onChange={(v) => set({ eyebrow: v })} placeholder="Hecho para ti" />
      <Txt label="Título" value={data.title} onChange={(v) => set({ title: v })} />
      <Txt label="Frase" value={data.text} onChange={(v) => set({ text: v })} area />
      <div className="grid grid-cols-2 gap-3">
        <Txt label="Texto do botão" hint="Vazio = sem botão" value={data.ctaText} onChange={(v) => set({ ctaText: v })} />
        <Txt label="Link do botão" hint="Vazio = mostra os produtos com nome" value={data.ctaHref} onChange={(v) => set({ ctaHref: v })} placeholder="/sector/llaveros" />
      </div>
      <MediaUploadField label="Foto" hint="Vazio = foto de um produto personalizável." value={data.image} onChange={(v) => set({ image: v })} kind="image" />
      <div className="grid grid-cols-2 gap-3">
        <Color label="Fundo (esquerda)" value={data.bgFrom} onChange={(v) => set({ bgFrom: v })} />
        <Color label="Fundo (direita)" value={data.bgTo} onChange={(v) => set({ bgTo: v })} />
      </div>
      <Field label="Posição" hint="Depois de qual seção de produtos o banner aparece.">
        <select className={`${inputCls} cursor-pointer`} value={data.afterSection} onChange={(e) => set({ afterSection: parseInt(e.target.value) || 1 })}>
          {Array.from({ length: Math.max(1, sectionsCount) }, (_, k) => <option key={k} value={k + 1}>Depois da {k + 1}ª seção</option>)}
        </select>
      </Field>
    </div>
  );
}

// ------------------------------------------------------------------ rodapé

function LinksEditor({ items, onChange }: { items: FooterLinkItem[]; onChange: (v: FooterLinkItem[]) => void }) {
  const setItem = (i: number, p: Partial<FooterLinkItem>) => onChange(items.map((it, k) => (k === i ? { ...it, ...p } : it)));
  return (
    <div>
      {items.map((it, i) => (
        <div key={i} className="mb-3 rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <ItemBar index={i} total={items.length} onMove={(d) => onChange(move(items, i, d))} onRemove={() => onChange(items.filter((_, k) => k !== i))}>{it.title || `Link ${i + 1}`}</ItemBar>
          <Txt label="Título" value={it.title} onChange={(v) => setItem(i, { title: v })} />
          <Txt label="Descrição" value={it.description} onChange={(v) => setItem(i, { description: v })} />
          <Txt label="Link" hint="/pagina, https://… ou as palavras whatsapp / email (abre o contato da loja)" value={it.href} onChange={(v) => setItem(i, { href: v })} />
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { title: '', description: '', href: '' }])}
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-green-500/30 px-3 py-2 text-xs font-semibold text-green-300 hover:bg-green-500/10">
        <Plus size={14} /> Adicionar link
      </button>
    </div>
  );
}

export function RodapeForm({ data, onChange }: { data: RodapeContent; onChange: (d: RodapeContent) => void }) {
  const set = (p: Partial<RodapeContent>) => onChange({ ...data, ...p });
  return (
    <div>
      <Group title="Marca">
        <Txt label="Texto ao lado do logo" value={data.brandText} onChange={(v) => set({ brandText: v })} area />
        <p className="text-[11px] text-white/40">WhatsApp, e-mail e Instagram vêm de &quot;Informações da Loja&quot;, mais abaixo nesta página.</p>
      </Group>
      <Group title="Coluna 1 · Produtos">
        <Txt label="Título" value={data.productsTitle} onChange={(v) => set({ productsTitle: v })} />
        <Txt label="Frase" value={data.productsSubtitle} onChange={(v) => set({ productsSubtitle: v })} />
        <Toggle label="Listar as coleções automaticamente" hint="Usa as coleções de Setores e coleções. Desligue para escrever os links." checked={data.productsAuto} onChange={(v) => set({ productsAuto: v })} />
        {!data.productsAuto && <LinksEditor items={data.products} onChange={(v) => set({ products: v })} />}
      </Group>
      <Group title="Coluna 2 · Ajuda">
        <Txt label="Título" value={data.helpTitle} onChange={(v) => set({ helpTitle: v })} />
        <Txt label="Frase" value={data.helpSubtitle} onChange={(v) => set({ helpSubtitle: v })} />
        <LinksEditor items={data.help} onChange={(v) => set({ help: v })} />
      </Group>
      <Group title="Coluna 3 · Legal">
        <Txt label="Título" value={data.legalTitle} onChange={(v) => set({ legalTitle: v })} />
        <Txt label="Frase" value={data.legalSubtitle} onChange={(v) => set({ legalSubtitle: v })} />
        <LinksEditor items={data.legal} onChange={(v) => set({ legal: v })} />
      </Group>
      <Group title="Faixa de baixo">
        <Txt label="Linha de pagamento seguro" hint="Vazio = esconde" value={data.securityLine} onChange={(v) => set({ securityLine: v })} />
        <Txt label="Linha de envio" hint="Vazio = esconde" value={data.shippingLine} onChange={(v) => set({ shippingLine: v })} />
        <Toggle label="Mostrar os logos de pagamento" hint="Só aparecem os métodos ativos no Stripe." checked={data.showPayments} onChange={(v) => set({ showPayments: v })} />
        <Txt label="Direitos autorais" hint="{ano} vira o ano atual" value={data.copyright} onChange={(v) => set({ copyright: v })} />
        <Txt label="Prazo de resposta" hint="Vazio = esconde" value={data.responseTime} onChange={(v) => set({ responseTime: v })} />
      </Group>
    </div>
  );
}
