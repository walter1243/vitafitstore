const isDev = process.env.NODE_ENV === 'development'

// CSP em modo teste (Report-Only): nao bloqueia nada, so avisa no console do
// navegador o que seria bloqueado. Quando o console ficar limpo em todas as
// paginas (loja, checkout com Stripe, admin), trocar a chave para
// 'Content-Security-Policy'.
const cspReportOnly = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} https://js.stripe.com https://*.js.stripe.com https://maps.googleapis.com https://www.googletagmanager.com https://connect.facebook.net https://widget.trustpilot.com https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "connect-src 'self' https://api.stripe.com https://maps.googleapis.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://www.facebook.com https://vercel.com https://*.public.blob.vercel-storage.com https://nominatim.openstreetmap.org https://*.trustpilot.com",
  "frame-src 'self' https://js.stripe.com https://*.js.stripe.com https://hooks.stripe.com https://widget.trustpilot.com https://*.trustpilot.com https://www.google.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ')

const securityHeaders = [
  // Parte da CSP que ja vale de verdade: nao mexe em scripts, so impede o site
  // de ser embutido em outro dominio (clickjacking) e plugins antigos.
  { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'" },
  { key: 'Content-Security-Policy-Report-Only', value: cspReportOnly },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // geolocation=(self): o checkout usa "usar minha localizacao" pra achar o
  // ponto de recogida. payment fica livre (Apple Pay / Google Pay do Stripe).
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), browsing-topics=()' },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
  { key: 'X-XSS-Protection', value: '0' },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
  // Chave publica do Stripe usada no checkout: STRIPE_KEY_PUBLIC (conta
  // Kitoys3D, Espanha) e, se nao existir, a antiga NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
  // Embutida no build — mudou na Vercel, precisa de um deploy novo.
  env: {
    NEXT_PUBLIC_STRIPE_PK: process.env.STRIPE_KEY_PUBLIC || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Pre-visualizacao local sem o banco: com PREVIEW_API_FROM definido (so em
  // .env.development.local, nunca na Vercel), a vitrine local le produtos,
  // categorias, configuracoes e conteudo do site publicado — da pra ver
  // mudancas de layout com os dados reais sem precisar de push. A Vercel
  // marca as variaveis do banco como sensiveis, entao elas nao vem no
  // `vercel env pull`.
  async rewrites() {
    const from = process.env.NODE_ENV === 'development' ? process.env.PREVIEW_API_FROM : ''
    if (!from) return []
    return {
      beforeFiles: ['products', 'categories', 'store-settings', 'site-content', 'home-blocks', 'checkout/quote'].map((route) => ({
        source: `/api/${route}`,
        destination: `${from.replace(/\/$/, '')}/api/${route}`,
      })),
    }
  },
}

export default nextConfig
