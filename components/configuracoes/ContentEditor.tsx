'use client';
import { useEffect, useRef, useState } from 'react';
import { Pencil, X, Check, Loader2, Snowflake, Video, Sparkles, Mail, PanelBottom, Users, Eye, UploadCloud, Smartphone, Monitor } from 'lucide-react';
import {
  DEFAULT_SITE_CONTENT,
  SITE_CONTENT_SECTIONS,
  type SiteContent,
} from '@/lib/site-content-defaults';
import { HeroForm } from './content/HeroForm';
import { ProductsIntroForm } from './content/ProductsIntroForm';
import { DestaquesForm } from './content/DestaquesForm';
import { TrustBadgesForm } from './content/TrustBadgesForm';
import { AboutForm } from './content/AboutForm';
import { GiftBannerForm } from './content/GiftBannerForm';
import { FooterForm } from './content/FooterForm';
import { PagePosition } from './content/PagePosition';

type SectionKey = keyof SiteContent;

// desc says exactly where on the page this shows up — index feeds the
// PagePosition dots (see that file for the full landmark list) so each
// card also shows it visually, not just in words.
const SECTION_META: Record<SectionKey, { label: string; desc: string; icon: typeof Video; pageIndex: number }> = {
  hero: { label: 'Hero principal', desc: 'O vídeo/imagem grande do topo da loja, com título, subtítulo e botão.', icon: Video, pageIndex: 1 },
  productsIntro: { label: 'Texto dos produtos', desc: 'A frase pequena que aparece acima de "Productos", repetida em cada categoria.', icon: Sparkles, pageIndex: 3 },
  destaques: { label: 'Destacados', desc: 'Os 4 cards com ícone/selo que aparecem logo abaixo da lista de produtos.', icon: Sparkles, pageIndex: 4 },
  trustBadges: { label: 'Selos de confiança', desc: 'A faixa com 4 selos (envio, devolução, pagamento...) acima dos produtos.', icon: PanelBottom, pageIndex: 2 },
  about: { label: 'Sobre a loja', desc: 'Seção com o texto "Por que nos escolher", diferenciais e estatísticas, perto do fim da página.', icon: Users, pageIndex: 8 },
  giftBanner: { label: 'Banner de presente', desc: 'O banner grande com a foto da cesta, depois das categorias em destaque.', icon: Mail, pageIndex: 6 },
  footer: { label: 'Rodapé', desc: 'Descrição da marca, colunas e nota de direitos autorais, no final da página.', icon: PanelBottom, pageIndex: 9 },
};

const SECTION_ORDER: SectionKey[] = ['hero', 'trustBadges', 'productsIntro', 'destaques', 'giftBanner', 'about', 'footer'];
const DRAFT_STORAGE_KEY = 'vitafit-admin-site-content-draft';

// Drafts saved to localStorage before media fields switched from
// base64-inline to real uploaded URLs can still be carrying a giant
// "data:" string around. Publishing that blows past the server's request
// size limit and used to fail with an opaque error — this catches it up
// front with a message that actually says what to do.
function findOversizedDataUrl(value: unknown, path = ''): string | null {
  if (typeof value === 'string') {
    if (value.startsWith('data:') && value.length > 200_000) return path || '(campo)';
    return null;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const hit = findOversizedDataUrl(value[i], `${path}[${i}]`);
      if (hit) return hit;
    }
    return null;
  }
  if (value && typeof value === 'object') {
    for (const [key, v] of Object.entries(value)) {
      const hit = findOversizedDataUrl(v, path ? `${path}.${key}` : key);
      if (hit) return hit;
    }
  }
  return null;
}

export function ContentEditor() {
  const [published, setPublished] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [content, setContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [loading, setLoading] = useState(true);
  const [restoredDraft, setRestoredDraft] = useState(false);
  const [editingSection, setEditingSection] = useState<SectionKey | null>(null);
  const [draft, setDraft] = useState<SiteContent[SectionKey] | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [publishedJustNow, setPublishedJustNow] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const dirty = JSON.stringify(content) !== JSON.stringify(published);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/site-content', { cache: 'no-store' });
        const data = res.ok ? await res.json() : DEFAULT_SITE_CONTENT;
        setPublished(data);

        const savedDraft = typeof window !== 'undefined' ? window.localStorage.getItem(DRAFT_STORAGE_KEY) : null;
        if (savedDraft) {
          try {
            // A draft saved before a new content section existed (e.g.
            // "Texto dos produtos") won't have that key at all — publishing
            // it as-is sends `data: undefined` for that section and the API
            // rejects it with "Dados inválidos.". Layering the draft over
            // the freshly fetched published content fills in anything the
            // old draft is missing instead of leaving it undefined.
            setContent({ ...data, ...JSON.parse(savedDraft) });
            setRestoredDraft(true);
          } catch {
            setContent(data);
          }
        } else {
          setContent(data);
        }
      } catch {
        // keep defaults
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Persist in-progress edits locally so a refresh doesn't lose unpublished work.
  useEffect(() => {
    if (loading) return;
    if (dirty) {
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(content));
    } else {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }, [content, dirty, loading]);

  function openEditor(section: SectionKey) {
    setEditingSection(section);
    setDraft(content[section]);
  }

  function closeEditor() {
    setEditingSection(null);
    setDraft(null);
  }

  function applySectionDraft() {
    if (!editingSection || !draft) return;
    setContent((prev) => ({ ...prev, [editingSection]: draft }));
    closeEditor();
  }

  async function handlePublish() {
    setPublishing(true);
    setPublishError('');
    try {
      for (const section of SITE_CONTENT_SECTIONS) {
        const badField = findOversizedDataUrl(content[section]);
        if (badField) {
          throw new Error(
            `"${SECTION_META[section].label}" tem um arquivo antigo salvo em formato pesado (${badField}) de antes da correção de upload. ` +
            `Abra essa seção, reenvie a imagem/vídeo pelo campo de mídia e publique de novo.`
          );
        }

        const res = await fetch('/api/site-content', {
          method: 'POST',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ section, data: content[section] }),
        });
        if (!res.ok) {
          const raw = await res.text().catch(() => '');
          let message = '';
          try { message = JSON.parse(raw)?.error ?? ''; } catch { /* not JSON */ }
          throw new Error(
            message ||
            `Não foi possível publicar "${SECTION_META[section].label}" (HTTP ${res.status}${res.statusText ? ` ${res.statusText}` : ''}).` +
            (raw ? ` ${raw.slice(0, 200)}` : '')
          );
        }
      }
      setPublished(content);
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      setPublishedJustNow(true);
      setTimeout(() => setPublishedJustNow(false), 3000);
    } catch (err: any) {
      setPublishError(err?.message || 'Erro de conexão ao publicar.');
    } finally {
      setPublishing(false);
    }
  }

  function sendPreviewContent() {
    iframeRef.current?.contentWindow?.postMessage({ type: 'STORE_PREVIEW_CONTENT', content }, '*');
  }

  useEffect(() => {
    if (!previewOpen) return;
    function onMessage(e: MessageEvent) {
      if (e.data?.type === 'STORE_PREVIEW_READY') sendPreviewContent();
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewOpen, content]);

  return (
    <div className="rounded-2xl border border-green-500/15 glass-panel-admin p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-green-500/25 bg-green-500/10">
            <Snowflake size={16} className="text-green-400" />
          </span>
          <div>
            <h2 className="font-semibold text-white">Conteúdo da Vitrine</h2>
            <p className="text-xs text-white/45">
              Edite os textos e imagens da loja, veja como fica antes e publique quando estiver pronto.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => { setPreviewOpen(true); setTimeout(sendPreviewContent, 400); }}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-white/80 transition-colors hover:border-green-500/30 hover:bg-green-500/10"
          >
            <Eye size={14} /> Visualizar loja
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={!dirty || publishing}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {publishing ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
            Publicar{dirty ? ' alterações' : ''}
          </button>
        </div>
      </div>

      {(dirty || publishedJustNow || restoredDraft) && (
        <div className={`mb-4 rounded-xl border px-3 py-2 text-xs font-medium ${
          publishedJustNow
            ? 'border-green-500/30 bg-green-500/10 text-green-300'
            : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
        }`}>
          {publishedJustNow
            ? '✓ Alterações publicadas — já estão no ar.'
            : restoredDraft && dirty
              ? 'Rascunho não publicado recuperado. Clique em "Visualizar loja" para conferir ou "Publicar alterações" para colocar no ar.'
              : 'Você tem alterações não publicadas. O cliente só vê depois de clicar em "Publicar alterações".'}
        </div>
      )}

      {publishError && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{publishError}</p>
      )}

      {loading ? (
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60">
          <Loader2 size={14} className="animate-spin" /> Carregando conteúdo atual da loja...
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {SECTION_ORDER.map((key) => {
            const meta = SECTION_META[key];
            const Icon = meta.icon;
            const sectionDirty = JSON.stringify(content[key]) !== JSON.stringify(published[key]);
            return (
              <div key={key} className="rounded-2xl border border-white/10 bg-[#1c2236]/80 p-4 transition-colors hover:border-green-500/25">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                      <Icon size={16} className="text-green-400" />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{meta.label}</h3>
                      <p className="mt-0.5 text-xs text-white/45">{meta.desc}</p>
                      <PagePosition index={meta.pageIndex} />
                    </div>
                  </div>
                  {sectionDirty && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                      Não publicado
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => openEditor(key)}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 transition-colors hover:border-green-500/30 hover:bg-green-500/10"
                >
                  <Pencil size={12} /> Editar seção
                </button>
              </div>
            );
          })}
        </div>
      )}

      {editingSection && draft && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/70 p-4" onClick={closeEditor}>
          <div
            className="glass-panel-admin max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-green-500/30 bg-[#161b28] p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Editar: {SECTION_META[editingSection].label}</h3>
              <button type="button" onClick={closeEditor} className="rounded-lg border border-white/10 p-2 text-white/70 hover:bg-white/5">
                <X size={14} />
              </button>
            </div>

            {editingSection === 'hero' && (
              <HeroForm data={draft as SiteContent['hero']} onChange={(d) => setDraft(d)} />
            )}
            {editingSection === 'productsIntro' && (
              <ProductsIntroForm data={draft as SiteContent['productsIntro']} onChange={(d) => setDraft(d)} />
            )}
            {editingSection === 'destaques' && (
              <DestaquesForm data={draft as SiteContent['destaques']} onChange={(d) => setDraft(d)} />
            )}
            {editingSection === 'trustBadges' && (
              <TrustBadgesForm data={draft as SiteContent['trustBadges']} onChange={(d) => setDraft(d)} />
            )}
            {editingSection === 'about' && (
              <AboutForm data={draft as SiteContent['about']} onChange={(d) => setDraft(d)} />
            )}
            {editingSection === 'giftBanner' && (
              <GiftBannerForm data={draft as SiteContent['giftBanner']} onChange={(d) => setDraft(d)} />
            )}
            {editingSection === 'footer' && (
              <FooterForm data={draft as SiteContent['footer']} onChange={(d) => setDraft(d)} />
            )}

            <p className="mt-4 text-[11px] text-white/35">
              Isso só atualiza o rascunho. Depois use "Visualizar loja" pra conferir e "Publicar alterações" pra colocar no ar.
            </p>

            <div className="mt-3 flex justify-end gap-2">
              <button type="button" onClick={closeEditor} className="rounded-lg border border-white/10 px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/5">
                Cancelar
              </button>
              <button
                type="button"
                onClick={applySectionDraft}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700"
              >
                <Check size={12} /> Aplicar ao rascunho
              </button>
            </div>
          </div>
        </div>
      )}

      {previewOpen && (
        <div className="fixed inset-0 z-[260] flex flex-col bg-black/80 p-3 sm:p-6" onClick={() => setPreviewOpen(false)}>
          <div
            className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0f1117]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-2">
                <Eye size={14} className="text-green-400" />
                <span className="text-sm font-semibold text-white">Prévia da loja</span>
                {dirty && <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">com alterações não publicadas</span>}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-lg border border-white/10 p-1">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`rounded-md p-1.5 transition-colors ${previewDevice === 'desktop' ? 'bg-green-500/20 text-green-300' : 'text-white/50 hover:text-white'}`}
                    aria-label="Ver como desktop"
                  >
                    <Monitor size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`rounded-md p-1.5 transition-colors ${previewDevice === 'mobile' ? 'bg-green-500/20 text-green-300' : 'text-white/50 hover:text-white'}`}
                    aria-label="Ver como mobile"
                  >
                    <Smartphone size={14} />
                  </button>
                </div>
                <button type="button" onClick={() => setPreviewOpen(false)} className="rounded-lg border border-white/10 p-2 text-white/70 hover:bg-white/5">
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="flex flex-1 items-center justify-center overflow-auto bg-black/30 p-3">
              <iframe
                ref={iframeRef}
                src="/preview"
                onLoad={sendPreviewContent}
                className={`h-full rounded-xl border border-white/10 bg-white transition-all ${previewDevice === 'mobile' ? 'w-[390px]' : 'w-full'}`}
                title="Prévia da loja"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
