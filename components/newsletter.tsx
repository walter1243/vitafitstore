"use client"

import { useState } from 'react'
import { Send, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollReveal } from '@/components/scroll-reveal'
import { DEFAULT_NEWSLETTER, type NewsletterContent } from '@/lib/site-content-defaults'

export function Newsletter({ data }: { data?: NewsletterContent }) {
  const content = { ...DEFAULT_NEWSLETTER, ...data }
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
    <section
      className="relative overflow-hidden py-16"
      style={{ background: 'linear-gradient(135deg, #c2410c 0%, #9a3412 100%)' }}
    >
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <ScrollReveal className="text-center">
          <h2 className="mb-3 text-2xl font-bold text-white sm:text-3xl">
            {content.title}
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-white/85">
            {content.text}
          </p>

          <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
            <Input
              type="email"
              placeholder="Tu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 border-white/25 bg-white/10 text-white placeholder:text-white/60 focus-visible:ring-white/50"
              required
              disabled={status === 'loading' || status === 'success'}
            />
            <Button
              type="submit"
              size="lg"
              className="h-12 gap-2 bg-white text-orange-800 hover:bg-orange-50"
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

          <p className="mt-4 text-xs text-white/70">
            {content.privacyText}
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
