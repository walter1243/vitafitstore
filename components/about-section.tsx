"use client"

import { Award, Heart, Leaf, Users } from 'lucide-react'

const features = [
  {
    icon: Leaf,
    title: "100% Natural",
    description: "Ingredientes de origen natural, sin aditivos artificiales ni conservantes dañinos."
  },
  {
    icon: Award,
    title: "Calidad certificada",
    description: "Todos nuestros productos cumplen con los más estrictos estándares de calidad europeos."
  },
  {
    icon: Heart,
    title: "Bienestar real",
    description: "Fórmulas desarrolladas por expertos para resultados que puedes sentir."
  },
  {
    icon: Users,
    title: "Comunidad activa",
    description: "Más de 50.000 clientes satisfechos que confían en VitaFit para su bienestar."
  }
]

export function AboutSection() {
  return (
    <section id="nosotros" className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Content */}
          <div>
            <h2 className="mb-4 text-3xl font-bold text-foreground sm:text-4xl">
              ¿Por qué elegir{' '}
              <span className="text-primary">VitaFit Store</span>?
            </h2>
            <p className="mb-6 text-muted-foreground">
              En VitaFit creemos que el bienestar debe ser accesible para todos. 
              Por eso seleccionamos cuidadosamente cada producto, priorizando la 
              calidad, la eficacia y la transparencia.
            </p>
            <p className="mb-8 text-muted-foreground">
              Nuestro equipo de nutricionistas y expertos en fitness trabaja 
              constantemente para ofrecerte las mejores soluciones para tu salud. 
              Desde suplementos premium hasta accesorios de entrenamiento, todo 
              lo que necesitas para sentirte mejor está aquí.
            </p>

            <div className="grid gap-6 sm:grid-cols-2">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="aspect-square overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 p-8">
              <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl bg-card shadow-xl">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary">
                  <Leaf className="h-10 w-10 text-primary-foreground" />
                </div>
                <h3 className="mb-2 text-2xl font-bold text-foreground">VitaFit Store</h3>
                <p className="mb-4 text-center text-muted-foreground">
                  Tu bienestar, nuestra prioridad
                </p>
                <div className="grid grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-2xl font-bold text-primary">5+</p>
                    <p className="text-xs text-muted-foreground">Años</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">50K+</p>
                    <p className="text-xs text-muted-foreground">Clientes</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">100+</p>
                    <p className="text-xs text-muted-foreground">Productos</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -left-4 top-1/4 rounded-xl bg-card p-4 shadow-lg">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                  <Heart className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">4.9/5</p>
                  <p className="text-xs text-muted-foreground">Satisfacción</p>
                </div>
              </div>
            </div>

            <div className="absolute -right-4 bottom-1/4 rounded-xl bg-primary p-4 text-primary-foreground shadow-lg">
              <p className="text-sm font-bold">🇪🇸 Made in Spain</p>
              <p className="text-xs opacity-80">Fabricado en España</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
