import { Lamp, Puzzle, type LucideIcon } from 'lucide-react';
import { slugifyCategory } from '@/lib/store-product';

// As colecoes da vitrine infantil. Cada produto entra numa colecao pela
// CATEGORIA cadastrada no admin: se o nome da categoria contem uma das
// palavras de `match` (sem acento, minusculo), o produto aparece ali.
// Ex: categorias "Juegos de mesa", "Puzzles 3D" → Juegos; "Lámparas luna" → Lámparas.
export type Collection = {
  slug: string;
  name: string;
  shortName: string;
  icon: LucideIcon;
  tagline: string;
  description: string;
  match: string[];
  // Cor da colecao. main: texto/icone/botao (contraste AA com branco);
  // soft: fundo pastel dos blocos e fotos.
  color: { main: string; soft: string };
};

export const COLLECTIONS: Collection[] = [
  {
    slug: 'juegos-3d',
    name: 'Juegos impresos en 3D',
    shortName: 'Juegos 3D',
    icon: Puzzle,
    tagline: 'Para jugar, montar y compartir',
    description:
      'Puzzles, juegos de mesa, figuras y retos de ingenio que salen de nuestra impresora 3D, capa a capa, listos para horas de diversión en familia.',
    color: { main: '#C2410C', soft: '#FFEBD9' },
    match: ['juego', 'jogo', 'juguete', 'brinquedo', 'puzzle', 'rompecabeza', 'game', 'figura', 'toy'],
  },
  {
    slug: 'lamparas',
    name: 'Lámparas para habitaciones',
    shortName: 'Lámparas',
    icon: Lamp,
    tagline: 'Luz suave para soñar',
    description:
      'Lámparas impresas en 3D con formas divertidas para decorar la habitación de los peques y acompañarles a la hora de dormir.',
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
