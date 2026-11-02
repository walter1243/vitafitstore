'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';

// Idioma do site: o original e espanhol; os outros sao traduzidos na hora
// pelo Google Tradutor (tudo que aparece na tela, inclusive os produtos).
// A escolha fica no cookie "googtrans" (/es/<idioma>), que o proprio Google
// le; trocar recarrega a pagina.
export const LANGS = [
  { code: 'es', flag: 'es', short: 'ES', name: 'Español' },
  { code: 'fr', flag: 'fr', short: 'FR', name: 'Français' },
  { code: 'en', flag: 'gb', short: 'EN', name: 'English' },
  { code: 'pt-PT', flag: 'pt', short: 'PT', name: 'Português' },
] as const;

const COOKIE = 'googtrans';

function readLang() {
  if (typeof document === 'undefined') return 'es';
  const m = document.cookie.match(/(?:^|;\s*)googtrans=\/es\/([^;]+)/);
  const code = m ? decodeURIComponent(m[1]) : 'es';
  return LANGS.some((l) => l.code === code) ? code : 'es';
}

function writeLang(code: string) {
  const host = location.hostname.replace(/^www\./, '');
  const domains = ['', `; domain=${host}`, `; domain=.${host}`];
  for (const d of domains) document.cookie = `${COOKIE}=; path=/; max-age=0${d}`;
  if (code !== 'es') {
    const v = `/es/${code}`;
    document.cookie = `${COOKIE}=${v}; path=/; max-age=31536000; SameSite=Lax`;
    if (host.includes('.')) document.cookie = `${COOKIE}=${v}; path=/; max-age=31536000; SameSite=Lax; domain=.${host}`;
  }
}

const Flag = ({ code }: { code: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={`https://flagcdn.com/w40/${code}.png`} alt="" width={22} height={16} className="h-4 w-[22px] shrink-0 rounded-[3px] object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.08)]" />
);

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const [lang, setLang] = useState('es');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => setLang(readLang()), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('mousedown', onClick); };
  }, [open]);

  const cur = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  function choose(code: string) {
    setOpen(false);
    if (code === lang) return;
    writeLang(code);
    location.reload();
  }

  return (
    <div ref={ref} className={`notranslate relative ${className}`} translate="no">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Idioma: ${cur.name}`}
        className="flex h-11 cursor-pointer items-center gap-1.5 rounded-full px-2 text-[13px] font-semibold text-[#1d1d1f] transition-colors hover:bg-[#F2F4FA]"
      >
        <Flag code={cur.flag} />
        <span className="hidden sm:inline">{cur.short}</span>
        <ChevronDown className={`hidden h-3.5 w-3.5 sm:block transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <ul role="listbox" aria-label="Idioma" className="absolute right-0 top-full z-[70] mt-1 w-44 overflow-hidden rounded-2xl border border-black/[0.06] bg-white py-1 shadow-[0_16px_40px_rgba(0,0,0,0.14)]">
          {LANGS.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                role="option"
                aria-selected={l.code === lang}
                onClick={() => choose(l.code)}
                className={`flex w-full cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-left text-[14px] transition-colors hover:bg-[#f5f5f7] ${l.code === lang ? 'font-bold text-[#0071e3]' : 'text-[#1d1d1f]'}`}
              >
                <Flag code={l.flag} />
                <span className="flex-1">{l.name}</span>
                <span className="text-[11px] font-semibold text-[#6e6e73]">{l.short}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Carrega o Google Tradutor so quando o idioma nao e espanhol (e nunca no
// painel). Vai no layout, entao vale em todas as paginas da loja.
export function TranslateLoader() {
  const path = usePathname() ?? '';
  useEffect(() => {
    if (path.startsWith('/admin') || path.startsWith('/acesso')) return;
    const lang = readLang();
    if (lang === 'es') return;
    document.documentElement.lang = lang;
    if (document.getElementById('kt-gt')) return;

    // O tradutor troca os textos da pagina por baixo do React; sem isto o
    // React quebra ao atualizar um no que o tradutor ja mexeu.
    const proto = Node.prototype as Node & { __ktPatched?: boolean };
    if (!proto.__ktPatched) {
      proto.__ktPatched = true;
      const remove = proto.removeChild;
      proto.removeChild = function <T extends Node>(this: Node, child: T): T {
        if (child.parentNode !== this) return child;
        return remove.call(this, child) as T;
      };
      const insert = proto.insertBefore;
      proto.insertBefore = function <T extends Node>(this: Node, node: T, ref: Node | null): T {
        if (ref && ref.parentNode !== this) return node;
        return insert.call(this, node, ref) as T;
      };
    }

    const box = document.createElement('div');
    box.id = 'google_translate_element';
    box.style.display = 'none';
    document.body.appendChild(box);
    const w = window as unknown as { ktGtInit?: () => void; google?: { translate: { TranslateElement: new (o: object, id: string) => unknown } } };
    w.ktGtInit = () => { new w.google!.translate.TranslateElement({ pageLanguage: 'es', autoDisplay: false }, 'google_translate_element'); };
    const s = document.createElement('script');
    s.id = 'kt-gt';
    s.src = 'https://translate.google.com/translate_a/element.js?cb=ktGtInit';
    s.async = true;
    document.body.appendChild(s);
  }, [path]);
  return null;
}
