'use client';
import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { toStoreProduct } from '@/lib/store-product';
import { useSectors } from './sectors-context';
import { useStoreProducts } from './use-store-products';

// Produto oferecido no fim de uma brincadeira: o da colecao cujo nome bate
// com `prefer` (ex: /dino/), senao o primeiro da colecao. Null = colecao
// ainda sem produto cadastrado.
export function useCollectionOffer(slug: string, prefer?: RegExp) {
  const { products } = useStoreProducts();
  const { collectionForCategory } = useSectors();
  return useMemo(() => {
    const items = products.filter((p) => collectionForCategory(p.category)?.slug === slug);
    const chosen = (prefer && items.find((p) => prefer.test(p.name))) || items[0];
    return chosen ? toStoreProduct(chosen) : null;
  }, [products, slug, prefer, collectionForCategory]);
}

// Fim de toda brincadeira: "¿Lo añadimos al carrito?" com o produto da
// colecao. "Sí" adiciona, fecha o popup e abre o carrinho. Sem produto
// cadastrado, leva pra pagina da colecao.
export function OfferPrompt({ slug, question, prefer, fallbackLabel, onClose, dark }: {
  slug: string;
  question: string;
  prefer?: RegExp;
  fallbackLabel: string;
  onClose: () => void;
  dark?: boolean;
}) {
  const offer = useCollectionOffer(slug, prefer);
  const { addItem, setIsCartOpen, setShowUpsell } = useCart();

  function addToCart() {
    if (!offer) return;
    addItem(offer);
    onClose();
    // Espera o popup da brincadeira terminar de fechar (senao o fechamento
    // dele fecha o carrinho junto) e abre o carrinho direto, sem o aviso
    // "¡Añadido al carrito!".
    setTimeout(() => { setShowUpsell(false); setIsCartOpen(true); }, 450);
  }

  const box = dark ? 'bg-white/10 text-white' : 'bg-white text-[#23263f]';
  const muted = dark ? 'text-white/75' : 'text-[#565a78]';

  return (
    <div className={`flex flex-col gap-3 rounded-3xl p-4 ${box}`} role="status">
      {offer ? (
        <>
          <div className="flex items-center gap-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#FFEBD9]">
              <Image src={offer.image} alt={offer.name} fill sizes="64px" className="object-cover" />
            </div>
            <div className="min-w-0 text-left">
              <p className="font-kids text-xl font-bold">{question}</p>
              <p className={`truncate text-sm ${muted}`}>{offer.name} · {offer.price.toFixed(2)}€</p>
            </div>
          </div>
          <button
            type="button"
            onClick={addToCart}
            className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#c2410c] font-extrabold text-white transition-colors hover:bg-[#9a3412]"
          >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" /> ¡Sí, añadir al carrito!
          </button>
        </>
      ) : (
        <>
          <p className="text-center font-kids text-xl font-bold">{question}</p>
          <Link
            href={`/coleccion/${slug}`}
            onClick={onClose}
            className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-2xl bg-[#c2410c] font-extrabold text-white transition-colors hover:bg-[#9a3412]"
          >
            {fallbackLabel}
          </Link>
        </>
      )}
    </div>
  );
}
