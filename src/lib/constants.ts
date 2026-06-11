export const siteConfig = {
  name: "ITERA",
  tagline: "Pagos más inteligentes para la logística global",
  description:
    "Un ecosistema inteligente que acelera pagos, optimiza operaciones y simplifica el flujo de carga.",
  taglineBold: "La plataforma que simplifica los pagos para liberar carga.",
  stats: null, // Removed per user request
  products: [
    {
      title: "Payments",
      description:
        "Envía y recibe pagos autorizados a través de instituciones financieras reguladas — de forma segura, eficiente y con visibilidad total.",
      href: "/transactions/new",
    },
    {
      title: "Access Credits",
      description:
        "Accede a líneas de crédito flexibles para cubrir tus pagos de flete y mantener tu operación en movimiento sin interrupciones.",
      href: "/transactions/new",
    },
    {
      title: "Access Pickup Solution",
      description:
        "Coordina y libera tu carga de forma ágil con nuestra solución integrada de recogida, conectando transportistas y terminales en un solo lugar.",
      href: "/dashboard",
    },
  ],
  features: [
    {
      title: "Diseñado para el ritmo del comercio",
      description:
        "Unifica pagos, datos y decisiones en movimiento. Mueve mercancías más rápido, reduce fricciones y obtén visibilidad total en cada paso de la cadena de suministro.",
    },
    {
      title: "Flujo de caja y capital de trabajo inteligente",
      description:
        "Libera fondos, optimiza pagos y preserva la flexibilidad. Mantén las mercancías en movimiento y el capital trabajando sin frenar operaciones.",
    },
    {
      title: "Una red, muchos actores",
      description:
        "Conecta pagadores, proveedores y socios en todo el mundo. Construye relaciones más sólidas y optimiza la colaboración en todo el ecosistema logístico.",
    },
    {
      title: "Inteligencia operacional",
      description:
        "Convierte los datos de pago en información procesable. Optimiza operaciones, reduce costos y toma decisiones más inteligentes con análisis en tiempo real.",
    },
  ],
  cta: {
    heading: "¿Listo para mover tus pagos al siguiente nivel?",
    description:
      "Acelera pagos y optimiza operaciones con ITERA.",
  },
  links: {
    signIn: "/signin",
    signUp: "/register",
    pricing: "/#pricing",
    contactSales: "/#contact",
    findVendor: "/#",
    dashboard: "/dashboard",
  },
};

export const navLinks = [
  { label: "Productos", href: "/#products" },
  { label: "Soluciones", href: "/#features" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Embarques", href: "/shipments" },
  { label: "Transacciones", href: "/transactions" },
];