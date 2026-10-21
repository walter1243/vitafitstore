'use client';
import { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, ExternalLink, Image as ImageIcon, Loader2, Plus, RotateCcw, Save, Trash2, Video } from 'lucide-react';
import { Field, inputCls, textareaCls, MediaUploadField } from '@/components/configuracoes/content/shared';
import { type Sector, type SiteCollection } from '@/lib/sectors-shared';
import { DEFAULT_WORLD, TILE_ICONS, parseWorldContent, type Media, type MediaKind, type WorldContent } from '@/lib/world-content';

const STYLE_LABEL: Record<string, string> = { infantil: 'Infantil', hogar: 'Casa / Hogar', llaveros: 'Chaveiros', navidad: 'Navidad', mascotas: 'Mascotas / Pet' };
const ICON_LABEL: Record<string, string> = {
  sparkles: 'Brilho', heart: 'Coração', gift: 'Presente', sun: 'Sol', leaf: 'Folha', paw: 'Patinha', pen: 'Caneta',
  star: 'Estrela', shield: 'Escudo', truck: 'Caminhão', printer: 'Impressora', smile: 'Sorriso',
};
const box = 'rounded-2xl border border-white/10 bg-[#161b28] p-5';
const btn = 'inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs font-semibold text-white/75 transition hover:bg-white/5 disabled:opacity-40';

async function post(body: Record<string, unknown>) {
  const res = await fetch('/api/sectors', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || 'Erro ao salvar.');
  return data as Sector[];
}

// Campo de midia com escolha Imagem / Video (mesmo sistema do Editar loja).
function MediaSlot({ label, hint, value, onChange }: { label: string; hint?: string; value: Media; onChange: (m: Media) => void }) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center gap-2">
        {(['image', 'video'] as MediaKind[]).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => onChange({ url: value.kind === k ? value.url : '', kind: k })}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold ${value.kind === k ? 'border-green-500/60 bg-green-500/10 text-white' : 'border-white/10 text-white/60 hover:bg-white/5'}`}
          >
            {k === 'image' ? <ImageIcon size={13} /> : <Video size={13} />} {k === 'image' ? 'Imagem' : 'Vídeo'}
          </button>
        ))}
      </div>
      <MediaUploadField label={label} hint={hint} value={value.url} onChange={(url) => onChange({ ...value, url })} kind={value.kind} />
    </div>
  );
}

// Admin → Editar mundos: tudo de cada mundo (Infantil, Hogar, Llaveros,
// Mascotas e os proximos setores): capa do card, faixa, vitrine (fotos ou
// videos, textos, beneficios, passos) e a midia de cada colecao.
export function AdminWorlds() {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [products, setProducts] = useState<{ id: number; name: string; price: number }[]>([]);

  useEffect(() => {
    fetch('/api/products', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : [])).then((p) => { if (Array.isArray(p)) setProducts(p); }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/sectors?all=1', { cache: 'no-store' })
      .then((r) => r.json())
      .then((s) => {
        if (Array.isArray(s)) { setSectors(s); setActiveId(s[0]?.id ?? null); }
        else setMsg({ ok: false, text: s?.error || 'Não foi possível carregar os mundos.' });
      })
      .catch(() => setMsg({ ok: false, text: 'Erro de conexão.' }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-green-400" /></div>;
  const sector = sectors.find((s) => s.id === activeId);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 text-white">
      <div className={box}>
        <h2 className="font-semibold">Editar mundos</h2>
        <p className="mt-1 text-xs text-white/50">
          Cada mundo é uma aba no início do site. Aqui você troca a capa, os textos e as imagens de cada coleção. Para criar um mundo novo, use “Setores e coleções”.
        </p>
        <div className="mt-4 flex flex-wrap gap-2" role="tablist">
          {sectors.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={s.id === activeId}
              onClick={() => { setActiveId(s.id); setMsg(null); }}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold ${s.id === activeId ? 'border-green-500/60 bg-green-500/10 text-white' : 'border-white/10 text-white/60 hover:bg-white/5'}`}
            >
              {s.name}
              <span className="ml-1.5 text-[11px] font-normal text-white/45">{STYLE_LABEL[s.style] ?? s.style}</span>
            </button>
          ))}
        </div>
      </div>

      {msg && <div className={`rounded-xl px-4 py-3 text-sm ${msg.ok ? 'border border-green-500/30 bg-green-500/10 text-green-200' : 'border border-red-500/30 bg-red-500/10 text-red-300'}`}>{msg.text}</div>}

      {sector && (
        <WorldEditor
          key={sector.id}
          sector={sector}
          products={products}
          onSaved={(list, text) => { setSectors(list); setMsg({ ok: true, text }); }}
          onError={(text) => setMsg({ ok: false, text })}
        />
      )}
    </div>
  );
}

function WorldEditor({ sector, products, onSaved, onError }: { sector: Sector; products: { id: number; name: string; price: number }[]; onSaved: (s: Sector[], text: string) => void; onError: (t: string) => void }) {
  const [name, setName] = useState(sector.name);
  const [tagline, setTagline] = useState(sector.tagline);
  const [description, setDescription] = useState(sector.description);
  const [band, setBand] = useState<Media>(sector.videoUrl ? { url: sector.videoUrl, kind: 'video' } : { url: sector.imageUrl, kind: 'image' });
  const [content, setContent] = useState<WorldContent>(() => parseWorldContent(sector.content, sector.style));
  const [busy, setBusy] = useState(false);
  const sc = content.showcase;
  const setSc = (patch: Partial<WorldContent['showcase']>) => setContent((c) => ({ ...c, showcase: { ...c.showcase, ...patch } }));

  async function save() {
    setBusy(true);
    try {
      const list = await post({
        action: 'saveSector',
        id: sector.id,
        slug: sector.slug,
        enabled: sector.enabled,
        style: sector.style,
        name,
        tagline,
        description,
        imageUrl: band.kind === 'image' ? band.url : '',
        videoUrl: band.kind === 'video' ? band.url : '',
        content,
      });
      onSaved(list, `Mundo “${name}” salvo. Já está no site.`);
    } catch (e: any) {
      onError(e?.message || 'Erro ao salvar.');
    } finally {
      setBusy(false);
    }
  }

  const moveShot = (i: number, d: -1 | 1) => {
    const shots = [...sc.shots];
    const j = i + d;
    if (j < 0 || j >= shots.length) return;
    [shots[i], shots[j]] = [shots[j], shots[i]];
    setSc({ shots });
  };

  return (
    <>
      {/* 1. Card e faixa */}
      <section className={box}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-semibold">1. Card “Elige tu mundo” e faixa</h3>
          <a className={btn} href={`/#mundo-${sector.slug}`} target="_blank" rel="noreferrer"><ExternalLink size={13} /> Ver no site</a>
        </div>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <Field label="Nome do mundo"><input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Frase"><input className={inputCls} value={tagline} onChange={(e) => setTagline(e.target.value)} /></Field>
        </div>
        <Field label="Texto de apresentação (página do setor)">
          <textarea rows={2} className={textareaCls} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <MediaSlot
          label="Capa do card (início do site)"
          hint="Aparece no card do mundo. Imagem horizontal (16:10) ou vídeo curto sem som. PNG sem fundo aparece inteiro."
          value={content.cover}
          onChange={(cover) => setContent((c) => ({ ...c, cover }))}
        />
        <MediaSlot
          label="Imagem ou vídeo da faixa (página do setor)"
          hint="Fica ao lado do texto na página do setor. Vazio = faixa só com texto."
          value={band}
          onChange={setBand}
        />
      </section>

      <div className="sticky bottom-3 z-10 flex flex-wrap justify-end gap-2 rounded-2xl border border-white/10 bg-[#161b28]/95 p-3 backdrop-blur">
        <button
          type="button"
          className={btn}
          onClick={() => { if (window.confirm('Voltar a capa deste mundo para o padrão?')) setContent((c) => ({ ...c, cover: DEFAULT_WORLD[sector.style].cover })); }}
        >
          <RotateCcw size={13} /> Restaurar padrão
        </button>
        <button type="button" onClick={save} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold hover:bg-green-500 disabled:opacity-50">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Salvar mundo
        </button>
      </div>

      {/* 2. Colecoes do mundo */}
      <section className={box}>
        <h3 className="mb-1 font-semibold">2. Coleções deste mundo</h3>
        <p className="mb-4 text-xs text-white/50">Imagem, foto e vídeo de cada coleção. Cada uma salva separado.</p>
        {sector.collections.length === 0 && <p className="text-xs text-white/45">Nenhuma coleção. Crie em “Setores e coleções”.</p>}
        <div className="space-y-4">
          {sector.collections.map((c) => (
            <CollectionMedia key={c.id} c={c} onSaved={onSaved} onError={onError} />
          ))}
        </div>
      </section>
    </>
  );
}

function CollectionMedia({ c, onSaved, onError }: { c: SiteCollection; onSaved: (s: Sector[], text: string) => void; onError: (t: string) => void }) {
  const [d, setD] = useState(c);
  const [busy, setBusy] = useState(false);
  const [media, setMedia] = useState<Media>(c.videoUrl ? { url: c.videoUrl, kind: 'video' } : { url: c.photoUrl || '', kind: 'image' });

  async function save() {
    setBusy(true);
    try {
      const list = await post({
        action: 'saveCollection',
        ...d,
        photoUrl: media.kind === 'image' ? media.url : d.photoUrl,
        videoUrl: media.kind === 'video' ? media.url : '',
      });
      onSaved(list, `Coleção “${d.name}” salva.`);
    } catch (e: any) {
      onError(e?.message || 'Erro ao salvar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#0f1117] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-semibold">{c.name}</p>
        <a className={btn} href={`/coleccion/${c.slug}`} target="_blank" rel="noreferrer"><ExternalLink size={13} /> Ver</a>
      </div>
      <div className="grid gap-x-4 sm:grid-cols-2">
        <Field label="Frase da coleção"><input className={inputCls} value={d.tagline} onChange={(e) => setD({ ...d, tagline: e.target.value })} /></Field>
        <Field label="Descrição"><input className={inputCls} value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} /></Field>
      </div>
      <MediaUploadField label="Imagem principal / arte" hint="Aparece no menu e no destaque (PNG sem fundo fica ótimo)." value={d.imageUrl} onChange={(url) => setD({ ...d, imageUrl: url })} kind="image" />
      <div className="mt-3">
        <MediaSlot label="Foto ou vídeo de ambiente" hint="Foto grande da coleção (faixa escura / casa / pet) ou vídeo curto sem som." value={media} onChange={setMedia} />
      </div>
      <div className="flex justify-end">
        <button type="button" onClick={save} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-xs font-semibold hover:bg-green-500 disabled:opacity-50">
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Salvar coleção
        </button>
      </div>
    </div>
  );
}
