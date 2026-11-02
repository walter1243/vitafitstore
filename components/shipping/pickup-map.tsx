'use client';
import { useEffect, useRef, useState } from 'react';
import { Check, Clock, MapPin, X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import type { Map as LMap, Marker } from 'leaflet';
import type { PickupPoint } from './shipping-options';
import { kmLabel, todayHours, type Origin } from './pickup-geo';

// Escolha do ponto de recogida no mapa (como na Vinted): mapa de ruas
// (OpenStreetMap) com a casa do cliente e os pontos numerados por
// distancia; tocar no pino ou na lista seleciona, "Elegir este punto"
// confirma.

const DAY_ES: Record<string, string> = { monday: 'Lun', tuesday: 'Mar', wednesday: 'Mié', thursday: 'Jue', friday: 'Vie', saturday: 'Sáb', sunday: 'Dom' };

function weekHours(p: PickupPoint) {
  return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((d) => [DAY_ES[d], p.hours?.[d] || 'Cerrado'] as const);
}

const pinHtml = (n: number, on: boolean) =>
  `<div style="display:flex;align-items:center;justify-content:center;width:${on ? 38 : 30}px;height:${on ? 38 : 30}px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${on ? '#0071e3' : '#1d1d1f'};border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.3)"><span style="transform:rotate(45deg);color:#fff;font:700 ${on ? 14 : 12}px/1 system-ui,sans-serif">${n}</span></div>`;

const homeHtml =
  '<div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:#d70015;border:3px solid #fff;box-shadow:0 4px 12px rgba(0,0,0,.3)"><svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><path d="M12 3 2 12h3v8h5v-6h4v6h5v-8h3z"/></svg></div>';

export function PickupMapModal({ points, origin, value, onChoose, onClose }: {
  points: (PickupPoint & { km: number | null })[];
  origin: Origin;
  value: PickupPoint | null;
  onChoose: (p: PickupPoint) => void;
  onClose: () => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LMap | null>(null);
  const markers = useRef<Map<string, Marker>>(new Map());
  const listRef = useRef<HTMLUListElement>(null);
  const [sel, setSel] = useState<string | null>(value?.id ?? points[0]?.id ?? null);
  const selRef = useRef(sel);
  selRef.current = sel;

  // Trava a rolagem da pagina e fecha com Esc.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [onClose]);

  // Monta o mapa (leaflet so roda no navegador).
  useEffect(() => {
    let alive = true;
    (async () => {
      const L = (await import('leaflet')).default;
      if (!alive || !boxRef.current || mapRef.current) return;
      const map = L.map(boxRef.current, { zoomControl: false, attributionControl: true });
      mapRef.current = map;
      L.control.zoom({ position: 'topright' }).addTo(map);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);
      const bounds: [number, number][] = [];
      if (origin) {
        L.marker([origin.lat, origin.lng], { icon: L.divIcon({ html: homeHtml, className: '', iconSize: [34, 34], iconAnchor: [17, 17] }), keyboard: false, title: 'Tu dirección' }).addTo(map);
        bounds.push([origin.lat, origin.lng]);
      }
      points.forEach((p, i) => {
        if (p.lat == null || p.lng == null) return;
        const on = p.id === selRef.current;
        const m = L.marker([p.lat, p.lng], {
          icon: L.divIcon({ html: pinHtml(i + 1, on), className: '', iconSize: on ? [38, 38] : [30, 30], iconAnchor: on ? [19, 38] : [15, 30] }),
          title: p.name,
          zIndexOffset: on ? 1000 : 0,
        }).addTo(map);
        m.on('click', () => setSel(p.id));
        markers.current.set(p.id, m);
        bounds.push([p.lat, p.lng]);
      });
      // Enquadra a casa + os pontos mais proximos.
      const near = bounds.slice(0, origin ? 6 : 5);
      if (near.length > 1) map.fitBounds(near, { padding: [36, 36], maxZoom: 16 });
      else if (near.length === 1) map.setView(near[0], 15);
      else map.setView([40.4, -3.7], 6);
      setTimeout(() => map.invalidateSize(), 50);
    })();
    return () => {
      alive = false;
      mapRef.current?.remove();
      mapRef.current = null;
      markers.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Selecionado: pino azul e maior, mapa centraliza, lista rola ate ele.
  useEffect(() => {
    (async () => {
      const L = (await import('leaflet')).default;
      points.forEach((p, i) => {
        const m = markers.current.get(p.id);
        if (!m) return;
        const on = p.id === sel;
        m.setIcon(L.divIcon({ html: pinHtml(i + 1, on), className: '', iconSize: on ? [38, 38] : [30, 30], iconAnchor: on ? [19, 38] : [15, 30] }));
        m.setZIndexOffset(on ? 1000 : 0);
      });
      const p = points.find((x) => x.id === sel);
      if (p?.lat != null && p.lng != null && mapRef.current) mapRef.current.panTo([p.lat, p.lng], { animate: true });
      listRef.current?.querySelector(`[data-id="${CSS.escape(sel ?? '')}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    })();
  }, [sel, points]);

  const chosen = points.find((p) => p.id === sel) ?? null;

  return (
    <div className="fixed inset-0 z-[80] flex items-stretch justify-center bg-black/50 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="Elige un punto de recogida">
      <div className="flex h-full w-full flex-col overflow-hidden bg-white sm:h-[min(760px,92vh)] sm:max-w-3xl sm:rounded-3xl">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <div>
            <p className="text-[17px] font-bold text-slate-900">Elige un punto de recogida</p>
            <p className="text-xs text-slate-500">{points.length} puntos cerca de tu dirección</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-full hover:bg-slate-100" aria-label="Cerrar">
            <X className="h-5 w-5 text-slate-700" />
          </button>
        </div>

        <div className="relative h-[45%] shrink-0 bg-[#e8eef3] sm:h-[50%]">
          <div ref={boxRef} className="absolute inset-0 z-0" />
        </div>

        <ul ref={listRef} className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto" role="radiogroup" aria-label="Puntos de recogida">
          {points.map((p, i) => {
            const on = p.id === sel;
            return (
              <li key={p.id} data-id={p.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setSel(p.id)}
                  className={`flex w-full cursor-pointer items-start gap-3 px-4 py-3 text-left transition-colors ${on ? 'bg-[#0071e3]/[0.06]' : 'hover:bg-slate-50'}`}
                >
                  <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${on ? 'bg-[#0071e3]' : 'bg-slate-900'}`}>{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="text-sm font-bold text-slate-900">{p.name}</span>
                      {p.km != null && <span className="shrink-0 text-xs font-semibold text-slate-600">{kmLabel(p.km)}</span>}
                    </span>
                    <span className="block text-xs text-slate-600">{p.address} · {p.zip} {p.city}</span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" aria-hidden="true" />{todayHours(p)}</span>
                      {p.carrier && <span>· {p.carrier}</span>}
                    </span>
                    {on && Object.keys(p.hours ?? {}).length > 0 && (
                      <span className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 rounded-lg bg-white px-3 py-2 text-[11px] text-slate-600 ring-1 ring-slate-200">
                        {weekHours(p).map(([d, t]) => (
                          <span key={d} className="contents"><span className="font-semibold">{d}</span><span>{t}</span></span>
                        ))}
                      </span>
                    )}
                  </span>
                  {on && <Check className="mt-1 h-5 w-5 shrink-0 text-[#0071e3]" aria-hidden="true" />}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="border-t border-slate-200 bg-white px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
          <button
            type="button"
            disabled={!chosen}
            onClick={() => { if (chosen) { onChoose(chosen); onClose(); } }}
            className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#0071e3] px-5 text-[15px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            <MapPin className="h-4 w-4" aria-hidden="true" />
            {chosen ? `Elegir ${chosen.name}` : 'Elige un punto'}
          </button>
        </div>
      </div>
    </div>
  );
}
