import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
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
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
