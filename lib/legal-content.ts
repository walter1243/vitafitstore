// Standard EU/Spain e-commerce legal boilerplate. Clauses that depend on the
// business's own identity (legal name, NIF/CIF, registered address, exact
// support hours) are marked [COMPLETAR] — fill these in before relying on
// these pages for real compliance. Nothing here should be treated as legal
// advice; a lawyer should review before launch.

export type LegalSection = { heading: string; body: string[] };

export type LegalPage = {
  slug: string;
  title: string;
  navLabel: string;
  intro: string;
  sections: LegalSection[];
};

export const LEGAL_PAGES: Record<string, LegalPage> = {
  'aviso-legal': {
    slug: 'aviso-legal',
    title: 'Aviso Legal',
    navLabel: 'Aviso legal',
    intro: 'Información general sobre el titular de este sitio web, conforme a la Ley de Servicios de la Sociedad de la Información (LSSI-CE).',
    sections: [
      {
        heading: 'Titular del sitio',
        body: [
          'Razón social: [COMPLETAR — razón social o nombre del titular]',
          'NIF/CIF: [COMPLETAR]',
          'Domicilio social: [COMPLETAR — dirección completa]',
          'Correo electrónico de contacto: [COMPLETAR]',
        ],
      },
      {
        heading: 'Objeto',
        body: [
          'Este sitio web tiene como finalidad la venta online de productos de calefacción y confort térmico para el hogar.',
        ],
      },
      {
        heading: 'Condiciones de uso',
        body: [
          'El acceso y uso de este sitio atribuye la condición de usuario y supone la aceptación de las condiciones aquí recogidas. El usuario se compromete a hacer un uso adecuado de los contenidos y servicios ofrecidos.',
        ],
      },
    ],
  },
  terminos: {
    slug: 'terminos',
    title: 'Términos y Condiciones',
    navLabel: 'Términos y condiciones',
    intro: 'Condiciones aplicables a la compra de productos a través de esta tienda online.',
    sections: [
      {
        heading: 'Proceso de compra',
        body: [
          'Los precios mostrados incluyen impuestos aplicables salvo que se indique lo contrario. El pedido se confirma tras la verificación del pago.',
        ],
      },
      {
        heading: 'Disponibilidad',
        body: [
          'Los productos están sujetos a disponibilidad de stock. En caso de no disponibilidad tras la compra, se informará al cliente y se procederá al reembolso íntegro.',
        ],
      },
      {
        heading: 'Precios y pagos',
        body: [
          'Aceptamos pago con tarjeta y otros métodos indicados en el checkout, procesados mediante pasarelas de pago seguras (Stripe).',
        ],
      },
      {
        heading: 'Ley aplicable',
        body: ['Estas condiciones se rigen por la legislación española y europea de protección al consumidor.'],
      },
    ],
  },
  envios: {
    slug: 'envios',
    title: 'Política de Envíos y Entregas',
    navLabel: 'Envíos y entregas',
    intro: 'Información sobre plazos, transportistas y seguimiento de pedidos.',
    sections: [
      {
        heading: 'Plazos de entrega',
        body: [
          'El plazo de entrega estimado se muestra en la ficha de cada producto y en el checkout. [COMPLETAR — confirmar plazo real según el almacén/proveedor: si el envío es desde un almacén en España/UE, 2-3 días laborables es razonable; si el proveedor envía desde fuera de la UE, el plazo real suele ser de 5 a 9+ días laborables y debe indicarse así para evitar reclamaciones y contracargos.]',
        ],
      },
      {
        heading: 'Transportistas',
        body: [
          '[COMPLETAR — indicar el/los transportista(s) utilizados, por ejemplo Correos, Correos Express, SEUR o GLS]',
        ],
      },
      {
        heading: 'Seguimiento',
        body: [
          'Todos los pedidos incluyen código de seguimiento, enviado por email y disponible bajo solicitud por WhatsApp.',
        ],
      },
      {
        heading: 'Gastos de envío',
        body: ['Envío gratuito en pedidos superiores a 50€. Por debajo de ese importe se aplican los gastos de envío indicados en el checkout.'],
      },
    ],
  },
  devoluciones: {
    slug: 'devoluciones',
    title: 'Política de Devoluciones y Reembolsos',
    navLabel: 'Devoluciones y reembolsos',
    intro: 'Derecho de desistimiento conforme a la normativa europea de protección al consumidor (Directiva 2011/83/UE).',
    sections: [
      {
        heading: 'Derecho de desistimiento (14 días)',
        body: [
          'El cliente dispone de 14 días naturales desde la recepción del pedido para desistir de la compra sin necesidad de justificación, conforme al Real Decreto Legislativo 1/2007 y la normativa europea de consumidores.',
        ],
      },
      {
        heading: 'Cómo solicitar una devolución',
        body: [
          'Escríbenos por WhatsApp o al correo de soporte indicando el número de pedido. Te confirmaremos el proceso y la dirección de devolución.',
        ],
      },
      {
        heading: 'Estado del producto',
        body: [
          'El producto debe devolverse en su embalaje original, sin señales de uso, junto con todos los accesorios incluidos.',
        ],
      },
      {
        heading: 'Reembolso',
        body: [
          'El reembolso se realiza por el mismo método de pago utilizado en la compra, en un plazo máximo de 14 días desde la recepción del producto devuelto.',
        ],
      },
    ],
  },
  privacidad: {
    slug: 'privacidad',
    title: 'Política de Privacidad',
    navLabel: 'Política de privacidad',
    intro: 'Tratamiento de datos personales conforme al Reglamento General de Protección de Datos (RGPD) y la LOPDGDD.',
    sections: [
      {
        heading: 'Responsable del tratamiento',
        body: ['[COMPLETAR — razón social, NIF y dirección del responsable del tratamiento]'],
      },
      {
        heading: 'Datos que recopilamos',
        body: [
          'Datos de contacto y envío facilitados al realizar un pedido (nombre, dirección, email, teléfono) y datos de navegación mediante cookies técnicas y analíticas.',
        ],
      },
      {
        heading: 'Finalidad',
        body: [
          'Gestión de pedidos y envíos, atención al cliente, y comunicaciones comerciales solo si el usuario se ha suscrito voluntariamente a la newsletter.',
        ],
      },
      {
        heading: 'Derechos del usuario',
        body: [
          'El usuario puede ejercer sus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a [COMPLETAR — email de contacto de privacidad].',
        ],
      },
    ],
  },
  cookies: {
    slug: 'cookies',
    title: 'Política de Cookies',
    navLabel: 'Política de cookies',
    intro: 'Uso de cookies técnicas y analíticas en este sitio web.',
    sections: [
      {
        heading: 'Qué son las cookies',
        body: ['Pequeños archivos que se almacenan en tu navegador para mejorar la experiencia de uso del sitio.'],
      },
      {
        heading: 'Cookies que utilizamos',
        body: [
          'Cookies técnicas necesarias para el funcionamiento del carrito y el checkout, y cookies analíticas para entender el uso del sitio (Google Analytics).',
        ],
      },
      {
        heading: 'Gestión de cookies',
        body: ['Puedes configurar o bloquear las cookies desde las opciones de tu navegador en cualquier momento.'],
      },
    ],
  },
};

export const LEGAL_SLUGS = Object.keys(LEGAL_PAGES);
