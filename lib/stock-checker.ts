/**
 * Stock Checker
 * Verifica estoque nos fornecedores cadastrados no banco.
 * Suporta dois modos:
 *  - REST API: GET /produtos/{sku}/estoque com api_key
 *  - Scraper (sem key): fetch HTML + extração por seletor CSS básico
 */
import { sql } from '@/lib/db'

export interface SupplierStockResult {
  supplierId: number
  supplierName: string
  baseUrl: string
  apiKey: string
  available: boolean
  stock: number
  wholesalePrice: number
  estimatedDays: number
}

export async function checkStock(
  sku: string,
  quantity: number
): Promise<SupplierStockResult | null> {
  // Busca fornecedores ativos no banco
  const suppliers = await sql`
    SELECT id, name, base_url, api_key,
           scraper_url_template, scraper_stock_selector
    FROM suppliers
    WHERE active = TRUE
    ORDER BY id
  `

  const results: SupplierStockResult[] = []

  for (const supplier of suppliers) {
    try {
      // ── Modo Scraper (sem API key) ──────────────────────────
      if (!supplier.api_key && supplier.scraper_url_template && supplier.scraper_stock_selector) {
        const productUrl = (supplier.scraper_url_template as string).replace('{sku}', encodeURIComponent(sku))
        const html = await fetch(productUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0',
            Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
          },
          signal: AbortSignal.timeout(10000),
        }).then((r) => r.text())

        const stockText = extractBySelector(html, supplier.scraper_stock_selector as string)
        const stockNum  = stockText ? parseInt(stockText.replace(/\D/g, ''), 10) : 0

        results.push({
          supplierId: supplier.id,
          supplierName: supplier.name,
          baseUrl: supplier.base_url,
          apiKey: '',
          available: stockNum >= quantity,
          stock: stockNum,
          wholesalePrice: 0, // sem preço de custo no scraper — usar margem no admin
          estimatedDays: 7,
        })
        continue
      }

      // ── Modo REST API ───────────────────────────────────────
      const response = await fetch(
        `${supplier.base_url}/produtos/${encodeURIComponent(sku)}/estoque`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${supplier.api_key}`,
            'Content-Type': 'application/json',
          },
          // Timeout de 8 segundos por fornecedor
          signal: AbortSignal.timeout(8000),
        }
      )

      if (!response.ok) {
        console.warn(`[StockChecker] ${supplier.name} retornou ${response.status}`)
        continue
      }

      const data = await response.json()

      results.push({
        supplierId: supplier.id,
        supplierName: supplier.name,
        baseUrl: supplier.base_url,
        apiKey: supplier.api_key,
        available: (data.estoque ?? data.stock ?? 0) >= quantity,
        stock: data.estoque ?? data.stock ?? 0,
        wholesalePrice: data.preco_atacado ?? data.price ?? 0,
        estimatedDays: data.prazo_dias ?? data.delivery_days ?? 7,
      })
    } catch (err) {
      console.error(`[StockChecker] Erro em ${supplier.name}:`, (err as Error).message)
    }
  }

  // Retorna o fornecedor com menor preço e estoque disponível
  const available = results
    .filter((r) => r.available)
    .sort((a, b) => a.wholesalePrice - b.wholesalePrice)

  return available[0] ?? null
}

/** Extrai texto de elemento HTML pelo seletor CSS básico (sem deps externos) */
export function extractBySelector(html: string, selector: string): string | null {
  selector = selector.trim()

  // [data-attr] or [data-attr="value"]
  const dataMatch = selector.match(/^\[([^\]="]+)(?:="([^"]*)")?\]$/)
  if (dataMatch) {
    const attr = dataMatch[1]
    const re = new RegExp(`${attr}=["']([^"']+)["']`, 'i')
    const found = html.match(re)
    return found ? found[1] : null
  }

  let attrPattern = ''
  if (selector.startsWith('#')) {
    attrPattern = `id=["']${selector.slice(1)}["']`
  } else if (selector.startsWith('.')) {
    const cls = selector.slice(1)
    attrPattern = `class=["'][^"']*${cls}[^"']*["']`
  } else if (selector.includes('.')) {
    const [, cls] = selector.split('.')
    attrPattern = `class=["'][^"']*${cls}[^"']*["']`
  } else {
    const tagRe = new RegExp(`<${selector}[^>]*>([^<]+)<\/${selector}>`, 'i')
    const m = html.match(tagRe)
    return m ? m[1].trim() : null
  }

  const tagRe = new RegExp(
    `<[a-z][a-z0-9]*[^>]*${attrPattern}[^>]*>([\\s\\S]*?)<\/[a-z][a-z0-9]*>`,
    'i'
  )
  const m = html.match(tagRe)
  if (!m) return null
  return m[1].replace(/<[^>]+>/g, '').trim()
}
