'use client';
import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, ExternalLink, Globe, Instagram, Loader2, Mail, MessageCircle, Nfc, PenLine, RefreshCw, ScanLine, Star, X } from 'lucide-react';
import { adminBtnPrimaryCls, adminBtnSecondaryCls, adminInputCls } from '@/components/admin-ui';

// Admin → Tags NFC: grava/le as tags dos chaveiros direto pelo Chrome do
// celular Android (Web NFC). Grava um unico registro de link, o mais leve
// possivel, sem app pago e sem nada extra na tag.

type NdefRecordLike = { recordType: string; mediaType?: string; encoding?: string; data?: DataView };
type NdefReadingEvent = Event & { serialNumber: string; message: { records: NdefRecordLike[] } };
type NdefReaderLike = {
  scan(opts?: { signal?: AbortSignal }): Promise<void>;
  write(msg: { records: { recordType: string; data: string }[] }, opts?: { overwrite?: boolean; signal?: AbortSignal }): Promise<void>;
  onreading: ((e: NdefReadingEvent) => void) | null;
  onreadingerror: ((e: Event) => void) | null;
};
const newReader = () => new (window as unknown as { NDEFReader: new () => NdefReaderLike }).NDEFReader();

type Tab = 'gravar' | 'ler' | 'sobrescrever';
type Kind = 'google' | 'site' | 'whatsapp' | 'instagram' | 'email';
type Form = { kind: Kind; site: string; whatsapp: string; whatsappMsg: string; instagram: string; email: string; google: string };
type Status = { tone: 'info' | 'ok' | 'error'; text: string } | null;
type TagRead = { serial: string; records: { type: string; value: string }[] };

const KINDS: { key: Kind; label: string; icon: React.ReactNode }[] = [
  { key: 'google', label: 'Avaliação Google', icon: <Star size={16} /> },
  { key: 'site', label: 'Link do site', icon: <Globe size={16} /> },
  { key: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={16} /> },
  { key: 'instagram', label: 'Instagram', icon: <Instagram size={16} /> },
  { key: 'email', label: 'E-mail', icon: <Mail size={16} /> },
];

const EMPTY_FORM: Form = { kind: 'google', site: '', whatsapp: '', whatsappMsg: '', instagram: '', email: '', google: '' };

// Monta o link final que vai pra tag. Retorna erro em texto quando falta algo.
function buildLink(f: Form): { url: string } | { error: string } {
  switch (f.kind) {
    case 'site': {
      const v = f.site.trim();
      if (!v) return { error: 'Informe o link do site.' };
      return { url: /^https?:\/\//i.test(v) ? v : `https://${v}` };
    }
    case 'whatsapp': {
      const digits = f.whatsapp.replace(/\D/g, '');
      if (digits.length < 8) return { error: 'Informe o número com código do país (ex: 34 600 000 000).' };
      const msg = f.whatsappMsg.trim();
      return { url: `https://wa.me/${digits}${msg ? `?text=${encodeURIComponent(msg)}` : ''}` };
    }
    case 'instagram': {
      const user = f.instagram.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/[/?#].*$/, '');
      if (!user) return { error: 'Informe o @ do Instagram.' };
      return { url: `https://instagram.com/${user}` };
    }
    case 'email': {
      const v = f.email.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { error: 'E-mail inválido.' };
      return { url: `mailto:${v}` };
    }
    case 'google': {
      const v = f.google.trim();
      if (!v) return { error: 'Cole o link de avaliação ou o Place ID do estabelecimento.' };
      if (/^https?:\/\//i.test(v)) return { url: v };
      return { url: `https://search.google.com/local/writereview?placeid=${encodeURIComponent(v)}` };
    }
  }
}

// Tamanho real na tag: registro URI com prefixo comprimido (https://www. etc.)
// + cabecalhos NDEF/TLV. NTAG213 tem 144 bytes uteis.
const URI_PREFIXES = ['https://www.', 'http://www.', 'https://', 'http://', 'mailto:', 'tel:'];
function tagBytes(url: string) {
  const prefix = URI_PREFIXES.find((p) => url.toLowerCase().startsWith(p)) ?? '';
  return new TextEncoder().encode(url.slice(prefix.length)).length + 1 + 4 + 3;
}

function describeLink(url: string): { label: string; icon: React.ReactNode } {
  if (/search\.google\.com\/local\/writereview|g\.page\/r\/|google\.[^/]+\/maps/i.test(url)) return { label: 'Avaliação Google', icon: <Star size={16} /> };
  if (/wa\.me|whatsapp\.com/i.test(url)) return { label: 'WhatsApp', icon: <MessageCircle size={16} /> };
  if (/instagram\.com/i.test(url)) return { label: 'Instagram', icon: <Instagram size={16} /> };
  if (/^mailto:/i.test(url)) return { label: 'E-mail', icon: <Mail size={16} /> };
  if (/^https?:\/\//i.test(url)) return { label: 'Site', icon: <Globe size={16} /> };
  return { label: 'Texto', icon: <Nfc size={16} /> };
}

function decodeRecord(r: NdefRecordLike): string {
  if (r.recordType === 'empty' || !r.data) return '';
  try {
    return new TextDecoder(r.encoding || 'utf-8').decode(r.data);
  } catch {
    return `(${r.mediaType || r.recordType})`;
  }
}

function nfcErrorText(e: unknown, overwrite: boolean): string {
  const name = (e as { name?: string })?.name;
  if (name === 'AbortError') return 'Cancelado.';
  if (name === 'NotAllowedError') {
    return overwrite
      ? 'Permissão de NFC negada. Libere o NFC para este site nas configurações do Chrome.'
      : 'Essa tag já tem conteúdo (ou o NFC foi bloqueado). Para trocar o link, use a aba “Gravar por cima”.';
  }
  if (name === 'NotSupportedError') return 'Essa tag não é compatível com NDEF.';
  if (name === 'NetworkError') return 'A tag se afastou antes de terminar. Segure o celular parado em cima dela e tente de novo.';
  return (e as Error)?.message || 'Não foi possível acessar a tag.';
}

function StatusBox({ status }: { status: Status }) {
  if (!status) return null;
  const cls = status.tone === 'ok' ? 'border-green-500/30 bg-green-500/10 text-green-300'
    : status.tone === 'error' ? 'border-red-500/30 bg-red-500/10 text-red-300'
    : 'border-blue-500/30 bg-blue-500/10 text-blue-200';
  return (
    <div className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ${cls}`}>
      {status.tone === 'ok' ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
        : status.tone === 'error' ? <AlertCircle size={16} className="mt-0.5 shrink-0" />
        : <Loader2 size={16} className="mt-0.5 shrink-0 animate-spin" />}
      <span>{status.text}</span>
    </div>
  );
}

function LinkForm({ form, setForm }: { form: Form; setForm: (f: Form) => void }) {
  const set = (patch: Partial<Form>) => setForm({ ...form, ...patch });
  const built = buildLink(form);
  const bytes = 'url' in built ? tagBytes(built.url) : 0;

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40">O que gravar</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {KINDS.map((k) => (
            <button
              key={k.key}
              type="button"
              onClick={() => set({ kind: k.key })}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition ${form.kind === k.key ? 'border-green-500/60 bg-green-500/10 text-white' : 'border-white/10 text-white/60 hover:bg-white/5'}`}
            >
              <span className={form.kind === k.key ? 'text-green-400' : 'text-white/40'}>{k.icon}</span>
              {k.label}
            </button>
          ))}
        </div>
      </div>

      {form.kind === 'google' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/80">Link de avaliação ou Place ID</label>
          <input className={adminInputCls} value={form.google} onChange={(e) => set({ google: e.target.value })} placeholder="https://g.page/r/XXXX/review  ou  ChIJN1t_tDeuEmsRUsoyG83frY4" />
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-relaxed text-amber-100/80">
            <p className="font-semibold text-amber-200">Como pegar o link do estabelecimento:</p>
            <p className="mt-1">1. No <b>Perfil da Empresa no Google</b> (pesquise o nome da loja logado na conta dona), toque em <b>“Pedir avaliações”</b> e copie o link.</p>
            <p className="mt-1">
              2. Ou pegue o <b>Place ID</b> no{' '}
              <a className="underline" href="https://developers.google.com/maps/documentation/places/web-service/place-id#find-id" target="_blank" rel="noreferrer">localizador de Place ID</a>{' '}
              e cole aqui — o link que abre direto a janela de “escrever avaliação” é montado sozinho.
            </p>
          </div>
        </div>
      )}
      {form.kind === 'site' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/80">Link do site</label>
          <input className={adminInputCls} value={form.site} onChange={(e) => set({ site: e.target.value })} placeholder="kitoys3d.com" inputMode="url" />
        </div>
      )}
      {form.kind === 'whatsapp' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/80">Número com código do país</label>
          <input className={adminInputCls} value={form.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} placeholder="34 600 000 000" inputMode="tel" />
          <label className="block pt-1 text-sm font-medium text-white/80">Mensagem pronta <span className="text-white/40">(opcional)</span></label>
          <input className={adminInputCls} value={form.whatsappMsg} onChange={(e) => set({ whatsappMsg: e.target.value })} placeholder="Hola! Vi tu llavero…" />
        </div>
      )}
      {form.kind === 'instagram' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/80">@ do Instagram</label>
          <input className={adminInputCls} value={form.instagram} onChange={(e) => set({ instagram: e.target.value })} placeholder="@kitoys3d" />
        </div>
      )}
      {form.kind === 'email' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-white/80">E-mail</label>
          <input className={adminInputCls} value={form.email} onChange={(e) => set({ email: e.target.value })} placeholder="contato@kitoys3d.com" inputMode="email" />
        </div>
      )}

      {'url' in built && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-xs text-white/40">Vai ser gravado na tag:</p>
          <p className="mt-1 break-all font-mono text-sm text-white">{built.url}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
            <span className={bytes <= 137 ? 'text-green-400' : 'text-amber-400'}>
              ≈ {bytes} bytes {bytes <= 137 ? '· cabe em NTAG213' : '· pode não caber em NTAG213 (144 bytes)'}
            </span>
            {!built.url.startsWith('mailto:') && (
              <a href={built.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-white/60 underline hover:text-white">
                <ExternalLink size={12} /> Testar link
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TagContent({ tag }: { tag: TagRead }) {
  return (
    <div className="space-y-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs text-white/40">Tag <span className="font-mono">{tag.serial || 'sem número de série'}</span></p>
      {tag.records.length === 0 ? (
        <p className="text-sm text-white/60">Tag vazia — nada gravado.</p>
      ) : tag.records.map((r, i) => {
        const d = describeLink(r.value);
        const isLink = /^(https?:|mailto:|tel:)/i.test(r.value);
        return (
          <div key={i} className="flex items-start gap-3 rounded-lg border border-white/10 bg-[#1c2236] p-3">
            <span className="mt-0.5 text-green-400">{d.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white/60">{d.label}</p>
              <p className="break-all font-mono text-sm text-white">{r.value || `(${r.type})`}</p>
            </div>
            {isLink && (
              <a href={r.value} target="_blank" rel="noreferrer" className="shrink-0 text-white/50 hover:text-white" aria-label="Abrir link">
                <ExternalLink size={16} />
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function AdminNfc() {
  const [tab, setTab] = useState<Tab>('gravar');
  const [supported, setSupported] = useState<boolean | null>(null);
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);
  const [tagRead, setTagRead] = useState<TagRead | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'NDEFReader' in window);
    return () => abortRef.current?.abort();
  }, []);

  const cancel = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setBusy(false);
    setStatus(null);
  };

  const switchTab = (t: Tab) => {
    cancel();
    setTagRead(null);
    setTab(t);
  };

  const readTag = async () => {
    cancel();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setBusy(true);
    setTagRead(null);
    setStatus({ tone: 'info', text: 'Aproxime a tag da parte de trás do celular…' });
    try {
      const reader = newReader();
      reader.onreading = (e) => {
        setTagRead({ serial: e.serialNumber, records: e.message.records.map((r) => ({ type: r.recordType, value: decodeRecord(r) })) });
        setStatus({ tone: 'ok', text: 'Tag lida.' });
        navigator.vibrate?.(80);
        ctrl.abort();
        setBusy(false);
      };
      reader.onreadingerror = () => setStatus({ tone: 'error', text: 'Não consegui ler essa tag. Tente de novo, segurando parado.' });
      await reader.scan({ signal: ctrl.signal });
    } catch (e) {
      setBusy(false);
      setStatus({ tone: 'error', text: nfcErrorText(e, true) });
    }
  };

  const writeTag = async (overwrite: boolean) => {
    const built = buildLink(form);
    if ('error' in built) { setStatus({ tone: 'error', text: built.error }); return; }
    cancel();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setBusy(true);
    setStatus({ tone: 'info', text: overwrite ? 'Aproxime a tag para gravar por cima…' : 'Aproxime a tag nova para gravar…' });
    try {
      await newReader().write({ records: [{ recordType: 'url', data: built.url }] }, { overwrite, signal: ctrl.signal });
      navigator.vibrate?.([80, 60, 80]);
      setStatus({ tone: 'ok', text: `Gravado! Aproxime um celular da tag para testar.` });
      setTagRead(null);
    } catch (e) {
      setStatus({ tone: 'error', text: nfcErrorText(e, overwrite) });
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  };

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'gravar', label: 'Cadastrar e gravar', icon: <PenLine size={16} /> },
    { key: 'ler', label: 'Ler tag', icon: <ScanLine size={16} /> },
    { key: 'sobrescrever', label: 'Gravar por cima', icon: <RefreshCw size={16} /> },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 text-white">
      {supported === false && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-400" />
          <div>
            <p className="font-semibold">Este navegador não acessa NFC.</p>
            <p className="mt-1 text-amber-100/75">
              Abra o painel (kitoys3d.com/admin) no <b>Chrome de um celular Android</b> com o NFC ligado. iPhone e computador não conseguem gravar tags pelo navegador. Dá pra preparar o link aqui, mas a gravação só funciona no celular.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-1 rounded-2xl border border-white/10 bg-[#161b28] p-1" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => switchTab(t.key)}
            className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-xs font-semibold transition sm:flex-row sm:gap-2 sm:text-sm ${tab === t.key ? 'bg-green-600 text-white' : 'text-white/60 hover:bg-white/5'}`}
          >
            {t.icon}
            <span className="text-center leading-tight">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="space-y-4 rounded-2xl border border-white/10 bg-[#161b28] p-5">
        {tab === 'gravar' && (
          <>
            <div>
              <h2 className="font-semibold">Cadastrar e gravar tag nova</h2>
              <p className="mt-0.5 text-xs text-white/45">Escolha o tipo, preencha e aproxime a tag. Se a tag já tiver algo gravado, ela não é alterada — use “Gravar por cima”.</p>
            </div>
            <LinkForm form={form} setForm={setForm} />
            <StatusBox status={status} />
            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="button" className={`${adminBtnPrimaryCls} w-full sm:w-auto`} disabled={busy || !supported} onClick={() => writeTag(false)}>
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Nfc size={16} />} Aproximar e gravar
              </button>
              {busy && <button type="button" className={`${adminBtnSecondaryCls} w-full sm:w-auto`} onClick={cancel}><X size={16} /> Cancelar</button>}
            </div>
          </>
        )}

        {tab === 'ler' && (
          <>
            <div>
              <h2 className="font-semibold">Ler tag</h2>
              <p className="mt-0.5 text-xs text-white/45">Aproxime a tag para ver qual link está gravado nela.</p>
            </div>
            <StatusBox status={status} />
            {tagRead && <TagContent tag={tagRead} />}
            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="button" className={`${adminBtnPrimaryCls} w-full sm:w-auto`} disabled={busy || !supported} onClick={readTag}>
                {busy ? <Loader2 size={16} className="animate-spin" /> : <ScanLine size={16} />} {tagRead ? 'Ler outra tag' : 'Aproximar e ler'}
              </button>
              {busy && <button type="button" className={`${adminBtnSecondaryCls} w-full sm:w-auto`} onClick={cancel}><X size={16} /> Cancelar</button>}
            </div>
          </>
        )}

        {tab === 'sobrescrever' && (
          <>
            <div>
              <h2 className="font-semibold">Gravar por cima (reutilizar tag)</h2>
              <p className="mt-0.5 text-xs text-white/45">Veja o que tem na tag, escolha o novo conteúdo e grave substituindo o anterior.</p>
            </div>
            <div className="space-y-3 rounded-xl border border-white/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/40">1 · Conteúdo atual</p>
              {tagRead ? <TagContent tag={tagRead} /> : <p className="text-sm text-white/50">Opcional: leia a tag antes para conferir o que está gravado.</p>}
              <button type="button" className={`${adminBtnSecondaryCls} w-full sm:w-auto`} disabled={busy || !supported} onClick={readTag}>
                <ScanLine size={16} /> {tagRead ? 'Ler de novo' : 'Ver o que tem na tag'}
              </button>
            </div>
            <div className="space-y-3 rounded-xl border border-white/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/40">2 · Novo conteúdo</p>
              <LinkForm form={form} setForm={setForm} />
            </div>
            <StatusBox status={status} />
            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="button" className={`${adminBtnPrimaryCls} w-full sm:w-auto`} disabled={busy || !supported} onClick={() => writeTag(true)}>
                {busy ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Aproximar e gravar por cima
              </button>
              {busy && <button type="button" className={`${adminBtnSecondaryCls} w-full sm:w-auto`} onClick={cancel}><X size={16} /> Cancelar</button>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
