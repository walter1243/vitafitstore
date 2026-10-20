'use client';
import { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, ExternalLink, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Field, inputCls, textareaCls, MediaUploadField } from '@/components/configuracoes/content/shared';
import { INTERACTIVE_OPTIONS, SECTOR_STYLES, slugify, type Interactive, type SectorStyle, type Sector, type SiteCollection, type Theme } from '@/lib/sectors-shared';

type CollectionDraft = Omit<SiteCollection, 'id' | 'position'> & { id?: number };
type SectorDraft = { id?: number; name: string; slug: string; tagline: string; style: SectorStyle; enabled: boolean };

const emptyCollection = (sectorId: number): CollectionDraft => ({
  sectorId,
  slug: '',
  name: '',
  shortName: '',
  tagline: '',
  description: '',
  imageUrl: '',
  photoUrl: '',
  theme: 'light',
  bgColor: '#F5F5F7',
  interactive: 'none',
  match: '',
  enabled: true,
});

async function post(body: Record<string, unknown>) {
  const res = await fetch('/api/sectors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Erro ao salvar.');
  return data as Sector[];
}

const btn = 'inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-semibold text-white/75 transition hover:bg-white/5 disabled:opacity-40';

// Admin → Setores e coleções: a vitrine e organizada em setores (Infantil,
// Decoración...) e cada setor tem colecoes; cada colecao vira uma faixa de
// tela cheia na home e na pagina do setor. Os produtos entram numa colecao
// pelas categorias escolhidas aqui.
export function AdminSectors() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sectorDraft, setSectorDraft] = useState<SectorDraft | null>(null);
  const [collectionDraft, setCollectionDraft] = useState<CollectionDraft | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/sectors?all=1', { cache: 'no-store' }).then((r) => r.json()),
      fetch('/api/categories', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([s, c]) => {
        if (Array.isArray(s)) setSectors(s);
        else setError(s?.error || 'Não foi possível carregar os setores.');
        if (Array.isArray(c)) setCategories(c.map((x: { name: string }) => x.name));
      })
      .catch(() => setError('Erro de conexão ao carregar os setores.'))
      .finally(() => setLoading(false));
  }, []);

  async function run(body: Record<string, unknown>, after?: () => void) {
    setBusy(true);
    setError('');
    try {
      setSectors(await post(body));
      after?.();
    } catch (e: any) {
      setError(e?.message || 'Erro ao salvar.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-400" /></div>;
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#161b28] p-5">
        <div>
          <h2 className="font-semibold text-white">Setores e coleções</h2>
          <p className="mt-1 text-xs text-white/50">
            Cada setor aparece no menu e tem a sua página. Cada coleção vira uma faixa de tela cheia na home, na ordem abaixo.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSectorDraft({ name: '', slug: '', tagline: '', style: 'infantil', enabled: true })}
          className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-500"
        >
          <Plus size={16} /> Novo setor
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}

      {sectors.map((s, si) => (
        <div key={s.id} className="rounded-2xl border border-white/10 bg-[#161b28] p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white">{s.name}</h3>
                {!s.enabled && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/60">oculto</span>}
              </div>
              <p className="text-xs text-white/50">{s.style === 'hogar' ? 'Visual: Casa / Hogar' : 'Visual: Infantil'}{s.tagline ? ` · ${s.tagline}` : ''}</p>
              <p className="mt-1 text-[11px] text-white/35">/sector/{s.slug}</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button className={btn} disabled={busy || si === 0} onClick={() => run({ action: 'moveSector', id: s.id, direction: 'up' })} aria-label="Subir setor"><ArrowUp size={14} /></button>
              <button className={btn} disabled={busy || si === sectors.length - 1} onClick={() => run({ action: 'moveSector', id: s.id, direction: 'down' })} aria-label="Descer setor"><ArrowDown size={14} /></button>
              <button className={btn} disabled={busy} onClick={() => run({ action: 'saveSector', ...s, enabled: !s.enabled })}>
                {s.enabled ? <><EyeOff size={14} /> Ocultar</> : <><Eye size={14} /> Mostrar</>}
              </button>
              <button className={btn} disabled={busy} onClick={() => setSectorDraft({ id: s.id, name: s.name, slug: s.slug, tagline: s.tagline, style: s.style, enabled: s.enabled })}><Pencil size={14} /> Editar</button>
              <button
                className={`${btn} hover:border-red-500/40 hover:text-red-300`}
                disabled={busy}
                onClick={() => {
                  if (window.confirm(`Excluir o setor "${s.name}" e todas as coleções dele? Os produtos não são apagados.`)) run({ action: 'deleteSector', id: s.id });
                }}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {s.collections.length === 0 && <p className="rounded-xl border border-dashed border-white/10 px-4 py-6 text-center text-xs text-white/40">Nenhuma coleção neste setor ainda.</p>}
            {s.collections.map((c, ci) => (
              <div key={c.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-[#1c2236] p-3">
                <div
                  className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10"
                  style={{ background: c.theme === 'dark' ? '#07080F' : c.bgColor }}
                >
                  {(c.photoUrl || c.imageUrl) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.theme === 'dark' && c.photoUrl ? c.photoUrl : c.imageUrl} alt="" className="h-full w-full object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {c.name} {!c.enabled && <span className="ml-1 text-[10px] font-semibold text-white/50">(oculta)</span>}
                  </p>
                  <p className="truncate text-[11px] text-white/45">
                    {c.theme === 'dark' ? 'Faixa escura' : 'Faixa clara'} · {INTERACTIVE_OPTIONS.find((o) => o.key === c.interactive)?.label.split(' (')[0]} · categorias: {c.match || '—'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button className={btn} disabled={busy || ci === 0} onClick={() => run({ action: 'moveCollection', id: c.id, direction: 'up' })} aria-label="Subir coleção"><ArrowUp size={14} /></button>
                  <button className={btn} disabled={busy || ci === s.collections.length - 1} onClick={() => run({ action: 'moveCollection', id: c.id, direction: 'down' })} aria-label="Descer coleção"><ArrowDown size={14} /></button>
                  <a className={btn} href={`/coleccion/${c.slug}`} target="_blank" rel="noreferrer" aria-label="Ver no site"><ExternalLink size={14} /></a>
                  <button className={btn} disabled={busy} onClick={() => setCollectionDraft({ ...c })}><Pencil size={14} /> Editar</button>
                  <button
                    className={`${btn} hover:border-red-500/40 hover:text-red-300`}
                    disabled={busy}
                    onClick={() => { if (window.confirm(`Excluir a coleção "${c.name}"? Os produtos não são apagados.`)) run({ action: 'deleteCollection', id: c.id }); }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setCollectionDraft(emptyCollection(s.id))}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-dashed border-white/15 px-4 py-2.5 text-sm font-semibold text-white/70 hover:border-green-500/40 hover:text-white"
          >
            <Plus size={16} /> Nova coleção em {s.name}
          </button>
        </div>
      ))}

      {sectorDraft && (
        <SectorForm
          draft={sectorDraft}
          busy={busy}
          onCancel={() => setSectorDraft(null)}
          onSave={(d) => run({ action: 'saveSector', ...d }, () => setSectorDraft(null))}
        />
      )}
      {collectionDraft && (
        <CollectionForm
          draft={collectionDraft}
          sectors={sectors}
          categories={categories}
          busy={busy}
          onCancel={() => setCollectionDraft(null)}
          onSave={(d) => run({ action: 'saveCollection', ...d }, () => setCollectionDraft(null))}
        />
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[260] flex items-end justify-center bg-black/70 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-2xl border border-white/10 bg-[#161b28] p-5 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-white/60 hover:bg-white/5 hover:text-white" aria-label="Fechar"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SectorForm({ draft, busy, onCancel, onSave }: { draft: SectorDraft; busy: boolean; onCancel: () => void; onSave: (d: SectorDraft) => void }) {
  const [d, setD] = useState(draft);
  return (
    <Modal title={d.id ? 'Editar setor' : 'Novo setor'} onClose={onCancel}>
      <Field label="Nome do setor *" hint="Aparece no menu do site. Ex: Infantil, Decoración, Regalos.">
        <input className={inputCls} value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} placeholder="Decoración" />
      </Field>
      <Field label="Frase do setor" hint="Uma linha que aparece embaixo do nome.">
        <input className={inputCls} value={d.tagline} onChange={(e) => setD({ ...d, tagline: e.target.value })} placeholder="Piezas impresas en 3D para tu casa" />
      </Field>
      <Field
        label="Visual do setor (aparência no site)"
        hint="Escolhe COMO esse setor aparece para o cliente: as cores, as letras e o estilo dos cards de produto. Todas as coleções e páginas desse setor seguem o visual escolhido. Os produtos e preços não mudam — só a aparência."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {SECTOR_STYLES.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => setD({ ...d, style: o.key })}
              aria-pressed={d.style === o.key}
              className={`rounded-xl border p-3 text-left transition ${d.style === o.key ? 'border-green-500/60 bg-green-500/10 text-white' : 'border-white/10 text-white/60 hover:bg-white/5'}`}
            >
              {/* mini previa do visual */}
              {o.key === 'infantil' ? (
                <span className="mb-2 flex h-14 items-center justify-center gap-1.5 rounded-lg bg-[#FFD84D]">
                  {['#BFE0FF', '#DCD2FF', '#FFD1E6'].map((c) => (
                    <span key={c} className="h-9 w-7 rounded-md border-2 border-[#1E1B4B] shadow-[2px_2px_0_#1E1B4B]" style={{ background: c }} />
                  ))}
                </span>
              ) : (
                <span className="mb-2 flex h-14 items-center justify-center gap-2 rounded-lg bg-[#f3ece2]">
                  <span className="font-script text-lg text-[#8a6a3a]">hogar</span>
                  {['#ece3d6', '#e2d6c4'].map((c) => (
                    <span key={c} className="h-10 w-7 rounded-md" style={{ background: c }} />
                  ))}
                </span>
              )}
              <span className="block text-sm font-semibold">{o.label}{d.style === o.key ? ' ✓' : ''}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-white/55">{o.hint}</span>
            </button>
          ))}
        </div>
      </Field>
      <Field label="Endereço da página" hint={`kitoys3d.com/sector/${slugify(d.slug || d.name) || '...'}`}>
        <input className={inputCls} value={d.slug} onChange={(e) => setD({ ...d, slug: e.target.value })} placeholder={slugify(d.name) || 'gerado do nome'} />
      </Field>
      <label className="mb-5 flex items-center gap-2 text-sm text-white/75">
        <input type="checkbox" checked={d.enabled} onChange={(e) => setD({ ...d, enabled: e.target.checked })} /> Mostrar no site
      </label>
      <FormActions busy={busy} disabled={!d.name.trim()} onCancel={onCancel} onSave={() => onSave(d)} />
    </Modal>
  );
}

function CollectionForm({ draft, sectors, categories, busy, onCancel, onSave }: {
  draft: CollectionDraft;
  sectors: Sector[];
  categories: string[];
  busy: boolean;
  onCancel: () => void;
  onSave: (d: CollectionDraft) => void;
}) {
  const [d, setD] = useState(draft);
  const set = <K extends keyof CollectionDraft>(k: K, v: CollectionDraft[K]) => setD((x) => ({ ...x, [k]: v }));
  const terms = useMemo(() => d.match.split(',').map((t) => t.trim()).filter(Boolean), [d.match]);
  const toggleCategory = (name: string) => {
    const has = terms.some((t) => slugify(t) === slugify(name));
    const next = has ? terms.filter((t) => slugify(t) !== slugify(name)) : [...terms, name];
    set('match', next.join(', '));
  };

  return (
    <Modal title={d.id ? 'Editar coleção' : 'Nova coleção'} onClose={onCancel}>
      <div className="grid gap-x-4 sm:grid-cols-2">
        <Field label="Setor *">
          <select className={inputCls} value={d.sectorId} onChange={(e) => set('sectorId', Number(e.target.value))}>
            {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="Nome da coleção *" hint="Título grande da faixa.">
          <input className={inputCls} value={d.name} onChange={(e) => set('name', e.target.value)} placeholder="Macetas 3D" />
        </Field>
        <Field label="Nome curto" hint="Usado nos botões. Ex: Macetas.">
          <input className={inputCls} value={d.shortName} onChange={(e) => set('shortName', e.target.value)} placeholder={d.name || 'Macetas'} />
        </Field>
        <Field label="Endereço da página" hint={`kitoys3d.com/coleccion/${slugify(d.slug || d.name) || '...'}`}>
          <input className={inputCls} value={d.slug} onChange={(e) => set('slug', e.target.value)} placeholder={slugify(d.name) || 'gerado do nome'} />
        </Field>
      </div>
      <Field label="Frase da faixa" hint="Uma linha embaixo do título.">
        <input className={inputCls} value={d.tagline} onChange={(e) => set('tagline', e.target.value)} placeholder="Verde en cada rincón" />
      </Field>
      <Field label="Descrição" hint="Usada no Google (SEO) e no compartilhamento.">
        <textarea rows={2} className={textareaCls} value={d.description} onChange={(e) => set('description', e.target.value)} />
      </Field>

      <div className="grid gap-x-4 sm:grid-cols-2">
        <Field label="Tema da faixa">
          <div className="grid grid-cols-2 gap-2">
            {(['light', 'dark'] as Theme[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set('theme', t)}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold ${d.theme === t ? 'border-green-500/60 bg-green-500/10 text-white' : 'border-white/10 text-white/60 hover:bg-white/5'}`}
              >
                {t === 'light' ? 'Clara' : 'Escura'}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Cor de fundo" hint={d.theme === 'light' ? 'Vira um degradê suave até quase branco.' : 'Fundo quando não houver foto.'}>
          <div className="grid grid-cols-[44px_1fr] gap-2">
            <input type="color" value={d.bgColor} onChange={(e) => set('bgColor', e.target.value.toUpperCase())} className="h-10 w-11 cursor-pointer rounded" />
            <input className={inputCls} value={d.bgColor} onChange={(e) => set('bgColor', e.target.value)} />
          </div>
        </Field>
      </div>

      <MediaUploadField
        label="Imagem principal"
        hint="Aparece inteira no meio da faixa (PNG sem fundo fica ótimo)."
        value={d.imageUrl}
        onChange={(url) => set('imageUrl', url)}
        kind="image"
      />
      {d.theme === 'dark' && (
        <MediaUploadField
          label="Foto de fundo (faixa escura)"
          hint="Foto de tela cheia atrás do título. Sem ela, usa a imagem principal sobre a cor de fundo."
          value={d.photoUrl}
          onChange={(url) => set('photoUrl', url)}
          kind="image"
        />
      )}

      <Field label="Brincadeira da faixa" hint="Botão interativo ao lado de “Ver”. Sem brincadeira, o segundo botão leva ao setor.">
        <select className={inputCls} value={d.interactive} onChange={(e) => set('interactive', e.target.value as Interactive)}>
          {INTERACTIVE_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
        </select>
      </Field>

      <Field label="Produtos desta coleção" hint="Entram os produtos cujas categorias contêm uma destas palavras. Toque nas categorias ou escreva palavras separadas por vírgula.">
        {categories.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {categories.map((name) => {
              const on = terms.some((t) => slugify(t) === slugify(name));
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggleCategory(name)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${on ? 'border-green-500/60 bg-green-500/15 text-green-200' : 'border-white/10 text-white/60 hover:bg-white/5'}`}
                >
                  {name}
                </button>
              );
            })}
          </div>
        )}
        <input className={inputCls} value={d.match} onChange={(e) => set('match', e.target.value)} placeholder="macetas, plantas" />
      </Field>

      <label className="mb-5 flex items-center gap-2 text-sm text-white/75">
        <input type="checkbox" checked={d.enabled} onChange={(e) => set('enabled', e.target.checked)} /> Mostrar no site
      </label>
      <FormActions busy={busy} disabled={!d.name.trim() || !d.sectorId} onCancel={onCancel} onSave={() => onSave(d)} />
    </Modal>
  );
}

function FormActions({ busy, disabled, onCancel, onSave }: { busy: boolean; disabled: boolean; onCancel: () => void; onSave: () => void }) {
  return (
    <div className="flex justify-end gap-2">
      <button type="button" onClick={onCancel} className="rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/5">Cancelar</button>
      <button
        type="button"
        onClick={onSave}
        disabled={busy || disabled}
        className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50"
      >
        {busy && <Loader2 size={14} className="animate-spin" />} Salvar
      </button>
    </div>
  );
}
