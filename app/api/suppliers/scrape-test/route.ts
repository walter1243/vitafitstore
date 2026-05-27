/**
 * POST /api/suppliers/scrape-test
 * Testa uma config de scraping sem precisar de API key no fornecedor.
 * Funciona via fetch puro (sem Puppeteer) — compatível com Vercel serverless.
 * Suporta: #id, .class, [data-attr], tag.class
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

interface ScrapeTestBody {
  url: string
  stockSelector: string   // ex: ".quantidade-estoque", "#stock", "[data-stock]"
  priceSelector?: string  // opcional
}

/**
 * Extrai texto de um seletor CSS básico dentro de uma string HTML.
 * Suporta: #id, .class, [data-attr="val"], [data-attr], tag, tag.class
 */
function extractBySelector(html: string, selector: string): string | null {
  selector = selector.trim()

  // [data-attr] or [data-attr="value"]
  const dataMatch = selector.match(/^\[([^\]="]+)(?:="([^"]*)")?\]$/)
  if (dataMatch) {
    const attr = dataMatch[1]
    const re = new RegExp(`${attr}=["']([^"']+)["']`, 'i')
    const found = html.match(re)
    return found ? found[1] : null
  }

  // Build a regex that finds >content< inside an element matching the selector
  let attrPattern = ''

  if (selector.startsWith('#')) {
    // #id
    attrPattern = `id=["']${selector.slice(1)}["']`
  } else if (selector.startsWith('.')) {
    // .class — element may have multiple classes
    const cls = selector.slice(1)
    attrPattern = `class=["'][^"']*${cls}[^"']*["']`
  } else if (selector.includes('.')) {
    // tag.class
    const [, cls] = selector.split('.')
    attrPattern = `class=["'][^"']*${cls}[^"']*["']`
  } else {
    // plain tag — match first occurrence
    const tagRe = new RegExp(`<${selector}[^>]*>([^<]+)</${selector}>`, 'i')
    const m = html.match(tagRe)
    return m ? m[1].trim() : null
  }

  // Find tag that contains attrPattern, then grab inner text
  const tagRe = new RegExp(
    `<[a-z][a-z0-9]*[^>]*${attrPattern}[^>]*>([\\s\\S]*?)<\/[a-z][a-z0-9]*>`,
    'i'
  )
  const m = html.match(tagRe)
  if (!m) return null

  // Strip inner HTML tags and return text
  return m[1].replace(/<[^>]+>/g, '').trim()
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req)
    if (!auth.ok) return auth.response

    const body: ScrapeTestBody = await req.json()
    const { url, stockSelector, priceSelector } = body

    if (!url || !stockSelector) {
      return NextResponse.json(
        { error: 'url e stockSelector são obrigatórios' },
        { status: 400 }
      )
    }

    // Fetch the supplier product page
    const response = await fetch(url, {
      headers: {
        // Imita um browser comum para evitar bloqueio de bots
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
          '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(12000),
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Fornecedor retornou ${response.status}` },
        { status: 502 }
      )
    }

    const html = await response.text()

    const stockRaw  = extractBySelector(html, stockSelector)
    const priceRaw  = priceSelector ? extractBySelector(html, priceSelector) : null

    const stockNum  = stockRaw  ? parseInt(stockRaw.replace(/\D/g, ''), 10)   : null
    const priceNum  = priceRaw  ? parseFloat(priceRaw.replace(/[^\d,.]/g, '').replace(',', '.')) : null

    return NextResponse.json({
      success: true,
      stockRaw,
      priceRaw,
      stock: isNaN(stockNum as number) ? null : stockNum,
      price: isNaN(priceNum as number) ? null : priceNum,
      htmlSnippet: html.slice(0, 2000), // primeiros 2000 chars para debug
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
