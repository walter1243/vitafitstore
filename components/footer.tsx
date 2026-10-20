"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Instagram, Lock, Mail, MessageCircle, Truck } from 'lucide-react'
import { PAYMENT_LOGOS } from '@/components/payment-logos'
import { useSectors } from '@/components/kids/sectors-context'
import { type FooterContent } from '@/lib/site-content-defaults'

// Contato: vem do Admin → Editar loja (WhatsApp, e-mail, Instagram); estes
// valores so aparecem enquanto as configuracoes carregam ou se estiverem vazias.
const DEFAULT_WHATSAPP = '+34 678 68 4704'
const DEFAULT_EMAIL = 'kitoys3d@gmail.com'
const waHref = (phone: string) => `https://wa.me/${phone.replace(/\D/g, '')}`
const LOGO = '/images/logo-kitoys-3d.png'

type FooterLink = { title: string; description: string; href: string; external?: boolean }

const ayuda = (whatsappHref: string): FooterLink[] => [
  { title: 'Centro de ayuda y preguntas frecuentes', description: 'Montaje, uso de rotuladores lavables y mantenimiento.', href: whatsappHref, external: true },
  { title: 'Seguimiento de envío', description: 'Localiza tu paquete con nuestros operadores logísticos.', href: '/legal/envios' },
  { title: 'Cambios y devoluciones', description: '14 días naturales conforme a la normativa europea.', href: '/legal/devoluciones' },
  { title: 'Garantía legal de 3 años', description: 'Cobertura ante cualquier defecto de fabricación.', href: '/legal/terminos' },
]

const LEGAL: FooterLink[] = [
  { title: 'Aviso legal', description: 'Datos del titular y domicilio de operaciones (LSSI-CE).', href: '/legal/aviso-legal' },
  { title: 'Política de privacidad', description: 'Tratamiento seguro de tus datos (RGPD UE 2016/679).', href: '/legal/privacidad' },
  { title: 'Política de cookies', description: 'Preferencias de navegación y analítica web.', href: '/legal/cookies' },
  { title: 'Condiciones generales de contratación', description: 'Términos de venta, pagos y resolución de litigios.', href: '/legal/terminos' },
]

// Logo de pagamento so aparece se o metodo esta ATIVO na conta Stripe
// (consulta /api/checkout/stripe-status): Bizum e PayPal entram sozinhos
// quando forem ativados — nunca prometer um metodo que o checkout nao tem.
const LOGO_NEEDS: Record<string, (methods: string[], bizum: string) => boolean> = {
  visa: (m) => m.includes('card'),
  mastercard: (m) => m.includes('card'),
  'apple-pay': (m) => m.includes('card'),
  'google-pay': (m) => m.includes('card'),
  paypal: (m) => m.includes('paypal'),
  bizum: (_m, bizum) => bizum === 'active',
}

function normalizeInstagramHref(input: string) {
  const value = String(input || '').trim()
  if (!value) return ''
  if (value.startsWith('http://') || value.startsWith('https://')) return value
  return `https://instagram.com/${value.replace(/^@/, '')}`
}

function LinkList({ items }: { items: FooterLink[] }) {
  return (
    <ul className="mt-4 space-y-3">
      {items.map((item) => (
        <li key={item.title}>
          {item.external ? (
            <a href={item.href} target="_blank" rel="noopener noreferrer" className="group block">
              <span className="block text-sm font-bold text-[#23263f] group-hover:text-[#c2410c]">{item.title}</span>
              <span className="block text-xs leading-relaxed text-[#565a78]">{item.description}</span>
            </a>
          ) : (
            <Link href={item.href} className="group block">
              <span className="block text-sm font-bold text-[#23263f] group-hover:text-[#c2410c]">{item.title}</span>
              <span className="block text-xs leading-relaxed text-[#565a78]">{item.description}</span>
            </Link>
          )}
        </li>
      ))}
    </ul>
  )
}

// Rodape da Kitoys 3D: marca, tres colunas (colecoes reais do Admin →
// Setores e coleções, ayuda e legal), seguranca/pagamentos e contato.
// `content` (do editor de conteudo) fica aceito por compatibilidade.
export function Footer(_props: { content?: FooterContent }) {
  const { collections } = useSectors()
  const [instagram, setInstagram] = useState('')
  const [whatsapp, setWhatsapp] = useState(DEFAULT_WHATSAPP)
  const [EMAIL, setEmail] = useState(DEFAULT_EMAIL)
  const [payment, setPayment] = useState<{ methods: string[]; bizum: string } | null>(null)

  useEffect(() => {
    fetch('/api/store-settings', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.instagram) setInstagram(d.instagram)
        if (String(d?.whatsapp ?? '').replace(/\D/g, '')) setWhatsapp(String(d.whatsapp).replace(/\s+/g, ' ').trim())
        if (d?.email) setEmail(String(d.email).trim())
      })
      .catch(() => {})
    fetch('/api/checkout/stripe-status')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (Array.isArray(d?.paymentMethods)) setPayment({ methods: d.paymentMethods, bizum: String(d.bizum ?? '') }) })
      .catch(() => {})
  }, [])

  const productos: FooterLink[] = collections.map((c) => ({
    title: c.name,
    description: c.tagline || c.description,
    href: `/coleccion/${c.slug}`,
  }))
  const logos = PAYMENT_LOGOS.filter(({ key }) => (payment ? LOGO_NEEDS[key]?.(payment.methods, payment.bizum) : key === 'visa' || key === 'mastercard'))
  const instagramHref = normalizeInstagramHref(instagram)
  const WHATSAPP_HREF = waHref(whatsapp)
  const WHATSAPP_DISPLAY = whatsapp

  return (
    <footer className="kids border-t border-[#efe7da] bg-[#FAF8F5]">
      {/* Marca */}
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-8 pt-12 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          <Link href="/" aria-label="Kitoys 3D — Inicio" className="shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO} alt="Kitoys 3D" className="h-16 w-auto object-contain" />
          </Link>
          <p className="max-w-xl text-sm leading-relaxed text-[#565a78]">
            Explora el universo creativo de kitoys3d: juguetes, puzzles y lámparas fabricados con tecnología de impresión 3D de alta precisión.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {instagramHref && (
            <a href={instagramHref} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#23263f] transition-colors hover:bg-[#23263f] hover:text-white">
              <Instagram className="h-5 w-5" />
            </a>
          )}
          <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#23263f] transition-colors hover:bg-[#23263f] hover:text-white">
            <MessageCircle className="h-5 w-5" />
          </a>
          <a href={`mailto:${EMAIL}`} aria-label="Email" className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#23263f] transition-colors hover:bg-[#23263f] hover:text-white">
            <Mail className="h-5 w-5" />
          </a>
        </div>
      </div>

      {/* Colunas */}
      <div className="border-y border-[#efe7da] bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <h2 className="font-kids text-xl font-bold text-[#23263f]">Productos</h2>
            <p className="mt-1 text-xs text-[#565a78]">Nuestras colecciones impresas en 3D.</p>
            <LinkList items={productos} />
          </div>
          <div id="ayuda-soporte" className="scroll-mt-24">
            <h2 className="font-kids text-xl font-bold text-[#23263f]">Ayuda y atención al cliente</h2>
            <p className="mt-1 text-xs text-[#565a78]">Atención personalizada desde España.</p>
            <LinkList items={ayuda(WHATSAPP_HREF)} />
          </div>
          <div>
            <h2 className="font-kids text-xl font-bold text-[#23263f]">Legal y transparencia</h2>
            <p className="mt-1 text-xs text-[#565a78]">Tus derechos como consumidor en la Unión Europea.</p>
            <LinkList items={LEGAL} />
          </div>
        </div>
      </div>

      {/* Seguranca e pagamentos */}
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="space-y-1.5 text-sm text-[#565a78]">
          <p className="flex items-center gap-2"><Lock className="h-4 w-4 shrink-0 text-[#15803d]" aria-hidden="true" /> Pago 100% seguro y encriptado (SSL/TLS) con autenticación reforzada (SCA).</p>
          <p className="flex items-center gap-2"><Truck className="h-4 w-4 shrink-0 text-[#15803d]" aria-hidden="true" /> Envíos con seguimiento a toda España peninsular y Baleares.</p>
        </div>
        <div className="flex flex-wrap gap-1.5" aria-label="Métodos de pago aceptados">
          {logos.map(({ key, label, Logo }) => (
            <span key={key} title={label} className="overflow-hidden rounded-md">
              <Logo />
            </span>
          ))}
        </div>
      </div>

      {/* Copyright e contato */}
      <div className="border-t border-[#efe7da]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 text-sm text-[#565a78] sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>© 2026 kitoys3d. Todos los derechos reservados.</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-5">
            <a href={WHATSAPP_HREF} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-[#23263f]">
              <MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp {WHATSAPP_DISPLAY}
            </a>
            <a href={`mailto:${EMAIL}`} className="inline-flex items-center gap-1.5 hover:text-[#23263f]">
              <Mail className="h-4 w-4" aria-hidden="true" /> {EMAIL}
            </a>
            <span className="text-xs">Respuesta en menos de 24 h laborables</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
