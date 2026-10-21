// Setores e colecoes da vitrine — tipos, valores iniciais e regras de
// vinculo com produtos. Sem import de banco: serve pro servidor e pro
// navegador. Os dados de verdade vivem nas tabelas `sectors` e
// `site_collections` (Admin → Setores e coleções); DEFAULT_SECTORS so
// preenche o banco na primeira vez e cobre o site se o banco cair.

export type Interactive = 'none' | 'rompecabezas' | 'colorear' | 'encender' | 'nombre';
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
  // Video curto opcional da colecao (toca sem som no destaque).
  videoUrl: string;
  // Categorias de produto (nomes do Admin → Categorias) ou palavras-chave,
  // separadas por virgula. Produto entra se a categoria dele contem uma delas.
  match: string;
  position: number;
  enabled: boolean;
};

// Visual do setor (site "coringa": mudou o setor, muda o design).
// infantil = colorido em blocos; hogar = casa, minimalista quente.
export type SectorStyle = 'infantil' | 'hogar' | 'llaveros' | 'mascotas' | 'navidad';
export const SECTOR_STYLES: { key: SectorStyle; label: string; hint: string }[] = [
  { key: 'infantil', label: 'Infantil', hint: 'Cores fortes, cards com contorno e brincadeiras. Para brinquedos, lâmparas infantis, kits de pintar.' },
  { key: 'hogar', label: 'Casa / Hogar', hint: 'Tons areia e creme, letras elegantes, fotos grandes. Para decoração, vasos, móveis e organização.' },
  { key: 'llaveros', label: 'Chaveiros personalizados', hint: 'Índigo e laranja, moderno e divertido, com o nome do cliente ao vivo no chaveiro.' },
  { key: 'navidad', label: 'Navidad', hint: 'Verde com detalhes vermelhos, neve caindo e o trenó do Papai Noel. Para a coleção de Natal.' },
  { key: 'mascotas', label: 'Mascotas / Pet', hint: 'Tons quentes (marrom e dourado), fotos grandes dos pets em destaque e nome do pet personalizado.' },
];
export const sectorStyleOf = (v: unknown): SectorStyle =>
  v === 'hogar' || v === 'llaveros' || v === 'mascotas' || v === 'navidad' ? v : 'infantil';

export type Sector = {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  style: SectorStyle;
  // Texto, imagem e video de abertura do setor (Admin → Setores e coleções).
  description: string;
  imageUrl: string;
  videoUrl: string;
  // Capa e vitrine do mundo (JSON livre; ver lib/world-content.ts).
  content?: unknown;
  position: number;
  enabled: boolean;
  collections: SiteCollection[];
};

export const INTERACTIVE_OPTIONS: { key: Interactive; label: string }[] = [
  { key: 'none', label: 'Nenhuma' },
  { key: 'rompecabezas', label: 'Quebra-cabeça (pôr a peça que falta)' },
  { key: 'colorear', label: 'Pintar o dinossauro' },
  { key: 'encender', label: 'Acender a luminária (site escuro + interruptor)' },
  { key: 'nombre', label: 'Personalizar com nome (chaveiro / pet: o cliente escreve e vê ao vivo)' },
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

// Colecao de um produto: a escolhida no cadastro (Admin → Produtos → "Onde
// aparece no site") e, se nao tiver, a que bate com a categoria dele.
export function collectionForProduct(collections: SiteCollection[], p: { collectionSlug?: string; category?: string; categoryLabel?: string }) {
  if (p.collectionSlug) {
    const chosen = collections.find((c) => c.slug === p.collectionSlug);
    if (chosen) return chosen;
  }
  return collectionForCategory(collections, p.categoryLabel ?? p.category);
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

const col = (c: Omit<SiteCollection, 'id' | 'sectorId' | 'enabled' | 'photoUrl' | 'videoUrl'> & { photoUrl?: string; videoUrl?: string }): SiteCollection => ({
  id: 0,
  sectorId: 0,
  enabled: true,
  photoUrl: '',
  videoUrl: '',
  ...c,
});

export const DEFAULT_SECTORS: Sector[] = [
  {
    id: 0,
    slug: 'infantil',
    name: 'Infantil',
    tagline: 'Juguetes y lámparas impresos en 3D para los peques',
    style: 'infantil',
    description: '',
    imageUrl: '',
    videoUrl: '',
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
