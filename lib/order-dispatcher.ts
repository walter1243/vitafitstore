/**
 * Order Dispatcher
 * Cria o pedido no fornecedor selecionado e salva no banco
 */
import { sql } from '@/lib/db'
import type { SupplierStockResult } from '@/lib/stock-checker'

export interface ClientOrder {
  id: number
  sku: string
  quantity: number
  productName: string
  customer: {
    name: string
    email: string
    phone: string
    cpf?: string
  }
  address: {
    street: string
    number?: string
    complement?: string
    neighborhood?: string
    city: string
    state?: string
    postalCode: string
    country: string
  }
}

export async function dispatchOrderToSupplier(
  clientOrder: ClientOrder,
  supplier: SupplierStockResult
): Promise<{ supplierOrderId: string; status: string }> {
  const payload = {
    sku: clientOrder.sku,
    quantidade: clientOrder.quantity,
    entrega: {
      nome: clientOrder.customer.name,
      cpf: clientOrder.customer.cpf ?? '',
      cep: clientOrder.address.postalCode.replace(/\D/g, ''),
      logradouro: clientOrder.address.street,
      numero: clientOrder.address.number ?? 'S/N',
      complemento: clientOrder.address.complement ?? '',
      bairro: clientOrder.address.neighborhood ?? '',
      cidade: clientOrder.address.city,
      estado: clientOrder.address.state ?? '',
    },
    referencia_interna: String(clientOrder.id),
    nota_fiscal_emitente: 'fornecedor',
  }

  const response = await fetch(`${supplier.baseUrl}/pedidos`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${supplier.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Fornecedor retornou ${response.status}: ${text}`)
  }

  const supplierResponse = await response.json()
  const supplierOrderId: string =
    supplierResponse.id ??
    supplierResponse.pedido_id ??
    supplierResponse.order_id ??
    'unknown'

  // Salva o supplier_order no banco
  await sql`
    INSERT INTO supplier_orders
      (order_id, supplier_id, supplier_order_id, status)
    VALUES
      (${clientOrder.id}, ${supplier.supplierId}, ${supplierOrderId}, 'sent')
    ON CONFLICT DO NOTHING
  `

  // Atualiza status do pedido principal
  await sql`
    UPDATE orders
    SET status = 'processing'
    WHERE id = ${clientOrder.id}
  `

  return { supplierOrderId, status: 'sent' }
}

export async function recordDispatchError(
  orderId: number,
  supplierId: number,
  error: string
): Promise<void> {
  await sql`
    INSERT INTO supplier_orders (order_id, supplier_id, status, error_message)
    VALUES (${orderId}, ${supplierId}, 'error', ${error})
  `
}
