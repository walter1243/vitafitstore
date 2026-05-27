import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CartProvider } from '@/lib/cart-context'
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
  title: 'VitaFit Store | Suplementos y Bienestar en España',
  description: 'Tu tienda online de salud, bienestar y fitness. Suplementos de alta calidad, envío gratis en pedidos +50€. Entrega en España en 2-3 días.',
  keywords: ['suplementos', 'colágeno', 'vitaminas', 'fitness', 'bienestar', 'España', 'salud'],
  authors: [{ name: 'VitaFit Store' }],
  icons: {
    icon: [
      { url: '/favicon-vitafit-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-vitafit-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon-vitafit-32.png',
    apple: [{ url: '/apple-icon-vitafit.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'VitaFit Store | Suplementos y Bienestar en España',
    description: 'Tu tienda online de salud, bienestar y fitness. Suplementos de alta calidad.',
    locale: 'es_ES',
    type: 'website',
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
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <CartProvider>
          {children}
        </CartProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
