// Ficha da empresa para o Google (schema.org) — mesmos dados do aviso
// legal (lib/legal-content.ts) e do rodape.
const SITE = 'https://www.kitoys3d.com';

export default function SchemaOrg() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE}/#organization`,
        name: 'Kitoys 3D',
        url: SITE,
        logo: `${SITE}/images/logo-kitoys-3d.png`,
        email: 'kitoys3d@gmail.com',
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+34678684704',
          email: 'kitoys3d@gmail.com',
          contactType: 'customer service',
          availableLanguage: ['Spanish', 'Portuguese'],
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE}/#website`,
        url: SITE,
        name: 'Kitoys 3D',
        description: 'Juguetes, rompecabezas y lámparas infantiles impresos en 3D en España.',
        inLanguage: 'es-ES',
        publisher: { '@id': `${SITE}/#organization` },
      },
      {
        '@type': 'Store',
        name: 'Kitoys 3D',
        image: `${SITE}/images/logo-kitoys-3d.png`,
        priceRange: '€',
        url: SITE,
        telephone: '+34678684704',
        email: 'kitoys3d@gmail.com',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Carrer Emilio Sala Hernández, 43',
          addressLocality: 'Elche',
          addressRegion: 'Alicante',
          addressCountry: 'ES',
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
