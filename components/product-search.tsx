'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { toStoreProduct } from '@/lib/store-product';
import { useStoreProducts } from '@/components/kids/use-store-products';
import { useSectors } from '@/components/kids/sectors-context';

// Busca de produtos do cabecalho: sugestoes enquanto digita (foto, nome,
// preco, colecao) e Enter abre /buscar?q=... com todos os resultados.
// Ignora acentos e maiusculas ("lampara" acha "Lámpara").
export const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

export function useProductSearch(query: string) {
  const { products } = useStoreProducts();
  const { collectionForProduct } = useSectors();
  return useMemo(() => {
    const words = normalize(query).split(/\s+/).filter(Boolean);
    if (words.length === 0) return [];
    return products
      .map((p) => {
        const col = collectionForProduct(p);
        const hay = normalize(`${p.name} ${p.category ?? ''} ${col?.name ?? ''} ${p.description ?? ''}`);
        const name = normalize(p.name);
        if (!words.every((w) => hay.includes(w))) return null;
        const score = words.reduce((n, w) => n + (name.includes(w) ? 2 : 1), 0);
        return { product: toStoreProduct(p), collection: col?.name ?? '', score };
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score) as { product: ReturnType<typeof toStoreProduct>; collection: string; score: number }[];
  }, [query, products, collectionForProduct]);
}

export function ProductSearch({ autoFocus, onDone, className = '' }: { autoFocus?: boolean; onDone?: () => void; className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const results = useProductSearch(q).slice(0, 6);

  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  function go(href: string) {
    setOpen(false);
    setQ('');
    onDone?.();
    router.push(href);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (active >= 0 && results[active]) {
      const p = results[active].product;
      return go(`/producto/${p.id}-${p.slug}`);
    }
    if (q.trim()) go(`/buscar?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <div ref={boxRef} className={`relative ${className}`}>
      <form role="search" onSubmit={submit}>
        <label className="sr-only" htmlFor="busqueda-productos">Buscar productos</label>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#565a78]" aria-hidden="true" />
        <input
          id="busqueda-productos"
          type="search"
          value={q}
          autoFocus={autoFocus}
          autoComplete="off"
          onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(-1); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(results.length - 1, i + 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(-1, i - 1)); }
            if (e.key === 'Escape') { setOpen(false); onDone?.(); }
          }}
          placeholder="Buscar juguetes, llaveros, jarrones…"
          className="h-12 w-full rounded-full border-2 border-[#efe7da] bg-[#FFF8EF] pl-12 pr-11 text-base text-[#23263f] outline-none transition-colors placeholder:text-[#8a8ca6] focus:border-[#23263f] focus:bg-white"
          aria-autocomplete="list"
          aria-controls="busqueda-sugerencias"
          aria-expanded={open && q.trim().length > 0}
        />
        {q && (
          <button type="button" onClick={() => { setQ(''); setActive(-1); }} aria-label="Borrar búsqueda" className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-[#565a78] hover:bg-[#F2F4FA]">
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {open && q.trim() && (
        <div id="busqueda-sugerencias" role="listbox" className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-3xl border border-[#efe7da] bg-white shadow-[0_24px_48px_rgba(35,38,63,0.16)]">
          {results.length === 0 ? (
            <p className="px-5 py-5 text-sm text-[#565a78]">No encontramos nada con «{q}». Prueba con otra palabra.</p>
          ) : (
            <ul>
              {results.map(({ product: p, collection }, i) => (
                <li key={p.id} role="option" aria-selected={i === active}>
                  <Link
                    href={`/producto/${p.id}-${p.slug}`}
                    onClick={() => { setOpen(false); setQ(''); onDone?.(); }}
                    onMouseEnter={() => setActive(i)}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors ${i === active ? 'bg-[#FFF4E0]' : 'hover:bg-[#FFF8EF]'}`}
                  >
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#F2F4FA]">
                      <Image src={p.mainImage ?? p.image} alt="" fill sizes="48px" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-[#23263f]">{p.name}</span>
                      {collection && <span className="block truncate text-xs text-[#565a78]">{collection}</span>}
                    </span>
                    <span className="shrink-0 font-bold text-[#23263f]">{p.price.toFixed(2)}€</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => go(`/buscar?q=${encodeURIComponent(q.trim())}`)}
            className="block w-full cursor-pointer border-t border-[#efe7da] px-5 py-3 text-left text-sm font-bold text-[#c2410c] hover:bg-[#FFF8EF]"
          >
            Ver todos los resultados de «{q.trim()}»
          </button>
        </div>
      )}
    </div>
  );
}
