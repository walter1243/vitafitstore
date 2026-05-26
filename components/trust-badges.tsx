"use client"

import { Truck, RotateCcw, ShieldCheck, Clock } from 'lucide-react'

const badges = [
  { icon: Truck, title: 'Envío gratis +50€', desc: 'En todos los pedidos' },
  { icon: RotateCcw, title: 'Devolución 30 días', desc: 'Sin preguntas' },
  { icon: ShieldCheck, title: 'Pago seguro SSL', desc: '100% protegido' },
  { icon: Clock, title: 'Entrega 2-3 días', desc: 'En toda España' },
]

export function TrustBadges() {
  return (
    <section
      className="relative py-6 border-b border-white/8"
      style={{ background: '#060f1e' }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {badges.map((badge, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/20">
                <badge.icon className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{badge.title}</p>
                <p className="text-xs text-white/45">{badge.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
