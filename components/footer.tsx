"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Leaf, Instagram, MessageCircle, X } from 'lucide-react'

const footerLinks = {
  productos: [
    { label: 'Suplementos', href: '#salud' },
    { label: 'Vitaminas', href: '#salud' },
    { label: 'Accesorios Fitness', href: '#fitness' },
    { label: 'Ofertas', href: '#productos' },
  ],
  empresa: [
    { label: 'Sobre nosotros', href: '#nosotros' },
    { label: 'Blog', href: '#' },
    { label: 'Trabaja con nosotros', href: '#' },
    { label: 'Contacto', href: '#' },
  ],
  ayuda: [
    { label: 'Preguntas frecuentes', href: '#' },
    { label: 'Envíos y entregas', href: '#' },
    { label: 'Devoluciones', href: '#' },
    { label: 'Formas de pago', href: '#' },
  ],
  legal: [
    { label: 'Aviso legal', href: '#' },
    { label: 'Política de privacidad', href: '#' },
    { label: 'Cookies', href: '#' },
    { label: 'Términos y condiciones', href: '#' },
  ],
}

type FooterSectionKey = keyof typeof footerLinks

const footerSections: { key: FooterSectionKey; title: string }[] = [
  { key: 'productos', title: 'Productos' },
  { key: 'empresa', title: 'Empresa' },
  { key: 'ayuda', title: 'Ayuda' },
  { key: 'legal', title: 'Legal' },
]

const footerSectionText: Record<FooterSectionKey, string> = {
  productos: 'Encuentra rápidamente las categorías y productos que buscas en la tienda.',
  empresa: 'Conoce mejor VitaFit, nuestros canales y la información institucional.',
  ayuda: 'Centro de atención al cliente y SAC para pedidos, entregas, cambios y pagos.',
  legal: 'Documentos oficiales de privacidad, cookies y condiciones de la tienda.',
}

export function Footer() {
  const [storeName, setStoreName] = useState('VitaFit Store')
  const [instagram, setInstagram] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [activePopup, setActivePopup] = useState<FooterSectionKey | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/store-settings')
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
                <h3 className="text-base font-semibold text-slate-900">
                  {footerSections.find(s => s.key === activePopup)?.title}
                </h3>
                <button
                  type="button"
                  onClick={() => setActivePopup(null)}
                  className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                  aria-label="Fechar popup"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="mb-3 text-sm leading-relaxed text-slate-600">
                {footerSectionText[activePopup]}
              </p>

              <ul className="space-y-2">
                {footerLinks[activePopup].map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      onClick={() => setActivePopup(null)}
                      className="block rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-100 hover:text-emerald-700"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
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
          {footerSections.map((section) => (
            <div key={section.key}>
              <button
                type="button"
                onClick={() => setActivePopup(section.key)}
                className="mb-2 text-left font-semibold text-foreground transition-colors hover:text-primary"
              >
                {section.title}
              </button>
              <p className="text-sm text-muted-foreground">Haz clic para abrir</p>
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
