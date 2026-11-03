// Link de rastreio a partir do que o admin colar: link com ou sem https://,
// ou so o codigo (ex: PQ4F6P0712345670103001S / ES123456789ES) → Correos.
export function trackingLink(input: string): string | null {
  const v = String(input || '').trim();
  if (!v) return null;
  if (/^https?:\/\//i.test(v)) {
    try { return new URL(v).toString(); } catch { return null; }
  }
  if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(v)) {
    try { return new URL(`https://${v}`).toString(); } catch { return null; }
  }
  const code = v.replace(/\s+/g, '').toUpperCase();
  if (/^[A-Z0-9]{8,40}$/.test(code)) {
    return `https://www.correos.es/es/es/herramientas/localizador/envios/detalle?tracking-number=${code}`;
  }
  return null;
}
