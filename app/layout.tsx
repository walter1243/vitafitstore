import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CartProvider } from '@/lib/cart-context'
import SchemaOrg from '@/components/SchemaOrg'
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
    default: 'Calefacción y Confort Térmico Online | Tienda España',
    template: '%s | Nuestra Tienda',
  },
  description:
    'Compra productos de calefacción y confort térmico de calidad en España: calefactores, mantas eléctricas, bolsas de agua caliente y más. Envío gratis +50€. Entrega en 2-3 días.',
  keywords: [
    'calefacción hogar España',
    'calefactores eléctricos España',
    'mantas eléctricas online',
    'bolsas de agua caliente',
    'confort térmico invierno',
    'productos para el frío España',
    'calefacción bajo consumo',
    'comprar calefactor online',
    'tienda calefacción naturales España',
    'accesorios de invierno España',
    'calefacción entrega 24 horas España',
    'calefactores baratos calidad',
    'tienda confort térmico online',
    'productos invierno bienestar España',
    'calefacción eficiente premium',
    'calefacción Madrid',
    'calefacción Barcelona',
    'comprar calefactor eléctrico España',
  ],
  authors: [{ name: 'Nuestra Tienda' }],
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
    title: 'Calefacción y Confort Térmico Online | Tienda España',
    description:
      'Tu tienda de calefacción y confort térmico. Calefactores, mantas eléctricas, bolsas de agua caliente y más. Envío gratis en pedidos +50€. Entrega 2-3 días en toda España.',
    url: 'https://www.vitafitstore.es/',
    siteName: 'Nuestra Tienda',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: 'https://www.vitafitstore.es/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Calefacción y Confort Térmico de Alta Calidad en España',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Calefacción y Confort Térmico Online | Tienda España',
    description:
      'Calefactores, mantas eléctricas y bolsas de agua caliente. Envío gratis +50€. Entrega 2-3 días en España.',
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
  themeColor: '#0ea5e9',
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
        {/* Google Analytics GA4 */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-7HYXPMV30R"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-7HYXPMV30R', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <CartProvider>
          {children}
        </CartProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
