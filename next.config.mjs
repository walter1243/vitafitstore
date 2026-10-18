/** @type {import('next').NextConfig} */
const nextConfig = {
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
