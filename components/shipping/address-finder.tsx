'use client';
import { useEffect, useRef, useState } from 'react';
import { Loader2, LocateFixed, MapPin, Search } from 'lucide-react';

// Endereco do checkout com o Google Maps:
//  1. o cliente digita e escolhe a sugestao (autocompletar do Google);
//  2. ou "Usar mi ubicación": varias leituras do GPS, fica a mais precisa;
//  3. o mapa mostra o ponto e o cliente arrasta o alfinete ate o portal —
//     ao soltar, o endereco e recalculado. Piso/porta o cliente digita.
// Sem chave do Google, o botao de localizacao usa /api/shipping/geo.
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
      s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&loading=async&language=es&region=ES&libraries=places,geocoding&callback=${cb}`;
      s.async = true;
      s.onerror = () => rej(new Error('script'));
      document.head.appendChild(s);
    });
    return window.google;
  })();
  window.__kitoysMaps.catch(() => { window.__kitoysMaps = undefined; });
  return window.__kitoysMaps;
}

// Componentes do Google (Places novo: longText/types; Geocoder: long_name/types).
function fromComponents(list: any[]): FoundAddress {
  const get = (t: string) => {
    const c = list.find((x) => (x.types ?? []).includes(t));
    return c ? String(c.longText ?? c.long_name ?? '') : '';
  };
  const short = (t: string) => {
    const c = list.find((x) => (x.types ?? []).includes(t));
    return c ? String(c.shortText ?? c.short_name ?? '') : '';
  };
  return {
    street: get('route'),
    number: get('street_number'),
    zip: get('postal_code').replace(/\D/g, '').slice(0, 5),
    city: get('locality') || get('postal_town') || get('administrative_area_level_3') || get('administrative_area_level_2'),
    country: short('country').toUpperCase(),
  };
}

// GPS: junta leituras por ate ~10 s e fica com a de menor erro (para antes se ficar <= 12 m).
function bestPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('Tu navegador no permite ubicación.')); return; }
    let best: GeolocationPosition | null = null;
    const finish = () => { navigator.geolocation.clearWatch(id); clearTimeout(t); best ? resolve(best) : reject(new Error('Permite la ubicación o escribe la dirección.')); };
    const id = navigator.geolocation.watchPosition((p) => {
      if (!best || p.coords.accuracy < best.coords.accuracy) best = p;
      if (p.coords.accuracy <= 12) finish();
    }, (e) => { if (e.code === e.PERMISSION_DENIED || !best) { navigator.geolocation.clearWatch(id); clearTimeout(t); reject(new Error('Permite la ubicación o escribe la dirección.')); } }, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
    const t = setTimeout(finish, 10000);
  });
}

export function AddressFinder({ onAddress }: { onAddress: (a: FoundAddress) => void }) {
  const [ready, setReady] = useState<'loading' | 'ok' | 'off'>('loading');
  const [placesOk, setPlacesOk] = useState(true);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [point, setPoint] = useState<{ lat: number; lng: number; acc?: number } | null>(null);
  const token = useRef<any>(null);
  const mapEl = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const marker = useRef<any>(null);
  const circle = useRef<any>(null);
  const onAddressRef = useRef(onAddress);
  onAddressRef.current = onAddress;

  useEffect(() => { loadMaps().then(() => setReady('ok')).catch(() => setReady('off')); }, []);

  // Sugestoes enquanto digita (Places API nova).
  useEffect(() => {
    if (ready !== 'ok' || query.trim().length < 3) { setSuggestions([]); return; }
    let alive = true;
    const t = setTimeout(async () => {
      try {
        const g = window.google;
        const { AutocompleteSuggestion, AutocompleteSessionToken } = await g.maps.importLibrary('places');
        if (!token.current) token.current = new AutocompleteSessionToken();
        const { suggestions: list } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: query, sessionToken: token.current, includedRegionCodes: ['es', 'pt'], language: 'es', region: 'es',
        });
        if (alive) setSuggestions((list ?? []).filter((s: any) => s.placePrediction).slice(0, 5));
      } catch (e: any) {
        if (!alive) return;
        setSuggestions([]);
        if (/blocked|denied|not authorized|ApiNotActivated/i.test(String(e?.message ?? e))) setPlacesOk(false);
      }
    }, 250);
    return () => { alive = false; clearTimeout(t); };
  }, [query, ready]);

  async function apply(a: FoundAddress, lat: number, lng: number, acc?: number) {
    onAddressRef.current(a);
    setPoint({ lat, lng, acc });
    setMsg({ ok: true, text: a.number ? 'Dirección rellenada. Si el punto no está en tu portal, arrástralo en el mapa.' : 'Dirección rellenada. Añade el número y el piso.' });
  }

  // Sem o Geocoding do Google (API desativada/recusada): usa /api/shipping/geo.
  async function reverseOsm(lat: number, lng: number, acc?: number) {
    const r = await fetch(`/api/shipping/geo?lat=${lat}&lon=${lng}`);
    const d = await r.json();
    if (!r.ok || !d?.zip) throw new Error(d?.error || 'No encontramos tu dirección.');
    await apply({ street: d.street ?? '', number: d.number ?? '', zip: d.zip, city: d.city ?? '', country: d.country ?? 'ES' }, lat, lng, acc);
  }

  async function reverse(lat: number, lng: number, acc?: number) {
    try { await reverseGoogle(lat, lng, acc); } catch { await reverseOsm(lat, lng, acc); }
  }

  async function reverseGoogle(lat: number, lng: number, acc?: number) {
    const g = window.google;
    const { Geocoder } = await g.maps.importLibrary('geocoding');
    // O Google as vezes nao responde: depois de 8 s cai pro OSM (em reverse()).
    const { results } = await Promise.race([
      new Geocoder().geocode({ location: { lat, lng } }),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error('geocode timeout')), 8000)),
    ]) as any;
    const best = (results ?? []).find((r: any) => r.types?.includes('street_address') || r.types?.includes('premise')) ?? results?.[0];
    if (!best) throw new Error('No encontramos tu dirección.');
    await apply(fromComponents(best.address_components ?? []), lat, lng, acc);
  }

  async function pick(s: any) {
    setSuggestions([]);
    setBusy(true); setMsg(null);
    try {
      const place = s.placePrediction.toPlace();
      await place.fetchFields({ fields: ['addressComponents', 'location', 'formattedAddress'] });
      token.current = null; // fecha a sessao do autocompletar
      setQuery(place.formattedAddress ?? '');
      await apply(fromComponents(place.addressComponents ?? []), place.location.lat(), place.location.lng());
    } catch { setMsg({ ok: false, text: 'No pudimos usar esa dirección. Prueba otra o escríbela abajo.' }); }
    finally { setBusy(false); }
  }

  async function locate() {
    setBusy(true); setMsg(null);
    try {
      const pos = await bestPosition();
      const { latitude: lat, longitude: lng, accuracy } = pos.coords;
      if (ready === 'ok') await reverse(lat, lng, accuracy);
      else await reverseOsm(lat, lng, accuracy);
    } catch (e: any) { setMsg({ ok: false, text: e?.message || 'No encontramos tu dirección.' }); }
    finally { setBusy(false); }
  }

  // Mapa com alfinete arrastavel.
  useEffect(() => {
    if (!point || ready !== 'ok' || !mapEl.current) return;
    const g = window.google;
    if (!map.current) {
      map.current = new g.maps.Map(mapEl.current, { center: point, zoom: 19, mapTypeId: 'hybrid', disableDefaultUI: true, zoomControl: true, gestureHandling: 'greedy', clickableIcons: false });
      marker.current = new g.maps.Marker({ position: point, map: map.current, draggable: true, title: 'Tu portal' });
      marker.current.addListener('dragend', async () => {
        const p = marker.current.getPosition();
        setBusy(true);
        try { await reverse(p.lat(), p.lng()); } catch (e: any) { setMsg({ ok: false, text: e?.message || 'No encontramos tu dirección.' }); }
        finally { setBusy(false); }
      });
      map.current.addListener('click', (e: any) => { marker.current.setPosition(e.latLng); g.maps.event.trigger(marker.current, 'dragend'); });
    } else {
      marker.current.setPosition(point);
      map.current.panTo(point);
    }
    if (circle.current) circle.current.setMap(null);
    circle.current = point.acc ? new g.maps.Circle({ map: map.current, center: point, radius: point.acc, strokeColor: '#c2410c', strokeOpacity: 0.6, strokeWeight: 1, fillColor: '#c2410c', fillOpacity: 0.08, clickable: false }) : null;
  }, [point, ready]);

  return (
    <div className="space-y-2">
      {ready === 'ok' && placesOk && (
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Busca tu dirección (calle y número)"
            aria-label="Buscar dirección"
            autoComplete="off"
            className="h-12 w-full rounded-2xl border-2 border-[#c2410c]/30 bg-white pl-10 pr-3 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-[#c2410c]"
          />
          {suggestions.length > 0 && (
            <ul className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg" role="listbox">
              {suggestions.map((s, i) => (
                <li key={i}>
                  <button type="button" onClick={() => pick(s)} className="flex w-full cursor-pointer items-start gap-2 px-3 py-2.5 text-left text-sm text-slate-800 hover:bg-orange-50">
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
      )}
      <button
        type="button"
        onClick={locate}
        disabled={busy || ready === 'loading'}
        className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#c2410c]/40 bg-orange-50/60 px-4 text-sm font-bold text-[#9a3412] transition-colors hover:border-[#c2410c] hover:bg-orange-50 disabled:cursor-wait disabled:opacity-60"
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} />}
        {busy ? 'Buscando tu dirección…' : 'Usar mi ubicación'}
      </button>
      {msg && <p className={`text-xs font-medium ${msg.ok ? 'text-emerald-700' : 'text-red-600'}`}>{msg.text}</p>}
      {point && ready === 'ok' && (
        <div>
          <div ref={mapEl} className="h-56 w-full overflow-hidden rounded-2xl border border-slate-200" />
          <p className="mt-1 text-[11px] text-slate-500">
            Arrastra el punto (o toca el mapa) hasta la puerta de tu casa.{point.acc ? ` Precisión del GPS: ±${Math.round(point.acc)} m.` : ''}
          </p>
        </div>
      )}
    </div>
  );
}
