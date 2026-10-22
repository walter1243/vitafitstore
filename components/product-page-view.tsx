'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ChevronRight, Truck, Minus, Plus, ShoppingCart, Check, Play, Ruler } from 'lucide-react'
import { useCart } from '@/lib/cart-context'
import { type Product } from '@/lib/products'
import { TrustpilotWidget } from '@/components/trustpilot-widget'
import { SizeGuideModal } from '@/components/size-guide-modal'
import { ProductReviews } from '@/components/product-reviews'
import { useSectors } from '@/components/kids/sectors-context'
import { ProductDemo } from '@/components/kids/product-demo'
import { NamePersonalizer, NamePreview, type PersonalizerLook } from '@/components/personalize/name-personalizer'
import { DEFAULT_NAME_COLORS, cleanCustomText, lineTotalFor, minQtyFor, packOf, parsePersonalize, sizeRange, sizedPrice } from '@/lib/personalize'
import { ProductShipping } from '@/components/shipping/shipping-options'

export function ProductPageView({ product }: { product: Product }) {
  const { addItem } = useCart()
  const { collectionForProduct, getSector } = useSectors()
  const collection = collectionForProduct(product)
  // Produto com nome personalizado (chaveiro, placa de pet): o personalizador
  // ocupa o lugar do "Anadir" comum, no visual do setor dele.
  const personalized = Boolean(product.personalize?.enabled)
  const look = (collection ? getSector(collection.sectorId)?.style : undefined) as PersonalizerLook | undefined
  const pcfg = parsePersonalize(product.personalize)
  const [customName, setCustomName] = useState('')
  const [customColor, setCustomColor] = useState((pcfg.colors[0] ?? DEFAULT_NAME_COLORS[0]).hex)
  const sample = look === 'mascotas' ? 'Toby' : 'Lucía'
  const personalizeTitle = look === 'mascotas' ? 'Personaliza el nombre de tu mascota' : look === 'llaveros' ? 'Personaliza tu llavero' : 'Personalízalo con un nombre'
  const router = useRouter()
  const pBase = product.personalize?.enabled ? (product.personalize.previewImage || '') : ''
  // Fotos das cores entram na galeria: escolher a cor mostra a foto dela.
  const galleryImages = [...new Set([pBase || product.mainImage || product.image, ...(product.additionalImages ?? []), ...(product.colorOptions ?? []).map((c) => c.image)].filter(Boolean) as string[])]
  // Abre na foto da cor ja selecionada (a primeira), se ela tiver foto.
  const [activeIndex, setActiveIndex] = useState(() => { const im = product.colorOptions?.[0]?.image; const i = im ? galleryImages.indexOf(im) : -1; return i >= 0 ? i : 0 })
  const [slideDir, setSlideDir] = useState<'left' | 'right'>('right')
  const activeImage = galleryImages[activeIndex] ?? galleryImages[0]
  const touchStartX = useRef<number | null>(null)
  // Venda em pack: a quantidade anda de N em N (unidades).
  const pack = packOf(product.personalize)
  const step = pack?.qty ?? 1
  const [quantity, setQuantity] = useState(Math.max(step, minQtyFor(product.personalize)))
  const [added, setAdded] = useState(false)
  const [selectedColor, setSelectedColor] = useState(product.colorOptions?.[0]?.label ?? '')
  // Foto que combina com a cor escolhida (ou a principal): e nela que o nome aparece.
  const colorImages = (product.colorOptions ?? []).map((c) => c.image).filter(Boolean) as string[]
  const selectedColorImage = product.colorOptions?.find((c) => c.label === selectedColor)?.image
  const previewIndex = Math.max(0, selectedColorImage ? galleryImages.indexOf(selectedColorImage) : 0)
  const [selectedSize, setSelectedSize] = useState('')
  const [shipCost, setShipCost] = useState<number | null>(null)
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false)

  const needsSize = Boolean(product.productType && product.productType !== 'estandar' && product.sizes?.length)
  // Observacao do cliente (Admin → Produtos → "Cliente escreve uma observação").
  const noteCfg = parsePersonalize(product.personalize)
  const [obs, setObs] = useState('')
  const obsMissing = noteCfg.askNote && noteCfg.noteRequired && !obs.trim()
  const canBuy = (!needsSize || Boolean(selectedSize)) && !obsMissing
  const productLineTotal = lineTotalFor(sizedPrice(product.price, product.personalize, selectedSize), product.personalize, quantity)
  // Preco por tamanho (Admin → Produtos → Tamanhos): "desde X" ate escolher.
  const sizeRangeView = needsSize ? sizeRange(product.price, product.personalize, product.sizes) : null
  const sizePriceOf = (s: string) => parsePersonalize(product.personalize).sizePrices[s]
  const discountPct = product.originalPrice && product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null

  function selectColor(label: string, image?: string) {
    setSelectedColor(label)
    if (!image) return
    const idx = galleryImages.indexOf(image)
    if (idx >= 0) goToIndex(idx)
  }

  function goToIndex(index: number) {
    const len = galleryImages.length
    const wrapped = ((index % len) + len) % len
    setSlideDir(wrapped >= activeIndex ? 'right' : 'left')
    setActiveIndex(wrapped)
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || galleryImages.length < 2) return
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    const SWIPE_THRESHOLD = 40
    if (deltaX > SWIPE_THRESHOLD) goToIndex(activeIndex - 1)
    else if (deltaX < -SWIPE_THRESHOLD) goToIndex(activeIndex + 1)
    touchStartX.current = null
  }

  const obsNote = noteCfg.askNote && obs.trim() ? `Obs: ${obs.trim().replace(/\s+/g, ' ')}` : undefined
  const variant = {
    color: product.colorOptions?.length ? selectedColor : undefined,
    size: needsSize ? selectedSize : undefined,
    note: obsNote,
  }

  function handleAdd() {
    if (!canBuy) return
    addItem(product, variant, quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  function handleBuyNow() {
    if (!canBuy) return
    addItem(product, variant, quantity)
    router.push('/checkout')
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-36 sm:px-6 sm:pt-40 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-slate-500">
        <Link href="/" className="hover:text-slate-800">Inicio</Link>
        <ChevronRight size={12} />
        {collection ? (
          <Link href={`/coleccion/${collection.slug}`} className="hover:text-slate-800">{collection.shortName}</Link>
        ) : (
          <Link href="/#colecciones" className="hover:text-slate-800">Colecciones</Link>
        )}
        {product.categoryLabel && (
          <>
            <ChevronRight size={12} />
            <span className="text-slate-700">{product.categoryLabel}</span>
          </>
        )}
      </nav>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Gallery (no computador a descricao fica embaixo das fotos) */}
        <div className="min-w-0">
        <div className="flex gap-3">
          {/* Vertical thumbnail rail on desktop */}
          {galleryImages.length > 1 && (
            <div className="hidden shrink-0 flex-col gap-2 sm:flex lg:w-16">
              {galleryImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => goToIndex(i)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                    activeIndex === i ? 'border-orange-600' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Image src={img} alt="" fill className="object-cover" />
                </button>
              ))}
              {product.videoUrl && (
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border-2 border-slate-200 bg-slate-50">
                  <Play size={18} className="text-slate-400" />
                </div>
              )}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div
              className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {personalized && (activeIndex === 0 || colorImages.includes(activeImage)) ? (
                // O nome do cliente aparece na propria foto do produto.
                <div className="absolute inset-0">
                  <NamePreview cfg={{ ...pcfg, previewImage: activeImage, color: customColor || pcfg.color }} product={product} text={cleanCustomText(customName, pcfg.maxLength)} placeholder={sample} swingKey={0} stage="#ffffff" />
                </div>
              ) : (
                <Image
                  key={activeIndex}
                  src={activeImage}
                  alt={product.name}
                  fill
                  className={`object-cover ${slideDir === 'right' ? 'slide-from-right' : 'slide-from-left'}`}
                  priority
                />
              )}
            </div>
            {/* Horizontal thumbnails on mobile only */}
            {galleryImages.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:hidden">
                {galleryImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => goToIndex(i)}
                    className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                      activeIndex === i ? 'border-orange-600' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="mt-[30px] hidden lg:block">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Descripción</h2>
          <div
            className="prose prose-sm max-w-none prose-p:text-slate-600 prose-p:leading-relaxed"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
        </div>

        {/* Info */}
        <div>
          {product.categoryLabel && (
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.15em] text-orange-700">{product.categoryLabel}</p>
          )}
          <h1 className="text-2xl font-bold leading-tight text-slate-900 sm:text-3xl" style={{ fontFamily: 'var(--font-heading)' }}>
            {product.name}
          </h1>

          <div className="mt-3">
            <TrustpilotWidget />
          </div>

          {/* Price block */}
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-baseline gap-3">
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-base text-slate-400 line-through">{product.originalPrice.toFixed(2)}€</span>
              )}
              {pack ? (
                <>
                  <span className="text-4xl font-black text-slate-900">{pack.price.toFixed(2)}€</span>
                  <span className="text-base font-bold text-slate-600">pack de {pack.qty} uds</span>
                  {product.price * pack.qty > pack.price && (
                    <>
                      <span className="text-base text-slate-400 line-through">{(product.price * pack.qty).toFixed(2)}€</span>
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">-{Math.round((1 - pack.price / (product.price * pack.qty)) * 100)}%</span>
                    </>
                  )}
                  <span className="w-full text-xs font-semibold text-slate-500">{(pack.price / pack.qty).toFixed(2)}€ por unidad · se vende solo en packs de {pack.qty}</span>
                </>
              ) : (
              <span className="text-4xl font-black text-slate-900">
                {!selectedSize && sizeRangeView && sizeRangeView.min !== sizeRangeView.max && <span className="mr-1.5 text-base font-bold text-slate-500">desde</span>}
                {(selectedSize ? sizedPrice(product.price, product.personalize, selectedSize) : sizeRangeView?.min ?? product.price).toFixed(2)}€
              </span>
              )}
              {!pack && discountPct && (
                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">-{discountPct}%</span>
              )}
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <Truck size={13} /> Envío con seguimiento
            </p>
          </div>

          {/* Cores (Admin → Produtos → Cores do produto): trocar a cor troca a foto. */}
          {product.colorOptions && product.colorOptions.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-sm font-medium text-slate-700">Color: <span className="font-bold text-slate-900">{selectedColor}</span></p>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color">
                {product.colorOptions.map(c => (
                  <button
                    key={c.label}
                    type="button"
                    role="radio"
                    aria-checked={selectedColor === c.label}
                    onClick={() => selectColor(c.label, c.image)}
                    title={c.label}
                    className={`relative h-12 w-12 cursor-pointer overflow-hidden rounded-full border-2 p-0.5 transition-colors ${
                      selectedColor === c.label ? 'border-orange-600' : 'border-slate-200 hover:border-slate-400'
                    }`}
                    aria-label={c.label}
                  >
                    <span className="relative block h-full w-full overflow-hidden rounded-full">
                      {c.image ? (
                        <Image src={c.image} alt="" fill sizes="48px" className="object-cover" />
                      ) : (
                        <span className="block h-full w-full" style={{ background: c.hex || '#c2410c' }} />
                      )}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size selector */}
          {needsSize && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-medium text-slate-700">
                {product.productType === 'tamanho' ? 'Tamaño' : 'Talla'}: <span className="font-semibold text-slate-900">{selectedSize || 'Elige'}</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {product.sizes!.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[3rem] rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                      selectedSize === size
                        ? 'border-orange-600 bg-orange-50 text-orange-700'
                        : 'border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span className="block">{size}</span>
                    {sizePriceOf(size) > 0 && <span className="block text-xs font-bold opacity-80">{sizePriceOf(size).toFixed(2)}€</span>}
                  </button>
                ))}
              </div>
              {product.productType !== 'tamanho' && <button
                onClick={() => setSizeGuideOpen(true)}
                className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-orange-700 hover:text-orange-800"
              >
                <Ruler size={13} /> Guía de tallas
              </button>}
            </div>
          )}

          {noteCfg.askNote && (
            <div className="mt-6">
              <label htmlFor="obs-cliente" className="mb-2 block text-sm font-medium text-slate-700">
                Observaciones{noteCfg.noteRequired ? ' *' : ' (opcional)'}
              </label>
              <textarea
                id="obs-cliente"
                value={obs}
                onChange={(e) => setObs(e.target.value.slice(0, 250))}
                rows={3}
                placeholder={noteCfg.notePlaceholder || 'Ej: color y nombre de cada uno'}
                className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-base text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-orange-600"
              />
              <p className="mt-1 text-right text-[11px] text-slate-400">{obs.length}/250</p>
            </div>
          )}

          {/* Envio Packlink (antes da compra): ponto de recogida x domicilio, com preco atual */}
          <ProductShipping productId={product.id} quantity={quantity} size={selectedSize || undefined} onShipping={setShipCost} />

          {personalized && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="mb-3 text-base font-bold text-slate-900">{personalizeTitle}</p>
              <NamePersonalizer
                product={product}
                look={look ?? 'llaveros'}
                compact
                showPreview={false}
                name={customName}
                onName={(v) => { setCustomName(v); if (activeIndex !== previewIndex) goToIndex(previewIndex) }}
                color={customColor}
                onColor={(hex) => { setCustomColor(hex); if (activeIndex !== previewIndex) goToIndex(previewIndex) }}
                variant={{ color: product.colorOptions?.length ? selectedColor : undefined, size: needsSize ? selectedSize : undefined, note: obsNote }}
                basePrice={sizedPrice(product.price, product.personalize, selectedSize)}
                blocked={needsSize && !selectedSize ? `Elige ${product.productType === 'tamanho' ? 'un tamaño' : 'una talla'} arriba` : obsMissing ? 'Escribe las observaciones' : undefined}
              />
            </div>
          )}

          {/* Buy box */}
          <div className={`mt-6 rounded-2xl border border-slate-200 bg-white p-4 ${personalized ? 'hidden' : ''}`}>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="text-sm font-medium text-slate-500">Cantidad</span>
              <div className="flex items-center rounded-xl border border-slate-200 bg-white">
                <button
                  onClick={() => setQuantity(Math.max(Math.max(step, minQtyFor(product.personalize)), quantity - step))}
                  className="flex h-10 w-10 items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  aria-label="Reducir cantidad"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="min-w-10 px-1 text-center text-base font-bold text-slate-900">{pack ? `${quantity / step} pack${quantity / step > 1 ? "s" : ""}` : quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + step)}
                  className="flex h-10 w-10 items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  aria-label="Aumentar cantidad"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="text-xs font-medium text-orange-700">{product.stock} disponibles</span>
              {/* Total que o cliente paga: produto + envio escolhido (mesma conta do carrinho). */}
              <div className="ml-auto text-right leading-tight">
                <span className="block text-xs text-slate-500">{shipCost == null ? 'Total' : shipCost === 0 ? 'Total · envío gratis' : `Total con envío (${shipCost.toFixed(2)}€)`}</span>
                <span className="block whitespace-nowrap text-xl font-black text-slate-900">{(productLineTotal + (shipCost ?? 0)).toFixed(2)}€</span>
              </div>
            </div>

            {obsMissing && (!needsSize || selectedSize) && (
              <p className="mt-4 text-xs font-medium text-red-500">Escribe las observaciones para continuar.</p>
            )}
            {needsSize && !selectedSize && (
              <p className="mt-4 text-xs font-medium text-red-500">Elige {product.productType === 'tamanho' ? 'un tamaño' : 'una talla'} para continuar.</p>
            )}

            <div className="mt-4 flex flex-col gap-2.5">
              <button
                onClick={handleBuyNow}
                disabled={!canBuy}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-700 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Comprar ahora
              </button>
              <button
                onClick={handleAdd}
                disabled={!canBuy}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-orange-700 bg-white px-6 py-3.5 text-sm font-semibold text-orange-700 transition-all hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
                {added ? '¡Añadido al carrito!' : 'Añadir al carrito'}
              </button>
            </div>

            {/* Amostra gratis interativa (Admin → Produtos → Amostra interativa) */}
            <ProductDemo product={product} />
          </div>

          {sizeGuideOpen && product.productType && product.productType !== 'tamanho' && (
            <SizeGuideModal type={product.productType} onClose={() => setSizeGuideOpen(false)} />
          )}

          {/* Confianca: so informacao, embaixo e lado a lado */}
          {product.benefits.length > 0 && (
            <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:grid-cols-4">
              {product.benefits.slice(0, 4).map((b, i) => (
                <li key={i} className="flex items-center gap-1.5 text-[12px] font-medium leading-tight text-slate-600">
                  <Check className="h-3.5 w-3.5 shrink-0 text-orange-700" aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Descricao no celular/tablet (no computador fica embaixo das fotos) */}
      <div className="mt-12 max-w-3xl lg:hidden">
        <h2 className="mb-4 text-lg font-bold text-slate-900">Descripción</h2>
        <div
          className="prose prose-sm max-w-none prose-p:text-slate-600 prose-p:leading-relaxed"
          dangerouslySetInnerHTML={{ __html: product.description }}
        />
      </div>

      <ProductReviews productId={product.id} />
    </div>
  )
}
