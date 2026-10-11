import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CartProvider } from '@/lib/cart-context'
import SchemaOrg from '@/components/SchemaOrg'
import { CookieConsent } from '@/components/cookie-consent'
import { AnalyticsLoader } from '@/components/analytics-loader'
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
    default: 'Cestas de Regalo Personalizadas Online | Cesta & Encanto',
    template: '%s | Cesta & Encanto',
  },
  description:
    'Cestas de regalo personalizadas y cestas de Navidad en España: productos gourmet, presentación de lujo y tarjeta dedicatoria gratis. Envío gratis +50€. Entrega en 2-3 días.',
  keywords: [
    'cestas de regalo España',
    'cestas de Navidad online',
    'cestas personalizadas regalo',
    'regalos gourmet España',
    'cestas de regalo empresa',
    'regalos de Navidad online',
    'cestas gourmet personalizadas',
    'comprar cesta de regalo online',
    'tienda de cestas de regalo',
    'regalos originales España',
    'cestas de regalo entrega rápida',
    'cestas de regalo calidad premium',
    'tienda de regalos online España',
    'cestas de Navidad personalizadas',
    'regalos corporativos Navidad',
    'cestas de regalo Madrid',
    'cestas de regalo Barcelona',
    'comprar cesta de regalo España',
  ],
  authors: [{ name: 'Cesta & Encanto' }],
  alternates: {
    canonical: 'https://www.vitafitstore.es/',
  },
  icons: {
    icon: [
      { url: '/favicon-vitafit-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-vitafit-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon-vitafit-32.png',
    apple: [{ url: '/apple-icon-vitafit.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'Cestas de Regalo Personalizadas Online | Cesta & Encanto',
    description:
      'Cestas de regalo y cestas de Navidad hechas a mano, con productos gourmet seleccionados y presentación de lujo. Envío gratis en pedidos +50€. Entrega 2-3 días en toda España.',
    url: 'https://www.vitafitstore.es/',
    siteName: 'Cesta & Encanto',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: 'https://www.vitafitstore.es/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Cestas de Regalo Personalizadas de Cesta & Encanto',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Cestas de Regalo Personalizadas Online | Cesta & Encanto',
    description:
      'Cestas de regalo y cestas de Navidad con productos gourmet. Envío gratis +50€. Entrega 2-3 días en España.',
    images: ['https://www.vitafitstore.es/og-image.jpg'],
    creator: '@vitafitstore_es',
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
        <CookieConsent />
        <AnalyticsLoader />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
