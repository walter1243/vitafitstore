// Envio de e-mails pela Resend (API REST — sem dependencia extra).
// Chave: RESEND_KEY na Vercel. Remetente: RESEND_FROM (ex:
// "Kitoys 3D <pedidos@kitoys3d.com>") — o dominio do remetente precisa estar
// verificado na Resend, senao ela so entrega pro dono da conta.

const RESEND_URL = 'https://api.resend.com/emails';
const DEFAULT_FROM = 'Kitoys 3D <pedidos@kitoys3d.com>';
const REPLY_TO = 'kitoys3d@gmail.com';

export class EmailError extends Error {}

const senderDomain = () => (process.env.RESEND_FROM || DEFAULT_FROM).match(/@([^>\s]+)/)?.[1]?.toLowerCase() ?? '';

// Status do dominio do remetente na Resend. Chaves "so envio" nao podem ler
// dominios — ai volta status 'unknown'.
export async function senderDomainStatus() {
  const key = process.env.RESEND_KEY || process.env.RESEND_API_KEY;
  const name = senderDomain();
  if (!key) return { name, status: 'no-key' };
  try {
    const res = await fetch('https://api.resend.com/domains', { headers: { Authorization: `Bearer ${key}` } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { name, status: 'unknown', note: String(data?.message ?? res.status) };
    const d = (data?.data ?? []).find((x: any) => String(x?.name).toLowerCase() === name);
    return d ? { name, status: String(d.status), region: d.region } : { name, status: 'not-added' };
  } catch (e: any) {
    return { name, status: 'unknown', note: e?.message };
  }
}

export async function sendEmail({ to, subject, html, text }: { to: string; subject: string; html: string; text: string }) {
  const key = process.env.RESEND_KEY || process.env.RESEND_API_KEY;
  if (!key) throw new EmailError('RESEND_KEY não está configurada na Vercel.');
  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || DEFAULT_FROM,
      to: [to],
      reply_to: REPLY_TO,
      subject,
      html,
      text,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = String(data?.message || data?.error || `Resend respondeu ${res.status}`);
    throw new EmailError(
      /domain|verify|not verified|testing emails/i.test(msg)
        ? `A Resend recusou o remetente: ${msg} — verifique o domínio do remetente na Resend (Domains).`
        : msg,
    );
  }
  return data as { id: string };
}

// Pagina publica do pedido (/pedido): o cliente ve o estado (preparando,
// em caminho, pronto no ponto) com o numero do pedido + e-mail.
export const orderStatusUrl = (orderId: number, email?: string) =>
  `https://www.kitoys3d.com/pedido?n=${orderId}${email ? `&e=${encodeURIComponent(email)}` : ''}`;

const statusLinkHtml = (orderId: number, email?: string) =>
  `<tr><td align="center" style="padding:14px 32px 0;"><a href="${esc(orderStatusUrl(orderId, email))}" style="color:#23263f;font-size:14px;font-weight:bold;">Ver el estado de mi pedido</a></td></tr>`;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

// E-mail amigavel (espanhol) com o link de seguimento em destaque.
export function trackingEmail({ name, orderId, productName, trackingUrl, email }: {
  name: string;
  orderId: number;
  productName?: string;
  trackingUrl: string;
  email?: string;
}) {
  const first = (name || '').trim().split(/\s+/)[0] || '';
  const hello = first ? `¡Hola, ${esc(first)}!` : '¡Hola!';
  const product = productName ? ` (<strong>${esc(productName)}</strong>)` : '';
  const url = esc(trackingUrl);
  const subject = `¡Tu pedido #${orderId} ya está en camino! 🚚`;

  const html = `<!doctype html>
<html lang="es"><body style="margin:0;padding:0;background:#FFF8EF;font-family:Arial,Helvetica,sans-serif;color:#23263f;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8EF;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;">
        <tr><td align="center" style="padding:28px 24px 8px;">
          <img src="https://www.kitoys3d.com/images/logo-kitoys-3d.png" alt="Kitoys 3D" width="150" style="display:block;width:150px;height:auto;border:0;" />
        </td></tr>
        <tr><td style="padding:8px 32px 0;">
          <h1 style="margin:0 0 12px;font-size:26px;line-height:1.2;color:#23263f;">${hello} Tu pedido ya está en camino 🎉</h1>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#565a78;">
            Hemos terminado de preparar tu pedido <strong>#${orderId}</strong>${product} en nuestro taller y ya lo tiene la empresa de transporte.
            Puedes seguir el envío en todo momento desde este enlace:
          </p>
        </td></tr>
        <tr><td align="center" style="padding:8px 32px 8px;">
          <a href="${url}" target="_blank" rel="noopener" style="display:inline-block;background:#c2410c;color:#ffffff;text-decoration:none;font-weight:bold;font-size:18px;padding:16px 32px;border-radius:999px;">
            📦 Seguir mi pedido
          </a>
        </td></tr>
        <tr><td style="padding:12px 32px 0;">
          <p style="margin:0;font-size:13px;line-height:1.6;color:#565a78;">
            ¿El botón no funciona? Copia este enlace en tu navegador:<br />
            <a href="${url}" style="color:#c2410c;word-break:break-all;">${url}</a>
          </p>
        </td></tr>
        ${statusLinkHtml(orderId, email)}
        <tr><td style="padding:24px 32px 28px;">
          <p style="margin:0 0 6px;font-size:15px;line-height:1.6;color:#23263f;">¡Gracias por confiar en Kitoys 3D! Esperamos que los peques lo disfruten muchísimo.</p>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#565a78;">
            ¿Alguna duda? Responde a este correo o escríbenos por WhatsApp al +34 678 68 4704.
          </p>
        </td></tr>
        <tr><td align="center" style="background:#F2F4FA;padding:16px 24px;font-size:12px;color:#565a78;">
          Kitoys 3D · Juguetes y lámparas impresos en 3D · <a href="https://www.kitoys3d.com" style="color:#565a78;">kitoys3d.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = `${first ? `¡Hola, ${first}!` : '¡Hola!'} Tu pedido #${orderId}${productName ? ` (${productName})` : ''} ya está en camino.

Sigue tu envío aquí: ${trackingUrl}
Estado de tu pedido: ${orderStatusUrl(orderId, email)}

¡Gracias por confiar en Kitoys 3D! ¿Dudas? Responde a este correo o escríbenos por WhatsApp al +34 678 68 4704.`;

  return { subject, html, text };
}

// Pedido com "Recoger en punto": o cliente recebe o ponto escolhido, o codigo
// e um botao que abre o Google Maps no endereco certo (so tocar e ir buscar).
export function pickupEmail({ name, orderId, pickupPoint, email }: { name: string; orderId: number; pickupPoint: string; email?: string }) {
  // pickupPoint vem como "codigo · nome · endereco · cp cidade"
  const [code = '', pointName = '', address = '', zipCity = ''] = pickupPoint.split(' · ').map((s) => s.trim());
  const first = (name || '').trim().split(/\s+/)[0] || '';
  const hello = first ? `¡Hola, ${esc(first)}!` : '¡Hola!';
  const query = [pointName, address, zipCity, 'España'].filter(Boolean).join(', ');
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  const subject = `Tu pedido #${orderId}: punto de recogida 📍`;

  const html = `<!doctype html>
<html lang="es"><body style="margin:0;padding:0;background:#FFF8EF;font-family:Arial,Helvetica,sans-serif;color:#23263f;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8EF;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;">
        <tr><td align="center" style="padding:28px 24px 8px;">
          <img src="https://www.kitoys3d.com/images/logo-kitoys-3d.png" alt="Kitoys 3D" width="150" style="display:block;width:150px;height:auto;border:0;" />
        </td></tr>
        <tr><td style="padding:8px 32px 0;">
          <h1 style="margin:0 0 12px;font-size:26px;line-height:1.2;color:#23263f;">${hello} Recibimos tu pedido #${orderId} 🎉</h1>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#565a78;">
            Elegiste <strong>recoger tu pedido en un punto</strong>. Cuando llegue, la empresa de transporte te avisará y podrás ir a buscarlo aquí:
          </p>
        </td></tr>
        <tr><td style="padding:0 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF4E0;border-radius:16px;">
            <tr><td style="padding:18px 20px;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:bold;letter-spacing:1px;color:#9a3412;">📍 TU PUNTO DE RECOGIDA</p>
              <p style="margin:0 0 6px;font-size:18px;font-weight:bold;color:#23263f;">${esc(pointName || code)}</p>
              <p style="margin:0;font-size:15px;line-height:1.5;color:#23263f;">${esc(address)}<br />${esc(zipCity)}</p>
              ${code ? `<p style="margin:10px 0 0;font-size:13px;color:#565a78;">Código del punto: <strong style="color:#23263f;">${esc(code)}</strong> · Pedido: <strong style="color:#23263f;">#${orderId}</strong></p>` : ''}
            </td></tr>
          </table>
        </td></tr>
        <tr><td align="center" style="padding:20px 32px 8px;">
          <a href="${esc(mapsUrl)}" target="_blank" rel="noopener" style="display:inline-block;background:#c2410c;color:#ffffff;text-decoration:none;font-weight:bold;font-size:18px;padding:16px 32px;border-radius:999px;">
            🗺️ Cómo llegar
          </a>
        </td></tr>
        <tr><td style="padding:12px 32px 0;">
          <p style="margin:0;font-size:13px;line-height:1.6;color:#565a78;">
            Lleva tu DNI/NIE y el número de pedido para recogerlo. ¿El botón no funciona? Abre este enlace:<br />
            <a href="${esc(mapsUrl)}" style="color:#c2410c;word-break:break-all;">${esc(mapsUrl)}</a>
          </p>
        </td></tr>
        ${statusLinkHtml(orderId, email)}
        <tr><td style="padding:24px 32px 28px;">
          <p style="margin:0 0 6px;font-size:15px;line-height:1.6;color:#23263f;">¡Gracias por confiar en Kitoys 3D!</p>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#565a78;">
            ¿Alguna duda? Responde a este correo o escríbenos por WhatsApp al +34 678 68 4704.
          </p>
        </td></tr>
        <tr><td align="center" style="background:#F2F4FA;padding:16px 24px;font-size:12px;color:#565a78;">
          Kitoys 3D · Juguetes y lámparas impresos en 3D · <a href="https://www.kitoys3d.com" style="color:#565a78;">kitoys3d.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = `${first ? `¡Hola, ${first}!` : '¡Hola!'} Recibimos tu pedido #${orderId}.

Elegiste recogerlo en un punto. Cuando llegue, la empresa de transporte te avisará.

Tu punto de recogida:
${pointName}
${address}
${zipCity}
${code ? `Código del punto: ${code} · Pedido: #${orderId}\n` : ''}
Cómo llegar (Google Maps): ${mapsUrl}
Estado de tu pedido: ${orderStatusUrl(orderId, email)}

Lleva tu DNI/NIE y el número de pedido para recogerlo.
¡Gracias por confiar en Kitoys 3D! ¿Dudas? Responde a este correo o escríbenos por WhatsApp al +34 678 68 4704.`;

  return { subject, html, text };
}

// Admin marcou "Entregue no ponto" (ou entregue em casa): aviso ao cliente.
export function readyEmail({ name, orderId, pickupPoint, email }: { name: string; orderId: number; pickupPoint?: string; email?: string }) {
  const [, pointName = '', address = '', zipCity = ''] = (pickupPoint || '').split(' · ').map((s) => s.trim());
  const first = (name || '').trim().split(/\s+/)[0] || '';
  const hello = first ? `¡Hola, ${esc(first)}!` : '¡Hola!';
  const atPoint = Boolean(pickupPoint);
  const subject = atPoint ? `Tu pedido #${orderId} ya está en tu punto de recogida 📍` : `Tu pedido #${orderId} ha sido entregado 🎉`;
  const lead = atPoint
    ? 'Tu pedido ya ha llegado al punto de recogida. Puedes ir a buscarlo con tu DNI/NIE y el número de pedido:'
    : 'Tu pedido ha sido entregado. ¡Esperamos que lo disfrutéis muchísimo!';
  const statusUrl = esc(orderStatusUrl(orderId, email));

  const html = `<!doctype html>
<html lang="es"><body style="margin:0;padding:0;background:#FFF8EF;font-family:Arial,Helvetica,sans-serif;color:#23263f;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8EF;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;">
        <tr><td align="center" style="padding:28px 24px 8px;">
          <img src="https://www.kitoys3d.com/images/logo-kitoys-3d.png" alt="Kitoys 3D" width="150" style="display:block;width:150px;height:auto;border:0;" />
        </td></tr>
        <tr><td style="padding:8px 32px 0;">
          <h1 style="margin:0 0 12px;font-size:26px;line-height:1.2;color:#23263f;">${hello} ${atPoint ? 'Tu pedido te espera 📦' : 'Pedido entregado 🎉'}</h1>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#565a78;">${lead}</p>
        </td></tr>
        ${atPoint ? `<tr><td style="padding:0 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF4E0;border-radius:16px;">
            <tr><td style="padding:18px 20px;">
              <p style="margin:0 0 6px;font-size:18px;font-weight:bold;color:#23263f;">${esc(pointName)}</p>
              <p style="margin:0;font-size:15px;line-height:1.5;color:#23263f;">${esc(address)}<br />${esc(zipCity)}</p>
              <p style="margin:10px 0 0;font-size:13px;color:#565a78;">Pedido: <strong style="color:#23263f;">#${orderId}</strong></p>
            </td></tr>
          </table>
        </td></tr>` : ''}
        <tr><td align="center" style="padding:20px 32px 8px;">
          <a href="${statusUrl}" target="_blank" rel="noopener" style="display:inline-block;background:#c2410c;color:#ffffff;text-decoration:none;font-weight:bold;font-size:18px;padding:16px 32px;border-radius:999px;">Ver mi pedido</a>
        </td></tr>
        <tr><td style="padding:24px 32px 28px;">
          <p style="margin:0 0 6px;font-size:15px;line-height:1.6;color:#23263f;">¡Gracias por confiar en Kitoys 3D!</p>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#565a78;">¿Alguna duda? Responde a este correo o escríbenos por WhatsApp al +34 678 68 4704.</p>
        </td></tr>
        <tr><td align="center" style="background:#F2F4FA;padding:16px 24px;font-size:12px;color:#565a78;">
          Kitoys 3D · Juguetes y lámparas impresos en 3D · <a href="https://www.kitoys3d.com" style="color:#565a78;">kitoys3d.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const text = `${first ? `¡Hola, ${first}!` : '¡Hola!'} ${atPoint ? `Tu pedido #${orderId} ya está en el punto de recogida:
${pointName}
${address}
${zipCity}
Lleva tu DNI/NIE y el número de pedido.` : `Tu pedido #${orderId} ha sido entregado.`}

Estado de tu pedido: ${orderStatusUrl(orderId, email)}

¡Gracias por confiar en Kitoys 3D! ¿Dudas? Responde a este correo o escríbenos por WhatsApp al +34 678 68 4704.`;

  return { subject, html, text };
}
