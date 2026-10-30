// Paginas legais da Kitoys 3D (Espanha/UE). Titular, NIF e endereco
// informados pela dona da loja. Nada aqui e assessoria juridica — revisar
// com um gestor/advogado, principalmente o uso do NIF portugues.

const TITULAR = 'Anna Livia Lima Esteves';
const NIF = 'NIF (Portugal): 310208947';
const DOMICILIO = 'Carrer Emilio Sala Hernández, nº 43, Elche (Alicante), España';
const EMAIL = 'kitoys3d@gmail.com';
const WHATSAPP = '+34 678 68 4704';

export type LegalSection = { heading: string; body: string[]; table?: { head: string[]; rows: string[][] } };

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
          'Cada pedido se imprime y prepara por encargo en nuestro taller. Te avisamos por email con el código de seguimiento cuando el pedido sale.',
          'Salvo que se indique otro plazo en el producto, la entrega se realizará en un plazo máximo de 30 días naturales desde la confirmación del pedido, conforme al artículo 66 bis del Real Decreto Legislativo 1/2007 (TRLGDCU).',
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
          'Para nuestras estadísticas internas registramos las páginas visitadas, la hora y la zona aproximada de la visita o de la compra (país y ciudad, deducidos de la conexión). No guardamos tu dirección IP. Si rechazas las cookies en el aviso del sitio, tu visita se cuenta sin ubicación.',
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
    intro: 'Qué cookies y tecnologías similares usa kitoys3d.com, para qué sirven, cuánto duran y cómo puedes aceptarlas, rechazarlas o cambiar de opinión. Última actualización: 30 de octubre de 2026.',
    sections: [
      {
        heading: 'Qué son las cookies',
        body: [
          'Las cookies son pequeños archivos que un sitio web guarda en tu navegador. Otras tecnologías similares, como el almacenamiento local, funcionan de forma parecida y las tratamos igual en esta política.',
          'Algunas son necesarias para que la web funcione. Otras solo sirven para medir el uso del sitio o para publicidad, y esas únicamente se activan si las aceptas.',
        ],
      },
      {
        heading: 'Responsable',
        body: [`${TITULAR} (Kitoys 3D). ${NIF}. Domicilio: ${DOMICILIO}. Contacto: ${EMAIL}.`],
      },
      {
        heading: 'Necesarias (no requieren consentimiento)',
        body: ['Permiten pagar de forma segura y recordar tus elecciones en la tienda. Sin ellas, algunas funciones no van.'],
        table: {
          head: ['Nombre', 'Titular', 'Para qué sirve', 'Duración'],
          rows: [
            ['__stripe_mid, __stripe_sid', 'Stripe (tercero)', 'Pago seguro y prevención del fraude en el checkout', '1 año / 30 minutos'],
            ['cookie_consent', 'Kitoys 3D', 'Recordar si aceptaste o rechazaste las cookies', 'Hasta que la borres'],
            ['kitoys_zip, kitoys_ship_method', 'Kitoys 3D', 'Recordar tu código postal y la forma de envío elegida', 'Hasta que las borres'],
            ['kitoys_review_votes', 'Kitoys 3D', 'Evitar votar dos veces «Útil» en la misma opinión', 'Hasta que la borres'],
            ['store_branding_cache, kitoys_sectors_cache', 'Kitoys 3D', 'Cargar la tienda más rápido', 'Hasta cerrar la pestaña'],
          ],
        },
      },
      {
        heading: 'Analíticas (solo si aceptas)',
        body: ['Nos ayudan a saber cómo se usa la tienda para mejorarla.'],
        table: {
          head: ['Nombre', 'Titular', 'Para qué sirve', 'Duración'],
          rows: [['_ga, _ga_*', 'Google Analytics (tercero)', 'Distinguir visitantes y medir el uso del sitio', '2 años']],
        },
      },
      {
        heading: 'Publicidad (solo si aceptas)',
        body: ['Miden los resultados de nuestros anuncios en Facebook e Instagram.'],
        table: {
          head: ['Nombre', 'Titular', 'Para qué sirve', 'Duración'],
          rows: [['_fbp', 'Meta (tercero)', 'Medir la eficacia de los anuncios', '3 meses']],
        },
      },
      {
        heading: 'Estadísticas propias sin cookies',
        body: [
          'También contamos visitas de forma interna, sin instalar cookies en tu navegador: páginas vistas, hora y zona aproximada (país y ciudad). No guardamos tu dirección IP y el identificador usado cambia cada día. Si rechazas las cookies, tu visita se cuenta sin ubicación.',
          'Vercel, nuestro proveedor de alojamiento, ofrece además una medición agregada que tampoco usa cookies.',
        ],
      },
      {
        heading: 'Cómo aceptar, rechazar o cambiar tu elección',
        body: [
          'La primera vez que entras puedes elegir «Aceptar todas» o «Rechazar». Rechazar es tan fácil como aceptar y no te impide comprar.',
          'Puedes cambiar de opinión cuando quieras con el botón «Cambiar mis preferencias» de esta página. Si retiras tu consentimiento, borramos las cookies analíticas y de publicidad de este sitio.',
          'También puedes bloquear o eliminar las cookies desde tu navegador: Chrome (Configuración, Privacidad y seguridad), Safari (Ajustes, Privacidad), Firefox (Ajustes, Privacidad y seguridad) o Edge (Configuración, Cookies y permisos del sitio).',
        ],
      },
      {
        heading: 'Transferencias internacionales',
        body: [
          'Google, Meta y Stripe pueden tratar datos fuera de la Unión Europea, incluidos los Estados Unidos, con las garantías previstas por el RGPD. Puedes consultar sus políticas de privacidad en sus sitios web.',
        ],
      },
      {
        heading: 'Tus derechos y cambios en esta política',
        body: [
          `Puedes ejercer tus derechos escribiendo a ${EMAIL} y reclamar ante la Agencia Española de Protección de Datos (www.aepd.es). Más información en nuestra Política de Privacidad.`,
          'Si cambiamos las cookies que usamos, actualizaremos esta página y su fecha.',
        ],
      },
    ],
  },
};

export const LEGAL_SLUGS = Object.keys(LEGAL_PAGES);
