"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Leaf, Instagram, Mail, MessageCircle, PhoneCall, X } from 'lucide-react'

type FooterSectionKey = 'productos' | 'empresa' | 'ayuda' | 'legal'

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
    description: 'Explora categorias de la tienda y encuentra rapidamente lo que buscas.',
    items: [
      { title: 'Suplementos', description: 'Nutricion deportiva para energia y recuperacion.', href: '#salud' },
      { title: 'Vitaminas', description: 'Soporte diario para bienestar y defensas.', href: '#salud' },
      { title: 'Accesorios Fitness', description: 'Complementos para tu rutina de entrenamiento.', href: '#fitness' },
      { title: 'Ofertas', description: 'Productos destacados con promociones activas.', href: '#productos' },
    ],
  },
  empresa: {
    title: 'Empresa',
    description: 'Informacion institucional y canales oficiales de VitaFit.',
    items: [
      { title: 'Sobre nosotros', description: 'Conoce nuestra mision y compromiso con la calidad.', href: '#nosotros' },
      { title: 'Atencion comercial', description: 'Lunes a viernes, 9:00 a 18:00 (Madrid).' },
      { title: 'Email corporativo', description: 'sac@vitafitstore.com' },
      { title: 'Colaboraciones', description: 'Escribenos para alianzas y afiliaciones.' },
    ],
  },
  ayuda: {
    title: 'Ayuda y SAC',
    description: 'Soporte profesional para pedidos, pagos, cambios y entregas.',
    items: [
      { title: 'SAC WhatsApp', description: 'Respuesta rapida por chat para estado de pedido.' },
      { title: 'Envios y entregas', description: 'Plazo medio de 2 a 5 dias habiles en Espana.' },
      { title: 'Devoluciones', description: 'Solicitud de cambio o devolucion en hasta 14 dias.' },
      { title: 'Pagos y facturacion', description: 'Tarjeta, PayPal y metodos locales compatibles.' },
    ],
  },
  legal: {
    title: 'Legal',
    description: 'Documentos y politicas para una compra segura y transparente.',
    items: [
      { title: 'Aviso legal', description: 'Identificacion y terminos de uso de la plataforma.' },
      { title: 'Politica de privacidad', description: 'Tratamiento de datos personales y consentimiento.' },
      { title: 'Politica de cookies', description: 'Uso de cookies tecnicas y analiticas.' },
      { title: 'Terminos y condiciones', description: 'Reglas de compra, entrega y garantia.' },
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
    .replace(/[\u0300-\u036f]/g, '')
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

export function Footer() {
  const [storeName, setStoreName] = useState('VitaFit Store')
  const [instagram, setInstagram] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [activePopup, setActivePopup] = useState<FooterSectionKey | null>(null)
  const [categories, setCategories] = useState<CategoryMeta[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        const [settingsRes, categoriesRes] = await Promise.all([
          fetch('/api/store-settings', { cache: 'no-store' }),
          fetch('/api/categories', { cache: 'no-store' }),
        ])

        if (settingsRes.ok) {
          const data = await settingsRes.json()
          setStoreName(data?.storeName ?? 'VitaFit Store')
          setInstagram(data?.instagram ?? '')
          setWhatsapp(data?.whatsapp ?? '')
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
      description: 'Explora categorias creadas en el panel admin y navega directo en la vitrina.',
      items: categories.length
        ? categories.map((category) => ({
            title: category.name,
            description: 'Categoria activa en la tienda.',
            href: toCategoryAnchor(category.slug || category.name),
          }))
        : [
            { title: 'Sin categorias activas', description: 'Crea categorias no admin para aparecer aqui.', href: '#productos' },
          ],
    },
  }

  const instagramHref = normalizeInstagramHref(instagram)

  const socialLinks = [
    instagramHref && { icon: Instagram, href: instagramHref, label: 'Instagram' },
    whatsapp.trim() && {
      icon: MessageCircle,
      href: whatsapp.startsWith('http')
        ? whatsapp
        : `https://wa.me/${whatsapp.replace(/\D/g, '')}`,
      label: 'WhatsApp',
    },
  ].filter(Boolean) as { icon: typeof Instagram; href: string; label: string }[]

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {activePopup && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4" onClick={() => setActivePopup(null)}>
            <div
              className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 text-slate-800 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">{dynamicSections[activePopup].title}</h3>
                <button
                  type="button"
                  onClick={() => setActivePopup(null)}
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                  aria-label="Fechar popup"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="mb-3 text-sm leading-relaxed text-slate-600">{dynamicSections[activePopup].description}</p>

              <div className="space-y-2">
                {dynamicSections[activePopup].items.map((item) => (
                  <div key={item.title} className="rounded-lg border border-slate-200 p-3">
                    {item.href ? (
                      <Link
                        href={item.href}
                        onClick={() => setActivePopup(null)}
                        className="text-sm font-semibold text-slate-800 transition-colors hover:text-emerald-700"
                      >
                        {item.title}
                      </Link>
                    ) : (
                      <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                    )}
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.description}</p>
                  </div>
                ))}
              </div>

              {activePopup === 'ayuda' && (
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {whatsapp.trim() && (
                    <a
                      href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
                    >
                      <MessageCircle size={14} /> WhatsApp SAC
                    </a>
                  )}
                  {instagramHref && (
                    <a
                      href={instagramHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                    >
                      <Instagram size={14} /> Instagram
                    </a>
                  )}
                  <a
                    href="mailto:sac@vitafitstore.com"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                  >
                    <Mail size={14} /> Email SAC
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Leaf className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">
                {storeName}
              </span>
            </Link>
            <p className="mb-6 max-w-xs text-sm text-muted-foreground">
              Tu tienda online de salud, bienestar y fitness en España. 
              Productos de calidad para cuidar de ti.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links com popup */}
          {(Object.keys(dynamicSections) as FooterSectionKey[]).map((sectionKey) => (
            <div key={sectionKey}>
              <button
                type="button"
                onClick={() => setActivePopup(sectionKey)}
                className="mb-2 text-left font-semibold text-foreground transition-colors hover:text-primary"
              >
                {dynamicSections[sectionKey].title}
              </button>
              <p className="text-sm text-muted-foreground">{dynamicSections[sectionKey].description}</p>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-border pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              © 2026 {storeName}. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><PhoneCall className="h-3.5 w-3.5" /> SAC comercial</span>
              <span className="text-xs text-muted-foreground">Métodos de pago:</span>
              <div className="flex items-center gap-2">
                <div className="rounded bg-card px-2 py-1 text-xs font-medium text-muted-foreground">Visa</div>
                <div className="rounded bg-card px-2 py-1 text-xs font-medium text-muted-foreground">Mastercard</div>
                <div className="rounded bg-card px-2 py-1 text-xs font-medium text-muted-foreground">PayPal</div>
                <div className="rounded bg-card px-2 py-1 text-xs font-medium text-muted-foreground">Bizum</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
