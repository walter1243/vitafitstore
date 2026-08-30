'use client';
import { useEffect, useState } from 'react';
import { Pencil, X, Check, Loader2, Snowflake, Video, Sparkles, Mail, PanelBottom, Users } from 'lucide-react';
import {
  DEFAULT_SITE_CONTENT,
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

export function ContentEditor() {
  const [content, setContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<SectionKey | null>(null);
  const [draft, setDraft] = useState<SiteContent[SectionKey] | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedSection, setSavedSection] = useState<SectionKey | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/site-content', { cache: 'no-store' });
        if (res.ok) setContent(await res.json());
      } catch {
        // keep defaults
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function openEditor(section: SectionKey) {
    setEditingSection(section);
    setDraft(content[section]);
    setError('');
  }

  function closeEditor() {
    setEditingSection(null);
    setDraft(null);
  }

  async function handleSave() {
    if (!editingSection || !draft) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/site-content', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: editingSection, data: draft }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Não foi possível salvar.');
      }
      setContent((prev) => ({ ...prev, [editingSection]: draft }));
      setSavedSection(editingSection);
      setTimeout(() => setSavedSection(null), 2500);
      closeEditor();
    } catch (err: any) {
      setError(err?.message || 'Erro de conexão ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-green-500/15 glass-frost p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-green-500/25 bg-green-500/10">
          <Snowflake size={16} className="text-green-400" />
        </span>
        <div>
          <h2 className="font-semibold text-white">Conteúdo da Vitrine</h2>
          <p className="text-xs text-white/45">Edite os textos e imagens que o cliente vê na loja — as mudanças aparecem assim que forem salvas.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/60">
          <Loader2 size={14} className="animate-spin" /> Carregando conteúdo atual da loja...
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {SECTION_ORDER.map((key) => {
            const meta = SECTION_META[key];
            const Icon = meta.icon;
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
                  {savedSection === key && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-green-500/30 bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-300">
                      <Check size={10} /> Salvo
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
            className="glass-frost max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-green-500/30 bg-[#161b28] p-5"
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

            {error && (
              <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={closeEditor} className="rounded-lg border border-white/10 px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/5">
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60"
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                Salvar seção
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
