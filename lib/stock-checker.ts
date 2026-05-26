/**
 * Stock Checker
 * Verifica estoque nos fornecedores cadastrados no banco
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
    SELECT id, name, base_url, api_key
    FROM suppliers
    WHERE active = TRUE
    ORDER BY id
  `

  const results: SupplierStockResult[] = []

  for (const supplier of suppliers) {
    try {
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
