/**
 * WhatsApp Sender
 * Suporta Z-API e Evolution API (configurado em automation_settings)
 */

interface TrackingMessageParams {
  phone: string
  name: string
  orderId: number
  trackingCode: string
  carrier: string
  trackingUrl?: string
  customTemplate?: string
}

interface ConfirmationMessageParams {
  phone: string
  name: string
  orderId: number
  productName: string
  estimatedDays?: number
  customTemplate?: string
}

interface AccessTokenMessageParams {
  phone: string
  name: string
  accessToken: string
  accessUrl: string
}

interface WhatsAppConfig {
  provider: string   // 'zapi' | 'evolution'
  url: string
  token: string
}

async function getConfig(): Promise<WhatsAppConfig | null> {
  const url    = process.env.WHATSAPP_URL   || process.env.ZAPI_URL        || process.env.EVOLUTION_API_URL
  const token  = process.env.WHATSAPP_TOKEN || process.env.ZAPI_TOKEN      || process.env.EVOLUTION_API_KEY || process.env['API WHATSAP']
  const provider = process.env.WHATSAPP_PROVIDER || 'zapi'

  if (!url || !token) return null
  return { provider, url, token }
}

function sanitizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')

  // Ja vem com DDI (ex.: Espanha 34..., Brasil 55...)
  if (digits.length >= 11) return digits

  // Fallback legado para numeros locais brasileiros sem DDI
  if (digits.length === 10) return `55${digits}`

  return digits
}

function replaceVars(template: string, values: Record<string, string>): string {
  return Object.entries(values).reduce((acc, [key, value]) => {
    return acc.replaceAll(`{${key}}`, value)
  }, template)
}

function pickOne(items: string[]): string {
  return items[Math.floor(Math.random() * items.length)]
}

export async function sendTrackingWhatsApp(params: TrackingMessageParams): Promise<boolean> {
  const config = await getConfig()
  if (!config) {
    console.warn('[WhatsApp] Nenhuma configuração encontrada, pulando envio.')
    return false
  }

  const { phone, name, orderId, trackingCode, carrier } = params
  const trackingUrl = params.trackingUrl || `https://www.linkcorreios.com.br/?id=${trackingCode}`
  const fallbackTemplates = [
    'Hola {name}! Tu pedido #{orderId} ya fue enviado. Transportista: {carrier}. Codigo: {trackingCode}. Rastreo: {trackingUrl}',
    'Buenas noticias, {name}! Ya despachamos tu pedido #{orderId}. Seguimiento {trackingCode} con {carrier}. Puedes rastrear aqui: {trackingUrl}',
  ]
  const baseTemplate = params.customTemplate?.trim() || pickOne(fallbackTemplates)
  const message = replaceVars(baseTemplate, {
    name,
    orderId: String(orderId),
    carrier,
    trackingCode,
    trackingUrl,
  })

  try {
    if (config.provider === 'zapi') {
      await fetch(`${config.url}/send-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-Token': config.token,
        },
        body: JSON.stringify({ phone: sanitizePhone(phone), message }),
      })
    } else {
      // Evolution API
      await fetch(`${config.url}/message/sendText/default`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.token,
        },
        body: JSON.stringify({
          number: sanitizePhone(phone),
          options: { delay: 1200, presence: 'composing' },
          textMessage: { text: message },
        }),
      })
    }
    console.log(`[WhatsApp] Rastreio enviado para ${phone}`)
    return true
  } catch (err) {
    console.error('[WhatsApp] Falha ao enviar mensagem:', err)
    return false
  }
}

export async function sendConfirmationWhatsApp(params: ConfirmationMessageParams): Promise<boolean> {
  const config = await getConfig()
  if (!config) return false

  const { phone, name, orderId, productName, estimatedDays } = params
  const fallbackTemplates = [
    'Hola {name}! Gracias por tu compra en VitaFit. Tu pedido #{orderId} esta confirmado y ya estamos preparando {productName}. {eta}',
    'Hola {name}, que alegria tenerte con nosotros! Confirmamos tu pedido #{orderId} ({productName}). {eta} Te avisamos por aqui con el seguimiento.',
  ]
  const eta = estimatedDays ? `Entrega estimada: ${estimatedDays} dias habiles.` : ''
  const baseTemplate = params.customTemplate?.trim() || pickOne(fallbackTemplates)
  const message = replaceVars(baseTemplate, {
    name,
    orderId: String(orderId),
    productName,
    eta,
  })

  try {
    if (config.provider === 'zapi') {
      await fetch(`${config.url}/send-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-Token': config.token,
        },
        body: JSON.stringify({ phone: sanitizePhone(phone), message }),
      })
    } else {
      await fetch(`${config.url}/message/sendText/default`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.token,
        },
        body: JSON.stringify({
          number: sanitizePhone(phone),
          options: { delay: 1200, presence: 'composing' },
          textMessage: { text: message },
        }),
      })
    }
    return true
  } catch (err) {
    console.error('[WhatsApp] Falha ao enviar confirmação:', err)
    return false
  }
}

export async function sendAccessTokenWhatsApp(params: AccessTokenMessageParams): Promise<boolean> {
  const config = await getConfig()
  if (!config) return false

  const { phone, name, accessToken, accessUrl } = params
  const message =
`Olá ${name}! 🔐

Seu acesso foi gerado com sucesso.

🎟️ *Token de acesso:* ${accessToken}
🔗 *Link de acesso:* ${accessUrl}

Guarde esta mensagem para acessar sua área.`

  try {
    if (config.provider === 'zapi') {
      await fetch(`${config.url}/send-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-Token': config.token,
        },
        body: JSON.stringify({ phone: sanitizePhone(phone), message }),
      })
    } else {
      await fetch(`${config.url}/message/sendText/default`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': config.token,
        },
        body: JSON.stringify({
          number: sanitizePhone(phone),
          options: { delay: 1200, presence: 'composing' },
          textMessage: { text: message },
        }),
      })
    }
    return true
  } catch (err) {
    console.error('[WhatsApp] Falha ao enviar token de acesso:', err)
    return false
  }
}
