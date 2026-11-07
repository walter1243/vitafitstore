'use client';
// Editor visual da loja (Admin → Editar loja): a loja de verdade num iframe (/preview?edit=1)
// ao lado de um painel. Clicar numa parte da loja abre os ajustes dela; cada mudança aparece
// na hora na cópia da loja e só vai ao ar ao clicar em "Publicar".
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, BadgePercent, Check, CircleDot, Images, Loader2, Megaphone, Monitor, MousePointerClick,
  PanelBottom, RotateCcw, Rows3, Smartphone, Undo2, UploadCloud, Hand,
} from 'lucide-react';
import { DEFAULT_SITE_CONTENT, SITE_CONTENT_SECTIONS, type SiteContent } from '@/lib/site-content-defaults';
import { BannerForm, CategoriasForm, PromoForm, RodapeForm, SecoesForm, TopbarForm, type SectorLite } from './content/VitrineForms';

export type EditableKey = 'topbar' | 'banner' | 'categorias' | 'secoes' | 'promo' | 'rodape';

export const SECTION_META: Record<EditableKey, { label: string; desc: string; icon: typeof Images }> = {
  topbar: { label: 'Faixa do topo', desc: 'A linha fina acima do cabeçalho ("Envío gratis…").', icon: Megaphone },
  banner: { label: 'Banner principal', desc: 'Os slides grandes do topo: texto, botão, foto e cores.', icon: Images },
  categorias: { label: 'Stories / categorias', desc: 'As bolinhas com foto embaixo do banner: ordem, nome, foto.', icon: CircleDot },
  secoes: { label: 'Seções de produtos', desc: 'Ordem, títulos e frases de cada seção (Infantil, Hogar, Navidad…).', icon: Rows3 },
  promo: { label: 'Banner promocional', desc: 'O banner "Con su nombre" no meio da home.', icon: BadgePercent },
  rodape: { label: 'Rodapé', desc: 'Marca, colunas de links, segurança, envio e direitos autorais.', icon: PanelBottom },
};
const SECTION_ORDER: EditableKey[] = ['topbar', 'banner', 'categorias', 'secoes', 'promo', 'rodape'];
const DRAFT_STORAGE_KEY = 'vitafit-admin-site-content-draft';

// Rascunhos antigos com imagem embutida (data:) estouram o limite do servidor ao publicar.
function findOversizedDataUrl(value: unknown, path = ''): string | null {
  if (typeof value === 'string') return value.startsWith('data:') && value.length > 200_000 ? path || '(campo)' : null;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) { const hit = findOversizedDataUrl(value[i], `${path}[${i}]`); if (hit) return hit; }
    return null;
  }
  if (value && typeof value === 'object') {
    for (const [key, v] of Object.entries(value)) { const hit = findOversizedDataUrl(v, path ? `${path}.${key}` : key); if (hit) return hit; }
  }
  return null;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function ContentEditor() {
  const [published, setPublished] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [content, setContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [loading, setLoading] = useState(true);
  const [restoredDraft, setRestoredDraft] = useState(false);
  const [selected, setSelected] = useState<EditableKey | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [publishedJustNow, setPublishedJustNow] = useState(false);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [mode, setMode] = useState<'edit' | 'browse'>('edit');
  const [sectors, setSectors] = useState<SectorLite[]>([]);
  const [frameReady, setFrameReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const dirty = !same(content, published);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/site-content', { cache: 'no-store' });
        const data = res.ok ? await res.json() : DEFAULT_SITE_CONTENT;
        setPublished(data);
        const saved = typeof window !== 'undefined' ? window.localStorage.getItem(DRAFT_STORAGE_KEY) : null;
        if (saved) {
          try { setContent({ ...data, ...JSON.parse(saved) }); setRestoredDraft(true); } catch { setContent(data); }
        } else setContent(data);
      } catch { /* fica o padrão */ } finally { setLoading(false); }
    })();
    fetch('/api/sectors?all=1', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => { if (Array.isArray(d)) setSectors(d.filter((s: any) => s?.enabled !== false).map((s: any) => ({ slug: s.slug, name: s.name, tagline: s.tagline ?? '', imageUrl: s.imageUrl ?? '' }))); })
      .catch(() => {});
  }, []);

  // guarda o rascunho no navegador para não perder ao recarregar
  useEffect(() => {
    if (loading) return;
    if (dirty) window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(content));
    else window.localStorage.removeItem(DRAFT_STORAGE_KEY);
  }, [content, dirty, loading]);

  // ---------------------------------------------------------- conversa com a cópia da loja
  const post = useCallback((msg: unknown) => { iframeRef.current?.contentWindow?.postMessage(msg, window.location.origin); }, []);
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === 'STORE_PREVIEW_READY') setFrameReady(true);
      if (e.data?.type === 'STORE_PREVIEW_PICK' && SECTION_ORDER.includes(e.data.key)) setSelected(e.data.key);
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);
  // cada mudança vai para a cópia da loja (com um pequeno atraso para não travar ao digitar)
  useEffect(() => {
    if (!frameReady) return;
    const t = setTimeout(() => post({ type: 'STORE_PREVIEW_CONTENT', content }), 120);
    return () => clearTimeout(t);
  }, [content, frameReady, post]);
  useEffect(() => { if (frameReady) post({ type: 'STORE_PREVIEW_MODE', mode }); }, [mode, frameReady, post]);
  useEffect(() => { if (frameReady) post({ type: 'STORE_PREVIEW_SELECT', key: selected }); }, [selected, frameReady, post]);

  function setSection<K extends EditableKey>(key: K, data: SiteContent[K]) {
    setContent((prev) => ({ ...prev, [key]: data }));
  }

  async function handlePublish() {
    setPublishing(true);
    setPublishError('');
    try {
      for (const section of SITE_CONTENT_SECTIONS) {
        const label = SECTION_META[section as EditableKey]?.label ?? section;
        const bad = findOversizedDataUrl(content[section]);
        if (bad) throw new Error(`"${label}" tem um arquivo antigo em formato pesado (${bad}). Reenvie a imagem pelo campo de mídia e publique de novo.`);
        if (same(content[section], published[section])) continue;
        const res = await fetch('/api/site-content', {
          method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ section, data: content[section] }),
        });
        if (!res.ok) {
          const raw = await res.text().catch(() => '');
          let message = '';
          try { message = JSON.parse(raw)?.error ?? ''; } catch { /* não é JSON */ }
          throw new Error(message || `Não foi possível publicar "${label}" (HTTP ${res.status}).`);
        }
      }
      setPublished(content);
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      setRestoredDraft(false);
      setPublishedJustNow(true);
      setTimeout(() => setPublishedJustNow(false), 4000);
    } catch (err: any) {
      setPublishError(err?.message || 'Erro de conexão ao publicar.');
    } finally {
      setPublishing(false);
    }
  }

  const sectionDirty = (k: EditableKey) => !same(content[k], published[k]);
  const meta = selected ? SECTION_META[selected] : null;
  const btn = 'inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <div
      className="overflow-hidden rounded-2xl border border-white/10 bg-[#11151f]"
      // as caixas de texto ficam dentro do formulário da loja: Enter não pode salvar a loja inteira
      onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') e.preventDefault(); }}
    >
      {/* barra do editor */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#161b28] px-4 py-3">
        <div className="min-w-0">
          <h2 className="font-semibold text-white">Editor visual da loja</h2>
          <p className="text-xs text-white/45">Clique em qualquer parte da loja para editar. Só vai ao ar quando você publicar.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-white/10 p-0.5" role="group" aria-label="Modo">
            <button type="button" onClick={() => setMode('edit')} className={`${btn} ${mode === 'edit' ? 'bg-green-500/20 text-green-300' : 'text-white/60 hover:text-white'}`} title="Clicar numa parte da loja abre a edição"><MousePointerClick size={14} /> Editar</button>
            <button type="button" onClick={() => setMode('browse')} className={`${btn} ${mode === 'browse' ? 'bg-green-500/20 text-green-300' : 'text-white/60 hover:text-white'}`} title="Usar a loja normalmente (filtros, slides…)"><Hand size={14} /> Navegar</button>
          </div>
          <div className="flex rounded-lg border border-white/10 p-0.5" role="group" aria-label="Tamanho da tela">
            <button type="button" onClick={() => setDevice('desktop')} aria-label="Computador" className={`${btn} px-2 ${device === 'desktop' ? 'bg-green-500/20 text-green-300' : 'text-white/60 hover:text-white'}`}><Monitor size={15} /></button>
            <button type="button" onClick={() => setDevice('mobile')} aria-label="Celular" className={`${btn} px-2 ${device === 'mobile' ? 'bg-green-500/20 text-green-300' : 'text-white/60 hover:text-white'}`}><Smartphone size={15} /></button>
          </div>
          <button type="button" onClick={() => { setContent(published); setRestoredDraft(false); }} disabled={!dirty || publishing} className={`${btn} border border-white/10 text-white/70 hover:bg-white/5`}>
            <Undo2 size={14} /> Descartar
          </button>
          <button type="button" onClick={handlePublish} disabled={!dirty || publishing} className={`${btn} bg-green-600 text-white hover:bg-green-500`}>
            {publishing ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />} Publicar{dirty ? ' alterações' : ''}
          </button>
        </div>
      </div>

      {(dirty || publishedJustNow || publishError) && (
        <div className={`border-b px-4 py-2 text-xs font-medium ${publishError ? 'border-red-500/30 bg-red-500/10 text-red-300' : publishedJustNow ? 'border-green-500/30 bg-green-500/10 text-green-300' : 'border-amber-500/30 bg-amber-500/10 text-amber-300'}`}>
          {publishError || (publishedJustNow ? '✓ Publicado. Já está no ar (recarregue a loja para ver).' : restoredDraft ? 'Rascunho não publicado recuperado. Publique para colocar no ar ou descarte.' : 'Alterações ainda não publicadas: o cliente só vê depois de "Publicar alterações".')}
        </div>
      )}

      <div className="grid lg:grid-cols-[380px_minmax(0,1fr)]">
        {/* painel lateral */}
        <aside className="flex max-h-[calc(100vh-170px)] min-h-[520px] flex-col border-b border-white/10 lg:border-b-0 lg:border-r">
          {!selected || !meta ? (
            <div className="flex-1 overflow-y-auto p-3">
              <p className="mb-3 rounded-lg bg-white/[0.04] px-3 py-2 text-[12px] text-white/55">
                Passe o mouse na loja ao lado: cada parte fica marcada. <b className="text-white/80">Clique</b> para editar, ou escolha aqui:
              </p>
              {SECTION_ORDER.map((k) => {
                const m = SECTION_META[k];
                const Icon = m.icon;
                return (
                  <button key={k} type="button" onClick={() => setSelected(k)}
                    className="mb-2 flex w-full cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-[#1c2236]/70 p-3 text-left transition-colors hover:border-green-500/40 hover:bg-green-500/5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5"><Icon size={16} className="text-green-400" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-sm font-semibold text-white">{m.label}{sectionDirty(k) && <span className="h-2 w-2 rounded-full bg-amber-400" title="Alterado, não publicado" />}</span>
                      <span className="block text-[11px] text-white/45">{m.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
                <button type="button" onClick={() => setSelected(null)} className={`${btn} px-2 text-white/70 hover:bg-white/5`} aria-label="Voltar à lista"><ArrowLeft size={16} /></button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{meta.label}</p>
                  <p className="truncate text-[11px] text-white/40">{meta.desc}</p>
                </div>
                <button type="button" title="Voltar ao padrão desta parte" onClick={() => setSection(selected, DEFAULT_SITE_CONTENT[selected] as any)} className={`${btn} px-2 text-white/50 hover:bg-white/5 hover:text-white`}><RotateCcw size={14} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {loading ? <p className="flex items-center gap-2 text-xs text-white/60"><Loader2 size={14} className="animate-spin" /> Carregando…</p> : (
                  <>
                    {selected === 'topbar' && <TopbarForm data={content.topbar} onChange={(d) => setSection('topbar', d)} />}
                    {selected === 'banner' && <BannerForm data={content.banner} onChange={(d) => setSection('banner', d)} sectors={sectors} />}
                    {selected === 'categorias' && <CategoriasForm data={content.categorias} onChange={(d) => setSection('categorias', d)} sectors={sectors} />}
                    {selected === 'secoes' && <SecoesForm data={content.secoes} onChange={(d) => setSection('secoes', d)} sectors={sectors} />}
                    {selected === 'promo' && <PromoForm data={content.promo} onChange={(d) => setSection('promo', d)} sectionsCount={sectors.length} />}
                    {selected === 'rodape' && <RodapeForm data={content.rodape} onChange={(d) => setSection('rodape', d)} />}
                  </>
                )}
              </div>
              <div className="border-t border-white/10 px-3 py-2 text-[11px] text-white/40">
                <Check size={12} className="mr-1 inline text-green-400" />As mudanças aparecem na loja ao lado na hora.
              </div>
            </>
          )}
        </aside>

        {/* cópia da loja */}
        <div className="relative flex min-h-[520px] justify-center bg-[repeating-conic-gradient(#0d1017_0%_25%,#11151f_0%_50%)] bg-[length:24px_24px] p-3">
          {!frameReady && <div className="absolute inset-0 flex items-center justify-center gap-2 text-xs text-white/50"><Loader2 size={14} className="animate-spin" /> Abrindo a loja…</div>}
          <iframe
            ref={iframeRef}
            src="/preview?edit=1"
            title="Cópia da loja para edição"
            className={`h-[calc(100vh-200px)] min-h-[500px] rounded-xl border border-white/10 bg-white shadow-2xl transition-all duration-300 ${device === 'mobile' ? 'w-[390px]' : 'w-full'}`}
          />
        </div>
      </div>
    </div>
  );
}
