"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ChevronDown, Flame, Instagram, Mail, MessageCircle, PhoneCall } from 'lucide-react'
import { ScrollReveal } from '@/components/scroll-reveal'
import { PAYMENT_LOGOS } from '@/components/payment-logos'
import { DEFAULT_FOOTER, type FooterContent } from '@/lib/site-content-defaults'

type FooterSectionKey = 'productos' | 'ayuda' | 'legal'

type FooterItem = {
  title: string
  description: string
  href?: string
}

type FooterSectionConfig = {
  title: string
  description: string
  items: FooterItem[]
}

const footerSections: Record<FooterSectionKey, FooterSectionConfig> = {
  productos: {
    title: 'Productos',
    description: 'Explora nuestras categorías y encuentra rápidamente lo que buscas.',
    items: [],
  },
  ayuda: {
    title: 'Ayuda y Soporte',
    description: 'Soporte profesional para pedidos, pagos, cambios y entregas.',
    items: [
      { title: 'Atención por WhatsApp', description: 'Lunes a viernes, 9:00 a 18:00 (Madrid).' },
      { title: 'Envíos y entregas', description: 'Plazos, transportistas y seguimiento de pedidos.', href: '/legal/envios' },
      { title: 'Devoluciones y reembolsos', description: 'Derecho de desistimiento de 14 días.', href: '/legal/devoluciones' },
      { title: 'Pagos y facturación', description: 'Tarjeta, PayPal y métodos locales compatibles.' },
    ],
  },
  legal: {
    title: 'Legal',
    description: 'Documentos y políticas para una compra segura y transparente.',
    items: [
      { title: 'Aviso legal', description: 'Identificación y términos de uso de la plataforma.', href: '/legal/aviso-legal' },
      { title: 'Política de privacidad', description: 'Tratamiento de datos personales y consentimiento.', href: '/legal/privacidad' },
      { title: 'Política de cookies', description: 'Uso de cookies técnicas y analíticas.', href: '/legal/cookies' },
      { title: 'Términos y condiciones', description: 'Reglas de compra, entrega y garantía.', href: '/legal/terminos' },
    ],
  },
}

type CategoryMeta = {
  id: number
  name: string
  slug: string
  enabled?: boolean
}

function slugifyCategory(raw?: string) {
  if (!raw) return 'geral'
  return raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(new RegExp('[\\u0300-\\u036f]', 'g'), '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function toCategoryAnchor(raw?: string) {
  const slug = slugifyCategory(raw)
  if (slug === 'salud') return '#salud'
  if (slug === 'fitness') return '#fitness'
  return `#cat-${slug}`
}

function normalizeInstagramHref(input: string) {
  const value = String(input || '').trim()
  if (!value) return ''
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  return `https://instagram.com/${value.replace(/^@/, '')}`
}

export function Footer({ content }: { content?: FooterContent }) {
  const footerContent = { ...DEFAULT_FOOTER, ...content }
  const [storeName, setStoreName] = useState('Nuestra Tienda')
  const [instagram, setInstagram] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [openSections, setOpenSections] = useState<Set<FooterSectionKey>>(new Set())
  const [categories, setCategories] = useState<CategoryMeta[]>([])

  function toggleSection(key: FooterSectionKey) {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  useEffect(() => {
    ;(async () => {
      try {
        const [settingsRes, categoriesRes] = await Promise.all([
          fetch('/api/store-settings', { cache: 'no-store' }),
          fetch('/api/categories', { cache: 'no-store' }),
        ])

        if (settingsRes.ok) {
          const data = await settingsRes.json()
          setStoreName(data?.storeName ?? 'Nuestra Tienda')
          setInstagram(data?.instagram ?? '')
          setWhatsapp(data?.whatsapp ?? '')
          setEmail(data?.email ?? '')
        }

        if (categoriesRes.ok) {
          const data = await categoriesRes.json()
          if (Array.isArray(data)) {
            setCategories(data.filter((c: CategoryMeta) => c?.enabled !== false))
          }
        }
      } catch {
        // ignore
      }
    })()
  }, [])

  const dynamicSections: Record<FooterSectionKey, FooterSectionConfig> = {
    ...footerSections,
    productos: {
      title: 'Productos',
      description: 'Explora nuestras categorías y encuentra rápidamente lo que buscas.',
      items: categories.length
        ? categories.map((category) => ({
            title: category.name,
            description: 'Categoría activa en la tienda.',
            href: toCategoryAnchor(category.slug || category.name),
          }))
        : [
            { title: 'Calefactores Portátiles', description: 'Añade categorías reales desde el panel admin.', href: '#productos' },
          ],
    },
    ayuda: {
      ...footerSections.ayuda,
      title: footerContent.ayuda.title,
      description: footerContent.ayuda.description,
    },
    legal: {
      ...footerSections.legal,
      title: footerContent.legal.title,
      description: footerContent.legal.description,
    },
  }

  const instagramHref = normalizeInstagramHref(instagram)
  const emailHref = email.trim() ? `mailto:${email.trim()}` : ''

  const socialLinks = [
    instagramHref && { icon: Instagram, href: instagramHref, label: 'Instagram' },
    whatsapp.trim() && {
      icon: MessageCircle,
      href: whatsapp.startsWith('http')
        ? whatsapp
        : `https://wa.me/${whatsapp.replace(/\D/g, '')}`,
      label: 'WhatsApp',
    },
    emailHref && { icon: Mail, href: emailHref, label: 'Email' },
  ].filter(Boolean) as { icon: typeof Instagram; href: string; label: string }[]

  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <ScrollReveal className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-700">
                <Flame className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">
                {storeName}
              </span>
            </Link>
            <p className="mb-6 max-w-xs text-sm text-slate-500">
              {footerContent.brandDescription}
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-orange-700 hover:text-white"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links — click a section to expand it inline (accordion), same behavior at every screen size */}
          {(Object.keys(dynamicSections) as FooterSectionKey[]).map((sectionKey) => {
            const isOpen = openSections.has(sectionKey)
            const section = dynamicSections[sectionKey]
            return (
              <div key={sectionKey}>
                <button
                  type="button"
                  onClick={() => toggleSection(sectionKey)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-2 text-left font-semibold text-slate-800 transition-colors hover:text-orange-700 cursor-pointer"
                >
                  {section.title}
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <p className="mt-2 text-sm text-slate-500">{section.description}</p>

                <div
                  className={`overflow-hidden transition-all duration-300 ${isOpen ? 'mt-3' : ''}`}
                  style={{ maxHeight: isOpen ? '600px' : '0px', opacity: isOpen ? 1 : 0 }}
                >
                  <div className="space-y-2">
                    {section.items.map((item) => (
                      <div key={item.title} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
                        {item.href ? (
                          <Link href={item.href} className="text-sm font-semibold text-slate-800 transition-colors hover:text-orange-700">
                            {item.title}
                          </Link>
                        ) : (
                          <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                        )}
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.description}</p>
                      </div>
                    ))}
                  </div>

                  {sectionKey === 'ayuda' && (
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {whatsapp.trim() && (
                        <a
                          href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-700 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-600"
                        >
                          <MessageCircle size={14} /> WhatsApp SAC
                        </a>
                      )}
                      {instagramHref && (
                        <a
                          href={instagramHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Instagram size={14} /> Instagram
                        </a>
                      )}
                      {emailHref && (
                        <a
                          href={emailHref}
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Mail size={14} /> Email SAC
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Seguridad y logística */}
          <div>
            <p className="mb-2 font-semibold text-slate-800">Seguridad y Logística</p>
            <p className="mb-3 text-sm text-slate-500">Pago encriptado y envío con seguimiento en toda España.</p>
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_LOGOS.map(({ key, label, Logo }) => (
                <span key={key} title={label} className="overflow-hidden rounded-md">
                  <Logo />
                </span>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Bottom */}
        <div className="mt-12 border-t border-slate-200 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-slate-500">
              © 2026 {storeName}. {footerContent.copyrightNote}
            </p>
            <div className="flex items-center gap-4">
              {whatsapp.trim() && (
                <a
                  href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-orange-700"
                >
                  <PhoneCall className="h-3.5 w-3.5" /> Soporte por WhatsApp
                </a>
              )}
              {emailHref && (
                <a href={emailHref} className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-orange-700">
                  <Mail className="h-3.5 w-3.5" /> {email}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
