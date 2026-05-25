"use client"

import { Truck, RotateCcw, ShieldCheck, Clock } from 'lucide-react'

const badges = [
  {
    icon: Truck,
    title: "Envío gratis +50€",
    description: "En todos los pedidos"
  },
  {
    icon: RotateCcw,
    title: "Devolución 30 días",
    description: "Sin preguntas"
  },
  {
    icon: ShieldCheck,
    title: "Pago seguro SSL",
    description: "100% protegido"
  },
  {
    icon: Clock,
    title: "Entrega 2-3 días",
    description: "En toda España"
  }
]

export function TrustBadges() {
  return (
    <section className="border-y border-border bg-muted/30 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {badges.map((badge, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <badge.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{badge.title}</p>
                <p className="text-xs text-muted-foreground">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
