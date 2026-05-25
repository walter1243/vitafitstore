"use client"

import { useState } from 'react'
import { Send, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function Newsletter() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setStatus('success')
    setEmail('')
    
    // Reset after 3 seconds
    setTimeout(() => setStatus('idle'), 3000)
  }

  return (
    <section className="bg-primary py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="mb-3 text-2xl font-bold text-primary-foreground sm:text-3xl">
            Únete a la comunidad VitaFit
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-primary-foreground/80">
            Recibe ofertas exclusivas, consejos de salud y novedades antes que nadie. 
            ¡10% de descuento en tu primera compra!
          </p>

          <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
            <Input
              type="email"
              placeholder="Tu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/60 focus-visible:ring-primary-foreground"
              required
              disabled={status === 'loading' || status === 'success'}
            />
            <Button
              type="submit"
              variant="secondary"
              size="lg"
              className="h-12 gap-2"
              disabled={status === 'loading' || status === 'success'}
            >
              {status === 'loading' ? (
                'Enviando...'
              ) : status === 'success' ? (
                <>
                  <Check className="h-4 w-4" />
                  ¡Suscrito!
                </>
              ) : (
                <>
                  Suscribirme
                  <Send className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-4 text-xs text-primary-foreground/60">
            Al suscribirte aceptas nuestra política de privacidad. Sin spam, lo prometemos.
          </p>
        </div>
      </div>
    </section>
  )
}
