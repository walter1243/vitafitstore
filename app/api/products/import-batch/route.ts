/**
 * POST /api/products/import-batch
 * Recebe um array de produtos e insere todos de uma vez (importação em lote).
 */
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

interface ImportProduct {
  name: string
  price: number
  category?: string
  stock?: number
  image?: string
  additionalImages?: string[]
  description?: string
  sku?: string
  video?: string
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin(req)
    if (!auth.ok) return auth.response

    const { products }: { products: ImportProduct[] } = await req.json()

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: 'Nenhum produto fornecido' }, { status: 400 })
    }

    // Pega a última posição atual
    const [{ maxPos }] = await sql`
      SELECT COALESCE(MAX(position), 0) AS "maxPos" FROM products
    `
    let pos = Number(maxPos)

    const imported: number[] = []
    const errors: { name: string; error: string }[] = []

    for (const p of products) {
      if (!p.name || !p.price) {
        errors.push({ name: p.name ?? '?', error: 'name e price são obrigatórios' })
        continue
      }

      try {
        pos += 1
        const [row] = await sql`
          INSERT INTO products
            (name, price, category, stock, image, additional_images, description, video, position)
          VALUES (
            ${p.name},
            ${Number(p.price)},
            ${p.category ?? 'Geral'},
            ${p.stock ?? 0},
            ${p.image ?? null},
            ${JSON.stringify(Array.isArray(p.additionalImages) ? p.additionalImages : [])},
            ${p.description ?? null},
            ${p.video ?? null},
            ${pos}
          )
          RETURNING id
        `
        imported.push(row.id)
      } catch (e) {
        errors.push({ name: p.name, error: String(e) })
      }
    }

    return NextResponse.json({
      imported: imported.length,
      importedIds: imported,
      errors,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
