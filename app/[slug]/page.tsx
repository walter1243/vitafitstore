import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { CartSidebar } from '@/components/cart-sidebar';
import { ViceCityStore } from '@/components/sales/vice-city-store';
import { getSalesPage, storeIcons } from '@/lib/sales-pages';
import { getStoreProductsServer } from '@/lib/products-db';
import { toStoreProduct, type DbProduct } from '@/lib/store-product';
import { COUNTRY_COOKIE, countrySurcharge, viewerCountry } from '@/lib/country-price';
import { getAdminSessionFromCookieStore } from '@/lib/admin-auth';

// Link próprio de cada loja (multi-loja), o que vai no Instagram:
//   seusite.com/            → Kitoys (app/page.tsx)
//   seusite.com/vice-city   → VICE CITY STORE (esta página)
// As páginas fixas do site (/producto, /checkout, /admin…) têm prioridade sobre
// este endereço; endereço que não é loja dá 404. Catálogo próprio da loja
// (products.store_slug); carrinho e checkout Stripe são os mesmos da Kitoys.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getSalesPage(slug).catch(() => null);
  if (!page) return { title: 'Página no encontrada' };
  return {
    title: { absolute: page.title },
    description: page.subtitle,
    alternates: { canonical: `/${page.slug}` },
    robots: page.enabled ? undefined : { index: false, follow: false },
    icons: storeIcons(page),
    openGraph: {
      title: page.title,
      description: page.subtitle,
      siteName: page.title,
      images: page.heroImage || page.logoImage ? [page.heroImage || page.logoImage] : undefined,
    },
  };
}

export default async function StorePage({ params }: PageProps) {
  const { slug } = await params;
  const page = await getSalesPage(slug).catch(() => null);
  if (!page) notFound();

  const [ck, hd] = await Promise.all([cookies(), headers()]);
  // Loja em rascunho só aparece para quem está logado no painel (pré-visualização).
  const isAdmin = Boolean(getAdminSessionFromCookieStore(ck));
  if (!page.enabled && !isAdmin) notFound();

  const surcharge = await countrySurcharge(
    viewerCountry(ck.get(COUNTRY_COOKIE)?.value, hd.get('x-vercel-ip-country')),
  ).catch(() => 0);

  const all = await getStoreProductsServer(surcharge, true, page.slug);
  const products = all.map((p) => toStoreProduct(p as DbProduct));
  const cover = (page.coverProductId && products.find((p) => p.id === page.coverProductId)) || products[0] || null;

  return (
    <>
      <ViceCityStore config={page} products={products} cover={cover} preview={!page.enabled} />
      <CartSidebar />
    </>
  );
}
