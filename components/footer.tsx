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

export function Footer() {
  const [storeName, setStoreName] = useState('VitaFit Store')
  const [instagram, setInstagram] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [activePopup, setActivePopup] = useState<FooterSectionKey | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/store-settings', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        setStoreName(data?.storeName ?? 'VitaFit Store')
        setInstagram(data?.instagram ?? '')
        setWhatsapp(data?.whatsapp ?? '')
      } catch {
        // ignore
      }
    })()
  }, [])

  const socialLinks = [
    instagram.trim() && { icon: Instagram, href: `https://instagram.com/${instagram.replace(/^@/, '')}`, label: 'Instagram' },
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
                <h3 className="text-base font-semibold text-slate-900">{footerSections[activePopup].title}</h3>
                <button
                  type="button"
                  onClick={() => setActivePopup(null)}
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                  aria-label="Fechar popup"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="mb-3 text-sm leading-relaxed text-slate-600">{footerSections[activePopup].description}</p>

              <div className="space-y-2">
                {footerSections[activePopup].items.map((item) => (
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
                  {instagram.trim() && (
                    <a
                      href={`https://instagram.com/${instagram.replace(/^@/, '')}`}
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
                <Link
                  key={social.label}
                  href={social.href}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Links com popup */}
          {(Object.keys(footerSections) as FooterSectionKey[]).map((sectionKey) => (
            <div key={sectionKey}>
              <button
                type="button"
                onClick={() => setActivePopup(sectionKey)}
                className="mb-2 text-left font-semibold text-foreground transition-colors hover:text-primary"
              >
                {footerSections[sectionKey].title}
              </button>
              <p className="text-sm text-muted-foreground">{footerSections[sectionKey].description}</p>
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
