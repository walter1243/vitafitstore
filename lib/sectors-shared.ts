// Setores e colecoes da vitrine — tipos, valores iniciais e regras de
// vinculo com produtos. Sem import de banco: serve pro servidor e pro
// navegador. Os dados de verdade vivem nas tabelas `sectors` e
// `site_collections` (Admin → Setores e coleções); DEFAULT_SECTORS so
// preenche o banco na primeira vez e cobre o site se o banco cair.

export type Interactive = 'none' | 'rompecabezas' | 'colorear' | 'encender';
export type Theme = 'light' | 'dark';

export type SiteCollection = {
  id: number;
  sectorId: number;
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  // Imagem principal (aparece inteira no destaque claro e nos cards).
  imageUrl: string;
  // Foto de fundo de tela cheia (usada no tema escuro).
  photoUrl: string;
  theme: Theme;
  // Cor de fundo do destaque (no tema claro vira um degrade suave).
  bgColor: string;
  interactive: Interactive;
  // Categorias de produto (nomes do Admin → Categorias) ou palavras-chave,
  // separadas por virgula. Produto entra se a categoria dele contem uma delas.
  match: string;
  position: number;
  enabled: boolean;
};

export type Sector = {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  position: number;
  enabled: boolean;
  collections: SiteCollection[];
};

export const INTERACTIVE_OPTIONS: { key: Interactive; label: string }[] = [
  { key: 'none', label: 'Nenhuma' },
  { key: 'rompecabezas', label: 'Quebra-cabeça (pôr a peça que falta)' },
  { key: 'colorear', label: 'Pintar o dinossauro' },
  { key: 'encender', label: 'Acender a luminária (site escuro + interruptor)' },
];

export function slugify(raw: string) {
  return (raw || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function matchTerms(c: Pick<SiteCollection, 'match'>) {
  return c.match.split(',').map((t) => slugify(t)).filter(Boolean);
}

// Colecao de um produto pela categoria dele — vale a primeira colecao (na
// ordem dos setores/colecoes) cujas palavras aparecem no nome da categoria.
export function collectionForCategory(collections: SiteCollection[], category?: string) {
  const key = slugify(category || '');
  if (!key) return undefined;
  return collections.find((c) => matchTerms(c).some((t) => key.includes(t)));
}

export function enabledCollections(sectors: Sector[]) {
  return sectors.filter((s) => s.enabled).flatMap((s) => s.collections.filter((c) => c.enabled));
}

const col = (c: Omit<SiteCollection, 'id' | 'sectorId' | 'enabled' | 'photoUrl'> & { photoUrl?: string }): SiteCollection => ({
  id: 0,
  sectorId: 0,
  enabled: true,
  photoUrl: '',
  ...c,
});

export const DEFAULT_SECTORS: Sector[] = [
  {
    id: 0,
    slug: 'infantil',
    name: 'Infantil',
    tagline: 'Juguetes y lámparas impresos en 3D para los peques',
    position: 1,
    enabled: true,
    collections: [
      col({
        slug: 'rompecabezas',
        name: 'Rompecabezas',
        shortName: 'Rompecabezas',
        tagline: '¡Encuentra la pieza que falta!',
        description: 'Rompecabezas impresos en 3D con dibujos divertidos para montar (y colorear) en familia.',
        imageUrl: '/images/rompecabezas-completo.png',
        theme: 'light',
        bgColor: '#EAF2FF',
        interactive: 'rompecabezas',
        match: 'rompecabezas, puzzle, puzle, quebra',
        position: 1,
      }),
      col({
        slug: 'lamparas',
        name: 'Lámparas para habitaciones',
        shortName: 'Lámparas',
        tagline: 'Luz suave para soñar',
        description: 'Lámparas impresas en 3D con formas divertidas, como nuestro cohete, para la habitación de los peques.',
        imageUrl: '/images/lampara-cohete.png',
        photoUrl: '/images/lampara-cohete-habitacion.jpg',
        theme: 'dark',
        bgColor: '#07080F',
        interactive: 'encender',
        match: 'lampara, luminaria, luz, luces, lamp, quitamiedo, nocturna',
        position: 2,
      }),
      col({
        slug: 'para-pintar',
        name: 'Juguetes para pintar',
        shortName: 'Para pintar',
        tagline: '¡Píntalos a tu manera!',
        description: 'Juguetes impresos en 3D que llegan en blanco para que los peques los pinten como quieran.',
        imageUrl: '/images/juguetes-para-pintar.png',
        theme: 'light',
        bgColor: '#FFF1DF',
        interactive: 'colorear',
        match: 'pintar, colorear, colorir, juguete, brinquedo, dino, figura',
        position: 3,
      }),
    ],
  },
];

// Fundo pastel da colecao (cards de produto, estados vazios). No tema claro
// e a propria cor de fundo; no escuro, um lilas claro neutro.
export function softOf(c?: Pick<SiteCollection, 'theme' | 'bgColor'>) {
  if (!c) return '#F2F4FA';
  return c.theme === 'light' ? c.bgColor : '#F1EEFA';
}
