// Conteudo editavel de cada "mundo" (setor): capa do card na home e a
// vitrine embaixo das colecoes (fotos/videos de uso, textos, beneficios,
// passos). Fica no setor (coluna `content`, JSON) e e editado em
// Admin → Mundos. Sem import de banco: serve pro servidor e pro navegador.
import { type SectorStyle } from '@/lib/sectors-shared';

export type MediaKind = 'image' | 'video';
export type Media = { url: string; kind: MediaKind };
// productId: produto que aparece na foto (card de compra ao lado). 0 = automatico.
export type Shot = Media & { caption: string; alt: string; productId: number };
export type Tile = { icon: TileIcon; title: string; text: string };
export type Step = { title: string; text: string };

export const TILE_ICONS = ['sparkles', 'heart', 'gift', 'sun', 'leaf', 'paw', 'pen', 'star', 'shield', 'truck', 'printer', 'smile'] as const;
export type TileIcon = (typeof TILE_ICONS)[number];

export type WorldContent = {
  cover: Media;          // imagem/video do card "Elige tu mundo"
  showcase: {
    enabled: boolean;
    kicker: string;
    title: string;
    intro: string;
    shots: Shot[];       // ate 4 (a 1a e a grande)
    tiles: Tile[];       // ate 3
    steps: Step[];       // 0-3 ("Asi de facil")
    trust: boolean;      // faixa de confianca (envio, garantia...)
  };
};

const img = (url: string, caption = '', alt = ''): Shot => ({ url, kind: 'image', caption, alt, productId: 0 });

export const DEFAULT_WORLD: Record<SectorStyle, WorldContent> = {
  infantil: {
    cover: { url: '/images/sectors/infantil.jpg', kind: 'image' },
    showcase: {
      enabled: false,
      kicker: 'hecho para jugar',
      title: 'Juguetes que se montan, se pintan y se encienden',
      intro: 'Diseñados para que los peques jueguen, creen y se lo pasen en grande.',
      shots: [img('/images/sectors/infantil.jpg', 'Para jugar, pintar y soñar')],
      tiles: [
        { icon: 'smile', title: 'Para jugar de verdad', text: 'Piezas pensadas para manos pequeñas.' },
        { icon: 'star', title: 'Para pintar', text: 'Llegan en blanco para darles su propio color.' },
        { icon: 'sun', title: 'Para soñar', text: 'Lámparas de luz suave para la habitación.' },
      ],
      steps: [],
      trust: true,
    },
  },
  hogar: {
    cover: { url: '/images/sectors/hogar.jpg', kind: 'image' },
    showcase: {
      enabled: true,
      kicker: 'así queda en casa',
      title: 'Bonito y útil, todos los días',
      intro: 'Piezas pensadas para vivir en tu salón, tu estantería o tu mesa: combinan con todo y se notan sin hacer ruido.',
      shots: [
        img('/images/sectors/hogar-1.jpg', 'En la estantería, con flores frescas del jardín', 'Jarrón impreso en 3D con margaritas sobre una estantería'),
        img('/images/sectors/hogar-2.jpg', 'Sobre la mesa, junto a tus cosas de siempre', 'Jarrón impreso en 3D sobre una mesa de centro'),
      ],
      tiles: [
        { icon: 'sun', title: 'Juega con la luz', text: 'El relieve en espiral cambia con la luz del día.' },
        { icon: 'leaf', title: 'Flores, ramas o solo', text: 'Con un ramo, con ramas secas o como pieza decorativa.' },
        { icon: 'heart', title: 'Tonos que combinan', text: 'Colores neutros que encajan en cualquier rincón.' },
      ],
      steps: [],
      trust: true,
    },
  },
  llaveros: {
    cover: { url: '/images/sectors/llaveros.jpg', kind: 'image' },
    showcase: {
      enabled: true,
      kicker: 'hecho para ti',
      title: 'Un llavero que es solo tuyo',
      intro: 'Eliges el modelo, escribes el nombre y lo ves al momento. Nosotros lo imprimimos en 3D y te lo enviamos.',
      shots: [
        img('/images/sectors/llaveros-1.jpg', 'Siempre a mano, con tus llaves', 'Llavero personalizado impreso en 3D en la mano'),
        img('/images/sectors/llaveros.jpg', 'Modelos para todos los gustos', 'Colección de llaveros impresos en 3D'),
      ],
      tiles: [
        { icon: 'gift', title: 'El regalo perfecto', text: 'Con el nombre de quien lo recibe: cumpleaños, fin de curso, detalles.' },
        { icon: 'sparkles', title: 'Ligero y resistente', text: 'Para mochilas, llaves y bolsos del día a día.' },
        { icon: 'pen', title: 'Lo ves antes de pedirlo', text: 'Escribe el nombre y mira cómo queda en el modelo.' },
      ],
      steps: [
        { title: 'Elige el modelo', text: 'Mira los llaveros de la colección y quédate con tu favorito.' },
        { title: 'Escribe el nombre', text: 'Lo ves al momento en el llavero, tal cual lo imprimiremos.' },
        { title: 'Lo imprimimos y enviamos', text: 'Sale de nuestro taller de Elche directo a tu casa.' },
      ],
      trust: true,
    },
  },
  mascotas: {
    cover: { url: '/images/sectors/mascotas.png', kind: 'image' },
    showcase: {
      enabled: true,
      kicker: 'para los peludos de la casa',
      title: 'Hechos para su día a día',
      intro: 'Comederos, paseos y detalles impresos en 3D, pensados para que tu mascota (y tú) estéis más cómodos.',
      shots: [
        img('/images/sectors/mascotas-1.jpg', 'A la hora de comer', 'Perro comiendo de un comedero doble impreso en 3D'),
        img('/images/sectors/mascotas-2.jpg', 'Listos para el paseo', 'Dispensador de bolsas y pala para paseos impresos en 3D'),
      ],
      tiles: [
        { icon: 'paw', title: 'Con su nombre', text: 'Personaliza las piezas con el nombre de tu mascota.' },
        { icon: 'sparkles', title: 'Fáciles de limpiar', text: 'Superficies lisas, pensadas para el uso diario.' },
        { icon: 'heart', title: 'Colores alegres', text: 'Para que sus cosas se encuentren a la primera.' },
      ],
      steps: [
        { title: 'Elige la pieza', text: 'Comedero, placa, accesorio de paseo…' },
        { title: 'Escribe su nombre', text: 'Míralo al momento en la pieza antes de pedirla.' },
        { title: 'Lo recibe en casa', text: 'Lo imprimimos en Elche y te lo enviamos con seguimiento.' },
      ],
      trust: true,
    },
  },
};

const str = (v: unknown, max: number, def = '') => (typeof v === 'string' ? v.trim().slice(0, max) : def);
const kind = (v: unknown, url: string): MediaKind => (v === 'video' || /\.(mp4|webm|mov)(\?|$)/i.test(url) ? 'video' : 'image');

// Junta o salvo no banco com o padrao do visual (campos que faltam = padrao).
export function parseWorldContent(raw: unknown, style: SectorStyle): WorldContent {
  const d = DEFAULT_WORLD[style] ?? DEFAULT_WORLD.hogar;
  let o: any = {};
  if (typeof raw === 'string' && raw.trim()) { try { o = JSON.parse(raw); } catch { o = {}; } }
  else if (raw && typeof raw === 'object') o = raw;
  const sc = o.showcase ?? {};
  const coverUrl = str(o.cover?.url, 1000, d.cover.url) || d.cover.url;
  return {
    cover: { url: coverUrl, kind: kind(o.cover?.kind, coverUrl) },
    showcase: {
      enabled: typeof sc.enabled === 'boolean' ? sc.enabled : d.showcase.enabled,
      kicker: str(sc.kicker, 80, d.showcase.kicker),
      title: str(sc.title, 120, d.showcase.title),
      intro: str(sc.intro, 400, d.showcase.intro),
      shots: Array.isArray(sc.shots)
        ? sc.shots.slice(0, 4).map((s: any) => { const url = str(s?.url, 1000); return { url, kind: kind(s?.kind, url), caption: str(s?.caption, 120), alt: str(s?.alt, 160), productId: Math.max(0, Math.floor(Number(s?.productId) || 0)) }; }).filter((s: Shot) => s.url)
        : d.showcase.shots,
      tiles: Array.isArray(sc.tiles)
        ? sc.tiles.slice(0, 3).map((t: any) => ({ icon: (TILE_ICONS as readonly string[]).includes(t?.icon) ? t.icon : 'sparkles', title: str(t?.title, 60), text: str(t?.text, 200) })).filter((t: Tile) => t.title)
        : d.showcase.tiles,
      steps: Array.isArray(sc.steps)
        ? sc.steps.slice(0, 3).map((t: any) => ({ title: str(t?.title, 60), text: str(t?.text, 200) })).filter((t: Step) => t.title)
        : d.showcase.steps,
      trust: typeof sc.trust === 'boolean' ? sc.trust : d.showcase.trust,
    },
  };
}
