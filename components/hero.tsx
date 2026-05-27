"use client"

import { ArrowRight, Shield, Zap, Leaf } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { allProducts } from '@/lib/products'

const productStrip1 = allProducts.slice(0, 6)
const productStrip2 = allProducts.slice(6, 12)

const gradients = [
  'from-emerald-500 to-teal-700',
  'from-pink-500 to-rose-700',
  'from-violet-500 to-purple-700',
  'from-amber-500 to-orange-700',
  'from-cyan-500 to-blue-700',
  'from-indigo-500 to-violet-700',
]

const badges = [
  { icon: Shield, label: "Certificado" },
  { icon: Zap, label: "Resultados" },
  { icon: Leaf, label: "Natural" },
]

function ConveyorCard({ product, index }: { product: typeof allProducts[0]; index: number }) {
  const grad = product.gradient || gradients[index % gradients.length]
  return (
    <div className="inline-flex flex-col items-center justify-between gap-2 rounded-2xl px-5 py-4 mx-3 min-w-[140px] glass cursor-default select-none">
      {/* Film-strip sprocket holes illusion */}
      <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center text-2xl shadow-lg`}>
        {product.emoji}
      </div>
      <div className="text-center">
        <p className="text-white font-semibold text-xs leading-tight line-clamp-1">{product.name}</p>
        <p className="text-emerald-400 font-bold text-sm mt-0.5">{product.price.toFixed(2)}€</p>
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#060F1E] min-h-[92vh] flex flex-col justify-center">
      {/* Animated ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="animate-blob animation-delay-0 absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-emerald-600/20 blur-[120px]" />
        <div className="animate-blob animation-delay-2000 absolute top-1/2 right-0 h-[400px] w-[400px] rounded-full bg-violet-600/15 blur-[100px]" />
        <div className="animate-blob animation-delay-4000 absolute bottom-0 left-1/3 h-[350px] w-[350px] rounded-full bg-teal-500/10 blur-[90px]" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Main content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-20 pb-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          {/* Top pill badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-2 text-sm font-semibold text-emerald-400 backdrop-blur-sm">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Envío gratis en pedidos +50€
          </div>

          {/* Heading */}
          <h1 className="mb-5 max-w-4xl text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl" style={{ fontFamily: 'var(--font-heading)' }}>
            Tu bienestar,{' '}
            <span className="relative">
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                nuestra misión
              </span>
              <span className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-emerald-400/0 via-emerald-400/60 to-emerald-400/0" />
            </span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-white/60 leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
            Suplementos premium certificados para adelgazamiento, salud y bienestar.
            Resultados reales, formulaciones naturales. Entrega en toda España en 2-3 días.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="gap-2 bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-6 text-base rounded-xl shadow-lg shadow-emerald-500/25 transition-all duration-300 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
              asChild
            >
              <a href="#categorias">
                Ver productos
                <ArrowRight className="h-5 w-5" />
              </a>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-8 py-6 text-base rounded-xl border-white/20 text-white/80 hover:bg-white/10 hover:text-white transition-all duration-300"
              asChild
            >
              <a href="#nosotros">Conocer VitaFit</a>
            </Button>
          </div>

          {/* Trust badges */}
          <div className="mt-10 flex items-center gap-8 flex-wrap justify-center">
            {badges.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 text-white/50 text-sm">
                <Icon className="h-4 w-4 text-emerald-400" />
                <span>{label}</span>
              </div>
            ))}
          </div>

          {/* Stats row */}
          <div className="mt-12 flex items-center divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
            {[
              { value: "50K+", label: "Clientes felices" },
              { value: "4.9★", label: "Valoración media" },
              { value: "100%", label: "Natural" },
              { value: "2-3d", label: "Entrega rápida" },
            ].map(stat => (
              <div key={stat.label} className="px-8 py-4 text-center">
                <p className="text-2xl font-bold text-emerald-400">{stat.value}</p>
                <p className="text-xs text-white/50 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Product Conveyor Belt ─────────────────────────── */}
      <div className="relative z-10 mt-8 pb-8">
        {/* Film strip border top */}
        <div className="h-2 w-full bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent mb-3" />

        {/* Row 1: left to right scroll */}
        <div className="overflow-hidden py-3">
          <div className="flex animate-marquee-left" style={{ width: 'max-content' }}>
            {[...productStrip1, ...productStrip1].map((product, i) => (
              <ConveyorCard key={`r1-${i}`} product={product} index={i} />
            ))}
          </div>
        </div>

        {/* Row 2: right to left scroll */}
        <div className="overflow-hidden py-3 mt-2">
          <div className="flex animate-marquee-right" style={{ width: 'max-content' }}>
            {[...productStrip2, ...productStrip2].map((product, i) => (
              <ConveyorCard key={`r2-${i}`} product={product} index={i + 6} />
            ))}
          </div>
        </div>

        {/* Film strip border bottom */}
        <div className="h-2 w-full bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent mt-3" />

        {/* Edge fade gradients */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#060F1E] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#060F1E] to-transparent" />
      </div>
    </section>
  )
}
