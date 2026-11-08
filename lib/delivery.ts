// Previsão de entrega: dias úteis (seg–sex) de fabricação + transporte, a partir de hoje
// (hora de Madrid). Pedido depois da hora de corte começa a contar no próximo dia útil.
import { DEFAULT_ENTREGA, type EntregaContent } from '@/lib/site-content-defaults';

function madridNow(): Date {
  const s = new Date().toLocaleString('en-US', { timeZone: 'Europe/Madrid' });
  return new Date(s);
}

function addBusinessDays(d: Date, n: number): Date {
  const out = new Date(d);
  let left = Math.max(0, Math.round(n));
  while (left > 0) {
    out.setDate(out.getDate() + 1);
    const wd = out.getDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  return out;
}

export function deliveryWindow(cfg: Partial<EntregaContent> | undefined, personalized: boolean) {
  const c = { ...DEFAULT_ENTREGA, ...cfg };
  let start = madridNow();
  const wd = start.getDay();
  // fim de semana ou depois do corte: começa no próximo dia útil
  if (wd === 0 || wd === 6 || start.getHours() >= c.cutoffHour) start = addBusinessDays(start, 1);
  const prod = personalized ? c.productionDaysCustom : c.productionDays;
  const from = addBusinessDays(start, prod + c.transitMin);
  const to = addBusinessDays(start, prod + Math.max(c.transitMin, c.transitMax));
  return { from, to, prod };
}

const DIAS = ['dom.', 'lun.', 'mar.', 'mié.', 'jue.', 'vie.', 'sáb.'];
const MESES = ['ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.', 'jul.', 'ago.', 'sep.', 'oct.', 'nov.', 'dic.'];
// "vie. 13" ou "mar. 17 de nov."
const fmt = (d: Date, withMonth: boolean) => `${DIAS[d.getDay()]} ${d.getDate()}${withMonth ? ` de ${MESES[d.getMonth()]}` : ''}`;

export function deliveryText(cfg: Partial<EntregaContent> | undefined, personalized: boolean): string {
  const { from, to } = deliveryWindow(cfg, personalized);
  const sameMonth = from.getMonth() === to.getMonth();
  return `Recíbelo entre el ${fmt(from, !sameMonth)} y el ${fmt(to, true)}`;
}
