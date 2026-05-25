"use client"

import Link from 'next/link'
import { Leaf, Facebook, Instagram, Twitter, Youtube } from 'lucide-react'

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

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Youtube, href: '#', label: 'Youtube' },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Leaf className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">
                VitaFit<span className="text-primary">Store</span>
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

          {/* Links */}
          <div>
            <h3 className="mb-4 font-semibold text-foreground">Productos</h3>
            <ul className="space-y-3">
              {footerLinks.productos.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-foreground">Empresa</h3>
            <ul className="space-y-3">
              {footerLinks.empresa.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-foreground">Ayuda</h3>
            <ul className="space-y-3">
              {footerLinks.ayuda.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-foreground">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-muted-foreground hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-border pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-muted-foreground">
              © 2026 VitaFit Store. Todos los derechos reservados.
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
