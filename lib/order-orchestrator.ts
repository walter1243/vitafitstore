/**
 * Order Orchestrator
 * Fluxo completo: verificar estoque → criar pedido no fornecedor → notificar cliente
 * Chamado de forma assíncrona após confirmação de pagamento
 */
import { sql } from '@/lib/db'
import { checkStock } from '@/lib/stock-checker'
import { dispatchOrderToSupplier, recordDispatchError } from '@/lib/order-dispatcher'
import { sendConfirmationWhatsApp } from '@/lib/whatsapp'

export interface OrchestratorResult {
  success: boolean
  reason?: 'no_stock' | 'dispatch_error' | 'automation_disabled'
  supplierOrderId?: string
}

export async function processOrder(orderId: number): Promise<OrchestratorResult> {
  console.log(`[Orchestrator] Processando pedido #${orderId}`)

  // 1. Verifica se automação está habilitada
  const [settings] = await sql`
    SELECT automation_enabled, notify_whatsapp
    FROM automation_settings
    WHERE id = 1
  `

  const [storeSettings] = await sql`
    SELECT whatsapp_order_template
    FROM store_settings
    WHERE id = 1
  `
  if (!settings?.automation_enabled) {
    console.log('[Orchestrator] Automação desabilitada, pulando.')
    return { success: false, reason: 'automation_disabled' }
  }

  // 2. Busca dados do pedido
  const [order] = await sql`
    SELECT
      o.id,
      o.customer_name,
      o.customer_email,
      o.customer_phone,
      o.address_line,
      o.postal_code,
      o.city,
      o.country,
      p.name   AS product_name,
      p.sku    AS product_sku,
      1        AS quantity
    FROM orders o
    LEFT JOIN products p ON p.id = o.product_id
    WHERE o.id = ${orderId}
    LIMIT 1
  `

  if (!order) {
    console.error(`[Orchestrator] Pedido #${orderId} não encontrado`)
    return { success: false, reason: 'dispatch_error' }
  }

  const sku: string = order.product_sku ?? String(orderId)
  const quantity: number = Number(order.quantity ?? 1)

  // 3. Verifica estoque nos fornecedores
  const supplier = await checkStock(sku, quantity)
  if (!supplier) {
    console.warn(`[Orchestrator] Sem estoque para SKU ${sku}`)
    // Marca pedido como sem estoque
    await sql`UPDATE orders SET status = 'no_stock' WHERE id = ${orderId}`
    return { success: false, reason: 'no_stock' }
  }

  // 4. Despacha pedido para o fornecedor
  try {
    const addressParts = (order.address_line ?? '').split(',')
    const clientOrder = {
      id: order.id,
      sku,
      quantity,
      productName: order.product_name ?? 'Produto',
      customer: {
        name: order.customer_name ?? 'Cliente',
        email: order.customer_email ?? '',
        phone: order.customer_phone ?? '',
      },
      address: {
        street: addressParts[0]?.trim() ?? '',
        number: addressParts[1]?.trim(),
        city: order.city ?? '',
        postalCode: order.postal_code ?? '',
        country: order.country ?? 'BR',
      },
    }

    const dispatch = await dispatchOrderToSupplier(clientOrder, supplier)

    // 5. Notifica cliente via WhatsApp
    if (settings.notify_whatsapp && order.customer_phone) {
      await sendConfirmationWhatsApp({
        phone: order.customer_phone,
        name: order.customer_name ?? 'Cliente',
        orderId: order.id,
        productName: order.product_name ?? 'seu produto',
        estimatedDays: supplier.estimatedDays,
        customTemplate: storeSettings?.whatsapp_order_template ?? undefined,
      })
    }

    console.log(
      `[Orchestrator] ✅ Pedido #${orderId} → ${supplier.supplierName} (#${dispatch.supplierOrderId})`
    )
    return { success: true, supplierOrderId: dispatch.supplierOrderId }
  } catch (err) {
    const msg = (err as Error).message
    console.error(`[Orchestrator] Erro ao despachar pedido #${orderId}:`, msg)
    await recordDispatchError(orderId, supplier.supplierId, msg)
    return { success: false, reason: 'dispatch_error' }
  }
}
