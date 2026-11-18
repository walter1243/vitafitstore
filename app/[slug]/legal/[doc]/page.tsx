import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import { CartSidebar } from '@/components/cart-sidebar';
import { CookieSettingsButton } from '@/components/cookie-consent';
import { StoreFooter, StoreHeader } from '@/components/sales/store-chrome';
import { storeFontClass } from '@/components/sales/store-fonts';
import { LEGAL_PAGES, LEGAL_SLUGS, type LegalPage } from '@/lib/legal-content';
import { getAdminSessionFromCookieStore } from '@/lib/admin-auth';
import { getSalesPage, storeHeaderOffset, storeIcons, storeLegalHref, storePath } from '@/lib/sales-pages';

// Políticas (envíos, devoluciones, privacidad…) de cada loja própria, com o
// visual e o NOME dela: /vice-city/legal/aviso-legal. Layout limpo e organizado:
// menu dos documentos + índice da página ao lado (computador), abas + índice
// recolhível (celular), seções numeradas. O texto é o mesmo da Kitoys
// (lib/legal-content.ts) com "Kitoys 3D" trocado pelo nome da loja; titular,
// NIF, domicílio e e-mail continuam os reais (exigência da LSSI-CE).
export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ slug: string; doc: string }> };

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

const num = (i: number) => String(i + 1).padStart(2, '0');

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
  const stickyTop = storeHeaderOffset(store) + 24;

  const docLink = (s: string, mobile = false) => {
    const on = s === doc;
    return (
      <Link key={s} href={storeLegalHref(store.slug, s)} aria-current={on ? 'page' : undefined}
        className={mobile
          ? `shrink-0 border-b-2 py-3 text-xs font-semibold uppercase tracking-[0.16em] transition-colors ${on ? 'border-white text-white' : 'border-transparent text-white/50 hover:text-white'}`
          : `block border-l-2 py-2 pl-4 text-sm transition-colors ${on ? 'border-white font-semibold text-white' : 'border-white/10 text-white/55 hover:border-white/40 hover:text-white'}`}>
        {LEGAL_PAGES[s].navLabel}
      </Link>
    );
  };

  return (
    <div data-kt-store={store.slug} className={`${storeFontClass} relative flex min-h-screen flex-col overflow-x-clip bg-[#0b0614] text-white`}>
      <StoreHeader store={store} />

      {/* celular: abas dos documentos */}
      <nav aria-label="Documentos legales" className="mt-4 border-b border-white/10 lg:hidden">
        <div className="flex gap-6 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {LEGAL_SLUGS.map((s) => docLink(s, true))}
        </div>
      </nav>

      <div className="mx-auto grid w-full max-w-6xl flex-1 gap-12 px-4 pb-24 pt-10 lg:grid-cols-[220px_1fr] lg:pt-16">
        {/* computador: documentos + índice desta página, presos ao rolar */}
        <aside className="hidden lg:block">
          <div className="sticky space-y-10" style={{ top: stickyTop }}>
            <nav aria-label="Documentos legales">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">Documentos</p>
              {LEGAL_SLUGS.map((s) => docLink(s))}
            </nav>
            {page.sections.length > 1 && (
              <nav aria-label="En esta página">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/40">En esta página</p>
                <ol className="space-y-2 text-sm">
                  {page.sections.map((sec, i) => (
                    <li key={sec.heading}>
                      <a href={`#s${i + 1}`} className="flex gap-3 text-white/55 transition-colors hover:text-white">
                        <span className="tabular-nums text-white/30">{num(i)}</span>
                        <span>{sec.heading}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}
          </div>
        </aside>

        <main className="min-w-0 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">{store.title} · Información legal</p>
          <h1 className="font-store-display mt-3 text-5xl uppercase leading-[0.95] sm:text-6xl">{page.title}</h1>
          <p className="mt-5 text-lg leading-relaxed text-white/70">{page.intro}</p>
          <p className="mt-4 border-l-2 border-white/20 pl-4 text-sm leading-relaxed text-white/60">
            Los pedidos, pagos, envíos y devoluciones de {store.title} se rigen por estas condiciones.
          </p>

          {/* celular: índice recolhível */}
          {page.sections.length > 1 && (
            <details className="mt-8 border-y border-white/10 py-4 lg:hidden">
              <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Ver índice</summary>
              <ol className="mt-4 space-y-3 text-sm">
                {page.sections.map((sec, i) => (
                  <li key={sec.heading}>
                    <a href={`#s${i + 1}`} className="flex gap-3 text-white/65"><span className="tabular-nums text-white/30">{num(i)}</span>{sec.heading}</a>
                  </li>
                ))}
              </ol>
            </details>
          )}

          <div className="mt-10 divide-y divide-white/10 border-t border-white/10">
            {page.sections.map((section, i) => (
              <section key={section.heading} id={`s${i + 1}`} className="py-8" style={{ scrollMarginTop: stickyTop }}>
                <h2 className="flex items-baseline gap-4 text-xl font-semibold text-white">
                  <span className="font-store-display text-2xl tabular-nums text-white/30">{num(i)}</span>
                  {section.heading}
                </h2>
                <div className="mt-4 space-y-3 pl-0 sm:pl-12">
                  {section.body.map((paragraph, j) => (
                    <p key={j} className="text-base leading-[1.75] text-white/70">{paragraph}</p>
                  ))}
                  {section.table && (
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full min-w-[520px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-white/15">{section.table.head.map((h) => <th key={h} scope="col" className="py-3 pr-4 text-xs font-semibold uppercase tracking-[0.14em] text-white/50">{h}</th>)}</tr>
                        </thead>
                        <tbody className="text-white/70">
                          {section.table.rows.map((row) => (
                            <tr key={row[0]} className="border-b border-white/[0.07]">{row.map((cell, k) => <td key={k} className="py-3 pr-4 align-top">{cell}</td>)}</tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {doc === 'cookies' && section.heading.startsWith('Cómo aceptar') && (
                    <div className="mt-3 inline-block rounded-md bg-white p-1"><CookieSettingsButton /></div>
                  )}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-6 border-t border-white/10 pt-8">
            <Link href={storePath(store.slug)} className="inline-flex h-12 items-center rounded-md bg-white px-6 text-sm font-bold uppercase tracking-[0.12em] text-[#0b0614] transition-colors hover:bg-[#ff2d9b]">
              Volver a la tienda
            </Link>
          </div>
        </main>
      </div>

      <StoreFooter store={store} />
      <CartSidebar />
    </div>
  );
}
