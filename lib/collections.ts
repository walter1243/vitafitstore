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
  // Paleta da colecao — cada uma tem a sua cor pra crianca reconhecer de
  // longe. main: blocos grandes/titulos; deep: botoes e texto pequeno sobre
  // fundo claro (contraste >= 4.5:1 com branco); soft: fundos.
  color: {
    main: string;
    soft: string;
    deep: string;
  };
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
    match: ['juego', 'jogo', 'juguete', 'brinquedo', 'puzzle', 'rompecabeza', 'game', 'figura', 'toy'],
    color: { main: '#F97316', soft: '#FFEDD5', deep: '#C2410C' },
  },
  {
    slug: 'lamparas',
    name: 'Lámparas para habitaciones',
    shortName: 'Lámparas',
    icon: Lamp,
    tagline: 'Luz suave para soñar',
    description:
      'Lámparas impresas en 3D con formas divertidas para decorar la habitación de los peques y acompañarles a la hora de dormir.',
    match: ['lampara', 'luminaria', 'luz', 'luces', 'lamp', 'quitamiedo', 'nocturna'],
    color: { main: '#7C5CFF', soft: '#EDE9FE', deep: '#5B3FD9' },
  },
];

export function getCollection(slug: string): Collection | undefined {
  return COLLECTIONS.find((c) => c.slug === slug);
}

export function collectionForCategory(category?: string): Collection | undefined {
  const key = slugifyCategory(category);
  return COLLECTIONS.find((c) => c.match.some((word) => key.includes(word)));
}
