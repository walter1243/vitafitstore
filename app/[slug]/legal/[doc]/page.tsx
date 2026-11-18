import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { ChevronRight, Info } from 'lucide-react';
import { CartSidebar } from '@/components/cart-sidebar';
import { CookieSettingsButton } from '@/components/cookie-consent';
import { StoreFooter, StoreHeader } from '@/components/sales/store-chrome';
import { storeFontClass } from '@/components/sales/store-fonts';
import { LEGAL_PAGES, LEGAL_SLUGS, type LegalPage } from '@/lib/legal-content';
import { getAdminSessionFromCookieStore } from '@/lib/admin-auth';
import { getSalesPage, storeArt, storeIcons, storeLegalHref, storePath } from '@/lib/sales-pages';

// Políticas (envíos, devoluciones, privacidad…) de cada loja própria, com o
// visual e o NOME dela: /vice-city/legal/aviso-legal. O texto é o mesmo da
// Kitoys (lib/legal-content.ts) com "Kitoys 3D" trocado pelo nome da loja.
// Titular, NIF, domicílio e e-mail continuam os reais (exigência da LSSI-CE).
export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string; doc: string }> };

// Troca a marca da Kitoys pelo nome da loja (e-mail/domínio em minúsculas ficam).
function rebrand(page: LegalPage, name: string): LegalPage {
  const t = (v: string) => v.replace(/Kitoys 3D|Kitoys3D|Kitoys/g, name);
  return {
    ...page,
    title: t(page.title),
    intro: t(page.intro),
    sections: page.sections.map((s) => ({
      ...s,
      heading: t(s.heading),
      body: s.body.map(t),
      table: s.table ? { head: s.table.head.map(t), rows: s.table.rows.map((r) => r.map(t)) } : undefined,
    })),
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, doc } = await params;
  const store = await getSalesPage(slug).catch(() => null);
  const page = LEGAL_PAGES[doc];
  if (!store || !page) return { title: 'Página no encontrada' };
  return {
    title: { absolute: `${page.title} | ${store.title}` },
    alternates: { canonical: storeLegalHref(store.slug, doc) },
    icons: storeIcons(store),
  };
}

export default async function StoreLegalPage({ params }: PageProps) {
  const { slug, doc } = await params;
  const base = LEGAL_PAGES[doc];
  const store = await getSalesPage(slug).catch(() => null);
  if (!base || !store) notFound();
  if (!store.enabled && !getAdminSessionFromCookieStore(await cookies())) notFound();

  const page = rebrand(base, store.title);
  const art = storeArt(store);
  const S = store.neonSecondary;
  const P = store.neonPrimary;

  return (
    <div data-kt-store={store.slug} className={`${storeFontClass} relative flex min-h-screen flex-col overflow-x-clip bg-[#0d0418] text-white`}>
      {/* fundo: a arte da loja bem desfocada no topo */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] overflow-hidden">
        <div className="absolute -inset-16 bg-cover bg-center opacity-50 blur-[60px]" style={{ backgroundImage: `url(${art.ambient})` }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 0%, #0d0418cc 50%, #0d0418 100%)' }} />
      </div>

      <StoreHeader store={store} />

      <main className="relative z-10 mx-auto w-full max-w-3xl flex-1 px-4 pb-20 pt-8 sm:pt-12">
        <nav aria-label="Ruta" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-white/55">
          <Link href={storePath(store.slug)} className="hover:text-white">{store.title}</Link>
          <ChevronRight size={12} aria-hidden />
          <span className="text-white/80">{page.title}</span>
        </nav>

        <h1 className="font-store-display text-3xl leading-tight sm:text-4xl" style={{ textShadow: `0 0 22px ${P}66` }}>{page.title}</h1>
        <p className="mt-3 text-base leading-relaxed text-white/75">{page.intro}</p>

        <p className="mt-6 flex gap-3 rounded-2xl border border-white/12 bg-white/[0.04] p-4 text-sm leading-relaxed text-white/75">
          <Info size={18} className="mt-0.5 shrink-0" style={{ color: S }} aria-hidden />
          <span>Los pedidos, pagos, envíos y devoluciones de <strong className="text-white">{store.title}</strong> se rigen por estas condiciones.</span>
        </p>

        <div className="mt-10 space-y-9">
          {page.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-white">
                <span className="h-4 w-1 rounded-full" style={{ background: `linear-gradient(180deg, ${S}, ${P})` }} aria-hidden />
                {section.heading}
              </h2>
              <div className="space-y-2.5">
                {section.body.map((paragraph, i) => (
                  <p key={i} className="text-[15px] leading-relaxed text-white/70">{paragraph}</p>
                ))}
              </div>
              {section.table && (
                <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03]">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead className="text-[11px] uppercase tracking-[0.14em] text-white/50">
                      <tr>{section.table.head.map((h) => <th key={h} scope="col" className="px-4 py-3 font-bold">{h}</th>)}</tr>
                    </thead>
                    <tbody className="text-white/70">
                      {section.table.rows.map((row) => (
                        <tr key={row[0]} className="border-t border-white/[0.07]">{row.map((cell, i) => <td key={i} className="px-4 py-3 align-top">{cell}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {doc === 'cookies' && section.heading.startsWith('Cómo aceptar') && (
                <div className="mt-3 inline-block rounded-xl bg-white p-1"><CookieSettingsButton /></div>
              )}
            </section>
          ))}
        </div>

        <div className="mt-14 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">Otros documentos</p>
          <div className="flex flex-wrap gap-2">
            {LEGAL_SLUGS.filter((s) => s !== doc).map((s) => (
              <Link key={s} href={storeLegalHref(store.slug, s)}
                className="inline-flex min-h-10 items-center rounded-xl border border-white/12 bg-white/[0.04] px-3.5 text-sm font-medium text-white/80 transition-colors hover:border-white/40 hover:text-white">
                {LEGAL_PAGES[s].navLabel}
              </Link>
            ))}
          </div>
        </div>
      </main>

      <StoreFooter store={store} />
      <CartSidebar />
    </div>
  );
}
