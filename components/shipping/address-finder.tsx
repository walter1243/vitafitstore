'use client';
import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, Search } from 'lucide-react';

// Endereco do checkout com o autocompletar do Google: o cliente digita, escolhe
// a sugestao e rua, numero, CP e cidade sao preenchidos. Piso/porta ele digita.
// Sem chave do Google (ou se o Google recusar), a busca nao aparece e o
// cliente preenche os campos normalmente.
export type FoundAddress = { street: string; number: string; zip: string; city: string; country: string };

declare global { interface Window { google?: any; __kitoysMaps?: Promise<any> } }

function loadMaps(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('ssr'));
  if (window.__kitoysMaps) return window.__kitoysMaps;
  window.__kitoysMaps = (async () => {
    const { key } = await (await fetch('/api/maps-key')).json();
    if (!key) throw new Error('sem chave');
    await new Promise<void>((res, rej) => {
      const cb = `__kitoysMapsReady${Date.now()}`;
      (window as any)[cb] = () => res();
      const s = document.createElement('script');
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async&language=es&region=ES&libraries=places&callback=${cb}`;
      s.async = true;
      s.onerror = () => rej(new Error('script'));
      document.head.appendChild(s);
    });
    return window.google;
  })();
  window.__kitoysMaps.catch(() => { window.__kitoysMaps = undefined; });
  return window.__kitoysMaps;
}

// Componentes do endereco do Places (novo): longText / shortText / types.
function fromComponents(list: any[]): FoundAddress {
  const find = (t: string) => list.find((x) => (x.types ?? []).includes(t));
  const get = (t: string) => String(find(t)?.longText ?? '');
  return {
    street: get('route'),
    number: get('street_number'),
    zip: get('postal_code').replace(/\D/g, '').slice(0, 5),
    city: get('locality') || get('postal_town') || get('administrative_area_level_3') || get('administrative_area_level_2'),
    country: String(find('country')?.shortText ?? '').toUpperCase(),
  };
}

const withTimeout = <T,>(p: Promise<T>, ms: number) =>
  Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

export function AddressFinder({ onAddress }: { onAddress: (a: FoundAddress) => void }) {
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const token = useRef<any>(null);
  const skipNext = useRef(false);

  useEffect(() => { loadMaps().then(() => setReady(true)).catch(() => setReady(false)); }, []);

  // Sugestoes enquanto digita.
  useEffect(() => {
    if (skipNext.current) { skipNext.current = false; return; }
    if (!ready || query.trim().length < 3) { setSuggestions([]); return; }
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const { AutocompleteSuggestion, AutocompleteSessionToken } = await window.google.maps.importLibrary('places');
        if (!token.current) token.current = new AutocompleteSessionToken();
        const { suggestions: list } = await withTimeout(AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: query, sessionToken: token.current, includedRegionCodes: ['es', 'pt'], language: 'es', region: 'es',
        }), 8000) as any;
        if (!alive) return;
        setSuggestions((list ?? []).filter((s: any) => s.placePrediction).slice(0, 5));
        setOpen(true);
      } catch {
        if (alive) setSuggestions([]);
      }
    }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [query, ready]);

  async function pick(s: any) {
    const label = [s.placePrediction.mainText?.toString(), s.placePrediction.secondaryText?.toString()].filter(Boolean).join(', ');
    setOpen(false);
    setSuggestions([]);
    skipNext.current = true;
    setQuery(label || s.placePrediction.text.toString());
    setBusy(true); setMsg(null);
    try {
      const place = s.placePrediction.toPlace();
      await withTimeout(place.fetchFields({ fields: ['addressComponents'] }), 8000);
      token.current = null; // fecha a sessao do autocompletar
      const a = fromComponents(place.addressComponents ?? []);
      onAddress(a);
      setMsg(a.number
        ? { ok: true, text: 'Dirección rellenada. Añade el piso y la puerta si hace falta.' }
        : { ok: true, text: 'Dirección rellenada. Escribe el número de la calle.' });
    } catch {
      setMsg({ ok: false, text: 'No pudimos usar esa dirección. Escríbela en los campos de abajo.' });
    } finally { setBusy(false); }
  }

  if (!ready) return null;
  return (
    <div className="space-y-1.5">
      <div className="relative">
        {busy
          ? <Loader2 size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 animate-spin text-[#c2410c]" aria-hidden="true" />
          : <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />}
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setMsg(null); }}
          onFocus={() => suggestions.length && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Busca tu dirección (calle y número)"
          aria-label="Buscar dirección"
          autoComplete="off"
          className="h-12 w-full rounded-2xl border-2 border-[#c2410c]/30 bg-white pl-10 pr-3 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#c2410c]"
        />
        {open && suggestions.length > 0 && (
          <ul className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg" role="listbox">
            {suggestions.map((s, i) => (
              <li key={i}>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => pick(s)} className="flex w-full cursor-pointer items-start gap-2 px-3 py-2.5 text-left text-sm text-slate-800 hover:bg-orange-50">
                  <MapPin size={15} className="mt-0.5 shrink-0 text-[#c2410c]" aria-hidden="true" />
                  <span>
                    <span className="block font-semibold">{s.placePrediction.mainText?.toString() ?? s.placePrediction.text.toString()}</span>
                    {s.placePrediction.secondaryText && <span className="block text-xs text-slate-500">{s.placePrediction.secondaryText.toString()}</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {msg && <p className={`text-xs font-medium ${msg.ok ? 'text-emerald-700' : 'text-red-600'}`}>{msg.text}</p>}
    </div>
  );
}
