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
      desc: 'Entregas garantizadas en toda España para que tus regalos lleguen justo a tiempo.',
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
    { icon: 'clock', title: 'Entrega 2-3 días', desc: 'En toda España' },
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

export type SiteContent = {
  hero: HeroContent;
  productsIntro: ProductsIntroContent;
  destaques: DestaquesContent;
  trustBadges: TrustBadgesContent;
  about: AboutContent;
  giftBanner: GiftBannerContent;
  footer: FooterContent;
};

export const DEFAULT_SITE_CONTENT: SiteContent = {
  hero: DEFAULT_HERO,
  productsIntro: DEFAULT_PRODUCTS_INTRO,
  destaques: DEFAULT_DESTAQUES,
  trustBadges: DEFAULT_TRUST_BADGES,
  about: DEFAULT_ABOUT,
  giftBanner: DEFAULT_GIFT_BANNER,
  footer: DEFAULT_FOOTER,
};

export const SITE_CONTENT_SECTIONS = Object.keys(DEFAULT_SITE_CONTENT) as (keyof SiteContent)[];
