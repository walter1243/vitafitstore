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
    default: 'Juegos y lámparas infantiles impresos en 3D | Kitoys 3D',
    template: '%s | Kitoys 3D',
  },
  description:
    'Juegos, puzzles y lámparas para habitaciones infantiles impresos en 3D, capa a capa. Elige tu colección y recíbelo en casa en toda España.',
  keywords: [
    'juguetes impresos en 3D',
    'juegos infantiles impresión 3D',
    'puzzles 3D para niños',
    'juegos de mesa impresos en 3D',
    'lámparas infantiles',
    'lámpara habitación niños',
    'lámpara quitamiedos 3D',
    'decoración habitación infantil',
    'regalos originales para niños',
    'juguetes 3D España',
  ],
  authors: [{ name: 'Kitoys 3D' }],
  alternates: {
    canonical: 'https://www.kitoys3d.com/',
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
    title: 'Juegos y lámparas infantiles impresos en 3D | Kitoys 3D',
    description: 'Juegos, puzzles y lámparas para habitaciones infantiles impresos en 3D, capa a capa. Elige tu colección y recíbelo en casa en toda España.',
    url: 'https://www.kitoys3d.com/',
    siteName: 'Kitoys 3D',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: 'https://www.kitoys3d.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Juegos y lámparas infantiles impresos en 3D — Kitoys 3D',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Juegos y lámparas infantiles impresos en 3D | Kitoys 3D',
    description: 'Juegos, puzzles y lámparas para habitaciones infantiles impresos en 3D, capa a capa. Elige tu colección y recíbelo en casa en toda España.',
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
        <CookieConsent />
        <AnalyticsLoader />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
