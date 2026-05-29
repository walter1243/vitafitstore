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
    default: 'Suplementos Europeos Online | VitaFit Store España',
    template: '%s | VitaFit Store',
  },
  description:
    'Compra suplementos europeos de alta calidad en España: proteínas, colágeno, vitaminas, pre-entreno y más. Envío gratis +50€. Entrega en 2-3 días. ✅ 100% Natural.',
  keywords: [
    'suplementos deportivos España',
    'proteína whey España',
    'colágeno hidrolizado España',
    'vitaminas y minerales online',
    'pre-entreno sin cafeína',
    'creatina monohidratada',
    'proteína vegana España',
    'suplementos fitness online',
    'comprar suplementos europeos online',
    'tienda suplementos naturales España',
    'suplementos sin aditivos artificiales',
    'proteína whey con creatina',
    'colágeno marino hidrolizado',
    'vitaminas para deportistas',
    'suplementos entrega 24 horas España',
    'suplementos gym baratos calidad',
    'VitaFit Store suplementos',
    'tienda fitness online España',
    'suplementos bienestar España',
    'nutrición deportiva premium',
    'suplementos Madrid',
    'suplementos Barcelona',
    'comprar whey protein España',
  ],
  authors: [{ name: 'VitaFit Store' }],
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
    title: 'Suplementos Europeos Online | VitaFit Store España',
    description:
      'Tu tienda de suplementos deportivos naturales. Proteínas, colágeno, vitaminas y más. Envío gratis en pedidos +50€. Entrega 2-3 días en toda España.',
    url: 'https://www.vitafitstore.es/',
    siteName: 'VitaFit Store',
    locale: 'es_ES',
    type: 'website',
    images: [
      {
        url: 'https://www.vitafitstore.es/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'VitaFit Store — Suplementos Europeos de Alta Calidad en España',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Suplementos Europeos Online | VitaFit Store España',
    description:
      'Proteínas, colágeno, vitaminas y pre-entreno naturales. Envío gratis +50€. Entrega 2-3 días en España.',
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
  themeColor: '#10b981',
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
