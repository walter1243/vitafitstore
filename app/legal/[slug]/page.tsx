import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { LEGAL_PAGES, LEGAL_SLUGS } from '@/lib/legal-content'
import { getSiteContent } from '@/lib/site-content'

export const dynamic = 'force-dynamic'

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const page = LEGAL_PAGES[slug]
  if (!page) return { title: 'Página no encontrada' }
  return { title: page.title }
}

export default async function LegalPage({ params }: PageProps) {
  const { slug } = await params
  const page = LEGAL_PAGES[slug]
  if (!page) notFound()

  const content = await getSiteContent()

  return (
    <div className="flex min-h-screen flex-col bg-[#FAF8F5]">
      <Header />
      <main className="flex-1 pt-36 pb-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-6 flex flex-wrap gap-x-1.5 text-xs text-slate-500">
            <Link href="/" className="hover:text-slate-800">Inicio</Link>
            <span>/</span>
            <span className="text-slate-700">{page.title}</span>
          </nav>

          <h1 className="mb-3 text-3xl font-bold text-slate-900">{page.title}</h1>
          <p className="mb-10 text-slate-600">{page.intro}</p>

          <div className="space-y-8">
            {page.sections.map((section) => (
              <div key={section.heading}>
                <h2 className="mb-2 text-lg font-semibold text-slate-800">{section.heading}</h2>
                <div className="space-y-2">
                  {section.body.map((paragraph, i) => (
                    <p key={i} className="text-sm leading-relaxed text-slate-600">{paragraph}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-xl border border-slate-200 bg-white p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Otros documentos</p>
            <div className="flex flex-wrap gap-2">
              {LEGAL_SLUGS.filter((s) => s !== slug).map((s) => (
                <Link
                  key={s}
                  href={`/legal/${s}`}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-orange-300 hover:text-orange-700"
                >
                  {LEGAL_PAGES[s].navLabel}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer content={content.footer} />
    </div>
  )
}
