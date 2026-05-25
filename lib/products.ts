export interface ProductVariant {
  name: string
  color: string
  label: string
}

export interface Product {
  id: number
  name: string
  slug: string
  description: string
  shortDescription: string
  price: number
  originalPrice?: number
  image: string
  category: 'salud' | 'fitness'
  badge?: 'mas-vendido' | 'oferta' | 'nuevo'
  rating: number
  reviews: number
  stock: number
  benefits: string[]
  ingredients?: string
  usage?: string
  variants?: ProductVariant[]
  emoji: string
  gradient: string
}

export interface CartItem {
  product: Product
  quantity: number
  selectedVariant?: ProductVariant
}

export interface Review {
  id: number
  author: string
  rating: number
  date: string
  comment: string
  verified: boolean
}

export const healthProducts: Product[] = [
  {
    id: 1,
    name: "CollagenPro Elite",
    slug: "collagenpro-elite",
    description: "Nuestro colágeno marino hidrolizado de máxima pureza. Formulado con péptidos bioactivos de fácil absorción para rejuvenecer tu piel, fortalecer articulaciones y mejorar la salud del cabello y uñas. Sabor neutro, fácil de mezclar.",
    shortDescription: "Colágeno marino hidrolizado 500g",
    price: 34.99,
    image: "/images/collagen.jpg",
    category: "salud",
    badge: "mas-vendido",
    rating: 4.9,
    reviews: 847,
    stock: 156,
    emoji: "✨",
    gradient: "from-pink-400 to-rose-600",
    benefits: ["Piel más firme y elástica", "Articulaciones flexibles", "Cabello y uñas fuertes", "Fácil absorción"],
    ingredients: "Colágeno marino hidrolizado (100%), origen: pesca sostenible del Atlántico Norte",
    usage: "Disolver 10g (1 cacito) en agua, zumo o batido. Tomar preferiblemente en ayunas.",
    variants: [
      { name: "neutro", color: "#E8D5B7", label: "Neutro" },
      { name: "morango", color: "#F472B6", label: "Morango" },
      { name: "baunilha", color: "#FDE68A", label: "Baunilha" },
    ]
  },
  {
    id: 2,
    name: "SlimBurn Activo",
    slug: "slimburn-activo",
    description: "Fórmula termogénica natural que acelera el metabolismo y favorece la quema de grasa. Con extractos de té verde, cafeína natural y L-carnitina. Sin efectos secundarios, apto para veganos.",
    shortDescription: "Quemador de grasa natural 60 cápsulas",
    price: 29.99,
    image: "/images/slimburn.jpg",
    category: "salud",
    rating: 4.7,
    reviews: 523,
    stock: 89,
    emoji: "🔥",
    gradient: "from-orange-400 to-red-600",
    benefits: ["Acelera el metabolismo", "Aumenta la energía", "Reduce el apetito", "100% natural"],
    ingredients: "Extracto de té verde, cafeína natural, L-carnitina, pimienta negra",
    usage: "Tomar 2 cápsulas al día, preferiblemente antes del desayuno y antes de entrenar.",
    variants: [
      { name: "30caps", color: "#4ADE80", label: "30 Caps" },
      { name: "60caps", color: "#22C55E", label: "60 Caps" },
      { name: "90caps", color: "#16A34A", label: "90 Caps" },
    ]
  },
  {
    id: 3,
    name: "VitaJoint Flex",
    slug: "vitajoint-flex",
    description: "Suplemento premium para la salud articular con cúrcuma de alta biodisponibilidad, glucosamina y condroitina. Reduce la inflamación y mejora la movilidad. Ideal para deportistas y personas activas.",
    shortDescription: "Suplemento para articulaciones con cúrcuma",
    price: 24.99,
    image: "/images/vitajoint.jpg",
    category: "salud",
    rating: 4.8,
    reviews: 412,
    stock: 203,
    emoji: "💪",
    gradient: "from-amber-400 to-orange-600",
    benefits: ["Reduce inflamación", "Mejora movilidad", "Protege cartílagos", "Con cúrcuma premium"],
    ingredients: "Cúrcuma (95% curcuminoides), glucosamina, condroitina, MSM, vitamina C",
    usage: "Tomar 2 cápsulas al día con las comidas principales.",
    variants: [
      { name: "60caps", color: "#F59E0B", label: "60 Caps" },
      { name: "120caps", color: "#D97706", label: "120 Caps" },
    ]
  },
  {
    id: 4,
    name: "OmegaFit 3X",
    slug: "omegafit-3x",
    description: "Omega 3 de alta concentración con EPA y DHA de aceite de pescado purificado. Apoya la salud cardiovascular, cerebral y ocular. Cápsulas sin regusto a pescado.",
    shortDescription: "Omega 3 de alta concentración 90 softgels",
    price: 19.99,
    image: "/images/omega.jpg",
    category: "salud",
    rating: 4.6,
    reviews: 678,
    stock: 312,
    emoji: "🫀",
    gradient: "from-cyan-400 to-blue-600",
    benefits: ["Salud cardiovascular", "Función cerebral", "Salud ocular", "Sin regusto"],
    ingredients: "Aceite de pescado concentrado (EPA 400mg, DHA 200mg por cápsula)",
    usage: "Tomar 1-2 cápsulas al día con las comidas.",
    variants: [
      { name: "90soft", color: "#06B6D4", label: "90 Softgels" },
      { name: "180soft", color: "#0284C7", label: "180 Softgels" },
    ]
  },
  {
    id: 5,
    name: "MultiVita Complete",
    slug: "multivita-complete",
    description: "Multivitamínico completo con 25 vitaminas y minerales esenciales. Fórmula equilibrada para cubrir las necesidades diarias y mantener tu energía y vitalidad todo el día.",
    shortDescription: "Multivitamínico completo 120 cápsulas",
    price: 22.99,
    image: "/images/multivita.jpg",
    category: "salud",
    rating: 4.7,
    reviews: 534,
    stock: 178,
    emoji: "⚡",
    gradient: "from-violet-400 to-purple-600",
    benefits: ["25 vitaminas y minerales", "Más energía", "Sistema inmune", "4 meses de suministro"],
    ingredients: "Vitamina A, B1, B2, B3, B5, B6, B9, B12, C, D3, E, K, Calcio, Magnesio, Zinc, Hierro, Selenio...",
    usage: "Tomar 1 cápsula al día con el desayuno.",
    variants: [
      { name: "classic", color: "#8B5CF6", label: "Classic" },
      { name: "sport", color: "#F97316", label: "Sport" },
    ]
  },
  {
    id: 6,
    name: "SleepWell Pro",
    slug: "sleepwell-pro",
    description: "Fórmula natural para dormir mejor combinando melatonina de liberación prolongada con magnesio bisglicinato y extracto de valeriana. Descanso profundo sin somnolencia matutina.",
    shortDescription: "Melatonina + Magnesio para dormir mejor",
    price: 16.99,
    image: "/images/sleepwell.jpg",
    category: "salud",
    badge: "oferta",
    rating: 4.8,
    reviews: 892,
    stock: 267,
    emoji: "🌙",
    gradient: "from-indigo-400 to-violet-700",
    benefits: ["Concilia el sueño rápido", "Descanso profundo", "Sin dependencia", "Despierta renovado"],
    ingredients: "Melatonina 1.9mg, Magnesio bisglicinato 200mg, Extracto de valeriana, L-teanina",
    usage: "Tomar 1 cápsula 30 minutos antes de dormir.",
    variants: [
      { name: "lavanda", color: "#A78BFA", label: "Lavanda" },
      { name: "camomila", color: "#FCD34D", label: "Camomila" },
    ]
  }
]

export const fitnessProducts: Product[] = [
  {
    id: 7,
    name: "LegRaise Pro",
    slug: "legraise-pro",
    description: "Set de 3 bandas elásticas de resistencia para piernas y glúteos. Tres niveles de intensidad (suave, medio, fuerte) para progresar en tu entrenamiento. Látex premium antideslizante.",
    shortDescription: "Banda elástica para piernas y glúteos (set 3 niveles)",
    price: 14.99,
    image: "/images/legraise.jpg",
    category: "fitness",
    badge: "nuevo",
    rating: 4.7,
    reviews: 234,
    stock: 445,
    emoji: "🏋️",
    gradient: "from-slate-400 to-gray-700",
    benefits: ["3 niveles de resistencia", "Látex premium", "Antideslizante", "Portátil"],
    usage: "Ideal para sentadillas, puentes de glúteos, patadas de burro y más.",
    variants: [
      { name: "preto", color: "#1F2937", label: "Preto" },
      { name: "rosa", color: "#EC4899", label: "Rosa" },
      { name: "verde", color: "#16A34A", label: "Verde" },
    ]
  },
  {
    id: 8,
    name: "PowerFlex Set",
    slug: "powerflex-set",
    description: "Kit completo de 5 bandas elásticas para pilates, yoga y entrenamiento de fuerza. Incluye anclaje de puerta, asas y bolsa de transporte. Resistencias de 2kg a 25kg.",
    shortDescription: "Kit bandas elásticas pilates y yoga 5 piezas",
    price: 18.99,
    image: "/images/powerflex.jpg",
    category: "fitness",
    rating: 4.8,
    reviews: 567,
    stock: 234,
    emoji: "🎯",
    gradient: "from-blue-400 to-indigo-600",
    benefits: ["5 resistencias diferentes", "Anclaje de puerta incluido", "Asas ergonómicas", "Bolsa de transporte"],
    usage: "Perfecto para entrenamientos en casa, viajes o al aire libre.",
    variants: [
      { name: "preto", color: "#1F2937", label: "Preto" },
      { name: "cinza", color: "#6B7280", label: "Cinza" },
      { name: "azul", color: "#3B82F6", label: "Azul" },
    ]
  },
  {
    id: 9,
    name: "FitLegging Active",
    slug: "fitlegging-active",
    description: "Leggins deportivos de mujer de alta compresión. Tejido transpirable que absorbe la humedad, costuras planas y cintura alta para máxima comodidad. Disponible en varias tallas.",
    shortDescription: "Leggins deportivos mujer compresión",
    price: 27.99,
    image: "/images/legging.jpg",
    category: "fitness",
    rating: 4.6,
    reviews: 389,
    stock: 156,
    emoji: "👟",
    gradient: "from-emerald-400 to-teal-600",
    benefits: ["Alta compresión", "Transpirable", "Cintura alta", "Costuras planas"],
    usage: "Ideal para yoga, pilates, running o gimnasio.",
    variants: [
      { name: "preto", color: "#111827", label: "Preto" },
      { name: "navy", color: "#1E3A5F", label: "Azul Marinho" },
      { name: "verde", color: "#166534", label: "Verde" },
    ]
  },
  {
    id: 10,
    name: "SportTop Dry-Fit",
    slug: "sporttop-dryfit",
    description: "Camiseta deportiva de mujer sin costuras con tecnología Dry-Fit. Secado ultra rápido, ajuste perfecto y máxima libertad de movimiento. Diseño elegante y funcional.",
    shortDescription: "Camiseta deportiva de mujer sin costuras",
    price: 19.99,
    image: "/images/sporttop.jpg",
    category: "fitness",
    rating: 4.5,
    reviews: 278,
    stock: 198,
    emoji: "💨",
    gradient: "from-sky-300 to-blue-500",
    benefits: ["Sin costuras", "Secado rápido", "Ajuste perfecto", "Muy transpirable"],
    usage: "Perfecta para cualquier actividad deportiva de intensidad media-alta.",
    variants: [
      { name: "branco", color: "#F8FAFC", label: "Branco" },
      { name: "preto", color: "#111827", label: "Preto" },
      { name: "rosa", color: "#DB2777", label: "Rosa" },
    ]
  },
  {
    id: 11,
    name: "YogaMat Premium",
    slug: "yogamat-premium",
    description: "Esterilla de yoga antideslizante de 6mm de grosor. Material TPE ecológico, libre de látex y PVC. Doble cara con texturas diferentes. Incluye correa de transporte.",
    shortDescription: "Esterilla yoga antideslizante 6mm",
    price: 24.99,
    image: "/images/yogamat.jpg",
    category: "fitness",
    rating: 4.9,
    reviews: 456,
    stock: 123,
    emoji: "🧘",
    gradient: "from-purple-400 to-fuchsia-600",
    benefits: ["6mm de grosor", "Antideslizante", "Ecológica TPE", "Correa incluida"],
    usage: "Ideal para yoga, pilates, estiramientos y meditación.",
    variants: [
      { name: "roxo", color: "#7C3AED", label: "Roxo" },
      { name: "verde", color: "#16A34A", label: "Verde" },
      { name: "azul", color: "#1D4ED8", label: "Azul" },
    ]
  },
  {
    id: 12,
    name: "ResistBand Pro",
    slug: "resistband-pro",
    description: "Banda de resistencia larga para pilates y entrenamiento funcional. 2 metros de longitud, látex natural de alta calidad. Perfecta para rehabilitación y tonificación.",
    shortDescription: "Banda de resistencia para pilates y entrenamiento",
    price: 12.99,
    image: "/images/resistband.jpg",
    category: "fitness",
    badge: "oferta",
    rating: 4.6,
    reviews: 312,
    stock: 534,
    emoji: "🏃",
    gradient: "from-red-400 to-rose-600",
    benefits: ["2m de longitud", "Látex natural", "Multiusos", "Ideal rehabilitación"],
    usage: "Úsala para estiramientos, tonificación o ejercicios de rehabilitación.",
    variants: [
      { name: "vermelho", color: "#DC2626", label: "Vermelho" },
      { name: "azul", color: "#2563EB", label: "Azul" },
      { name: "verde", color: "#16A34A", label: "Verde" },
    ]
  }
]

export const allProducts = [...healthProducts, ...fitnessProducts]

export const productReviews: Record<number, Review[]> = {
  1: [
    { id: 1, author: "María G.", rating: 5, date: "15/03/2026", comment: "Increíble diferencia en mi piel después de 2 meses. Las arrugas finas se han reducido notablemente.", verified: true },
    { id: 2, author: "Carlos R.", rating: 5, date: "12/03/2026", comment: "Lo uso para las articulaciones y noto muchísima mejoría. El sabor es neutro, perfecto.", verified: true },
    { id: 3, author: "Ana L.", rating: 4, date: "08/03/2026", comment: "Buen producto, se disuelve bien. Esperando ver resultados en el pelo.", verified: true },
  ],
  2: [
    { id: 1, author: "Pedro M.", rating: 5, date: "14/03/2026", comment: "Funciona muy bien, me da energía sin nerviosismo. He perdido 3kg en un mes combinándolo con ejercicio.", verified: true },
    { id: 2, author: "Laura S.", rating: 4, date: "10/03/2026", comment: "Buen producto, se nota el efecto termogénico. Recomiendo tomarlo por la mañana.", verified: true },
  ],
  3: [
    { id: 1, author: "José A.", rating: 5, date: "13/03/2026", comment: "Mis rodillas ya no crujen al subir escaleras. Producto excepcional.", verified: true },
    { id: 2, author: "Carmen V.", rating: 5, date: "09/03/2026", comment: "Lo recomiendo para deportistas. La cúrcuma es de muy buena calidad.", verified: true },
  ],
  4: [
    { id: 1, author: "Miguel F.", rating: 5, date: "11/03/2026", comment: "Excelente omega 3, sin sabor a pescado. Lo noto en la concentración.", verified: true },
  ],
  5: [
    { id: 1, author: "Elena P.", rating: 5, date: "12/03/2026", comment: "Muy completo, me da energía todo el día. La relación calidad-precio es genial.", verified: true },
  ],
  6: [
    { id: 1, author: "Sofía R.", rating: 5, date: "14/03/2026", comment: "¡Por fin duermo bien! Me despierto descansada sin sentirme atontada.", verified: true },
    { id: 2, author: "David M.", rating: 5, date: "11/03/2026", comment: "Llevaba años con problemas de sueño. Esto ha cambiado mi vida.", verified: true },
  ],
}
