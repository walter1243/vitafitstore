// Shared types + defaults for editable storefront content.
// Safe to import from both server code (lib/site-content.ts, app/page.tsx)
// and client components (admin forms, storefront sections) — no DB imports here.

export type IconKey =
  | 'leaf'
  | 'zap'
  | 'truck'
  | 'shield'
  | 'clock'
  | 'rotate'
  | 'heart'
  | 'star'
  | 'gift'
  | 'lock'
  | 'sparkles'
  | 'award'
  | 'flame'
  | 'snowflake'
  | 'thermometer';

export const ICON_OPTIONS: { key: IconKey; label: string }[] = [
  { key: 'flame', label: 'Chama (calor)' },
  { key: 'thermometer', label: 'Termômetro (temperatura)' },
  { key: 'snowflake', label: 'Floco de neve (inverno)' },
  { key: 'shield', label: 'Escudo (segurança)' },
  { key: 'zap', label: 'Raio (eficiência energética)' },
  { key: 'truck', label: 'Caminhão (entrega)' },
  { key: 'clock', label: 'Relógio (rapidez)' },
  { key: 'rotate', label: 'Setas (devolução)' },
  { key: 'heart', label: 'Coração (conforto)' },
  { key: 'star', label: 'Estrela (qualidade)' },
  { key: 'gift', label: 'Presente (oferta)' },
  { key: 'lock', label: 'Cadeado (pagamento)' },
  { key: 'sparkles', label: 'Brilho (premium)' },
  { key: 'award', label: 'Selo (certificado)' },
  { key: 'leaf', label: 'Folha (natural)' },
];

export type HeroMediaType = 'video' | 'image';

export type HeroContent = {
  badgeText: string;
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
  videoUrl: string;
  posterUrl: string;
  videoPosition: 'top' | 'center' | 'bottom';
  heroImageUrl: string;
  mobileMediaType: HeroMediaType;
  desktopMediaType: HeroMediaType;
};

export const DEFAULT_HERO: HeroContent = {
  badgeText: 'Envío gratis en pedidos +50€ · España',
  titleLine1: 'Juguetes y lámparas',
  titleLine2: 'impresos en 3D',
  subtitle: 'Juegos para montar y compartir, y lámparas con formas divertidas para la habitación de los peques.',
  ctaText: 'Ver colecciones',
  ctaHref: '#colecciones',
  videoPosition: 'center',
  videoUrl: '/video-hero.mp4',
  posterUrl: '',
  heroImageUrl: '',
  mobileMediaType: 'video',
  desktopMediaType: 'video',
};

export type DestaqueFeature = {
  icon: IconKey;
  // A custom uploaded badge/seal image overrides the preset icon when set —
  // lets the store use its own AI-generated seal art instead of a generic
  // lucide icon.
  imageUrl?: string;
  title: string;
  desc: string;
};

export type DestaquesContent = {
  eyebrow: string;
  title: string;
  highlight: string;
  subtitle: string;
  features: DestaqueFeature[];
};

export const DEFAULT_DESTAQUES: DestaquesContent = {
  eyebrow: 'Por qué elegirnos',
  title: 'Destacados',
  highlight: 'de la temporada',
  subtitle: 'Lo que hace especiales a nuestras cestas: calidad, presentación y cariño en cada detalle.',
  features: [
    {
      icon: 'award',
      title: 'Presentación de Lujo',
      desc: 'Cestas y estuches preparados al detalle, listos para impresionar desde el primer momento en que se abren.',
    },
    {
      icon: 'leaf',
      title: 'Productos Artesanales y Gourmet',
      desc: 'Seleccionamos cuidadosamente embutidos, vinos, dulces y turrones de máxima calidad para tu mesa.',
    },
    {
      icon: 'truck',
      title: 'Envío Rápido y Seguro',
      desc: 'Envíos con seguimiento a toda España.',
    },
    {
      icon: 'gift',
      title: 'Tarjeta Dedicatoria Gratis',
      desc: 'Añade un mensaje personalizado en cada cesta para emocionar a familiares, amigos o empleados.',
    },
  ],
};

export type ProductsIntroContent = {
  eyebrow: string;
};

export const DEFAULT_PRODUCTS_INTRO: ProductsIntroContent = {
  eyebrow: 'Hecho con cariño para regalar',
};

export type TrustBadge = {
  icon: IconKey;
  title: string;
  desc: string;
};

export type TrustBadgesContent = {
  badges: TrustBadge[];
};

export const DEFAULT_TRUST_BADGES: TrustBadgesContent = {
  badges: [
    { icon: 'truck', title: 'Envío gratis +50€', desc: 'En todos los pedidos' },
    { icon: 'rotate', title: 'Devolución 14 días', desc: 'Derecho de desistimiento UE' },
    { icon: 'shield', title: 'Pago seguro SSL', desc: '100% protegido' },
    { icon: 'clock', title: 'Envío con seguimiento', desc: 'En toda España' },
  ],
};

// Drives the Christmas gift-basket photo banner (components/gift-basket-banner.tsx)
// — this used to be a plain email-signup newsletter card ("Prepárate para el
// frío"); that card and its signup form are gone, replaced by this banner,
// so the editable copy here was repurposed to match instead of leaving a
// dead "Newsletter" admin section that edited text nobody could see.
export type GiftBannerContent = {
  badgeText: string;
  heading: string;
  description: string;
  ctaText: string;
};

export const DEFAULT_GIFT_BANNER: GiftBannerContent = {
  badgeText: 'Edición Navidad',
  heading: 'El regalo que se recibe con una sonrisa',
  description: 'Cestas armadas a mano, con productos seleccionados y presentación lista para regalar. Perfecta para sorprender esta Navidad.',
  ctaText: 'Descubrir cestas de regalo',
};

export type FooterItemContent = {
  title: string;
  description: string;
  href?: string;
};

export type FooterSectionContent = {
  title: string;
  description: string;
  items?: FooterItemContent[];
};

export type FooterContent = {
  brandDescription: string;
  copyrightNote: string;
  ayuda: FooterSectionContent;
  legal: FooterSectionContent;
};

export const DEFAULT_FOOTER: FooterContent = {
  brandDescription: 'Tu tienda online de cestas de regalo personalizadas en España. Detalles cuidados para cada ocasión especial.',
  copyrightNote: 'Todos los derechos reservados.',
  ayuda: {
    title: 'Ayuda y Soporte',
    description: 'Soporte profesional para pedidos, pagos, cambios y entregas.',
    items: [
      { title: 'Atención por WhatsApp', description: 'Lunes a viernes, 9:00 a 18:00 (Madrid).' },
      { title: 'Envíos y entregas', description: 'Plazos, transportistas y seguimiento de pedidos.', href: '/legal/envios' },
      { title: 'Devoluciones y reembolsos', description: 'Derecho de desistimiento de 14 días.', href: '/legal/devoluciones' },
      { title: 'Pagos y facturación', description: 'Tarjeta, PayPal y métodos locales compatibles.' },
    ],
  },
  legal: {
    title: 'Legal',
    description: 'Documentos y politicas para una compra segura y transparente.',
  },
};

export type AboutFeature = {
  icon: IconKey;
  title: string;
  desc: string;
};

export type AboutStat = {
  value: string;
  label: string;
};

export type AboutContent = {
  title: string;
  highlight: string;
  paragraph1: string;
  paragraph2: string;
  features: AboutFeature[];
  tagline: string;
  stats: AboutStat[];
  ratingValue: string;
  ratingLabel: string;
  originBadgeTitle: string;
  originBadgeSubtitle: string;
};

export const DEFAULT_ABOUT: AboutContent = {
  title: '¿Por qué elegir',
  highlight: 'Cesta & Encanto',
  paragraph1: 'Creemos que un buen regalo se nota en los detalles. Por eso preparamos cada cesta a mano, seleccionando productos gourmet y una presentación que sorprende desde el primer momento.',
  paragraph2: 'Trabajamos con cariño en cada pedido, ya sea para una ocasión especial, un regalo de empresa o una cesta de Navidad. Desde embutidos y vinos hasta dulces y detalles personalizados, todo lo que necesitas para regalar algo memorable está aquí.',
  features: [
    { icon: 'award', title: 'Presentación de lujo', desc: 'Cestas y estuches preparados al detalle, listos para impresionar.' },
    { icon: 'leaf', title: 'Productos artesanales', desc: 'Seleccionamos cuidadosamente productos gourmet de máxima calidad.' },
    { icon: 'gift', title: 'Toque personal', desc: 'Tarjeta dedicatoria gratis en cada cesta, con el mensaje que elijas.' },
    { icon: 'lock', title: 'Pago 100% seguro', desc: 'Transacciones encriptadas y verificadas a través de Stripe y PayPal.' },
  ],
  tagline: 'Cada cesta, un detalle con cariño',
  // Honest service commitments — not inflated metrics. A brand-new store
  // has no verifiable "50K+ clientes" to show, and a visitor who tries to
  // check a fabricated number and finds nothing will abandon the purchase.
  stats: [
    { value: '24-48h', label: 'Respuesta WhatsApp' },
    { value: '2-3 días', label: 'Envío con seguimiento' },
    { value: '14 días', label: 'Devolución' },
  ],
  ratingValue: 'WhatsApp',
  ratingLabel: 'Atención rápida',
  originBadgeTitle: '🇪🇸 Distribuido en España',
  originBadgeSubtitle: 'Entrega en toda la Península',
};

// ---------------------------------------------------------------------------
// Modelo atual da vitrine (components/apple-home.tsx + footer.tsx + header.tsx).
// Texto vazio ('') = usar o automático (nome/descrição do setor, foto do
// primeiro produto, frase traduzida pelo seletor de idioma).

export type TopbarContent = {
  enabled: boolean;
  text: string;
  href: string;
  bg: string;
  color: string;
};

export const DEFAULT_TOPBAR: TopbarContent = {
  enabled: true,
  text: 'Envío gratis en pedidos +50€ · España',
  href: '',
  bg: '#f5f5f7',
  color: '#1d1d1f',
};

// Cabeçalho: textos da busca e do menu e o tamanho do logo. O logo, o nome e a cor
// principal ficam em "Informações da Loja" (store_settings) — ver Branding abaixo.
export type CabecalhoContent = {
  searchPlaceholder: string;
  homeLabel: string;         // '' = "Inicio" (traduzido)
  collectionsLabel: string;  // '' = "Colecciones" (traduzido)
  logoHeight: number;        // altura do logo no computador (px)
  logoImage: string;         // logo principal (modo "só a imagem"); '' = logo original da Kitoys
};

export const DEFAULT_CABECALHO: CabecalhoContent = {
  searchPlaceholder: 'Buscar juguetes, llaveros, jarrones…',
  homeLabel: '',
  collectionsLabel: '',
  logoHeight: 58,
  logoImage: '',
};

// Marca (tabela store_settings, Admin → Informações da Loja).
export type Branding = {
  storeName: string;
  logoUrl: string;
  logoStyle: 'logo_direto' | 'icone_nome';
  themeColor: string;
};

export type HomeSlide = {
  id: string;
  enabled: boolean;
  sector: string;     // setor ligado ao slide ('' = nenhum)
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;    // '' = filtra os produtos do setor na própria home
  image: string;      // '' = foto do primeiro produto do setor
  bgFrom: string;
  bgTo: string;
};

export type BannerContent = {
  enabled: boolean;
  mode: 'auto' | 'custom';  // auto = um slide por setor; custom = lista de slides
  autoplay: number;         // segundos (0 = não passa sozinho)
  maxSlides: number;
  christmasFirst: boolean;  // setor "navidad" primeiro no modo automático
  firstEyebrow: string;     // '' = "Novedades" (traduzido)
  eyebrow: string;          // '' = "Colección" (traduzido)
  ctaText: string;
  slides: HomeSlide[];
  // Banner de PRODUTOS (padrão): um slide por produto escolhido no admin, com foto, nome,
  // preço e botão para a página do produto. Ligado, vale no lugar dos modos auto/custom.
  productSlides: { enabled: boolean; ids: number[]; eyebrow: string; cta: string };
};

export const SLIDE_COLORS: [string, string][] = [
  ['#0b1730', '#12306b'],
  ['#3b0a0a', '#8f1d1d'],
  ['#0c2a1f', '#14594a'],
  ['#2a0d3d', '#5b2a86'],
  ['#2b1a0a', '#7a4a16'],
];

export const DEFAULT_BANNER: BannerContent = {
  enabled: true,
  mode: 'auto',
  autoplay: 5.5,
  maxSlides: 5,
  christmasFirst: true,
  firstEyebrow: '',
  eyebrow: '',
  ctaText: 'Comprar ahora',
  slides: [],
  productSlides: { enabled: true, ids: [11], eyebrow: 'Más vendido', cta: 'Comprar ahora' },
};

export type HomeChip = { sector: string; label: string; image: string; hidden: boolean };

export type CategoriasContent = {
  enabled: boolean;          // (antigo — não usado mais)
  visible: boolean;          // mostrar as categorias (filtro) embaixo do banner
  showAll: boolean;
  allLabel: string;
  showPersonalized: boolean;
  personalizedLabel: string;
  personalizedImage: string;
  // onde aparecem: embaixo do banner ou no meio, NO LUGAR do banner promocional (retângulo)
  position: 'top' | 'middle';
  items: HomeChip[];        // ordem e ajustes por setor (setor fora da lista entra no fim)
};

export const DEFAULT_CATEGORIAS: CategoriasContent = {
  enabled: true,
  visible: true,
  position: 'middle',
  showAll: true,
  allLabel: 'Todo',
  showPersonalized: true,
  personalizedLabel: 'Con nombre',
  personalizedImage: '',
  items: [],
};

export type HomeSectionCfg = { sector: string; title: string; tagline: string; hidden: boolean };

export type SecoesContent = {
  viewAllText: string;
  layout: 'carousel' | 'grid' | 'ab';  // ab = metade dos visitantes vê cada um (teste)
  items: HomeSectionCfg[];  // ordem e textos por setor
  showMore: boolean;        // produtos sem setor
  moreTitle: string;
  moreTagline: string;
  personalizedTitle: string;
  personalizedTagline: string;
};

export const DEFAULT_SECOES: SecoesContent = {
  viewAllText: 'Ver todo',
  layout: 'carousel',
  items: [],
  showMore: true,
  moreTitle: 'Más productos',
  moreTagline: 'Detalles impresos en 3D para tu casa',
  personalizedTitle: 'Con su nombre',
  personalizedTagline: 'Personaliza y míralo al instante',
};

export type PromoContent = {
  enabled: boolean;
  eyebrow: string;
  title: string;
  text: string;
  ctaText: string;
  ctaHref: string;      // '' = mostra os produtos personalizáveis
  image: string;        // '' = foto de um produto personalizável
  bgFrom: string;
  bgTo: string;
  afterSection: number; // aparece depois da seção nº (1 = depois da primeira)
};

export const DEFAULT_PROMO: PromoContent = {
  enabled: true,
  eyebrow: 'Hecho para ti',
  title: 'Con su nombre',
  text: 'Escribe el nombre y míralo al instante antes de comprar.',
  ctaText: 'Personalizar',
  ctaHref: '',
  image: '',
  bgFrom: '#0b1730',
  bgTo: '#1b3f8f',
  afterSection: 1,
};

// Faixa de confiança da home (embaixo dos stories). Só fatos verdadeiros da loja.
export type TrustIcon = 'made' | 'pay' | 'truck' | 'return' | 'chat' | 'gift';
export type ConfiancaItem = { icon: TrustIcon; title: string; text: string };
export type ConfiancaContent = { enabled: boolean; items: ConfiancaItem[] };

export const DEFAULT_CONFIANCA: ConfiancaContent = {
  enabled: false, // desligada a pedido; dá para ligar em Editar loja → Faixa de confiança
  items: [
    { icon: 'made', title: 'Hecho en España', text: 'Lo imprimimos en 3D en nuestro taller de Elche' },
    { icon: 'pay', title: 'Paga con Bizum o tarjeta', text: 'También Apple Pay y Google Pay, 100% seguro' },
    { icon: 'truck', title: 'Envío con seguimiento', text: 'A domicilio o en un punto de recogida' },
    { icon: 'return', title: 'Devolución en 14 días', text: 'Y garantía legal de 3 años' },
  ],
};

// Prazo de entrega mostrado embaixo do preço (página do produto). Dias úteis (seg–sex).
export type EntregaContent = {
  enabled: boolean;
  productionDays: number;        // dias para imprimir e embalar
  productionDaysCustom: number;  // produtos personalizados (com nome)
  transitMin: number;            // dias da transportadora (mínimo)
  transitMax: number;            // dias da transportadora (máximo)
  cutoffHour: number;            // pedido até esta hora conta o dia (hora de Madrid)
  madeText: string;              // frase sobre a fabricação
};

export const DEFAULT_ENTREGA: EntregaContent = {
  enabled: true,
  productionDays: 2,
  productionDaysCustom: 3,
  transitMin: 2,
  transitMax: 4,
  cutoffHour: 14,
  madeText: 'Lo fabricamos para ti en nuestro taller de Elche',
};

// href especiais no rodapé: "whatsapp" = abre o WhatsApp da loja; "email" = abre o e-mail.
export type FooterLinkItem = { title: string; description: string; href: string };

export type RodapeContent = {
  brandText: string;
  productsTitle: string;
  productsSubtitle: string;
  productsAuto: boolean;            // lista as coleções reais do admin
  products: FooterLinkItem[];
  helpTitle: string;
  helpSubtitle: string;
  help: FooterLinkItem[];
  legalTitle: string;
  legalSubtitle: string;
  legal: FooterLinkItem[];
  securityLine: string;
  shippingLine: string;
  copyright: string;                // {ano} vira o ano atual
  responseTime: string;
  showPayments: boolean;
};

export const DEFAULT_RODAPE: RodapeContent = {
  brandText: 'Explora el universo creativo de kitoys3d: juguetes, puzzles y lámparas fabricados con tecnología de impresión 3D de alta precisión.',
  productsTitle: 'Productos',
  productsSubtitle: 'Nuestras colecciones impresas en 3D.',
  productsAuto: true,
  products: [],
  helpTitle: 'Ayuda y atención al cliente',
  helpSubtitle: 'Atención personalizada desde España.',
  help: [
    { title: 'Centro de ayuda y preguntas frecuentes', description: 'Montaje, uso de rotuladores lavables y mantenimiento.', href: 'whatsapp' },
    { title: 'Mi pedido y seguimiento', description: 'Mira en qué paso está tu pedido con el número y tu e-mail.', href: '/pedido' },
    { title: 'Cambios y devoluciones', description: '14 días naturales conforme a la normativa europea.', href: '/legal/devoluciones' },
    { title: 'Garantía legal de 3 años', description: 'Cobertura ante cualquier defecto de fabricación.', href: '/legal/terminos' },
  ],
  legalTitle: 'Legal y transparencia',
  legalSubtitle: 'Tus derechos como consumidor en la Unión Europea.',
  legal: [
    { title: 'Aviso legal', description: 'Datos del titular y domicilio de operaciones (LSSI-CE).', href: '/legal/aviso-legal' },
    { title: 'Política de privacidad', description: 'Tratamiento seguro de tus datos (RGPD UE 2016/679).', href: '/legal/privacidad' },
    { title: 'Política de cookies', description: 'Preferencias de navegación y analítica web.', href: '/legal/cookies' },
    { title: 'Condiciones generales de contratación', description: 'Términos de venta, pagos y resolución de litigios.', href: '/legal/terminos' },
  ],
  securityLine: 'Pago 100% seguro y encriptado (SSL/TLS) con autenticación reforzada (SCA).',
  shippingLine: 'Envíos con seguimiento a toda España peninsular y Baleares.',
  copyright: '© {ano} kitoys3d. Todos los derechos reservados.',
  responseTime: 'Respuesta en menos de 24 h laborables',
  showPayments: true,
};

export type SiteContent = {
  topbar: TopbarContent;
  cabecalho: CabecalhoContent;
  banner: BannerContent;
  categorias: CategoriasContent;
  secoes: SecoesContent;
  promo: PromoContent;
  rodape: RodapeContent;
  entrega: EntregaContent;
  confianca: ConfiancaContent;
  // modelo antigo (não aparece mais na loja; mantido para não perder dados salvos)
  hero: HeroContent;
  productsIntro: ProductsIntroContent;
  destaques: DestaquesContent;
  trustBadges: TrustBadgesContent;
  about: AboutContent;
  giftBanner: GiftBannerContent;
  footer: FooterContent;
};

export const DEFAULT_SITE_CONTENT: SiteContent = {
  topbar: DEFAULT_TOPBAR,
  cabecalho: DEFAULT_CABECALHO,
  banner: DEFAULT_BANNER,
  categorias: DEFAULT_CATEGORIAS,
  secoes: DEFAULT_SECOES,
  promo: DEFAULT_PROMO,
  rodape: DEFAULT_RODAPE,
  entrega: DEFAULT_ENTREGA,
  confianca: DEFAULT_CONFIANCA,
  hero: DEFAULT_HERO,
  productsIntro: DEFAULT_PRODUCTS_INTRO,
  destaques: DEFAULT_DESTAQUES,
  trustBadges: DEFAULT_TRUST_BADGES,
  about: DEFAULT_ABOUT,
  giftBanner: DEFAULT_GIFT_BANNER,
  footer: DEFAULT_FOOTER,
};

export const SITE_CONTENT_SECTIONS = Object.keys(DEFAULT_SITE_CONTENT) as (keyof SiteContent)[];
