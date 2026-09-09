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
    <section className="bg-[#FAF8F5] px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <ScrollReveal className="rounded-3xl bg-gradient-to-br from-orange-50 to-amber-50 px-6 py-12 text-center sm:px-12">
          <h2 className="mb-3 text-2xl font-bold text-slate-900 sm:text-3xl">
            {content.title}
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-slate-600">
            {content.text}
          </p>

          <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
            <Input
              type="email"
              placeholder="Tu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-orange-600/40"
              required
              disabled={status === 'loading' || status === 'success'}
            />
            <Button
              type="submit"
              size="lg"
              className="h-12 gap-2 bg-orange-700 text-white hover:bg-orange-800"
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

          <p className="mt-4 text-xs text-slate-500">
            {content.privacyText}
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
