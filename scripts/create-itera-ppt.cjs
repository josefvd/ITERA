const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const path = require("path");

// Icons
const { FaRocket, FaShip, FaCreditCard, FaCheckCircle, FaChartLine, FaWallet, FaFileInvoice, FaUsers, FaGlobeAmericas } = require("react-icons/fa");

function renderIconSvg(IconComponent, color = "#000000", size = 256) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(IconComponent, { color, size: String(size) })
  );
}

async function iconToBase64Png(IconComponent, color, size = 256) {
  const svg = renderIconSvg(IconComponent, color, size);
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + pngBuffer.toString("base64");
}

// Brand palette
const BG_DARK = "3C3C3C";
const BG_BEIGE = "ECE2D8";
const BG_BEIGE_LIGHT = "F2EBE3";
const CHARCOAL = "4B4B4B";
const WARM_DARK = "535250";
const GRAY = "7D7E80";
const TAUPE = "A49F9B";
const WHITE = "FFFFFF";
const GREEN = "2D9D6E";
const ACCENT = "3C3C3C";

async function createPresentation() {
  let pres = new pptxgen();
  pres.layout = "LAYOUT_16x9";
  pres.author = "ITERA";
  pres.title = "ITERA — Plataforma de Pagos para Logística";

  const logoData = path.resolve("/Users/josevera/freight-platform/public/images/logo-source.jpg");

  // Helper for shadows
  const cardShadow = () => ({ type: "outer", color: "000000", blur: 6, offset: 2, angle: 135, opacity: 0.1 });
  const iconCircle = (color) => ({ fill: { color }, shape: pres.shapes.OVAL });

  // ========================
  // SLIDE 1: Title
  // ========================
  let s1 = pres.addSlide();
  s1.background = { color: BG_DARK };
  s1.addImage({ path: logoData, x: 0.8, y: 0.6, w: 0.7, h: 0.7, rounding: true });
  s1.addText("ITERA", { x: 1.6, y: 0.6, w: 3, h: 0.7, fontSize: 22, color: WHITE, fontFace: "Calibri", bold: true, valign: "middle", margin: 0 });
  s1.addText("Pagos inteligentes\npara la logística global", { x: 0.8, y: 1.6, w: 8.4, h: 2, fontSize: 40, color: WHITE, fontFace: "Arial Black", bold: true, align: "left" });
  s1.addText("La plataforma que simplifica los pagos para liberar carga.", { x: 0.8, y: 3.5, w: 7, h: 0.6, fontSize: 18, color: TAUPE, fontFace: "Calibri" });
  s1.addText("Junio 2026", { x: 0.8, y: 4.8, w: 3, h: 0.4, fontSize: 12, color: GRAY, fontFace: "Calibri" });

  // ========================
  // SLIDE 2: Elemento 1 - Cargo Release Payment
  // ========================
  let s2 = pres.addSlide();
  s2.background = { color: BG_BEIGE };
  s2.addText("CARGO RELEASE PAYMENT", { x: 0.8, y: 0.3, w: 8.4, h: 0.5, fontSize: 11, color: GRAY, fontFace: "Calibri", bold: true, charSpacing: 4 });

  // Title
  s2.addText("Elemento 1:\nPagos para Liberación de Carga", { x: 0.8, y: 0.9, w: 8, h: 1.2, fontSize: 28, color: CHARCOAL, fontFace: "Calibri", bold: true });

  // Feature cards
  const features1 = [
    { title: "Inicio de Sesión", desc: "Registro y autenticación\nsegura de usuarios" },
    { title: "Dashboard", desc: "Resumen de transacciones,\nembarques y acciones rápidas" },
    { title: "Crear Pago", desc: "Pagos a proveedores\nvía ACH, wire o prepago" },
    { title: "Transacciones", desc: "Historial completo con\nfiltros y estados" },
    { title: "Config. Bancaria", desc: "Vinculación de cuentas\nbancarias y prepago" },
    { title: "Facturas", desc: "Gestión de facturas\ny referencias" }
  ];

  features1.forEach((f, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = 0.8 + col * 3.1;
    const y = 2.4 + row * 1.5;
    // Card
    s2.addShape(pres.shapes.RECTANGLE, { x, y, w: 2.8, h: 1.3, fill: { color: WHITE }, shadow: cardShadow() });
    // Left accent
    s2.addShape(pres.shapes.RECTANGLE, { x, y, w: 0.06, h: 1.3, fill: { color: CHARCOAL } });
    s2.addText(f.title, { x: x + 0.2, y: y + 0.1, w: 2.5, h: 0.4, fontSize: 14, color: CHARCOAL, fontFace: "Calibri", bold: true, margin: 0 });
    s2.addText(f.desc, { x: x + 0.2, y: y + 0.5, w: 2.5, h: 0.7, fontSize: 11, color: GRAY, fontFace: "Calibri", margin: 0 });
  });

  s2.addText("✓ Funcionalidad completa desplegada en producción", { x: 0.8, y: 5.1, w: 8, h: 0.3, fontSize: 11, color: GREEN, fontFace: "Calibri", bold: true });

  // ========================
  // SLIDE 3: Elemento 2 - All-in-One Payment Platform
  // ========================
  let s3 = pres.addSlide();
  s3.background = { color: BG_DARK };
  s3.addText("ALL-IN-ONE PAYMENT PLATFORM", { x: 0.8, y: 0.3, w: 8.4, h: 0.5, fontSize: 11, color: TAUPE, fontFace: "Calibri", bold: true, charSpacing: 4 });

  s3.addText("Elemento 2:\nTodas las Obligaciones en un Solo Lugar", { x: 0.8, y: 0.9, w: 8, h: 1.2, fontSize: 28, color: WHITE, fontFace: "Calibri", bold: true });

  // Flow steps
  const steps = [
    "Forwardea facturas\na invoices@itera.com\no vía WhatsApp",
    "ITERA extrae\nla información\nautomáticamente",
    "Dashboard agrupa\nobligaciones\npor embarque",
    "Un clic paga\ntodas las facturas\ndel embarque"
  ];

  steps.forEach((step, i) => {
    const x = 0.8 + i * 2.3;
    // Circle with number
    s3.addShape(pres.shapes.OVAL, { x: x + 0.7, y: 2.3, w: 0.6, h: 0.6, fill: { color: WHITE } });
    s3.addText(String(i + 1), { x: x + 0.7, y: 2.3, w: 0.6, h: 0.6, fontSize: 16, color: BG_DARK, fontFace: "Calibri", bold: true, align: "center", valign: "middle" });
    s3.addText(step, { x, y: 3.1, w: 2, h: 1.2, fontSize: 12, color: WHITE, fontFace: "Calibri", align: "center" });
    if (i < 3) {
      s3.addShape(pres.shapes.LINE, { x: x + 2, y: 2.6, w: 0.3, h: 0, line: { color: TAUPE, width: 1, dashType: "dash" } });
    }
  });

  // Approval workflow
  s3.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 4.5, w: 8.4, h: 0.8, fill: { color: WHITE, transparency: 90 } });
  s3.addText("⚡ Approval workflow: Si el monto excede X, el manager aprueba — completamente customizable", { x: 1, y: 4.6, w: 8, h: 0.6, fontSize: 13, color: WHITE, fontFace: "Calibri", bold: true });

  // ========================
  // SLIDE 4: Elemento 2 Detail - Shipments
  // ========================
  let s4 = pres.addSlide();
  s4.background = { color: BG_BEIGE };
  s4.addText("AGRUPACIÓN POR EMBARQUE", { x: 0.8, y: 0.3, w: 8.4, h: 0.5, fontSize: 11, color: GRAY, fontFace: "Calibri", bold: true, charSpacing: 4 });

  s4.addText("Ejemplo: Shipment XYZ", { x: 0.8, y: 0.9, w: 6, h: 0.6, fontSize: 24, color: CHARCOAL, fontFace: "Calibri", bold: true });

  // Table
  const headerOpts = { fill: { color: CHARCOAL }, color: WHITE, bold: true, fontSize: 11, fontFace: "Calibri", align: "center" };
  const cellOpts = { fontSize: 11, fontFace: "Calibri", color: CHARCOAL, align: "center" };
  const rowEven = { fill: { color: "FFFFFF" } };
  const rowOdd = { fill: { color: BG_BEIGE_LIGHT } };

  s4.addTable([
    [
      { text: "Proveedor", options: headerOpts },
      { text: "Monto", options: headerOpts },
      { text: "Vence", options: headerOpts },
      { text: "Estado", options: headerOpts }
    ],
    [
      { text: "Maersk", options: { ...cellOpts, ...rowEven } },
      { text: "$5,000", options: { ...cellOpts, ...rowEven } },
      { text: "Jun 13", options: { ...cellOpts, ...rowEven } },
      { text: "Pendiente", options: { ...cellOpts, ...rowEven, color: "D4A017" } }
    ],
    [
      { text: "Terminal", options: { ...cellOpts, ...rowOdd } },
      { text: "$1,200", options: { ...cellOpts, ...rowOdd } },
      { text: "Jun 13", options: { ...cellOpts, ...rowOdd } },
      { text: "Pendiente", options: { ...cellOpts, ...rowOdd, color: "D4A017" } }
    ],
    [
      { text: "Customs", options: { ...cellOpts, ...rowEven } },
      { text: "$600", options: { ...cellOpts, ...rowEven } },
      { text: "Jun 13", options: { ...cellOpts, ...rowEven } },
      { text: "Pendiente", options: { ...cellOpts, ...rowEven, color: "D4A017" } }
    ],
    [
      { text: "Trucking Co", options: { ...cellOpts, ...rowOdd } },
      { text: "$800", options: { ...cellOpts, ...rowOdd } },
      { text: "Jun 13", options: { ...cellOpts, ...rowOdd } },
      { text: "Pendiente", options: { ...cellOpts, ...rowOdd, color: "D4A017" } }
    ],
    [
      { text: "TOTAL", options: { ...cellOpts, ...{ fill: { color: "E8E0D6" }, bold: true } } },
      { text: "$7,600", options: { ...cellOpts, ...{ fill: { color: "E8E0D6" }, bold: true, fontSize: 13 } } },
      { text: "", options: { ...cellOpts, ...{ fill: { color: "E8E0D6" } } } },
      { text: "", options: { ...cellOpts, ...{ fill: { color: "E8E0D6" } } } }
    ]
  ], { x: 0.8, y: 1.8, w: 8.4, colW: [3, 2, 2, 1.4], border: { pt: 0.5, color: "D9D0C5" } });

  s4.addText("⚠️ Vence en 48 horas", { x: 0.8, y: 4.5, w: 4, h: 0.4, fontSize: 14, color: "C0392B", fontFace: "Calibri", bold: true });
  s4.addShape(pres.shapes.RECTANGLE, { x: 0.8, y: 5, w: 3.5, h: 0.5, fill: { color: CHARCOAL } });
  s4.addText("Pagar todas las obligaciones", { x: 0.8, y: 5, w: 3.5, h: 0.5, fontSize: 12, color: WHITE, fontFace: "Calibri", bold: true, align: "center", valign: "middle" });

  // ========================
  // SLIDE 5: Elemento 3 - Trade Credit
  // ========================
  let s5 = pres.addSlide();
  s5.background = { color: BG_DARK };
  s5.addText("TRADE CREDIT", { x: 0.8, y: 0.3, w: 8.4, h: 0.5, fontSize: 11, color: TAUPE, fontFace: "Calibri", bold: true, charSpacing: 4 });

  s5.addText("Elemento 3:\nFinanciamiento Inteligente", { x: 0.8, y: 0.9, w: 8, h: 1.2, fontSize: 28, color: WHITE, fontFace: "Calibri", bold: true });

  // Side panel mockup
  s5.addShape(pres.shapes.RECTANGLE, { x: 5.5, y: 0.5, w: 4.2, h: 4.8, fill: { color: "2A2A2A" } });
  s5.addText("Shipment XYZ", { x: 5.8, y: 0.7, w: 3.5, h: 0.4, fontSize: 16, color: WHITE, fontFace: "Calibri", bold: true });
  s5.addText("Obligaciones: $7,600", { x: 5.8, y: 1.2, w: 3.5, h: 0.3, fontSize: 13, color: TAUPE, fontFace: "Calibri" });
  s5.addText("¿Necesitas más tiempo?", { x: 5.8, y: 1.7, w: 3.5, h: 0.3, fontSize: 12, color: WHITE, fontFace: "Calibri", bold: true });
  s5.addText("Usa ITERA Trade Credit\npara cubrir estas obligaciones\ny mantener tu carga en movimiento.", { x: 5.8, y: 2.1, w: 3.5, h: 0.8, fontSize: 11, color: GRAY, fontFace: "Calibri" });
  s5.addText("Plazo: 30 días\nFee estimado: 2.5%\nFondos directo a proveedores", { x: 5.8, y: 3, w: 3.5, h: 0.8, fontSize: 11, color: TAUPE, fontFace: "Calibri" });
  
  s5.addShape(pres.shapes.RECTANGLE, { x: 5.8, y: 3.9, w: 3.5, h: 0.4, fill: { color: "3A3A3A" } });
  s5.addText("Financiar con ITERA", { x: 5.8, y: 3.9, w: 3.5, h: 0.4, fontSize: 12, color: WHITE, fontFace: "Calibri", bold: true, align: "center", valign: "middle" });

  // Left side - how it works
  const flowItems = [
    "1. Usuario ve ⚠️ Vence en 48h",
    "2. Opciones: Pagar ahora o Financiar",
    "3. Side panel con términos del crédito",
    "4. Confirmación: Obligaciones cubiertas"
  ];
  flowItems.forEach((item, i) => {
    s5.addText(item, { x: 0.8, y: 2.3 + i * 0.6, w: 4.2, h: 0.5, fontSize: 14, color: WHITE, fontFace: "Calibri" });
  });

  // ========================
  // SLIDE 6: Trade Credit - Confirmación
  // ========================
  let s6 = pres.addSlide();
  s6.background = { color: BG_BEIGE };
  s6.addText("CONFIRMACIÓN", { x: 0.8, y: 0.3, w: 8.4, h: 0.5, fontSize: 11, color: GRAY, fontFace: "Calibri", bold: true, charSpacing: 4 });

  s6.addText("✅ Obligaciones cubiertas", { x: 0.8, y: 0.9, w: 8, h: 0.7, fontSize: 28, color: GREEN, fontFace: "Calibri", bold: true });

  const confirmationItems = [
    "Maersk — Financiado",
    "Terminal — Financiado",
    "Customs — Financiado",
    "Trucking Co — Financiado"
  ];

  confirmationItems.forEach((item, i) => {
    const y = 1.9 + i * 0.7;
    s6.addShape(pres.shapes.RECTANGLE, { x: 0.8, y, w: 5.5, h: 0.55, fill: { color: WHITE }, shadow: cardShadow() });
    s6.addText("✓", { x: 1, y, w: 0.5, h: 0.55, fontSize: 16, color: GREEN, fontFace: "Calibri", bold: true, valign: "middle" });
    s6.addText(item, { x: 1.5, y, w: 4, h: 0.55, fontSize: 14, color: CHARCOAL, fontFace: "Calibri", valign: "middle" });
  });

  s6.addText("Pago total financiado: $7,600", { x: 0.8, y: 4.5, w: 5, h: 0.4, fontSize: 16, color: CHARCOAL, fontFace: "Calibri", bold: true });
  s6.addText("Vencimiento del crédito: 30 días", { x: 0.8, y: 4.9, w: 5, h: 0.4, fontSize: 14, color: GRAY, fontFace: "Calibri" });

  // ========================
  // SLIDE 7: Resumen
  // ========================
  let s7 = pres.addSlide();
  s7.background = { color: BG_DARK };

  s7.addImage({ path: logoData, x: 0.8, y: 0.4, w: 0.6, h: 0.6, rounding: true });
  s7.addText("ITERA", { x: 1.5, y: 0.4, w: 3, h: 0.6, fontSize: 20, color: WHITE, fontFace: "Calibri", bold: true, valign: "middle", margin: 0 });

  s7.addText("Resumen de Implementación", { x: 0.8, y: 1.3, w: 8, h: 0.7, fontSize: 28, color: WHITE, fontFace: "Calibri", bold: true });

  const summaryItems = [
    { title: "Elemento 1: Cargo Release", desc: "Login → Dashboard → Pagos → Banking → Facturas. Flujo completo en producción." },
    { title: "Elemento 2: All-in-One", desc: "Agrupación de facturas por embarque, pago 1-click, approval workflow customizable." },
    { title: "Elemento 3: Trade Credit", desc: "Financiamiento a 30 días, side panel, confirmación, fondos directo a proveedores." },
    { title: "Stack Técnico", desc: "Next.js 16 · Neon PostgreSQL · Vercel · Tailwind CSS · JWT Auth · Framer Motion" }
  ];

  summaryItems.forEach((item, i) => {
    const y = 2.3 + i * 0.8;
    s7.addShape(pres.shapes.RECTANGLE, { x: 0.8, y, w: 8.4, h: 0.7, fill: { color: "2A2A2A" } });
    s7.addShape(pres.shapes.RECTANGLE, { x: 0.8, y, w: 0.06, h: 0.7, fill: { color: TAUPE } });
    s7.addText(item.title, { x: 1.1, y: y + 0.05, w: 3, h: 0.3, fontSize: 13, color: WHITE, fontFace: "Calibri", bold: true, margin: 0 });
    s7.addText(item.desc, { x: 1.1, y: y + 0.35, w: 7.5, h: 0.3, fontSize: 11, color: TAUPE, fontFace: "Calibri", margin: 0 });
  });

  s7.addText("https://freight-platform-iota.vercel.app", { x: 0.8, y: 5.2, w: 8, h: 0.3, fontSize: 11, color: GRAY, fontFace: "Calibri" });

  // Save
  const outPath = path.resolve("/Users/josevera/Desktop/ITERA_Presentation.pptx");
  await pres.writeFile({ fileName: outPath });
  console.log("✓ PPT creado:", outPath);
}

createPresentation().catch(console.error);