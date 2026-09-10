'use client'

import { useRef, useState } from 'react'
import { Star, Camera, X, Check, Loader2 } from 'lucide-react'

const MAX_DIMENSION = 1280

// Downscale + re-encode client-side before it ever leaves the phone —
// a raw phone photo can be several MB, comfortably over what a serverless
// function's request body can take, so this keeps submissions small and
// fast without needing a separate upload step.
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = img.width * scale
        canvas.height = img.height * scale
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('No se pudo procesar la imagen.'))
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.78))
      }
      img.onerror = () => reject(new Error('No se pudo leer la imagen.'))
      img.src = reader.result as string
    }
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'))
    reader.readAsDataURL(file)
  })
}

export function ReviewForm({ token, productName, customerName }: { token: string; productName: string; customerName: string }) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [displayName, setDisplayName] = useState(customerName)
  const [photo, setPhoto] = useState('')
  const [photoBusy, setPhotoBusy] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function handlePhoto(file: File | null) {
    if (!file) return
    setPhotoBusy(true)
    setError('')
    try {
      const dataUrl = await compressImage(file)
      setPhoto(dataUrl)
    } catch (e: any) {
      setError(e?.message ?? 'No se pudo procesar la foto.')
    } finally {
      setPhotoBusy(false)
    }
  }

  async function handleSubmit() {
    if (!rating) {
      setError('Elige una puntuación de 1 a 5 estrellas.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, rating, comment, photoUrl: photo, displayName }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error ?? 'No se pudo enviar tu valoración.')
        return
      }
      setDone(true)
    } catch {
      setError('Error de conexión. Inténtalo de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#FAF8F5] px-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50">
            <Check className="h-6 w-6 text-orange-700" />
          </div>
          <h1 className="mb-1 text-lg font-bold text-slate-900">¡Gracias por tu valoración!</h1>
          <p className="text-sm text-slate-500">
            La revisaremos y en breve aparecerá en la página del producto.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FAF8F5] px-4 py-10">
      <div className="mx-auto w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-orange-700">Valorar producto</p>
        <h1 className="mb-4 text-lg font-bold leading-tight text-slate-900">{productName}</h1>

        <div className="mb-5">
          <p className="mb-2 text-sm font-medium text-slate-700">¿Qué puntuación le das?</p>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                aria-label={`${n} estrellas`}
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    (hoverRating || rating) >= n ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Tu nombre</label>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Cómo quieres aparecer"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-orange-600/50 focus:ring-2 focus:ring-orange-600/20"
          />
        </div>

        <div className="mb-4">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Cuéntanos tu experiencia (opcional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="¿Qué te ha parecido el producto?"
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-orange-600/50 focus:ring-2 focus:ring-orange-600/20"
          />
        </div>

        <div className="mb-5">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Añade una foto (opcional)</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handlePhoto(e.target.files?.[0] ?? null)}
          />
          {photo ? (
            <div className="relative inline-block">
              <img src={photo} alt="" className="h-24 w-24 rounded-xl border border-slate-200 object-cover" />
              <button
                type="button"
                onClick={() => setPhoto('')}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-white"
                aria-label="Quitar foto"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={photoBusy}
              className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 text-slate-400 hover:border-orange-400 hover:text-orange-600"
            >
              {photoBusy ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
              <span className="text-[10px]">Subir foto</span>
            </button>
          )}
        </div>

        {error && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting || photoBusy}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
          {submitting ? 'Enviando...' : 'Enviar valoración'}
        </button>
      </div>
    </main>
  )
}
