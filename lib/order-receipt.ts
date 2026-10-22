'use client';
// Etiqueta de envio do pedido em PDF pra impressora termica de 58 mm
// (Bluetooth, impressa pelo celular). Papel de 58 mm = area util de 48 mm
// (384 pontos a 203 dpi): a pagina tem exatamente 48 mm de largura e a altura
// acompanha o conteudo. Layout de etiqueta: moldura, logo, nome completo,
// endereco, telefone e o numero do pedido. So preto puro.
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

const W = 48;      // largura util (mm)
const M = 0.8;     // moldura afastada da borda (mm)
const IN = 2.4;    // respiro interno (mm)
const COUNTRY: Record<string, string> = { ES: 'ESPAÑA', PT: 'PORTUGAL', FR: 'FRANCIA', DE: 'ALEMANIA', BR: 'BRASIL' };

// Logo da marca ja em preto e branco puro (1 bit, 384 px) pra termica.
const LOGO = '/images/logo-kitoys-termica.png';
const LOGO_RATIO = 264 / 384;
const LOGO_W = 30; // mm

async function dataUrl(src: string) {
  const blob = await (await fetch(src)).blob();
  return await new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}

// Desenha tudo; draw=false so mede a altura.
function layout(doc: jsPDF, o: ReceiptOrder, logo: string | null, draw: boolean) {
  const inner = W - 2 * M - 2 * IN;
  const x0 = M + IN;
  let y = M;

  // Cabecalho: a logo (sem ela, o nome escrito)
  const logoH = LOGO_W * LOGO_RATIO;
  const headH = logo ? logoH + 2 : 8.5;
  if (draw) {
    if (logo) {
      doc.addImage(logo, 'PNG', (W - LOGO_W) / 2, y + 1, LOGO_W, logoH);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Kitoys 3D', W / 2, y + headH / 2 + 1.7, { align: 'center' });
    }
  }
  y += headH;
  if (draw) { doc.setLineWidth(0.35); doc.line(M, y, W - M, y); }
  y += IN;

  const para = (s: string, size: number, bold = false, gap = 0.5) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(s, inner) as string[];
    const lh = size * 0.4;
    for (const line of lines) {
      y += lh;
      if (draw) doc.text(line, x0, y);
    }
    y += gap;
  };

  // Destinatario
  para(o.customer || '-', 10.5, true, 1);
  if (o.addressLine) para(o.addressLine, 7.5, false, 0.2);
  const cityLine = [o.postalCode, (o.city ?? '').toUpperCase()].filter(Boolean).join(' ');
  const country = COUNTRY[String(o.country ?? 'ES').toUpperCase()] ?? String(o.country ?? '').toUpperCase();
  if (cityLine || country) para([cityLine, country].filter(Boolean).join(', '), 7.5, false, 1.4);
  if (o.phone) para(`TEL: ${o.phone}`, 9, false, 0.4);
  y += IN - 0.6;
  if (draw) { doc.setLineWidth(0.35); doc.line(M, y, W - M, y); }

  // Rodape: numero do pedido numa caixa
  y += IN;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const label = `PEDIDO: #${o.id}`;
  const bw = doc.getTextWidth(label) + 4;
  const bh = 5.2;
  if (draw) {
    doc.setLineWidth(0.3);
    doc.rect((W - bw) / 2, y, bw, bh);
    doc.text(label, W / 2, y + bh / 2 + 1.1, { align: 'center' });
  }
  y += bh + IN;

  // Moldura
  if (draw) { doc.setLineWidth(0.4); doc.rect(M, M, W - 2 * M, y - M); }
  return y + M + 3; // sobra pra destacar o papel
}

// Monta o PDF (separado do download pra poder testar).
export function buildOrderReceipt(o: ReceiptOrder, logo: string | null = null) {
  const probe = new jsPDF({ unit: 'mm', format: [W, 200] });
  const height = Math.ceil(layout(probe, o, logo, false));
  const doc = new jsPDF({ unit: 'mm', format: [W, Math.max(height, W + 1)] });
  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);
  layout(doc, o, logo, true);
  return doc;
}

export async function downloadOrderReceipt(o: ReceiptOrder) {
  let logo: string | null = null;
  try { logo = await dataUrl(LOGO); } catch { logo = null; }
  buildOrderReceipt(o, logo).save(`etiqueta-pedido-${o.id}.pdf`);
}
