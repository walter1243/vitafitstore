// Paginas legais da Kitoys 3D (Espanha/UE). Titular, NIF e endereco
// informados pela dona da loja. Nada aqui e assessoria juridica — revisar
// com um gestor/advogado, principalmente o uso do NIF portugues.

const TITULAR = 'Anna Livia Lima Esteves';
const NIF = 'NIF (Portugal): 310208947';
const DOMICILIO = 'Carrer Emilio Sala Hernández, nº 43, Elche (Alicante), España';
const EMAIL = 'kitoys3d@gmail.com';
const WHATSAPP = '+34 678 68 4704';

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
          `Titular: ${TITULAR}`,
          'Nombre comercial: Kitoys 3D',
          NIF,
          `Domicilio: ${DOMICILIO}`,
          `Correo electrónico: ${EMAIL}`,
          `WhatsApp: ${WHATSAPP}`,
        ],
      },
      {
        heading: 'Objeto',
        body: [
          'Este sitio web tiene como finalidad la venta online de productos impresos en 3D: juguetes, rompecabezas y lámparas infantiles, entre otros.',
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
        heading: 'Garantía legal',
        body: [
          'Conforme al Real Decreto Legislativo 1/2007 (TRLGDCU), todos los productos cuentan con una garantía legal de conformidad de 3 años desde la entrega. Si un producto presenta un defecto de fabricación, escríbenos y te ofreceremos la reparación, la sustitución o el reembolso según corresponda.',
        ],
      },
      {
        heading: 'Reclamaciones',
        body: [
          `Para cualquier incidencia o reclamación, escríbenos a ${EMAIL} o por WhatsApp al ${WHATSAPP}. También puedes acudir a los servicios de consumo de tu comunidad autónoma.`,
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
          'Cada pedido se imprime y prepara en nuestro taller. El plazo de entrega estimado se indica en el checkout y te avisamos por email cuando el pedido sale.',
        ],
      },
      {
        heading: 'Transportistas',
        body: [
          'Enviamos con operadores logísticos con seguimiento a toda España peninsular y Baleares.',
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
        body: ['Envío gratuito en pedidos a partir de 50 €. Por debajo de ese importe se aplican los gastos de envío de cada producto, indicados en el carrito y en el checkout.'],
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
          `Escríbenos por WhatsApp (${WHATSAPP}) o a ${EMAIL} indicando el número de pedido. Te confirmaremos el proceso y la dirección de devolución.`,
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
        body: [`Responsable: ${TITULAR} (Kitoys 3D)`, NIF, `Domicilio: ${DOMICILIO}`, `Contacto: ${EMAIL}`],
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
          `El usuario puede ejercer sus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a ${EMAIL}. También puede presentar una reclamación ante la Agencia Española de Protección de Datos (www.aepd.es).`,
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
