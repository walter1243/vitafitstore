import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { CartSidebar } from '@/components/cart-sidebar';
import { ViceCityStore } from '@/components/sales/vice-city-store';
import { getSalesPage } from '@/lib/sales-pages';
import { getStoreProductsServer } from '@/lib/products-db';
import { toStoreProduct, type DbProduct } from '@/lib/store-product';
import { COUNTRY_COOKIE, countrySurcharge, viewerCountry } from '@/lib/country-price';
import { getAdminSessionFromCookieStore } from '@/lib/admin-auth';

// Página de venda temática (Admin → Páginas de venda). Vitrine sobre os
// produtos reais da Kitoys: o carrinho e o checkout (Stripe, Bizum, IVA,
// envío +25€) são os mesmos da loja — por isso montamos o CartSidebar.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getSalesPage(slug).catch(() => null);
  if (!page) return { title: 'Campaña no encontrada' };
  return {
    title: `${page.title} | Kitoys 3D`,
    description: page.subtitle,
    alternates: { canonical: `/tienda/${page.slug}` },
    robots: page.enabled ? undefined : { index: false, follow: false },
    openGraph: { title: page.title, description: page.subtitle, images: page.heroImage ? [page.heroImage] : undefined },
  };
}

export default async function SalesPage({ params }: PageProps) {
  const { slug } = await params;
  const [ck, hd] = await Promise.all([cookies(), headers()]);
  const page = await getSalesPage(slug).catch(() => null);
  if (!page) notFound();

  // Página desligada só aparece para quem está logado no painel (pré-visualização).
  const isAdmin = Boolean(getAdminSessionFromCookieStore(ck));
  if (!page.enabled && !isAdmin) notFound();

  const surcharge = await countrySurcharge(
    viewerCountry(ck.get(COUNTRY_COOKIE)?.value, hd.get('x-vercel-ip-country')),
  ).catch(() => 0);

  // Catálogo próprio da loja (produtos com store_slug = slug desta loja).
  const all = await getStoreProductsServer(surcharge, true, page.slug);
  const byId = new Map(all.map((p) => [Number(p.id), p as DbProduct]));
  const products = all.map((p) => toStoreProduct(p as DbProduct));
  const coverRaw = page.coverProductId ? byId.get(page.coverProductId) : undefined;
  const cover = coverRaw ? toStoreProduct(coverRaw) : (products[0] ?? null);

  return (
    <>
      <ViceCityStore config={page} products={products} cover={cover} />
      <CartSidebar />
    </>
  );
}
