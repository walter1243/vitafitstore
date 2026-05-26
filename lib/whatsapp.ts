/**
 * WhatsApp Sender
 * Suporta Z-API e Evolution API (configurado em automation_settings)
 */

interface TrackingMessageParams {
  phone: string
  name: string
  trackingCode: string
  carrier: string
}

interface ConfirmationMessageParams {
  phone: string
  name: string
  productName: string
  estimatedDays?: number
}

interface WhatsAppConfig {
  provider: string   // 'zapi' | 'evolution'
  url: string
  token: string
}

async function getConfig(): Promise<WhatsAppConfig | null> {
  const url    = process.env.WHATSAPP_URL   || process.env.ZAPI_URL        || process.env.EVOLUTION_API_URL
  const token  = process.env.WHATSAPP_TOKEN || process.env.ZAPI_TOKEN      || process.env.EVOLUTION_API_KEY
  const provider = process.env.WHATSAPP_PROVIDER || 'zapi'

  if (!url || !token) return null
  return { provider, url, token }
}

function sanitizePhone(phone: string): string {
  // Mantém apenas dígitos, remove +55 duplo
  const digits = phone.replace(/\D/g, '')
  // Garante código de país 55 para Brasil
  if (digits.startsWith('55') && digits.length >= 12) return digits
  if (digits.length === 11 || digits.length === 10) return `55${digits}`
  return digits
}

export async function sendTrackingWhatsApp(params: TrackingMessageParams): Promise<boolean> {
  const config = await getConfig()
  if (!config) {
    console.warn('[WhatsApp] Nenhuma configuração encontrada, pulando envio.')
    return false
  }

  const { phone, name, trackingCode, carrier } = params
  const message =
`Olá ${name}! 🎉

Seu pedido foi *despachado* com sucesso!

📦 *Transportadora:* ${carrier}
🔍 *Código de Rastreio:* \`${trackingCode}\`

Acompanhe em tempo real:
🌐 https://www.linkcorreios.com.br/?id=${trackingCode}

Qualquer dúvida, é só chamar aqui! 💪`

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

  const { phone, name, productName, estimatedDays } = params
  const prazo = estimatedDays ? `*Previsão de entrega:* ${estimatedDays} dias úteis\n` : ''
  const message =
`Olá ${name}! ✅

Seu pedido foi *confirmado* e já está sendo preparado!

🛍️ *Produto:* ${productName}
${prazo}
Em breve você receberá o código de rastreio por aqui. 📦

Obrigado pela compra! 💪`

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
