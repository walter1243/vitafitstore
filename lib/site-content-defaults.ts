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
};

export const DEFAULT_HERO: HeroContent = {
  badgeText: 'Envío gratis en pedidos +50€ · España',
  titleLine1: 'Calor y Confort',
  titleLine2: 'Para tu Invierno',
  subtitle: 'Calefacción · Confort Térmico · Bienestar',
  ctaText: 'Descubrir Productos',
  ctaHref: '#productos',
  videoPosition: 'center',
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
  eyebrow: 'Por qué elegirnos',
  title: 'Destacados',
  highlight: 'de la temporada',
  subtitle: 'Lo que nos hace diferentes: calidez, eficiencia y confort real para el frío.',
  features: [
    {
      icon: 'flame',
      title: 'Calor Instantáneo',
      desc: 'Productos diseñados para calentar rápido y mantener la temperatura ideal en tu hogar.',
    },
    {
      icon: 'zap',
      title: 'Bajo Consumo Energético',
      desc: 'Tecnología eficiente que calienta sin disparar tu factura de luz.',
    },
    {
      icon: 'truck',
      title: 'Envío Exprés 2-3 Días',
      desc: 'Pedidos procesados el mismo día. Seguimiento en tiempo real y entrega garantizada en toda España.',
    },
    {
      icon: 'shield',
      title: 'Calidad Certificada',
      desc: 'Productos certificados y probados para un uso seguro dentro de casa.',
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
  title: 'Prepárate para el frío',
  text: 'Recibe ofertas exclusivas de temporada, consejos de confort térmico y novedades antes que nadie. ¡10% de descuento en tu primera compra!',
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
  brandDescription: 'Tu tienda online de calefacción y confort térmico en España. Productos de calidad para pasar el invierno con calidez.',
  copyrightNote: 'Todos los derechos reservados.',
  empresa: {
    title: 'Empresa',
    description: 'Informacion institucional y canales oficiales de la tienda.',
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
  paragraph1: 'Creemos que el confort en invierno debe ser accesible para todos. Por eso seleccionamos cuidadosamente cada producto, priorizando la calidez, la eficiencia y la seguridad.',
  paragraph2: 'Nuestro equipo trabaja constantemente para ofrecerte las mejores soluciones de calefacción y confort térmico para tu hogar. Desde calefactores hasta accesorios de abrigo, todo lo que necesitas para pasar el invierno con calidez está aquí.',
  features: [
    { icon: 'flame', title: 'Calor real', desc: 'Productos que calientan de verdad, probados para el frío europeo.' },
    { icon: 'award', title: 'Calidad certificada', desc: 'Todos nuestros productos cumplen con los más estrictos estándares de seguridad europeos.' },
    { icon: 'heart', title: 'Confort real', desc: 'Diseñados para el uso diario, pensados en tu bienestar durante todo el invierno.' },
    { icon: 'sparkles', title: 'Comunidad activa', desc: 'Miles de clientes satisfechos que confían en nosotros para pasar el invierno con calidez.' },
  ],
  tagline: 'Tu confort, nuestra prioridad',
  stats: [
    { value: '5+', label: 'Años' },
    { value: '50K+', label: 'Clientes' },
    { value: '100+', label: 'Productos' },
  ],
  ratingValue: '4.9/5',
  ratingLabel: 'Satisfacción',
  originBadgeTitle: '🇪🇸 Distribuido en España',
  originBadgeSubtitle: 'Entrega en toda la Península',
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
