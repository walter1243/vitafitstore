'use client';
import { useEffect, useRef, useState } from 'react';
import { Pencil, X, Check, Loader2, Snowflake, Video, Sparkles, Mail, PanelBottom, Users, Eye, UploadCloud, Smartphone, Monitor } from 'lucide-react';
import {
  DEFAULT_SITE_CONTENT,
  SITE_CONTENT_SECTIONS,
  type SiteContent,
} from '@/lib/site-content-defaults';
import { HeroForm } from './content/HeroForm';
import { DestaquesForm } from './content/DestaquesForm';
import { TrustBadgesForm } from './content/TrustBadgesForm';
import { AboutForm } from './content/AboutForm';
import { NewsletterForm } from './content/NewsletterForm';
import { FooterForm } from './content/FooterForm';

type SectionKey = keyof SiteContent;

const SECTION_META: Record<SectionKey, { label: string; desc: string; icon: typeof Video }> = {
  hero: { label: 'Hero principal', desc: 'Vídeo, título, subtítulo e botão de ação da vitrine.', icon: Video },
  destaques: { label: 'Destacados', desc: 'Os 4 cards de diferenciais logo abaixo dos produtos.', icon: Sparkles },
  trustBadges: { label: 'Selos de confiança', desc: 'Faixa de selos (envio, garantia, pagamento...).', icon: PanelBottom },
  about: { label: 'Sobre a loja', desc: 'Seção "Nosotros": textos, diferenciais e cartão visual.', icon: Users },
  newsletter: { label: 'Newsletter', desc: 'Título, texto e aviso da seção de inscrição por e-mail.', icon: Mail },
  footer: { label: 'Rodapé', desc: 'Descrição da marca, colunas e nota de direitos autorais.', icon: PanelBottom },
};

const SECTION_ORDER: SectionKey[] = ['hero', 'destaques', 'trustBadges', 'about', 'newsletter', 'footer'];
const DRAFT_STORAGE_KEY = 'vitafit-admin-site-content-draft';

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
            setContent(JSON.parse(savedDraft));
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
        const res = await fetch('/api/site-content', {
          method: 'POST',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ section, data: content[section] }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err?.error || `Não foi possível publicar "${SECTION_META[section].label}".`);
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
            {editingSection === 'destaques' && (
              <DestaquesForm data={draft as SiteContent['destaques']} onChange={(d) => setDraft(d)} />
            )}
            {editingSection === 'trustBadges' && (
              <TrustBadgesForm data={draft as SiteContent['trustBadges']} onChange={(d) => setDraft(d)} />
            )}
            {editingSection === 'about' && (
              <AboutForm data={draft as SiteContent['about']} onChange={(d) => setDraft(d)} />
            )}
            {editingSection === 'newsletter' && (
              <NewsletterForm data={draft as SiteContent['newsletter']} onChange={(d) => setDraft(d)} />
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
