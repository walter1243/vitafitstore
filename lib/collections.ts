import { Lamp, Palette, type LucideIcon } from 'lucide-react';
import { slugifyCategory } from '@/lib/store-product';

// As colecoes da vitrine infantil — o visual e as animacoes de cada uma
// ficam aqui no codigo; os PRODUTOS entram pelo admin. Um produto aparece
// na colecao quando o nome da CATEGORIA dele (Admin → Categorias) contem
// uma das palavras de `match` (sem acento, minusculo).
// Ex: "Juguetes para pintar", "Puzzles 3D" → Para pintar; "Lámparas luna" → Lámparas.
export type Collection = {
  slug: string;
  name: string;
  shortName: string;
  icon: LucideIcon;
  tagline: string;
  description: string;
  match: string[];
  // Imagem da colecao (cards, circulos e banner da pagina).
  image: string;
  // Brincadeira da colecao: "colorear" abre o foguete para pintar;
  // "encender" escurece o site e mostra o interruptor da lampada.
  interactive: 'colorear' | 'encender';
  // Cor da colecao. main: texto/icone/botao (contraste AA com branco);
  // soft: fundo pastel dos blocos e fotos.
  color: { main: string; soft: string };
};

export const COLLECTIONS: Collection[] = [
  {
    slug: 'para-pintar',
    name: 'Juguetes para pintar',
    shortName: 'Para pintar',
    icon: Palette,
    tagline: '¡Píntalos a tu manera!',
    description:
      'Juguetes impresos en 3D que llegan en blanco para que los peques los pinten como quieran: osos, cohetes, trenes, castillos y mucho más.',
    image: '/images/juguetes-para-pintar.png',
    interactive: 'colorear',
    color: { main: '#C2410C', soft: '#FFEBD9' },
    match: ['pintar', 'colorear', 'colorir', 'juego', 'jogo', 'juguete', 'brinquedo', 'puzzle', 'rompecabeza', 'figura', 'toy'],
  },
  {
    slug: 'lamparas',
    name: 'Lámparas para habitaciones',
    shortName: 'Lámparas',
    icon: Lamp,
    tagline: 'Luz suave para soñar',
    description:
      'Lámparas impresas en 3D con formas divertidas, como nuestro cohete, para decorar la habitación de los peques y acompañarles a la hora de dormir.',
    image: '/images/lampara-cohete.png',
    interactive: 'encender',
    color: { main: '#6D28D9', soft: '#F1E8FF' },
    match: ['lampara', 'luminaria', 'luz', 'luces', 'lamp', 'quitamiedo', 'nocturna'],
  },
];

export function getCollection(slug: string): Collection | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}

export function collectionForCategory(category?: string): Collection | undefined {
  const key = slugifyCategory(category);
  return COLLECTIONS.find((c) => c.match.some((word) => key.includes(word)));
}
