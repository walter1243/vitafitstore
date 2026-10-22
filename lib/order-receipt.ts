'use client';
// Comprovante do pedido em PDF pra impressora termica de 58 mm (Bluetooth,
// impresso pelo celular). Papel de 58 mm = area util de 48 mm (384 pontos a
// 203 dpi): a pagina tem exatamente 48 mm de largura, sem margem, e a altura
// acompanha o conteudo (rolo continuo). So preto puro — a termica nao tem cinza.
import { jsPDF } from 'jspdf';

export type ReceiptItem = { name?: string; quantity?: number; color?: string; size?: string; text?: string; note?: string; total?: number; packQty?: number; colorIsLetters?: boolean };
export type ReceiptOrder = {
  id: number;
  when: string;
  customer: string;
  phone?: string;
  email?: string;
  addressLine?: string;
  postalCode?: string;
  city?: string;
  country?: string;
  shippingMethod?: string;
  shippingService?: string;
  pickupPoint?: string;
  shippingCost?: number | null;
  total: number;
  items: ReceiptItem[];
};

const W = 48;          // largura util (mm)
const PAD = 1;         // respiro lateral (mm)
const LOGO = '/images/logo-kitoys-termica.png'; // 384 px, 1 bit
const LOGO_W = 44;     // mm
const LOGO_RATIO = 264 / 384;

const eur = (n: number) => `${n.toFixed(2)} €`;

async function dataUrl(src: string) {
  const blob = await (await fetch(src)).blob();
  return await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}

// Desenha tudo; com `doc` nulo so mede a altura (pra criar a pagina do tamanho certo).
function layout(doc: jsPDF, o: ReceiptOrder, logo: string | null, draw: boolean) {
  let y = 2;
  const inner = W - PAD * 2;
  const text = (s: string, size = 8.5, bold = false, align: 'left' | 'center' | 'right' = 'left') => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(s, inner) as string[];
    const lh = size * 0.42; // pt → mm com entrelinha
    for (const line of lines) {
      y += lh;
      if (draw) doc.text(line, align === 'center' ? W / 2 : align === 'right' ? W - PAD : PAD, y, { align });
    }
    y += 0.6;
  };
  const row = (left: string, right: string, size = 8.5, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const rw = doc.getTextWidth(right) + 2;
    const lines = doc.splitTextToSize(left, inner - rw) as string[];
    const lh = size * 0.42;
    lines.forEach((line, i) => {
      y += lh;
      if (draw) {
        doc.text(line, PAD, y);
        if (i === 0) doc.text(right, W - PAD, y, { align: 'right' });
      }
    });
    y += 0.6;
  };
  const rule = () => {
    y += 1.2;
    if (draw) {
      doc.setLineWidth(0.25);
      doc.setLineDashPattern([0.8, 0.6], 0);
      doc.line(PAD, y, W - PAD, y);
      doc.setLineDashPattern([], 0);
    }
    y += 1.2;
  };

  // Cabecalho
  if (logo) {
    const h = LOGO_W * LOGO_RATIO;
    if (draw) doc.addImage(logo, 'PNG', (W - LOGO_W) / 2, y, LOGO_W, h);
    y += h + 1;
  } else {
    text('KITOYS 3D', 14, true, 'center');
  }
  text('www.kitoys3d.com', 7.5, false, 'center');
  rule();
  text(`PEDIDO #${o.id}`, 13, true, 'center');
  text(o.when, 8, false, 'center');
  rule();

  // Cliente
  text('CLIENTE', 8, true);
  text(o.customer || '-', 9.5, true);
  if (o.phone) text(`Tel: ${o.phone}`);
  if (o.email) text(o.email, 7.5);
  rule();

  // Envio
  const pickup = o.shippingMethod === 'pickup';
  text(pickup ? 'ENVÍO · RECOGER EN PUNTO' : 'ENVÍO · A DOMICILIO', 8, true);
  if (pickup && o.pickupPoint) {
    // "id · nome · endereco · cp cidade" → uma info por linha
    const parts = o.pickupPoint.split(' · ').map((s) => s.trim()).filter(Boolean);
    const [, ...rest] = parts;
    for (const p of rest.length ? rest : parts) text(p, 8.5);
    if (parts[0]) text(`Punto: ${parts[0]}`, 7.5);
  }
  if (!pickup || !o.pickupPoint) {
    if (o.addressLine) text(o.addressLine, 9);
    const cityLine = [o.postalCode, o.city].filter(Boolean).join(' ');
    if (cityLine) text(cityLine, 9);
    if (o.country) text(o.country === 'ES' ? 'España' : o.country, 8.5);
  }
  if (o.shippingService) text(o.shippingService.replace(/\s*\(id [^)]*\)/, ''), 7.5);
  rule();

  // Produtos
  text('PRODUCTOS', 8, true);
  for (const it of o.items) {
    const q = it.quantity ?? 1;
    const qty = it.packQty ? `${Math.round(q / it.packQty)} pack (${q} uds)` : `${q}x`;
    row(`${qty} ${it.name ?? ''}`, it.total != null ? eur(Number(it.total)) : '', 9, true);
    const det = [
      it.color && `${it.colorIsLetters ? 'Letras' : 'Color'}: ${it.color}`,
      it.size && `Talla: ${it.size}`,
    ].filter(Boolean).join(' · ');
    if (det) text(det, 8.5);
    if (it.text) text(`Nombre: "${it.text}"`, 10, true);
    if (it.note) text(it.note, 7.5);
    y += 0.8;
  }
  rule();

  // Totais
  const ship = o.shippingCost != null && Number.isFinite(Number(o.shippingCost)) ? Number(o.shippingCost) : null;
  if (ship != null) {
    row('Subtotal', eur(o.total - ship));
    row('Envío', ship === 0 ? 'Gratis' : eur(ship));
  }
  row('TOTAL', eur(o.total), 12, true);
  rule();
  text('¡Gracias por tu compra!', 9, true, 'center');
  text('Hecho en nuestro taller 3D', 7.5, false, 'center');
  return y + 6; // sobra pra destacar o papel
}

// Monta o PDF (separado do download pra poder testar).
export function buildOrderReceipt(o: ReceiptOrder, logo: string | null) {
  const probe = new jsPDF({ unit: 'mm', format: [W, 400] });
  const height = Math.max(60, Math.ceil(layout(probe, o, logo, false)));
  const doc = new jsPDF({ unit: 'mm', format: [W, height], orientation: 'portrait' });
  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);
  layout(doc, o, logo, true);
  return doc;
}

export async function downloadOrderReceipt(o: ReceiptOrder) {
  let logo: string | null = null;
  try { logo = await dataUrl(LOGO); } catch { logo = null; }
  buildOrderReceipt(o, logo).save(`pedido-${o.id}.pdf`);
}
