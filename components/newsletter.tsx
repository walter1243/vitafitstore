"use client"

import { useState } from 'react'
import { Send, Check, Flame } from 'lucide-react'
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
    <section className="bg-[#FAF8F5] px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-700 to-orange-900 px-6 py-12 text-center sm:px-12">
          {/* Soft glow accents for depth instead of a flat wash */}
          <div className="pointer-events-none absolute -top-16 -left-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl" />

          <div className="relative mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
            <Flame className="h-6 w-6 text-white" />
          </div>

          <h2 className="relative mb-3 text-2xl font-bold text-white sm:text-3xl">
            {content.title}
          </h2>
          <p className="relative mx-auto mb-8 max-w-xl text-orange-50">
            {content.text}
          </p>

          <form onSubmit={handleSubmit} className="relative mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
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

          <p className="relative mt-4 text-xs text-orange-100/80">
            {content.privacyText}
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
