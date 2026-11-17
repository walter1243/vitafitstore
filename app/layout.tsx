import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CartProvider } from '@/lib/cart-context'
import SchemaOrg from '@/components/SchemaOrg'
import { CookieConsent } from '@/components/cookie-consent'
import { EntryStart } from '@/components/entry-start'
import { AnalyticsLoader } from '@/components/analytics-loader'
import { SiteTracker } from '@/components/site-tracker'
import { TranslateLoader } from '@/components/language-switcher'
import { CouponPopup } from '@/components/coupon-popup'
import './globals.css'

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans"
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono"
});

export const metadata: Metadata = {
  title: {
    default: 'Regalos personalizados y decoración impresos en 3D | Kitoys 3D',
    template: '%s | Kitoys 3D',
  },
  description:
    'Regalos personalizados con nombre, decoración para casa y Navidad impresos en 3D en España: placas de nacimiento, lámparas con foto, llaveros y más. Envío gratis desde 25 €.',
  keywords: [
    'regalos personalizados',
    'regalos personalizados con nombre',
    'placa de nacimiento personalizada',
    'lámpara personalizada con foto',
    'llaveros personalizados',
    'decoración impresa en 3D',
    'decoración navideña 3D',
    'organizadores de cocina 3D',
    'regalos originales España',
    'impresión 3D España',
  ],
  authors: [{ name: 'Kitoys 3D' }],
  alternates: {
    canonical: 'https://www.kitoys3d.com/',
  },
  // Favicon e icones de app com o logo Kitoys 3D (gerados de
  // public/images/logo-kitoys-3d.png).
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32 48x48' },
      { url: '/favicon-kitoys-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-kitoys-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-kitoys-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [{ url: '/apple-icon-kitoys.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'Regalos personalizados y decoración impresos en 3D | Kitoys 3D',
    description: 'Regalos personalizados con nombre, decoración para casa y Navidad impresos en 3D en España: placas de nacimiento, lámparas con foto, llaveros y más. Envío gratis desde 25 €.',
    url: 'https://www.kitoys3d.com/',
    siteName: 'Kitoys 3D',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: 'https://www.kitoys3d.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Regalos personalizados y decoración impresos en 3D — Kitoys 3D',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Regalos personalizados y decoración impresos en 3D | Kitoys 3D',
    description: 'Regalos personalizados con nombre, decoración para casa y Navidad impresos en 3D en España: placas de nacimiento, lámparas con foto, llaveros y más. Envío gratis desde 25 €.',
    images: ['https://www.kitoys3d.com/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'L4p3pJnAY5V7uebPqcTR-ytWuF0gg7EcsZNcBofS0O8',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#c2410c',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="bg-background">
      <head>
        <SchemaOrg />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <CartProvider>
          {children}
        </CartProvider>
        {/* GDPR: Google Analytics and the Meta Pixel only fire after explicit
           cookie consent — see components/cookie-consent.tsx and
           components/analytics-loader.tsx. Never load them unconditionally
           here again. */}
        {/* Tela do Cloudflare Turnstile na entrada desligada (nov/2026): era mais uma barreira
           para quem chega pelo anúncio. Para voltar: <HumanCheck /> de components/human-check.tsx. */}
        <EntryStart />
        <CookieConsent />
        <AnalyticsLoader />
        <SiteTracker />
        {/* Pop-up de boas-vindas com cupom (Admin → Editar loja → Pop-up de cupom) */}
        <CouponPopup />
        <TranslateLoader />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
