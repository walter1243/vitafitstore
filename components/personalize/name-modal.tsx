'use client';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { toStoreProduct } from '@/lib/store-product';
import { useSectors } from '@/components/kids/sectors-context';
import { useStoreProducts } from '@/components/kids/use-store-products';
import { NamePersonalizer, type PersonalizerLook } from './name-personalizer';

// "Ponle su nombre" aberto a partir de uma colecao (botao da faixa/menu):
// usa o primeiro produto personalizavel da colecao.
export function NameModal({ open, onOpenChange, slug }: { open: boolean; onOpenChange: (v: boolean) => void; slug: string }) {
  const { getCollection, getSector, collectionForProduct } = useSectors();
  const { products, loaded } = useStoreProducts();
  const collection = getCollection(slug);
  const raw = products.find((p) => collectionForProduct(p)?.slug === slug && toStoreProduct(p).personalize?.enabled);
  const product = raw ? toStoreProduct(raw) : null;
  const style = collection ? getSector(collection.sectorId)?.style : undefined;
  const look: PersonalizerLook = style === 'mascotas' || style === 'hogar' || style === 'infantil' ? style : 'llaveros';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] w-full overflow-y-auto rounded-[32px] border-0 bg-white p-5 sm:max-w-[760px] sm:p-7">
        <DialogTitle className="text-center text-3xl font-bold text-[#1E1B4B]" style={{ fontFamily: "'Fredoka', 'Nunito', sans-serif" }}>
          ¡Ponle su nombre!
        </DialogTitle>
        <DialogDescription className="text-center text-base text-[#3F3D6B]">
          Escribe el nombre y míralo al momento en {product ? product.name : 'el modelo'}.
        </DialogDescription>
        {product ? (
          <NamePersonalizer product={product} look={look} compact onAdded={() => setTimeout(() => onOpenChange(false), 900)} />
        ) : (
          <div className="py-8 text-center">
            <p className="text-base text-[#3F3D6B]">{loaded ? 'Muy pronto podrás personalizar aquí.' : 'Cargando…'}</p>
            {loaded && collection && (
              <Link href={`/coleccion/${collection.slug}`} className="mt-4 inline-flex min-h-12 items-center rounded-full bg-[#1E1B4B] px-6 font-bold text-white">
                Ver {collection.shortName.toLowerCase()}
              </Link>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
