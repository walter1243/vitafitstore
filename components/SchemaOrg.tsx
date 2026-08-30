export default function SchemaOrg() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://www.vitafitstore.es/#organization',
        name: 'Nuestra Tienda',
        url: 'https://www.vitafitstore.es',
        logo: 'https://www.vitafitstore.es/logo.png',
        sameAs: ['https://instagram.com/vitafitstore_es'],
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+34601678657',
          contactType: 'customer service',
          availableLanguage: ['Spanish', 'Portuguese'],
        },
      },
      {
        '@type': 'WebSite',
        '@id': 'https://www.vitafitstore.es/#website',
        url: 'https://www.vitafitstore.es',
        name: 'Nuestra Tienda',
        description: 'Tienda online de calefacción y confort térmico en España',
        publisher: {
          '@id': 'https://www.vitafitstore.es/#organization',
        },
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://www.vitafitstore.es/?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Store',
        name: 'Nuestra Tienda',
        image: 'https://www.vitafitstore.es/og-image.jpg',
        priceRange: '€€',
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'ES',
        },
        url: 'https://www.vitafitstore.es',
        telephone: '+34601678657',
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
