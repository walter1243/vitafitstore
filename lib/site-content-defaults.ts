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
  | 'award';

export const ICON_OPTIONS: { key: IconKey; label: string }[] = [
  { key: 'leaf', label: 'Folha (natural)' },
  { key: 'zap', label: 'Raio (resultados)' },
  { key: 'truck', label: 'Caminhão (entrega)' },
  { key: 'shield', label: 'Escudo (segurança)' },
  { key: 'clock', label: 'Relógio (rapidez)' },
  { key: 'rotate', label: 'Setas (devolução)' },
  { key: 'heart', label: 'Coração (cuidado)' },
  { key: 'star', label: 'Estrela (qualidade)' },
  { key: 'gift', label: 'Presente (oferta)' },
  { key: 'lock', label: 'Cadeado (pagamento)' },
  { key: 'sparkles', label: 'Brilho (premium)' },
  { key: 'award', label: 'Selo (certificado)' },
];

export type HeroContent = {
  badgeText: string;
  titleLine1: string;
  titleLine2: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
  videoUrl: string;
  posterUrl: string;
};

export const DEFAULT_HERO: HeroContent = {
  badgeText: 'Envío gratis en pedidos +50€ · España',
  titleLine1: 'Suplementos Deportivos',
  titleLine2: 'Europeos en España',
  subtitle: 'Salud · Performance · Bienestar',
  ctaText: 'Descubrir Productos',
  ctaHref: '#productos',
  videoUrl: '/video-hero.mp4',
  posterUrl: '/images/collagen.jpg',
};

export type DestaqueFeature = {
  icon: IconKey;
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
  eyebrow: 'Por qué VitaFit',
  title: 'Destacados',
  highlight: 'VitaFit',
  subtitle: 'Lo que nos hace diferentes: calidad, transparencia y resultados reales.',
  features: [
    {
      icon: 'leaf',
      title: 'Ingredientes 100% Naturales',
      desc: 'Formulaciones limpias sin aditivos artificiales. Solo lo que tu cuerpo necesita para rendir al máximo.',
    },
    {
      icon: 'zap',
      title: 'Resultados Comprobados',
      desc: '+50.000 clientes satisfechos avalan nuestra efectividad. Respaldados por deportistas de élite.',
    },
    {
      icon: 'truck',
      title: 'Envío Exprés 2-3 Días',
      desc: 'Pedidos procesados el mismo día. Seguimiento en tiempo real y entrega garantizada en toda España.',
    },
    {
      icon: 'shield',
      title: 'Calidad Certificada',
      desc: 'Fabricados en instalaciones GMP. Análisis de pureza independientes en cada lote de producción.',
    },
  ],
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
    { icon: 'rotate', title: 'Devolución 30 días', desc: 'Sin preguntas' },
    { icon: 'shield', title: 'Pago seguro SSL', desc: '100% protegido' },
    { icon: 'clock', title: 'Entrega 2-3 días', desc: 'En toda España' },
  ],
};

export type NewsletterContent = {
  title: string;
  text: string;
  privacyText: string;
};

export const DEFAULT_NEWSLETTER: NewsletterContent = {
  title: 'Únete a la comunidad VitaFit',
  text: 'Recibe ofertas exclusivas, consejos de salud y novedades antes que nadie. ¡10% de descuento en tu primera compra!',
  privacyText: 'Al suscribirte aceptas nuestra política de privacidad. Sin spam, lo prometemos.',
};

export type FooterSectionContent = {
  title: string;
  description: string;
};

export type FooterContent = {
  brandDescription: string;
  copyrightNote: string;
  empresa: FooterSectionContent;
  ayuda: FooterSectionContent;
  legal: FooterSectionContent;
};

export const DEFAULT_FOOTER: FooterContent = {
  brandDescription: 'Tu tienda online de salud, bienestar y fitness en España. Productos de calidad para cuidar de ti.',
  copyrightNote: 'Todos los derechos reservados.',
  empresa: {
    title: 'Empresa',
    description: 'Informacion institucional y canales oficiales de VitaFit.',
  },
  ayuda: {
    title: 'Ayuda y SAC',
    description: 'Soporte profesional para pedidos, pagos, cambios y entregas.',
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
  highlight: 'nuestra tienda',
  paragraph1: 'Creemos que el bienestar debe ser accesible para todos. Por eso seleccionamos cuidadosamente cada producto, priorizando la calidad, la eficacia y la transparencia.',
  paragraph2: 'Nuestro equipo de nutricionistas y expertos en fitness trabaja constantemente para ofrecerte las mejores soluciones para tu salud. Desde suplementos premium hasta accesorios de entrenamiento, todo lo que necesitas para sentirte mejor está aquí.',
  features: [
    { icon: 'leaf', title: '100% Natural', desc: 'Ingredientes de origen natural, sin aditivos artificiales ni conservantes dañinos.' },
    { icon: 'award', title: 'Calidad certificada', desc: 'Todos nuestros productos cumplen con los más estrictos estándares de calidad europeos.' },
    { icon: 'heart', title: 'Bienestar real', desc: 'Fórmulas desarrolladas por expertos para resultados que puedes sentir.' },
    { icon: 'sparkles', title: 'Comunidad activa', desc: 'Más de 50.000 clientes satisfechos que confían en nosotros para su bienestar.' },
  ],
  tagline: 'Tu bienestar, nuestra prioridad',
  stats: [
    { value: '5+', label: 'Años' },
    { value: '50K+', label: 'Clientes' },
    { value: '100+', label: 'Productos' },
  ],
  ratingValue: '4.9/5',
  ratingLabel: 'Satisfacción',
  originBadgeTitle: '🇪🇸 Made in Spain',
  originBadgeSubtitle: 'Fabricado en España',
};

export type SiteContent = {
  hero: HeroContent;
  destaques: DestaquesContent;
  trustBadges: TrustBadgesContent;
  about: AboutContent;
  newsletter: NewsletterContent;
  footer: FooterContent;
};

export const DEFAULT_SITE_CONTENT: SiteContent = {
  hero: DEFAULT_HERO,
  destaques: DEFAULT_DESTAQUES,
  trustBadges: DEFAULT_TRUST_BADGES,
  about: DEFAULT_ABOUT,
  newsletter: DEFAULT_NEWSLETTER,
  footer: DEFAULT_FOOTER,
};

export const SITE_CONTENT_SECTIONS = Object.keys(DEFAULT_SITE_CONTENT) as (keyof SiteContent)[];
