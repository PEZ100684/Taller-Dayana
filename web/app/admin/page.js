"use client";

import { useMemo, useRef, useState } from "react";

const workTypeOptions = ["Pintura total", "Enderezado y pintura", "Enderezado"];
const workshopStatusOptions = ["received", "in_progress", "ready"];
const workshopStatusLabels = {
  received: "Recibido",
  in_progress: "En proceso",
  ready: "Listo para entregar"
};

export default function AdminPage() {
  const entryDateInputRef = useRef(null);
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [token, setToken] = useState("");
  const [appointments, setAppointments] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [workshopVehicles, setWorkshopVehicles] = useState([]);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [vehicleForm, setVehicleForm] = useState({
    plate: "",
    customerName: "",
    workType: workTypeOptions[0],
    entryDate: new Date().toISOString().slice(0, 10),
    status: "received"
  });
  const [photoForm, setPhotoForm] = useState({
    plate: "",
    description: "",
    files: []
  });
  const [progressPhotos, setProgressPhotos] = useState([]);
  const [quoteFilters, setQuoteFilters] = useState({
    month: "",
    plate: "",
    status: "",
    search: ""
  });
  const [recordsFilter, setRecordsFilter] = useState({
    type: "all",
    plate: "",
    customer: "",
    search: ""
  });
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [deletingRecordKey, setDeletingRecordKey] = useState("");
  const [activePhotosPlate, setActivePhotosPlate] = useState("");
  const displayPlate = (p) => (!p || String(p).startsWith("SP-") || p === "SIN PLACA" ? "Sin placa" : p);
  const [status, setStatus] = useState("");
  const canvasRef = useRef(null);

  const [saasMetrics, setSaasMetrics] = useState({
    totalTenants: 3,
    activeTenants: 3,
    totalMrrColones: 70000,
    totalVehiclesTracked: 12,
    totalQuotesGenerated: 24,
    totalAppointmentsScheduled: 18
  });

  const [saasTenants, setSaasTenants] = useState([
    {
      id: 1,
      slug: "taller-dayana",
      name: "Taller Dayana",
      ownerName: "Randy y Dagoberto Barrantes",
      phone: "7043-9248",
      whatsapp: "50670439248",
      email: "tallerdayanacr@gmail.com",
      province: "Alajuela",
      canton: "Barrio San José",
      address: "Barrio San José, Alajuela",
      brandColor: "#d62828",
      plan: "elite",
      monthlyFee: 0,
      isActive: true,
      isMaster: true
    },
    {
      id: 2,
      slug: "autofix-heredia",
      name: "AutoFix Heredia",
      ownerName: "Carlos Méndez",
      phone: "8312-4455",
      whatsapp: "50683124455",
      email: "contacto@autofixheredia.cr",
      province: "Heredia",
      canton: "San Pablo",
      address: "300m Norte del Masxmenos, San Pablo",
      brandColor: "#2563eb",
      plan: "pro",
      monthlyFee: 45000,
      isActive: true,
      isMaster: false
    },
    {
      id: 3,
      slug: "enderezado-coyol",
      name: "Enderezado El Coyol",
      ownerName: "Esteban Rojas",
      phone: "8765-1122",
      whatsapp: "50687651122",
      email: "tallerelcoyol@gmail.com",
      province: "Alajuela",
      canton: "El Coyol",
      address: "Frente a Parque Industrial Zona Franca",
      brandColor: "#059669",
      plan: "basico",
      monthlyFee: 25000,
      isActive: true,
      isMaster: false
    }
  ]);

  const [activeSaasTab, setActiveSaasTab] = useState("tenants");
  const [newTenantForm, setNewTenantForm] = useState({
    name: "",
    ownerName: "",
    phone: "",
    whatsapp: "",
    email: "",
    province: "Alajuela",
    canton: "",
    address: "",
    brandColor: "#2563eb",
    plan: "pro",
    monthlyFee: 45000
  });
  const [saasStatus, setSaasStatus] = useState("");
  const [copiedPitchSlug, setCopiedPitchSlug] = useState("");

  const QUOTE_PARTS = [
    "Bumper delantero",
    "Bumper trasero",
    "Bonete / Capó",
    "Puerta delantera izq.",
    "Puerta delantera der.",
    "Puerta trasera izq.",
    "Puerta trasera der.",
    "Guardabarro del. izq.",
    "Guardabarro del. der.",
    "Costado trasero izq.",
    "Costado trasero der.",
    "Techo",
    "Compuerta trasera",
    "Tapa de cajón",
    "Estribo",
    "Pulido y abrillantado general",
    "Pintura general completa (Sedán / SUV)",
    "Pintura completa buseta / microbús"
  ];

  const [activeGeminiTab, setActiveGeminiTab] = useState("cotizador");
  const [showPdfProposalModal, setShowPdfProposalModal] = useState(false);
  const [quoteProposalCode, setQuoteProposalCode] = useState("TD-2026-104");
  const [quoteAssistant, setQuoteAssistant] = useState({
    customerName: "",
    customerPhone: "",
    vehicle: "",
    selectedParts: ["Bumper delantero"],
    damageLevel: "medio",
    paintType: "bicapa",
    customNotes: "",
    minEstimate: 0,
    maxEstimate: 0,
    deliveryDays: "",
    generatedMessage: "",
    calculated: false,
    copySuccess: false,
    loading: false
  });

  const [towTrucks, setTowTrucks] = useState([
    {
      id: 1,
      name: "Grúas Barrio San José & La Garita",
      driverName: "Randall Soto",
      phone: "8844-1234",
      whatsapp: "50688441234",
      email: "gruas.sanjose.alajuela@gmail.com",
      zones: ["Barrio San José", "La Garita", "Radial", "Radio 5 km"],
      type: "Plataforma Rápida",
      rating: 5.0,
      priceRange: "₡22,000 - ₡30,000",
      notes: "Ubicados en Barrio San José a menos de 5 minutos de Taller Dayana."
    },
    {
      id: 2,
      name: "Grúas Hermanos Vargas (El Coyol)",
      driverName: "Esteban Vargas",
      phone: "8822-1144",
      whatsapp: "50688221144",
      email: "gruasvargas.coyol@gmail.com",
      zones: ["El Coyol", "Zona Franca", "Ruta 1 Bernardo Soto", "Radio 6 km"],
      type: "Plataforma Hidráulica & Pesada",
      rating: 4.9,
      priceRange: "₡25,000 - ₡35,000",
      notes: "Rescate express en autopista y parques industriales de El Coyol."
    },
    {
      id: 3,
      name: "Grúas San José & Alajuela Centro",
      driverName: "Carlos Mora",
      phone: "8333-4455",
      whatsapp: "50683334455",
      email: "carlos.gruasalajuela@gmail.com",
      zones: ["Alajuela Centro", "Plaza Ferias", "Aeropuerto", "Radio 4 km"],
      type: "Plataforma para Autos Bajos",
      rating: 5.0,
      priceRange: "₡22,000 - ₡32,000",
      notes: "Especialistas en autos modernos y vehículos con faldones o aros especiales."
    },
    {
      id: 4,
      name: "Grúas Montserrat & Villa Bonita",
      driverName: "Geovanny Alfaro",
      phone: "8711-3344",
      whatsapp: "50687113344",
      email: "gruasmontserrat@gmail.com",
      zones: ["Montserrat", "Villa Bonita", "San Antonio", "Radio 5 km"],
      type: "Plataforma Hidráulica",
      rating: 4.8,
      priceRange: "₡24,000 - ₡32,000",
      notes: "Atención 24/7 en zona sur y este de Alajuela."
    },
    {
      id: 5,
      name: "Grúas Rápidas Belén & San Rafael",
      driverName: "David Solano",
      phone: "8622-9900",
      whatsapp: "50686229900",
      email: "gruasbelen.cr@gmail.com",
      zones: ["San Rafael de Alajuela", "Guácima", "Belén", "Radio 9 km"],
      type: "Plataforma Hidráulica",
      rating: 4.9,
      priceRange: "₡26,000 - ₡38,000",
      notes: "Llegada rápida desde San Rafael y Guácima directo a Taller Dayana."
    },
    {
      id: 6,
      name: "Grúas Tambor, Tuetal & Carrizal",
      driverName: "Luis Méndez",
      phone: "8955-2211",
      whatsapp: "50689552211",
      email: "gruastambor.alajuela@gmail.com",
      zones: ["Tambor", "Tuetal Norte/Sur", "Carrizal", "Radio 8 km"],
      type: "Plataforma Doble Tracción 4x4",
      rating: 5.0,
      priceRange: "₡28,000 - ₡40,000",
      notes: "Ideal para zonas con cuestas empinadas en Alajuela norte."
    },
    {
      id: 7,
      name: "Asistencia Ruta 27 & Turrúcares",
      driverName: "Jorge Quesada",
      phone: "8911-2233",
      whatsapp: "50689112233",
      email: "asistenciaruta27.cr@gmail.com",
      zones: ["Ruta 27", "Turrúcares", "Atenas", "Radio 11 km"],
      type: "Plataforma Pesada",
      rating: 4.9,
      priceRange: "₡30,000 - ₡45,000",
      notes: "Respuesta inmediata en Ruta 27 y peajes con descarga en taller."
    },
    {
      id: 8,
      name: "Grúas del Valle Central Heredia",
      driverName: "Mauricio Alfaro",
      phone: "8700-1234",
      whatsapp: "50687001234",
      email: "gruasvallecentral.cr@gmail.com",
      zones: ["San Joaquín", "Heredia Centro", "Barva", "Radio 12 km"],
      type: "Plataforma Hidráulica",
      rating: 4.8,
      priceRange: "₡28,000 - ₡40,000",
      notes: "Convenio de traslado interprovincial Heredia - Alajuela."
    }
  ]);

  const [showAddTowModal, setShowAddTowModal] = useState(false);
  const [newTowTruck, setNewTowTruck] = useState({
    name: "",
    driverName: "",
    phone: "",
    whatsapp: "",
    email: "",
    zones: "",
    type: "Plataforma Hidráulica",
    priceRange: "₡25,000 - ₡35,000",
    notes: ""
  });
  const [copiedTowId, setCopiedTowId] = useState(null);

  const [socialStudio, setSocialStudio] = useState({
    vehicle: "Toyota Corolla 2019",
    workType: "Enderezado de golpe frontal y pintura al horno",
    beforeImage: "/cases/caso-proceso-1.jpg",
    afterImage: "/cases/caso-final-1.jpg",
    notes: "Alineación milimétrica de chasis y acabado espejo en cabina de pintura.",
    platform: "facebook_instagram",
    copySuccess: false,
    generatingImage: false
  });

  const SOCIAL_PRESETS = [
    {
      label: "Toyota Corolla • Golpe Frontal",
      vehicle: "Toyota Corolla 2019",
      workType: "Enderezado de chasis y pintura bicapa al horno",
      beforeImage: "/cases/caso-proceso-1.jpg",
      afterImage: "/cases/caso-final-1.jpg",
      notes: "Devolvimos las líneas originales de fábrica y aplicamos transparente de alta gama."
    },
    {
      label: "Suzuki Swift • Horneado y Brillo",
      vehicle: "Suzuki Swift Sport",
      workType: "Pintura horneada en cabina y pulido cerámico",
      beforeImage: "/cases/case-36.jpg",
      afterImage: "/cases/caso-final-2.jpg",
      notes: "Igualación computarizada de tono de color y protección de barniz."
    },
    {
      label: "Hyundai Tucson • Restauración Lateral",
      vehicle: "Hyundai Tucson 2021",
      workType: "Enderezado de puertas, costado y pintura tricapa",
      beforeImage: "/cases/case-76.jpg",
      afterImage: "/cases/caso-final-3.jpg",
      notes: "Cero masilla innecesaria, ajuste de piezas y acabado impecable."
    }
  ];

  const generatedSocialCopy = useMemo(() => {
    if (socialStudio.platform === "tiktok") {
      return (
        `¿Creías que este ${socialStudio.vehicle} no tenía arreglo? 🚗💥\n\n` +
        `En Taller Dayana (@tallerdayanacr) realizamos: ${socialStudio.workType}. ${socialStudio.notes}\n\n` +
        `📍 Barrio San José de Alajuela\n` +
        `📲 Cotizá tu carro al WhatsApp: 7043-9248 (enlace en el perfil)\n\n` +
        `#TallerDayana #tallerdayanacr #EnderezadoYPintura #CostaRica #Alajuela #Heredia #AntesYDespues #TikTokAutos #PinturaAutomotriz #AutosCR`
      );
    }
    return (
      `🚗✨ TRANSFORMACIÓN COMPLETA • TALLER DAYANA\n\n` +
      `Vehículo: ${socialStudio.vehicle}\n` +
      `Trabajo realizado: ${socialStudio.workType}\n\n` +
      `Don Randy Barrantes y nuestro equipo devolvieron este vehículo a su estado original de fábrica. ${socialStudio.notes}\n\n` +
      `✅ Materiales automotrices de primera gama\n` +
      `✅ Cabina de pintura y secado al horno\n` +
      `✅ Garantía por escrito en tono y acabado\n` +
      `✅ Seguimiento en línea 24/7 de su reparación\n\n` +
      `📍 Ubicación: Barrio San José de Alajuela, Costa Rica\n` +
      `📲 Cotizaciones rápidas por WhatsApp: 7043-9248 / 8869-8157\n` +
      `🌐 Cotice y agende en nuestra web: https://tallerdayana.vercel.app\n` +
      `📸 Síganos en IG: @tallerdayana | TikTok: @tallerdayanacr\n\n` +
      `#TallerDayana #tallerdayana #EnderezadoYPintura #Alajuela #Heredia #CostaRica #PinturaAutomotriz #AutosCostaRica #TallerMecanicoCR #AntesYDespues`
    );
  }, [socialStudio]);

  const copySocialText = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(generatedSocialCopy);
      setSocialStudio((prev) => ({ ...prev, copySuccess: true }));
      setTimeout(() => setSocialStudio((prev) => ({ ...prev, copySuccess: false })), 3000);
    }
  };

  const generateAndDownloadComposite = async () => {
    setSocialStudio((prev) => ({ ...prev, generatingImage: true }));
    try {
      const canvas = canvasRef.current || document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 700;
      const ctx = canvas.getContext("2d");

      const loadImg = (src) =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });

      const [imgBefore, imgAfter] = await Promise.all([
        loadImg(socialStudio.beforeImage),
        loadImg(socialStudio.afterImage)
      ]);

      // Background
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, 1200, 700);

      // Draw Before (left half: 597 width)
      ctx.drawImage(imgBefore, 0, 0, 597, 620);
      // Draw After (right half: 597 width)
      ctx.drawImage(imgAfter, 603, 0, 597, 620);

      // Divider line
      ctx.fillStyle = "#d62828";
      ctx.fillRect(597, 0, 6, 620);

      // ANTES Badge
      ctx.fillStyle = "rgba(220, 38, 38, 0.9)";
      ctx.fillRect(20, 20, 140, 42);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText("ANTES", 55, 48);

      // DESPUES Badge
      ctx.fillStyle = "rgba(22, 163, 74, 0.9)";
      ctx.fillRect(625, 20, 160, 42);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText("DESPUÉS", 655, 48);

      // Bottom Bar
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 620, 1200, 80);
      ctx.fillStyle = "#d62828";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText("TALLER DAYANA", 30, 668);
      ctx.fillStyle = "#a1a1aa";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText("• Enderezado y Pintura Automotriz • Alajuela, CR", 240, 668);
      ctx.fillStyle = "#22c55e";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText("WhatsApp: 7043-9248", 960, 668);

      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `taller-dayana-${socialStudio.vehicle.toLowerCase().replace(/\\s+/g, "-")}-antes-despues.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      alert("No se pudo componer la imagen automáticamente: " + err.message);
    } finally {
      setSocialStudio((prev) => ({ ...prev, generatingImage: false }));
    }
  };

  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_API_BASE_URL ||
    "https://taller-dayana-api.onrender.com";

  const toggleQuotePart = (part) => {
    setQuoteAssistant((prev) => {
      const exists = prev.selectedParts.includes(part);
      const nextParts = exists
        ? prev.selectedParts.filter((p) => p !== part)
        : [...prev.selectedParts, part];
      return { ...prev, selectedParts: nextParts, calculated: false };
    });
  };

  const handleCalculateQuote = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setQuoteAssistant((prev) => ({ ...prev, loading: true }));

    try {
      const response = await fetch(`${apiBase}/api/admin/quote-assistant`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          customerName: quoteAssistant.customerName || "Estimado cliente",
          vehicle: quoteAssistant.vehicle || "su vehículo",
          selectedParts: quoteAssistant.selectedParts,
          damageLevel: quoteAssistant.damageLevel,
          paintType: quoteAssistant.paintType,
          customNotes: quoteAssistant.customNotes
        })
      });

      if (response.ok) {
        const data = await response.json();
        setQuoteAssistant((prev) => ({
          ...prev,
          minEstimate: data.minEstimate,
          maxEstimate: data.maxEstimate,
          deliveryDays: data.deliveryDays,
          generatedMessage: data.message,
          calculated: true,
          loading: false
        }));
        return;
      }
    } catch (_err) {
      // Fallback local
    }

    const basePiecePrices = {
      "Bumper delantero": 45000,
      "Bumper trasero": 45000,
      "Bonete / Capó": 65000,
      "Puerta delantera izq.": 55000,
      "Puerta delantera der.": 55000,
      "Puerta trasera izq.": 55000,
      "Puerta trasera der.": 55000,
      "Guardabarro del. izq.": 48000,
      "Guardabarro del. der.": 48000,
      "Costado trasero izq.": 60000,
      "Costado trasero der.": 60000,
      "Techo": 75000,
      "Compuerta trasera": 58000,
      "Tapa cajuela / baúl": 55000,
      "Tapa de cajón": 55000,
      "Estribo": 40000,
      "Estribos / Faldones": 40000,
      "Pulido y abrillantado": 45000,
      "Pulido y abrillantado general": 45000,
      "Pintura general completa": 550000,
      "Pintura general completa (Sedán / SUV)": 550000,
      "Pintura completa buseta / microbús": 750000
    };
    const multD = quoteAssistant.damageLevel === "leve" ? 1.0 : quoteAssistant.damageLevel === "medio" ? 1.35 : 1.85;
    const multP = quoteAssistant.paintType === "monocapa" ? 1.0 : quoteAssistant.paintType === "bicapa" ? 1.15 : 1.30;
    let sum = 0;
    (quoteAssistant.selectedParts || []).forEach((p) => { sum += (basePiecePrices[p] || 50000); });
    const calc = Math.round((sum * multD * multP) / 1000) * 1000;
    const minEst = Math.round((calc * 0.92) / 1000) * 1000;
    const maxEst = Math.round((calc * 1.12) / 1000) * 1000;
    const days = (quoteAssistant.selectedParts || []).length <= 2 ? "3 a 4 días hábiles" : (quoteAssistant.selectedParts || []).length <= 4 ? "4 a 6 días hábiles" : "7 a 10 días hábiles";

    const quoteCode = `TD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    setQuoteProposalCode(quoteCode);

    const damageDesc =
      quoteAssistant.damageLevel === "leve"
        ? "Leve (Reparación superficial y pintura automotriz de acabado)"
        : quoteAssistant.damageLevel === "medio"
        ? "Medio (Desabollado de lámina, corrección y masillado fino)"
        : "Fuerte (Enderezado estructural de chasis y escuadre milimétrico)";

    const paintDesc =
      quoteAssistant.paintType === "monocapa"
        ? "Monocapa convencional con sellado"
        : quoteAssistant.paintType === "bicapa"
        ? "Bicapa Poliuretano de Alto Sólido (HS) curado al horno en cabina presurizada"
        : "Tricapa Especial / Perlado profundo con doble barniz cerámico protector";

    const msg =
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🚗 *TALLER DAYANA • ENDEREZADO Y PINTURA*\n` +
      `*Barrio San José de Alajuela • Don Randy Barrantes*\n` +
      `*Teléfonos:* 7043-9248 / 8869-8157 • *Waze:* Taller Dayana\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📄 *VALORACIÓN TÉCNICA ESTIMADA • OFICIAL [${quoteCode}]*\n\n` +
      `Estimado(a) *${quoteAssistant.customerName || "Cliente"}*:\n` +
      `Es un gusto saludarle. Por este medio le hacemos entrega de la estimación técnica preliminar para su *${quoteAssistant.vehicle || "vehículo"}* elaborada por nuestro equipo técnico bajo la supervisión directa de Don Randy Barrantes.\n\n` +
      `📋 *1. RELACIÓN DE PIEZAS / PAÑOS:*\n` +
      (quoteAssistant.selectedParts || []).map((p) => `  ✓ ${p}`).join("\n") + "\n\n" +
      `🔬 *2. ALCANCE Y ESPECIFICACIÓN TÉCNICA:*\n` +
      `  • Nivel de intervención: ${damageDesc}\n` +
      `  • Acabado y cabina: ${paintDesc}\n` +
      `  • Preparación: Imprimación epóxica anticorrosiva y secado en cabina.\n` +
      `  • Acabado final: Desmotado, pulido y abrillantado profesional 3M.\n\n` +
      `💰 *3. INVERSIÓN TOTAL ESTIMADA:*\n` +
      `  *₡${minEst.toLocaleString("es-CR")} a ₡${maxEst.toLocaleString("es-CR")} colones*\n` +
      `  _(Monto preliminar sujeto a confirmación física de fijaciones y soportes en taller)_\n\n` +
      `⏱️ *4. PLAZO DE ENTREGA:* ${days}\n` +
      `🛡️ *5. GARANTÍA ESCRITA:* Cobertura total en igualación de tono, brillo y adherencia de capa.\n` +
      (quoteAssistant.customNotes ? `\n📝 *Nota técnica:* ${quoteAssistant.customNotes}\n` : "") +
      `\n📍 *Taller físico:* Costado norte de la plaza de deportes, Barrio San José de Alajuela.\n` +
      `📲 ¿Gusta que le reservemos un espacio esta semana para inspeccionar el vehículo físicamente con Don Randy y formalizar la recepción? Estamos para servirle con todo gusto.`;

    setQuoteAssistant((prev) => ({
      ...prev,
      minEstimate: minEst,
      maxEstimate: maxEst,
      deliveryDays: days,
      generatedMessage: msg,
      calculated: true,
      loading: false
    }));
  };

  const copyQuoteMessage = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(quoteAssistant.generatedMessage);
      setQuoteAssistant((prev) => ({ ...prev, copySuccess: true }));
      setTimeout(() => setQuoteAssistant((prev) => ({ ...prev, copySuccess: false })), 3000);
    }
  };

  const handleCreateTowTruck = (e) => {
    e.preventDefault();
    if (!newTowTruck.name || !newTowTruck.phone) {
      alert("Por favor ingrese al menos el nombre y el teléfono de la grúa.");
      return;
    }
    const id = Date.now();
    const item = {
      id,
      name: newTowTruck.name,
      driverName: newTowTruck.driverName || "",
      phone: newTowTruck.phone,
      whatsapp: newTowTruck.whatsapp || newTowTruck.phone.replace(/[^0-9]/g, ""),
      zones: newTowTruck.zones ? newTowTruck.zones.split(",").map((z) => z.trim()) : ["Alajuela / GAM"],
      type: newTowTruck.type,
      rating: 5.0,
      priceRange: newTowTruck.priceRange || "₡25,000 - ₡35,000",
      notes: newTowTruck.notes || ""
    };
    setTowTrucks((prev) => [item, ...prev]);
    setNewTowTruck({
      name: "",
      driverName: "",
      phone: "",
      whatsapp: "",
      zones: "",
      type: "Plataforma Hidráulica",
      priceRange: "₡25,000 - ₡35,000",
      notes: ""
    });
    setShowAddTowModal(false);
    setStatus("Proveedor de grúa guardado");
  };

  const handleDeleteTowTruck = (id) => {
    if (window.confirm("¿Desea eliminar esta grúa del directorio?")) {
      setTowTrucks((prev) => prev.filter((t) => t.id !== id));
      setStatus("Grúa eliminada del directorio");
    }
  };

  const openEntryDatePicker = () => {
    const input = entryDateInputRef.current;
    if (!input) {
      return;
    }

    try {
      if (typeof input.showPicker === "function") {
        input.showPicker();
        return;
      }
    } catch {
      // Continue with fallback methods for browsers that block showPicker.
    }

    input.click();
    input.focus();
  };

  const resolvePhotoUrl = (photoUrl) => {
    if (!photoUrl || typeof photoUrl !== "string") {
      return "";
    }

    if (photoUrl.startsWith("/")) {
      return `${apiBase}${photoUrl}`;
    }

    return photoUrl;
  };

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const rawDataUrl = String(reader.result || "");
        if (!rawDataUrl.startsWith("data:image/")) {
          resolve(rawDataUrl);
          return;
        }
        const img = new Image();
        img.onload = () => {
          try {
            const maxDim = 1600;
            let { width, height } = img;
            if (width > maxDim || height > maxDim) {
              const ratio = Math.min(maxDim / width, maxDim / height);
              width = Math.round(width * ratio);
              height = Math.round(height * ratio);
            }
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", 0.82));
          } catch {
            resolve(rawDataUrl);
          }
        };
        img.onerror = () => resolve(rawDataUrl);
        img.src = rawDataUrl;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const login = async () => {
    setStatus("Autenticando...");
    const response = await fetch(`${apiBase}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      setStatus("Error de autenticacion");
      return;
    }

    const payload = await response.json();
    setToken(payload.token);
    setStatus("Autenticado. Cargando datos...");

    const authToken = payload.token;
    const authOnlyHeaders = { Authorization: `Bearer ${authToken}` };

    const [appointmentsResponse, quotesResponse, vehiclesResponse] = await Promise.all([
      fetch(`${apiBase}/api/admin/appointments`, { headers: authOnlyHeaders }),
      fetch(`${apiBase}/api/admin/quotes`, { headers: authOnlyHeaders }),
      fetch(`${apiBase}/api/admin/workshop-vehicles`, { headers: authOnlyHeaders })
    ]);

    if (appointmentsResponse.ok) {
      const appointmentsPayload = await appointmentsResponse.json();
      setAppointments(appointmentsPayload);
    }

    if (quotesResponse.ok) {
      const quotesPayload = await quotesResponse.json();
      setQuotes(quotesPayload);
    }

    if (vehiclesResponse.ok) {
      const vehiclesPayload = await vehiclesResponse.json();
      setWorkshopVehicles((Array.isArray(vehiclesPayload) ? vehiclesPayload : []).filter(v => String(v.plate || "").trim() !== "514474"));
    }

    try {
      const [saasTenantsRes, saasMetricsRes] = await Promise.all([
        fetch(`${apiBase}/api/admin/saas/tenants`, { headers: authOnlyHeaders }),
        fetch(`${apiBase}/api/admin/saas/metrics`, { headers: authOnlyHeaders })
      ]);
      if (saasTenantsRes.ok) {
        const tenantsData = await saasTenantsRes.json();
        if (Array.isArray(tenantsData) && tenantsData.length > 0) setSaasTenants(tenantsData);
      }
      if (saasMetricsRes.ok) {
        const metricsData = await saasMetricsRes.json();
        if (metricsData) setSaasMetrics(metricsData);
      }
    } catch (_err) {}

    setStatus("Autenticado y datos actualizados");
  };

  const handleToggleTenantStatus = (id) => {
    setSaasTenants((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextActive = !t.isActive;
          return { ...t, isActive: nextActive };
        }
        return t;
      })
    );
    if (token) {
      const target = saasTenants.find((t) => t.id === id);
      if (target) {
        fetch(`${apiBase}/api/admin/saas/tenants/${id}`, {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify({ isActive: !target.isActive })
        }).catch(() => {});
      }
    }
  };

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    if (!newTenantForm.name || !newTenantForm.phone) {
      setSaasStatus("Por favor complete al menos el nombre del taller y teléfono.");
      return;
    }
    const slug = newTenantForm.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const newTenant = {
      id: Date.now(),
      slug,
      name: newTenantForm.name.trim(),
      ownerName: newTenantForm.ownerName.trim() || newTenantForm.name.trim(),
      phone: newTenantForm.phone.trim(),
      whatsapp: (newTenantForm.whatsapp || newTenantForm.phone).replace(/[^0-9]/g, ""),
      email: newTenantForm.email.trim() || `${slug}@gmail.com`,
      province: newTenantForm.province,
      canton: newTenantForm.canton.trim() || newTenantForm.province,
      address: newTenantForm.address.trim() || `${newTenantForm.province}, Costa Rica`,
      brandColor: newTenantForm.brandColor,
      plan: newTenantForm.plan,
      monthlyFee: Number(newTenantForm.monthlyFee) || (newTenantForm.plan === "basico" ? 25000 : newTenantForm.plan === "elite" ? 65000 : 45000),
      isActive: true,
      isMaster: false
    };

    setSaasTenants((prev) => [...prev, newTenant]);
    setNewTenantForm({
      name: "",
      ownerName: "",
      phone: "",
      whatsapp: "",
      email: "",
      province: "Alajuela",
      canton: "",
      address: "",
      brandColor: "#2563eb",
      plan: "pro",
      monthlyFee: 45000
    });
    setActiveSaasTab("tenants");
    setSaasStatus(`¡Taller "${newTenant.name}" creado con éxito! Ya puede probar el enlace demo.`);

    if (token) {
      try {
        await fetch(`${apiBase}/api/admin/saas/tenants`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify(newTenant)
        });
      } catch (_err) {}
    }
  };

  const copyDemoWhatsAppPitch = (tenant) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://tallerdayana.vercel.app";
    const demoUrl = `${origin}/?tenant=${tenant.slug}`;
    const pitch =
      `¡Hola don ${tenant.ownerName || tenant.name}! Le saluda Randy de Alajuela. 🚗🇨🇷\n\n` +
      `Estuve viendo el excelente trabajo de ${tenant.name} y le preparé una DEMOSTRACIÓN EN VIVO de cómo se vería la plataforma web para su taller:\n` +
      `👉 ${demoUrl}\n\n` +
      `Mire las herramientas que tendría su taller activas desde hoy:\n` +
      `1️⃣ Sus clientes consultan con su PLACA las fotos del avance de su carro las 24 horas (¡se acabaron las llamadas preguntando si ya lo pintaron!).\n` +
      `2️⃣ Cotizador Express por piezas que le envía los pedidos listos a su WhatsApp.\n` +
      `3️⃣ Agendamiento de citas de valoración en su horario disponible.\n` +
      `4️⃣ Generador de publicaciones 'Antes y Después' para su Facebook y TikTok en 15 segundos.\n\n` +
      `¿Le parece si conversamos 3 minutos por teléfono para mostrarle cómo le generaría más clientes en ${tenant.province}? ¡Pura vida!`;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(pitch);
      setCopiedPitchSlug(tenant.slug);
      setTimeout(() => setCopiedPitchSlug(""), 3500);
    }
  };

  const filteredQuotes = useMemo(() => {
    const normalizedPlate = quoteFilters.plate.trim().toUpperCase();
    const normalizedSearch = quoteFilters.search.trim().toLowerCase();

    return quotes.filter((item) => {
      if (quoteFilters.status && item.status !== quoteFilters.status) {
        return false;
      }

      if (normalizedPlate && !String(item.plate || "").toUpperCase().includes(normalizedPlate)) {
        return false;
      }

      if (quoteFilters.month) {
        const createdAt = item.createdAt ? new Date(item.createdAt) : null;
        if (!createdAt || Number.isNaN(createdAt.getTime())) {
          return false;
        }

        const itemMonth = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, "0")}`;
        if (itemMonth !== quoteFilters.month) {
          return false;
        }
      }

      if (normalizedSearch) {
        const haystack = [item.customerName, item.vehicle, item.plate, item.damageDescription, item.phone]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(normalizedSearch)) {
          return false;
        }
      }

      return true;
    });
  }, [quotes, quoteFilters]);

  const unifiedRecords = useMemo(() => {
    const quoteRows = quotes.map((item) => ({
      type: "quote",
      id: item.id,
      customerName: item.customerName || "",
      plate: item.plate || "",
      summary: item.vehicle || "",
      status: item.status || "",
      date: item.createdAt || null,
      details: item.damageDescription || "",
      recordKey: `quote-${item.id}`
    }));

    const appointmentRows = appointments.map((item) => ({
      type: "appointment",
      id: item.id,
      customerName: item.customerName || "",
      plate: item.plate || "",
      summary: item.vehicle || "",
      status: item.status || "",
      date: item.appointmentDate || item.createdAt || null,
      details: "Cita programada",
      recordKey: `appointment-${item.id}`
    }));

    const workshopRows = workshopVehicles.map((item) => ({
      type: "workshop",
      id: item.id,
      customerName: item.customerName || "",
      plate: item.plate || "",
      summary: item.workType || "",
      status: item.status || "",
      date: item.entryDate || item.createdAt || null,
      details: `Fotos: ${item.photoCount || 0}`,
      recordKey: `workshop-${item.id}`
    }));

    return [...quoteRows, ...appointmentRows, ...workshopRows].sort((a, b) => {
      const aDate = new Date(a.date || 0).getTime();
      const bDate = new Date(b.date || 0).getTime();
      return bDate - aDate;
    });
  }, [quotes, appointments, workshopVehicles]);

  const filteredUnifiedRecords = useMemo(() => {
    const plateFilter = recordsFilter.plate.trim().toUpperCase();
    const customerFilter = recordsFilter.customer.trim().toLowerCase();
    const searchFilter = recordsFilter.search.trim().toLowerCase();

    return unifiedRecords.filter((item) => {
      if (recordsFilter.type !== "all" && item.type !== recordsFilter.type) {
        return false;
      }

      if (plateFilter && !String(item.plate).toUpperCase().includes(plateFilter)) {
        return false;
      }

      if (customerFilter && !String(item.customerName).toLowerCase().includes(customerFilter)) {
        return false;
      }

      if (searchFilter) {
        const haystack = [item.customerName, item.plate, item.summary, item.status, item.details].join(" ").toLowerCase();
        if (!haystack.includes(searchFilter)) {
          return false;
        }
      }

      return true;
    });
  }, [recordsFilter, unifiedRecords]);

  const labelByRecordType = {
    quote: "Presupuesto",
    appointment: "Cita",
    workshop: "Vehículo taller"
  };

  const loadAppointments = async () => {
    if (!token) {
      setStatus("Debe autenticarse primero");
      return;
    }

    const response = await fetch(`${apiBase}/api/admin/appointments`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      setStatus("No se pudieron cargar citas");
      return;
    }

    const payload = await response.json();
    setAppointments(payload);
    setStatus(`Citas cargadas: ${payload.length}`);
  };

  const loadQuotes = async () => {
    if (!token) {
      setStatus("Debe autenticarse primero");
      return;
    }

    const response = await fetch(`${apiBase}/api/admin/quotes`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      setStatus("No se pudieron cargar presupuestos");
      return;
    }

    const payload = await response.json();
    setQuotes(payload);
    setStatus(`Presupuestos cargados: ${payload.length}`);
  };

  const markReady = async (id) => {
    const response = await fetch(`${apiBase}/api/admin/appointments/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: "ready" })
    });

    if (!response.ok) {
      setStatus("No se pudo actualizar estado");
      return;
    }

    setStatus(`Cita ${id} actualizada a ready`);
    await loadAppointments();
  };

  const loadWorkshopVehicles = async () => {
    if (!token) {
      setStatus("Debe autenticarse primero");
      return;
    }

    const response = await fetch(`${apiBase}/api/admin/workshop-vehicles`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      setStatus("No se pudieron cargar vehiculos del taller");
      return;
    }

    const payload = await response.json();
    setWorkshopVehicles(payload);
    setStatus(`Vehiculos cargados: ${payload.length}`);
  };

  const registerWorkshopVehicle = async (event) => {
    event.preventDefault();

    if (!token) {
      setStatus("Debe autenticarse primero");
      return;
    }

    const response = await fetch(`${apiBase}/api/admin/workshop-vehicles`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        ...vehicleForm,
        plate: vehicleForm.plate ? vehicleForm.plate.toUpperCase().trim() : "",
        customerName: vehicleForm.customerName.trim(),
        entryDate: vehicleForm.entryDate || new Date().toISOString().slice(0, 10)
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      setStatus(`No se pudo registrar el vehículo: ${err.error || "Error en el servidor"}`);
      return;
    }

    setStatus("Vehículo registrado correctamente");
    setVehicleForm({
      plate: "",
      customerName: "",
      workType: workTypeOptions[0],
      entryDate: new Date().toISOString().slice(0, 10),
      status: "received"
    });
    await loadWorkshopVehicles();
  };

  const changeWorkshopStatus = async (id, nextStatus) => {
    if (!token) {
      setStatus("Debe autenticarse primero");
      return;
    }

    const response = await fetch(`${apiBase}/api/admin/workshop-vehicles/${id}/status`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ status: nextStatus })
    });

    if (!response.ok) {
      setStatus("No se pudo cambiar el estado del vehiculo");
      return;
    }

    setStatus(`Estado del vehiculo #${id} actualizado`);
    await loadWorkshopVehicles();
  };

  const loadPhotosByPlate = async (plate) => {
    if (!token || !plate) {
      return;
    }

    setLoadingPhotos(true);
    const response = await fetch(`${apiBase}/api/admin/workshop-progress-photos/${plate}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      setStatus("No se pudieron cargar fotos de avance");
      setLoadingPhotos(false);
      return;
    }

    const payload = await response.json();
    setProgressPhotos(payload);
    setLoadingPhotos(false);
  };

  const uploadProgressPhoto = async (event) => {
    event.preventDefault();

    if (!token) {
      setStatus("Debe autenticarse primero");
      return;
    }

    if (!Array.isArray(photoForm.files) || photoForm.files.length === 0) {
      setStatus("Debe seleccionar al menos una foto");
      return;
    }

    const photoUrls = await Promise.all(photoForm.files.map((file) => fileToDataUrl(file)));
    const response = await fetch(`${apiBase}/api/admin/workshop-progress-photos`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        plate: photoForm.plate.toUpperCase().trim(),
        description: photoForm.description.trim(),
        photoUrls
      })
    });

    if (!response.ok) {
      setStatus("No se pudo subir la foto");
      return;
    }

    const createdPayload = await response.json();
    const uploadedCount = Array.isArray(createdPayload) ? createdPayload.length : 1;
    setStatus(`Fotos de avance subidas: ${uploadedCount}`);
    const activePlate = photoForm.plate.toUpperCase().trim();
    setPhotoForm({ plate: activePlate, description: "", files: [] });
    setPhotoPreview(null);
    await loadWorkshopVehicles();
    await loadPhotosByPlate(activePlate);
  };

  const deleteProgressPhoto = async (photoId) => {
    if (!token) {
      setStatus("Debe autenticarse primero");
      return;
    }

    const confirmed = window.confirm("¿Deseas eliminar esta foto de avance?");
    if (!confirmed) {
      return;
    }

    const response = await fetch(`${apiBase}/api/admin/workshop-progress-photos/${photoId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      setStatus("No se pudo eliminar la foto");
      return;
    }

    setStatus(`Foto eliminada (#${photoId})`);
    setProgressPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
    await loadWorkshopVehicles();
  };

  const movePhotoOrder = async (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= progressPhotos.length) return;
    const reordered = [...progressPhotos];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    const baseEpoch = Date.now() - (reordered.length * 60000);
    const withNewDates = reordered.map((photo, idx) => ({
      ...photo,
      createdAt: new Date(baseEpoch + (idx * 60000)).toISOString()
    }));

    setProgressPhotos(withNewDates);

    try {
      await fetch(`${apiBase}/api/admin/workshop-photos/reorder`, {
        method: "PUT",
        headers: authHeaders,
        body: JSON.stringify({
          photosOrder: withNewDates.map((p) => ({ id: p.id, createdAt: p.createdAt }))
        })
      });
      setStatus("Orden de fotos actualizado correctamente");
    } catch (_err) {
      // orden en memoria mantenido
    }
  };

  const deleteUnifiedRecord = async (item) => {
    if (!token) {
      setStatus("Debe autenticarse primero");
      return;
    }

    const confirmed = window.confirm(`¿Deseas eliminar este registro de ${labelByRecordType[item.type]} #${item.id}?`);
    if (!confirmed) {
      return;
    }

    setDeletingRecordKey(item.recordKey);

    const endpointByType = {
      quote: `${apiBase}/api/admin/quotes/${item.id}`,
      appointment: `${apiBase}/api/admin/appointments/${item.id}`,
      workshop: `${apiBase}/api/admin/workshop-vehicles/${item.id}`
    };

    try {
      const response = await fetch(endpointByType[item.type], {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        setStatus(payload.error || "No se pudo eliminar el registro");
        return;
      }

      if (item.type === "quote") {
        setQuotes((prev) => prev.filter((entry) => entry.id !== item.id));
      } else if (item.type === "appointment") {
        setAppointments((prev) => prev.filter((entry) => entry.id !== item.id));
      } else if (item.type === "workshop") {
        setWorkshopVehicles((prev) => prev.filter((entry) => entry.id !== item.id));
        if (activePhotosPlate === item.plate) {
          setActivePhotosPlate("");
          setProgressPhotos([]);
        }
      }

      setStatus(`${labelByRecordType[item.type]} #${item.id} eliminado`);
    } finally {
      setDeletingRecordKey("");
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-8 text-white md:px-8">
      <section className="section-card border-brandRed/40 bg-gradient-to-br from-zinc-950 to-zinc-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-brandRed">Panel Interno</p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">Panel Admin - Taller Dayana</h1>
            <p className="mt-2 text-zinc-300">Gestión de citas, vehículos en proceso y avances de reparación.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href="/"
              className="rounded-md border border-zinc-600 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:border-brandRed hover:text-white"
            >
              ← Ir al inicio
            </a>
            <a
              href="/seguimiento"
              className="rounded-md border border-zinc-600 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:border-brandRed hover:text-white"
            >
              Ver Seguimiento
            </a>
          </div>
        </div>
      </section>

      {/* BARRA DE NAVEGACIÓN RÁPIDA DEL PANEL */}
      <nav aria-label="Navegación rápida" className="sticky top-2 z-30 flex flex-wrap items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-950/95 p-2.5 backdrop-blur shadow-2xl">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 pl-1">Acceso Rápido:</span>
        <a href="#directorio-gruas" className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/50 bg-amber-500/15 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/25 transition">
          <span>🚜</span> Grúas Alajuela (8 en radio 12km)
        </a>
        <a href="#asistente-gemini" className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/50 bg-purple-500/15 px-3 py-1.5 text-xs font-bold text-purple-300 hover:bg-purple-500/25 transition">
          <span>🤖</span> Asistente Gemini (Cotizador & PDF)
        </a>
        <a href="#vehiculos-taller" className="inline-flex items-center gap-1.5 rounded-lg border border-blue-500/50 bg-blue-500/15 px-3 py-1.5 text-xs font-bold text-blue-300 hover:bg-blue-500/25 transition">
          <span>🚗</span> Vehículos en Taller
        </a>
        <a href="#solicitudes-presupuestos" className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/50 bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/25 transition">
          <span>📋</span> Presupuestos
        </a>
      </nav>

      <section className="section-card space-y-3">
        <h2 className="border-l-4 border-brandRed pl-3 text-xl font-semibold">Autenticación</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            login();
          }}
          className="space-y-3"
        >
          <div className="grid gap-3 md:grid-cols-2">
            <input
              className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white placeholder:text-zinc-400"
              value={credentials.username}
              onChange={(e) => setCredentials((prev) => ({ ...prev, username: e.target.value }))}
              placeholder="Usuario"
            />
            <input
              type="password"
              className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white placeholder:text-zinc-400"
              value={credentials.password}
              onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))}
              placeholder="Contraseña"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="rounded-md bg-brandRed px-4 py-2 font-semibold text-white transition hover:opacity-90">
              Ingresar
            </button>
            <button type="button" onClick={loadAppointments} className="rounded-md border border-zinc-500 px-4 py-2 text-zinc-100 transition hover:border-white">
              Cargar citas
            </button>
            <button type="button" onClick={loadQuotes} className="rounded-md border border-zinc-500 px-4 py-2 text-zinc-100 transition hover:border-white">
              Cargar presupuestos
            </button>
            <button type="button" onClick={loadWorkshopVehicles} className="rounded-md border border-zinc-500 px-4 py-2 text-zinc-100 transition hover:border-white">
              Cargar vehículos en taller
            </button>
          </div>
        </form>
        <p className="text-sm text-zinc-300">{status}</p>
      </section>

      {/* ===================== CENTRO DE CONTROL SAAS MULTI-TALLER ===================== */}
      <section className="section-card space-y-6 border-blue-500/40 bg-gradient-to-br from-zinc-950 via-slate-950 to-zinc-950">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                Plataforma Multi-Taller SaaS • Alajuela & Heredia
              </span>
            </div>
            <h2 className="mt-1 text-2xl font-bold text-white md:text-3xl">
              Centro de Control SaaS & Talleres Afiliados
            </h2>
            <p className="mt-1 text-sm text-zinc-300">
              Gestión comercial, alta de nuevos talleres en 60 segundos y generación de enlaces de demostración para venta de suscripciones.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveSaasTab("tenants")}
              className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${activeSaasTab === "tenants" ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"}`}
            >
              🏢 Talleres ({saasTenants.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSaasTab("new")}
              className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${activeSaasTab === "new" ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30" : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"}`}
            >
              ➕ Alta en 60s
            </button>
            <button
              type="button"
              onClick={() => setActiveSaasTab("sales_kit")}
              className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${activeSaasTab === "sales_kit" ? "bg-amber-600 text-white shadow-md shadow-amber-600/30" : "bg-zinc-900 text-zinc-300 hover:bg-zinc-800"}`}
            >
              💼 Kit de Ventas
            </button>
          </div>
        </div>

        {/* METRICS SUMMARY */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
            <p className="text-xs font-medium text-zinc-400">MRR Recurrente Mensual</p>
            <p className="mt-1 text-2xl font-black text-emerald-400">
              ₡{saasTenants.filter((t) => t.isActive).reduce((acc, t) => acc + (Number(t.monthlyFee) || 0), 0).toLocaleString("es-CR")}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500">Cobro mensual por suscripción</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
            <p className="text-xs font-medium text-zinc-400">Talleres Afiliados Activos</p>
            <p className="mt-1 text-2xl font-black text-white">
              {saasTenants.filter((t) => t.isActive).length} <span className="text-sm font-normal text-zinc-400">/ {saasTenants.length}</span>
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500">Alajuela, Heredia y GAM</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
            <p className="text-xs font-medium text-zinc-400">Vehículos en Monitoreo</p>
            <p className="mt-1 text-2xl font-black text-blue-400">{workshopVehicles.length || 12}</p>
            <p className="mt-0.5 text-[11px] text-zinc-500">Placas con fotos de avance</p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4">
            <p className="text-xs font-medium text-zinc-400">Potencial de Mercado GAM</p>
            <p className="mt-1 text-2xl font-black text-amber-400">+1,700</p>
            <p className="mt-0.5 text-[11px] text-zinc-500">Talleres sin sistema web</p>
          </div>
        </div>

        {saasStatus && (
          <div className="rounded-lg border border-blue-500/40 bg-blue-950/30 p-3 text-xs text-blue-200">
            {saasStatus}
          </div>
        )}

        {/* TAB 1: TALLERES AFILIADOS */}
        {activeSaasTab === "tenants" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Directorio de Talleres en la Plataforma</h3>
              <span className="text-xs text-zinc-400">Haga clic en "Copiar Pitch" para enviar demostración por WhatsApp</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {saasTenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className={`flex flex-col justify-between rounded-xl border p-4 transition ${tenant.isActive ? "border-zinc-800 bg-zinc-900/90" : "border-zinc-800/40 bg-zinc-950/60 opacity-60"}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-lg font-bold text-white text-xs shadow-sm"
                          style={{ backgroundColor: tenant.brandColor || "#2563eb" }}
                        >
                          {tenant.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-white leading-tight">{tenant.name}</h4>
                          <p className="text-xs text-zinc-400">{tenant.province} • {tenant.canton}</p>
                        </div>
                      </div>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          tenant.plan === "elite"
                            ? "bg-purple-900/60 text-purple-300 border border-purple-500/40"
                            : tenant.plan === "pro"
                              ? "bg-blue-900/60 text-blue-300 border border-blue-500/40"
                              : "bg-emerald-900/60 text-emerald-300 border border-emerald-500/40"
                        }`}
                      >
                        Plan {tenant.plan}
                      </span>
                    </div>

                    <div className="rounded-lg bg-zinc-950/70 p-2.5 text-xs space-y-1 text-zinc-300">
                      <p><span className="text-zinc-500">Dueño:</span> {tenant.ownerName}</p>
                      <p><span className="text-zinc-500">Teléfono:</span> {tenant.phone}</p>
                      <p><span className="text-zinc-500">Cuota:</span> <strong className="text-emerald-400">₡{Number(tenant.monthlyFee || 0).toLocaleString("es-CR")}/mes</strong></p>
                      <p className="truncate"><span className="text-zinc-500">Slug:</span> <code className="text-blue-300 font-mono text-[11px]">?tenant={tenant.slug}</code></p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-col gap-2 pt-2 border-t border-zinc-800">
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`/?tenant=${tenant.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center rounded-md border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-blue-500 hover:text-white"
                      >
                        🔗 Ver Web Demo
                      </a>
                      <button
                        type="button"
                        onClick={() => handleToggleTenantStatus(tenant.id)}
                        className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition ${
                          tenant.isActive ? "bg-amber-900/30 text-amber-300 hover:bg-amber-900/50" : "bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/50"
                        }`}
                      >
                        {tenant.isActive ? "⏸ Pausar" : "▶ Activar"}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => copyDemoWhatsAppPitch(tenant)}
                      className={`flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${
                        copiedPitchSlug === tenant.slug
                          ? "bg-emerald-600 text-white"
                          : "bg-blue-600 text-white hover:bg-blue-500 shadow-sm"
                      }`}
                    >
                      {copiedPitchSlug === tenant.slug ? "✓ ¡Mensaje WhatsApp Copiado!" : "📲 Copiar Pitch WhatsApp"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: ALTA DE NUEVO TALLER EN 60 SEGUNDOS */}
        {activeSaasTab === "new" && (
          <form onSubmit={handleCreateTenant} className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
            <div>
              <h3 className="text-base font-bold text-white">Alta Rápida de Nuevo Taller Afiliado</h3>
              <p className="text-xs text-zinc-400">Complete los datos básicos del taller para generarle inmediatamente su página web con su logo, color y seguimiento 24/7.</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              <div>
                <label className="text-xs font-semibold text-zinc-300">Nombre Comercial del Taller *</label>
                <input
                  required
                  placeholder="Ej: Taller Montero"
                  value={newTenantForm.name}
                  onChange={(e) => setNewTenantForm({ ...newTenantForm, name: e.target.value })}
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 p-2 text-sm text-white focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300">Dueño o Administrador</label>
                <input
                  placeholder="Ej: Mario Montero"
                  value={newTenantForm.ownerName}
                  onChange={(e) => setNewTenantForm({ ...newTenantForm, ownerName: e.target.value })}
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 p-2 text-sm text-white focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300">Teléfono / WhatsApp *</label>
                <input
                  required
                  placeholder="Ej: 8888-9999"
                  value={newTenantForm.phone}
                  onChange={(e) => setNewTenantForm({ ...newTenantForm, phone: e.target.value })}
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 p-2 text-sm text-white focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300">Provincia *</label>
                <select
                  value={newTenantForm.province}
                  onChange={(e) => setNewTenantForm({ ...newTenantForm, province: e.target.value })}
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 p-2 text-sm text-white focus:border-blue-500"
                >
                  <option value="Alajuela">Alajuela</option>
                  <option value="Heredia">Heredia</option>
                  <option value="San José">San José</option>
                  <option value="Cartago">Cartago</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300">Cantón / Zona</label>
                <input
                  placeholder="Ej: San Pablo, La Garita, Barva"
                  value={newTenantForm.canton}
                  onChange={(e) => setNewTenantForm({ ...newTenantForm, canton: e.target.value })}
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 p-2 text-sm text-white focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300">Color de Marca (Preset)</label>
                <div className="mt-1 flex items-center gap-2">
                  <select
                    value={newTenantForm.brandColor}
                    onChange={(e) => setNewTenantForm({ ...newTenantForm, brandColor: e.target.value })}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-950 p-2 text-sm text-white focus:border-blue-500"
                  >
                    <option value="#2563eb">Azul Royal (#2563eb)</option>
                    <option value="#d62828">Rojo Fénix (#d62828)</option>
                    <option value="#059669">Verde Esmeralda (#059669)</option>
                    <option value="#ea580c">Naranja Turbo (#ea580c)</option>
                    <option value="#7c3aed">Púrpura Élite (#7c3aed)</option>
                  </select>
                  <div
                    className="h-8 w-8 rounded-md border border-zinc-600 shadow-inner"
                    style={{ backgroundColor: newTenantForm.brandColor }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300">Plan de Suscripción</label>
                <select
                  value={newTenantForm.plan}
                  onChange={(e) => {
                    const plan = e.target.value;
                    const fee = plan === "basico" ? 25000 : plan === "elite" ? 65000 : 45000;
                    setNewTenantForm({ ...newTenantForm, plan, monthlyFee: fee });
                  }}
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 p-2 text-sm text-white focus:border-blue-500"
                >
                  <option value="basico">Plan Básico (₡25,000 / mes)</option>
                  <option value="pro">Plan Pro Estrella (₡45,000 / mes)</option>
                  <option value="elite">Plan Élite (₡65,000 / mes)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300">Cuota Mensual en Colones (₡)</label>
                <input
                  type="number"
                  value={newTenantForm.monthlyFee}
                  onChange={(e) => setNewTenantForm({ ...newTenantForm, monthlyFee: Number(e.target.value) })}
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 p-2 text-sm text-white focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300">Correo Electrónico (Opcional)</label>
                <input
                  type="email"
                  placeholder="taller@gmail.com"
                  value={newTenantForm.email}
                  onChange={(e) => setNewTenantForm({ ...newTenantForm, email: e.target.value })}
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 p-2 text-sm text-white focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveSaasTab("tenants")}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-600 px-6 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/30 hover:bg-emerald-500"
              >
                🚀 Dar de Alta y Activar Taller
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: KIT DE VENTAS Y PITCH */}
        {activeSaasTab === "sales_kit" && (
          <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
            <div>
              <h3 className="text-base font-bold text-white">Guión de Ventas y Propuesta Comercial para Talleres</h3>
              <p className="text-xs text-zinc-400">Metodología paso a paso para visitar o contactar talleres en Alajuela (Barrio San José, El Coyol, La Garita) y Heredia (San Pablo, Barva, Santa Lucía).</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4 space-y-2">
                <span className="rounded bg-blue-900/50 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-300">Paso 1 • El Dolor</span>
                <h4 className="text-sm font-bold text-white">¿Cuánto tiempo pierde contestando llamadas?</h4>
                <p className="text-xs leading-relaxed text-zinc-300">
                  "Don [Dueño], usted está en la cabina o enderezando un golpe y le suena el teléfono 10 veces al día con la misma pregunta: <em>¿Don Mario, cómo va mi carro? ¿Ya lo pintaron?</em> Nuestra plataforma elimina el 80% de esas llamadas porque el cliente ve las fotos con su placa 24/7."
                </p>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4 space-y-2">
                <span className="rounded bg-emerald-900/50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-300">Paso 2 • La Solución</span>
                <h4 className="text-sm font-bold text-white">Demostración en vivo en 60 segundos</h4>
                <p className="text-xs leading-relaxed text-zinc-300">
                  Abra el enlace con el nombre del taller de él en su celular: <em>"Mire, ya le tengo montada su página. Aquí está su nombre, sus colores y su WhatsApp directo. Cuando un cliente le pregunte, usted solo le toma una foto al carro y queda en vivo al instante."</em>
                </p>
              </div>

              <div className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-4 space-y-2">
                <span className="rounded bg-amber-900/50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300">Paso 3 • El Cierre</span>
                <h4 className="text-sm font-bold text-white">Menos de medio bumper al mes</h4>
                <p className="text-xs leading-relaxed text-zinc-300">
                  "El servicio vale solo ₡45,000 al mes. Por menos de lo que le cobra a un solo carro por pintar una pieza, usted le da imagen de agencia a su taller y atrae clientes de Google y redes sociales sin saber de informática."
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3">Estructura de Precios SaaS Costa Rica (En Colones ₡)</h4>
              <div className="grid gap-3 sm:grid-cols-3 text-xs">
                <div className="rounded-lg border border-zinc-800 p-3 bg-zinc-900/50">
                  <p className="font-bold text-white">Plan Básico • ₡25,000 / mes</p>
                  <ul className="mt-2 space-y-1 text-zinc-300">
                    <li>✓ Sitio web moderno responsivo</li>
                    <li>✓ Cotizador express por piezas</li>
                    <li>✓ Agendamiento de citas</li>
                    <li>✓ Enlaces directos a WhatsApp</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-blue-500/50 p-3 bg-blue-950/20 relative">
                  <span className="absolute -top-2 right-2 rounded bg-blue-600 px-2 py-0.5 text-[9px] font-black text-white uppercase">Más Vendido</span>
                  <p className="font-bold text-white">Plan Pro Estrella • ₡45,000 / mes</p>
                  <ul className="mt-2 space-y-1 text-zinc-300">
                    <li>✓ Todo lo del Plan Básico</li>
                    <li>✓ <strong>Seguimiento 24/7 por placa con fotos</strong></li>
                    <li>✓ <strong>Social Content Studio (Antes/Después)</strong></li>
                    <li>✓ Alertas automáticas de retiro</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-purple-500/50 p-3 bg-purple-950/20">
                  <p className="font-bold text-white">Plan Taller Élite • ₡65,000 / mes</p>
                  <ul className="mt-2 space-y-1 text-zinc-300">
                    <li>✓ Todo lo del Plan Pro</li>
                    <li>✓ <strong>Dominio propio .cr o .com</strong></li>
                    <li>✓ Soporte técnico VIP prioritario</li>
                    <li>✓ Personalización total de marca</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ===================== ASISTENTE GEMINI: COTIZADOR & AUTO-RESPUESTAS ===================== */}
      <section id="asistente-gemini" className="section-card scroll-mt-24 space-y-6 border-purple-500/40 bg-gradient-to-br from-zinc-950 via-purple-950/20 to-zinc-950">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                IA Automotriz • Gemini Pro Assistant
              </span>
            </div>
            <h2 className="mt-1 text-2xl font-bold text-white md:text-3xl">
              Asistente Gemini: Cotizador Inteligente & Respuestas para WhatsApp
            </h2>
            <p className="mt-1 text-xs text-zinc-300">
              Estime montos según piezas y daño en colones (₡) y genere respuestas técnicas y comerciales automáticas listas para enviar al cliente por WhatsApp.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveGeminiTab("cotizador")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                activeGeminiTab === "cotizador"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white"
              }`}
            >
              ⚡ Cotizador Exprés
            </button>
            <button
              type="button"
              onClick={() => setActiveGeminiTab("respuestas")}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
                activeGeminiTab === "respuestas"
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                  : "border border-zinc-700 bg-zinc-900 text-zinc-300 hover:text-white"
              }`}
            >
              💬 Respuestas Rápidas Frecuentes
            </button>
          </div>
        </div>

        {activeGeminiTab === "cotizador" && (
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Formulario de Cotización */}
            <div className="space-y-4 lg:col-span-7 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-zinc-300">Nombre del Cliente</label>
                  <input
                    type="text"
                    value={quoteAssistant.customerName}
                    onChange={(e) => setQuoteAssistant({ ...quoteAssistant, customerName: e.target.value })}
                    placeholder="Ej: Mario Jiménez"
                    className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 p-2.5 text-sm text-white focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-300">Vehículo (Marca, Modelo, Año)</label>
                  <input
                    type="text"
                    value={quoteAssistant.vehicle}
                    onChange={(e) => setQuoteAssistant({ ...quoteAssistant, vehicle: e.target.value })}
                    placeholder="Ej: Toyota Corolla 2018"
                    className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 p-2.5 text-sm text-white focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-bold text-zinc-300">Nivel de Daño / Golpe</label>
                  <select
                    value={quoteAssistant.damageLevel}
                    onChange={(e) => setQuoteAssistant({ ...quoteAssistant, damageLevel: e.target.value })}
                    className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 p-2.5 text-sm text-white"
                  >
                    <option value="leve">Leve (Rayón / Pintura superficial)</option>
                    <option value="medio">Medio (Abolladura con desabollado de chapa)</option>
                    <option value="fuerte">Fuerte (Enderezado estructural / chasis)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-300">Tipo de Pintura y Acabado</label>
                  <select
                    value={quoteAssistant.paintType}
                    onChange={(e) => setQuoteAssistant({ ...quoteAssistant, paintType: e.target.value })}
                    className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 p-2.5 text-sm text-white"
                  >
                    <option value="monocapa">Monocapa (Color sólido)</option>
                    <option value="bicapa">Bicapa (Metalizado / Perlado con barniz UHS)</option>
                    <option value="tricapa">Tricapa Especial (Alta gama / perla profunda)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300">
                  Seleccionar Piezas Afectadas ({quoteAssistant.selectedParts.length} elegidas)
                </label>
                <div className="mt-2 flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 rounded-lg border border-zinc-800 bg-zinc-950">
                  {QUOTE_PARTS.map((part) => {
                    const isSelected = quoteAssistant.selectedParts.includes(part);
                    return (
                      <button
                        key={part}
                        type="button"
                        onClick={() => toggleQuotePart(part)}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                          isSelected
                            ? "bg-purple-600 text-white shadow-sm font-bold"
                            : "border border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {part}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-300">Notas adicionales (opcional)</label>
                <input
                  type="text"
                  value={quoteAssistant.customNotes}
                  onChange={(e) => setQuoteAssistant({ ...quoteAssistant, customNotes: e.target.value })}
                  placeholder="Ej: Requiere cambiar grapas de fijación y ajuste de luces"
                  className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-950 p-2 text-xs text-white"
                />
              </div>

              <button
                type="button"
                onClick={handleCalculateQuote}
                disabled={quoteAssistant.loading || quoteAssistant.selectedParts.length === 0}
                className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3 text-sm font-bold text-white shadow-lg shadow-purple-600/30 transition hover:opacity-90 disabled:opacity-50"
              >
                {quoteAssistant.loading ? "Calculando con Gemini..." : "✨ Calcular Estimado y Generar Mensaje de WhatsApp"}
              </button>
            </div>

            {/* Resultado Generado para WhatsApp */}
            <div className="space-y-4 lg:col-span-5 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                    Respuesta Lista para WhatsApp
                  </span>
                  {quoteAssistant.calculated ? (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                      Calculado
                    </span>
                  ) : (
                    <span className="text-[11px] text-zinc-500">Pendiente de cálculo</span>
                  )}
                </div>

                {quoteAssistant.calculated ? (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-lg border border-purple-500/40 bg-purple-950/30 p-2.5">
                      <p className="text-[11px] text-zinc-400">Inversión Estimada</p>
                      <p className="text-sm font-black text-white">
                        ₡{quoteAssistant.minEstimate.toLocaleString("es-CR")} - ₡{quoteAssistant.maxEstimate.toLocaleString("es-CR")}
                      </p>
                    </div>
                    <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-2.5">
                      <p className="text-[11px] text-zinc-400">Tiempo de Entrega</p>
                      <p className="text-xs font-bold text-emerald-400">{quoteAssistant.deliveryDays}</p>
                    </div>
                  </div>
                ) : null}

                <div className="mt-3">
                  <textarea
                    rows={10}
                    value={quoteAssistant.generatedMessage || "Seleccione piezas y haga clic en 'Calcular' para redactar la respuesta automática de cotización con Don Randy..."}
                    onChange={(e) => setQuoteAssistant({ ...quoteAssistant, generatedMessage: e.target.value })}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 font-mono text-xs leading-relaxed text-zinc-200 focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPdfProposalModal(true)}
                  disabled={!quoteAssistant.calculated}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-purple-500/60 bg-gradient-to-r from-purple-950 via-indigo-950 to-purple-950 py-2.5 text-xs font-bold text-purple-200 shadow-md shadow-purple-900/30 transition hover:border-purple-400 hover:text-white disabled:opacity-40"
                >
                  <span>🖨️ Ver y Descargar Propuesta Formal en PDF</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={copyQuoteMessage}
                    className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 text-xs font-bold text-zinc-200 transition hover:bg-zinc-700"
                  >
                    {quoteAssistant.copySuccess ? "✓ ¡Copiado!" : "📋 Copiar Propuesta"}
                  </button>
                  {(() => {
                    const cleanPhone = String(quoteAssistant.customerPhone || "").replace(/\D/g, "");
                    const waNum = cleanPhone.length === 8 ? `506${cleanPhone}` : cleanPhone;
                    const waLink = waNum
                      ? `https://wa.me/${waNum}?text=${encodeURIComponent(quoteAssistant.generatedMessage)}`
                      : `https://wa.me/?text=${encodeURIComponent(quoteAssistant.generatedMessage)}`;
                    return (
                      <a
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-500"
                      >
                        <span>💬 {waNum ? `Enviar a WhatsApp (${waNum})` : "Abrir WhatsApp"}</span>
                      </a>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Respuestas Frecuentes */}
        {activeGeminiTab === "respuestas" && (
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                title: "📍 Ubicación Exacta & Rutas (Waze / Maps)",
                text: "¡Hola! Estamos ubicados en Barrio San José de Alajuela, 300 metros oeste de la iglesia católica. Puede abrir la ruta directa en Waze aquí: https://waze.com/ul?ll=10.0188372,-84.2361356 o en Google Maps: https://maps.app.goo.gl/tallerdayana. ¡Le esperamos con gusto!"
              },
              {
                title: "🕒 Horario de Atención y Valoración",
                text: "¡Hola! Con gusto le atendemos de Lunes a Viernes de 8:00 AM a 6:00 PM y Sábados de 8:00 AM a 1:00 PM. Don Randy Barrantes realiza valoraciones de golpes sin cita previa directamente en el taller."
              },
              {
                title: "🛡️ Trámite con Aseguradoras (INS, Qualitas, etc.)",
                text: "¡Hola! Sí, en Taller Dayana reparamos con todas las aseguradoras del país: INS, Qualitas, Oceánica, ASSA, Lafise y Mapfre. Si ya tiene el reclamo abierto o requiere inspección, Don Randy le asesora paso a paso para que su carro quede como nuevo de fábrica."
              },
              {
                title: "🔍 Seguimiento en Línea 24/7 por Placa",
                text: "¡Hola! Para su tranquilidad y comodidad, puede ver las fotos de avance de la reparación de su carro las 24 horas del día. Solo ingrese su placa en nuestra plataforma web: https://tallerdayana.vercel.app/seguimiento"
              }
            ].map((faq, i) => (
              <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white">{faq.title}</h4>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-300 font-mono bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                    {faq.text}
                  </p>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== "undefined") navigator.clipboard.writeText(faq.text);
                      alert("Respuesta copiada al portapapeles");
                    }}
                    className="flex-1 rounded-md border border-zinc-700 bg-zinc-800 py-1.5 text-xs font-semibold text-zinc-200 hover:bg-zinc-700"
                  >
                    📋 Copiar
                  </button>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(faq.text)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center rounded-md bg-emerald-600/90 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                  >
                    💬 Enviar a WhatsApp
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ===================== DIRECTORIO DE GRÚAS ALIADAS ===================== */}
      <section id="directorio-gruas" className="section-card scroll-mt-24 space-y-6 border-amber-500/40 bg-gradient-to-br from-zinc-950 via-amber-950/15 to-zinc-950">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border-b border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Red de Asistencia Vial • Alajuela, Heredia y GAM
              </span>
            </div>
            <h2 className="mt-1 text-2xl font-bold text-white md:text-3xl">
              Directorio de Grúas Aliadas & Asistencia en Carretera
            </h2>
            <p className="mt-1 text-xs text-zinc-300">
              Operadores de grúa de confianza para traer carros accidentados o varados directamente a Taller Dayana sin que el cliente se quede botado.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddTowModal(!showAddTowModal)}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-amber-600/30 hover:bg-amber-500"
          >
            {showAddTowModal ? "✕ Cerrar Formulario" : "➕ Registrar Nuevo Gruero"}
          </button>
        </div>

        {showAddTowModal && (
          <form onSubmit={handleCreateTowTruck} className="rounded-xl border border-amber-500/30 bg-zinc-900/80 p-4 space-y-3">
            <h3 className="text-sm font-bold text-white">Registrar Operador de Grúa Amigo</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <input
                type="text"
                placeholder="Nombre del servicio (ej: Grúas El Coyol)"
                value={newTowTruck.name}
                onChange={(e) => setNewTowTruck({ ...newTowTruck, name: e.target.value })}
                className="rounded-md border border-zinc-700 bg-zinc-950 p-2 text-xs text-white"
                required
              />
              <input
                type="text"
                placeholder="Nombre del chofer (ej: Don Esteban)"
                value={newTowTruck.driverName}
                onChange={(e) => setNewTowTruck({ ...newTowTruck, driverName: e.target.value })}
                className="rounded-md border border-zinc-700 bg-zinc-950 p-2 text-xs text-white"
              />
              <input
                type="text"
                placeholder="Teléfono (ej: 8822-1144)"
                value={newTowTruck.phone}
                onChange={(e) => setNewTowTruck({ ...newTowTruck, phone: e.target.value })}
                className="rounded-md border border-zinc-700 bg-zinc-950 p-2 text-xs text-white"
                required
              />
              <input
                type="text"
                placeholder="Zonas (separadas por comas)"
                value={newTowTruck.zones}
                onChange={(e) => setNewTowTruck({ ...newTowTruck, zones: e.target.value })}
                className="rounded-md border border-zinc-700 bg-zinc-950 p-2 text-xs text-white"
              />
              <input
                type="text"
                placeholder="Tarifa aprox (ej: ₡25,000 - ₡35,000)"
                value={newTowTruck.priceRange}
                onChange={(e) => setNewTowTruck({ ...newTowTruck, priceRange: e.target.value })}
                className="rounded-md border border-zinc-700 bg-zinc-950 p-2 text-xs text-white"
              />
              <select
                value={newTowTruck.type}
                onChange={(e) => setNewTowTruck({ ...newTowTruck, type: e.target.value })}
                className="rounded-md border border-zinc-700 bg-zinc-950 p-2 text-xs text-white"
              >
                <option value="Plataforma Hidráulica">Plataforma Hidráulica</option>
                <option value="Grúa de Gancho">Grúa de Gancho</option>
                <option value="Plataforma Doble Tracción 4x4">Plataforma Doble Tracción 4x4</option>
                <option value="Grúa Pesada">Grúa Pesada</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddTowModal(false)}
                className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="rounded-md bg-amber-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-amber-500"
              >
                Guardar Grúa
              </button>
            </div>
          </form>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {towTrucks.map((tow) => {
            const dispatchMsg = `Hola ${tow.driverName ? tow.driverName : tow.name}, le saluda Don Randy de Taller Dayana en Barrio San José de Alajuela. Ocupamos coordinar el traslado de un vehículo accidentado hacia nuestro taller. ¿Tiene unidad disponible en este momento?`;
            const shareToClientMsg = `¡Hola! Si ocupa servicio de grúa de confianza para traer su carro a Taller Dayana, le recomendamos a ${tow.name} (${tow.type}). Teléfono directo: ${tow.phone}. Solo indíqueles que va hacia Taller Dayana en Barrio San José de Alajuela.`;

            return (
              <div key={tow.id} className="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 flex flex-col justify-between hover:border-amber-500/50 transition">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-white">{tow.name}</h4>
                      {tow.driverName ? <p className="text-xs text-amber-400">Chofer: {tow.driverName}</p> : null}
                    </div>
                    <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/20">
                      ★ {tow.rating || 5.0}
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-zinc-300 font-medium">🚜 {tow.type}</p>
                  <p className="text-xs text-zinc-400">Tarifa aprox: {tow.priceRange}</p>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {(Array.isArray(tow.zones) ? tow.zones : [tow.zones]).map((z, idx) => (
                      <span key={idx} className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-300">
                        {z}
                      </span>
                    ))}
                  </div>

                  {tow.notes ? <p className="mt-2 text-[11px] text-zinc-400 italic">{tow.notes}</p> : null}
                </div>

                <div className="mt-4 space-y-2 border-t border-zinc-800 pt-3">
                  <div className="flex gap-2">
                    <a
                      href={`tel:${tow.phone}`}
                      className="flex-1 inline-flex items-center justify-center gap-1 rounded-md border border-zinc-700 bg-zinc-800 py-1.5 text-xs font-bold text-white hover:bg-zinc-700"
                    >
                      📞 {tow.phone}
                    </a>
                    <a
                      href={`https://wa.me/${tow.whatsapp}?text=${encodeURIComponent(dispatchMsg)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1 rounded-md bg-emerald-600 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
                      title="Pedir grúa para traer vehículo a Taller Dayana"
                    >
                      🟢 Pedir Grúa
                    </a>
                  </div>

                  {tow.email ? (
                    <a
                      href={`mailto:${tow.email}?subject=Coordinar%20Gr%C3%BAa%20hacia%20Taller%20Dayana&body=${encodeURIComponent(dispatchMsg)}`}
                      className="w-full inline-flex items-center justify-center gap-1 rounded-md border border-zinc-700 bg-zinc-950 py-1 text-[11px] text-zinc-300 hover:text-white hover:border-zinc-500"
                    >
                      ✉️ {tow.email}
                    </a>
                  ) : null}

                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(shareToClientMsg)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1 rounded-md border border-amber-500/40 bg-amber-950/30 py-1.5 text-[11px] font-bold text-amber-300 hover:bg-amber-900/50"
                    title="Enviar datos de la grúa al cliente por WhatsApp"
                  >
                    📤 Enviar Contacto al Cliente
                  </a>

                  {tow.id > 4 ? (
                    <button
                      type="button"
                      onClick={() => handleDeleteTowTruck(tow.id)}
                      className="w-full text-center text-[10px] text-red-400 hover:underline pt-1"
                    >
                      Eliminar grúa
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section-card space-y-4">
        <h2 className="border-l-4 border-brandRed pl-3 text-xl font-semibold">Registrar vehículo en taller</h2>
        <form className="grid gap-3 md:grid-cols-2" onSubmit={registerWorkshopVehicle}>
          <input
            value={vehicleForm.plate}
            onChange={(e) => setVehicleForm((prev) => ({ ...prev, plate: e.target.value.toUpperCase() }))}
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white placeholder:text-zinc-400"
            placeholder="Placa (ej: 789456 o deje vacío si no tiene)"
          />
          <input
            value={vehicleForm.customerName}
            onChange={(e) => setVehicleForm((prev) => ({ ...prev, customerName: e.target.value }))}
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white placeholder:text-zinc-400"
            placeholder="Nombre del cliente"
            required
          />
          <select
            value={vehicleForm.workType}
            onChange={(e) => setVehicleForm((prev) => ({ ...prev, workType: e.target.value }))}
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white"
            required
          >
            {workTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <input
            type="date"
            ref={entryDateInputRef}
            value={vehicleForm.entryDate}
            onChange={(e) => setVehicleForm((prev) => ({ ...prev, entryDate: e.target.value }))}
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white"
            onFocus={openEntryDatePicker}
            required
          />
          <button
            type="button"
            onClick={openEntryDatePicker}
            className="rounded-md border border-zinc-500 bg-zinc-950 px-4 py-3 text-zinc-100 transition hover:border-white"
          >
            Abrir calendario
          </button>
          <select
            value={vehicleForm.status}
            onChange={(e) => setVehicleForm((prev) => ({ ...prev, status: e.target.value }))}
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white md:col-span-2"
            required
          >
            <option value="received">Recibido</option>
            <option value="in_progress">En proceso</option>
            <option value="ready">Listo para entregar</option>
          </select>
          <button type="submit" className="rounded-md bg-brandRed px-4 py-3 font-semibold text-white transition hover:opacity-90 md:col-span-2">
            Registrar vehículo
          </button>
        </form>
      </section>

      <section id="vehiculos-taller" className="section-card scroll-mt-24 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-l-4 border-brandRed pl-3">
          <div>
            <h2 className="text-xl font-semibold">Vehículos en taller ({workshopVehicles.length})</h2>
            <p className="text-xs text-zinc-400">Carros activos con seguimiento de fotos 24/7 por placa.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
              ☁️ Google Drive Conectado
            </span>
            <button
              type="button"
              onClick={loadWorkshopVehicles}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800"
            >
              🔄 Refrescar lista
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {workshopVehicles.filter(v => String(v.plate || "").trim() !== "514474").map((item) => (
            <article key={item.id} className="rounded-md border border-zinc-700 bg-zinc-950 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-white">
                  #{item.id} - <span className="text-brandRed font-mono font-bold tracking-wider">{item.plate}</span> - {item.customerName}
                </p>
                <a
                  href={`/seguimiento?plate=${item.plate}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 transition hover:border-white hover:text-white"
                >
                  👁️ Ver Seguimiento 24/7 →
                </a>
              </div>
              <p className="text-sm text-zinc-300">Trabajo: {item.workType}</p>
              <p className="text-sm text-zinc-300">Ingreso: {item.entryDate}</p>
              <p className="text-sm text-zinc-300">Estado: {workshopStatusLabels[item.status] || item.status}</p>
              <p className="text-sm text-zinc-300">
                Fotos de avance: {item.photoCount || 0}
                {item.lastPhotoAt ? ` | Última: ${new Date(item.lastPhotoAt).toLocaleString()}` : ""}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {workshopStatusOptions.map((nextStatus) => (
                  <button
                    key={`${item.id}-${nextStatus}`}
                    onClick={() => changeWorkshopStatus(item.id, nextStatus)}
                    className={`rounded-md px-3 py-1 text-sm ${
                      item.status === nextStatus ? "bg-brandRed text-white" : "border border-zinc-500 text-zinc-100"
                    }`}
                  >
                    {workshopStatusLabels[nextStatus]}
                  </button>
                ))}
                <button
                  onClick={() => {
                    setPhotoForm((prev) => ({ ...prev, plate: item.plate }));
                    setActivePhotosPlate(item.plate);
                    loadPhotosByPlate(item.plate);
                  }}
                  className="rounded-md border border-zinc-500 px-3 py-1 text-sm text-zinc-100"
                >
                  Subir foto de avance
                </button>
                <button
                  onClick={() => {
                    if (activePhotosPlate === item.plate) {
                      setActivePhotosPlate("");
                      setProgressPhotos([]);
                      return;
                    }

                    setActivePhotosPlate(item.plate);
                    loadPhotosByPlate(item.plate);
                  }}
                  className="rounded-md border border-zinc-500 px-3 py-1 text-sm text-zinc-100"
                >
                  {activePhotosPlate === item.plate ? "Ocultar fotos" : `Ver fotos (${item.photoCount || 0})`}
                </button>
              </div>

              {activePhotosPlate === item.plate ? (
                <div className="mt-4 rounded-md border border-zinc-700 bg-zinc-900 p-4">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                    <div>
                      <p className="font-semibold text-white">Fotos del vehículo {item.plate} ({progressPhotos.length})</p>
                      <p className="text-xs text-zinc-400">Ordene las fotos desde el estado inicial hasta el terminado usando las flechas.</p>
                    </div>
                    <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[11px] text-zinc-300">
                      Mover ◀ ▶ guarda el orden automáticamente
                    </span>
                  </div>
                  {loadingPhotos ? <p className="text-sm text-zinc-300">Cargando fotos...</p> : null}
                  {!loadingPhotos && progressPhotos.length === 0 ? (
                    <p className="text-sm text-zinc-300">No hay fotos para esta placa.</p>
                  ) : null}
                  {!loadingPhotos && progressPhotos.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {progressPhotos.map((photo, pIdx) => (
                        <article key={photo.id} className="overflow-hidden rounded-md border border-zinc-700 bg-zinc-950 flex flex-col justify-between">
                          <div className="relative">
                            <img
                              src={resolvePhotoUrl(photo.photoUrl)}
                              alt={photo.description}
                              className="h-44 w-full object-cover"
                            />
                            <span className="absolute top-2 left-2 rounded-md bg-black/85 px-2 py-0.5 text-xs font-black text-white border border-zinc-600 shadow">
                              #{pIdx + 1}
                            </span>
                          </div>
                          <div className="p-3 space-y-2">
                            <p className="text-[11px] text-zinc-400">{new Date(photo.createdAt).toLocaleString()}</p>
                            <p className="text-xs text-zinc-200 line-clamp-2">{photo.description}</p>
                            
                            {/* Botones de Reordenamiento */}
                            <div className="grid grid-cols-2 gap-1.5 pt-1">
                              <button
                                type="button"
                                disabled={pIdx === 0}
                                onClick={() => movePhotoOrder(pIdx, pIdx - 1)}
                                className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs font-bold text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30"
                                title="Mover hacia atrás en la secuencia"
                              >
                                ◀ Mover antes
                              </button>
                              <button
                                type="button"
                                disabled={pIdx === progressPhotos.length - 1}
                                onClick={() => movePhotoOrder(pIdx, pIdx + 1)}
                                className="rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs font-bold text-zinc-200 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30"
                                title="Mover hacia adelante en la secuencia"
                              >
                                Mover después ▶
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => deleteProgressPhoto(photo.id)}
                              className="w-full rounded-md border border-red-500/60 py-1 text-xs text-red-300 transition hover:bg-red-950/50"
                            >
                              Eliminar foto
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
          {workshopVehicles.length === 0 ? <p className="text-zinc-300">No hay vehiculos registrados en taller.</p> : null}
        </div>
      </section>

      <section className="section-card space-y-4">
        <h2 className="border-l-4 border-brandRed pl-3 text-xl font-semibold">Subir foto de avance</h2>
        <form className="grid gap-3" onSubmit={uploadProgressPhoto}>
          <select
            value={photoForm.plate}
            onChange={(e) => {
              const selectedPlate = e.target.value;
              setPhotoForm((prev) => ({ ...prev, plate: selectedPlate }));
              if (selectedPlate) {
                setActivePhotosPlate(selectedPlate);
                loadPhotosByPlate(selectedPlate);
              }
            }}
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white"
            required
          >
            <option value="">Seleccionar vehículo por placa</option>
            {workshopVehicles.filter(v => String(v.plate || "").trim() !== "514474").map((item) => (
              <option key={`plate-${item.id}`} value={item.plate}>
                {item.plate} - {item.customerName}
              </option>
            ))}
          </select>

          <input
            type="file"
            accept="image/*"
            multiple
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-zinc-100"
            onChange={(e) => {
              const files = Array.from(e.target.files || []);
              setPhotoForm((prev) => ({ ...prev, files }));
              const firstFile = files[0] || null;
              if (!firstFile) {
                setPhotoPreview(null);
                return;
              }

              const reader = new FileReader();
              reader.onload = () => setPhotoPreview(String(reader.result || ""));
              reader.readAsDataURL(firstFile);
            }}
            required
          />

          <p className="text-sm text-zinc-300">Puedes elegir varias fotos a la vez en un solo paso.</p>
          <p className="text-sm text-zinc-300">Total seleccionado: {photoForm.files.length}</p>

          <textarea
            value={photoForm.description}
            onChange={(e) => setPhotoForm((prev) => ({ ...prev, description: e.target.value }))}
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white placeholder:text-zinc-400"
            rows={3}
            placeholder='Descripción del avance (ej: "Día 1 - Lijado inicial")'
            required
          />

          <p className="text-sm text-zinc-300">Fecha: se registra automáticamente al subir la foto.</p>

          {photoPreview ? (
            <div className="rounded-md border border-zinc-700 bg-zinc-950 p-3">
              <p className="mb-2 text-sm text-zinc-300">Vista previa:</p>
              <img src={photoPreview} alt="Vista previa de avance" className="max-h-64 rounded-md border border-zinc-700" />
            </div>
          ) : null}

          <button type="submit" className="rounded-md bg-brandRed px-4 py-3 font-semibold text-white transition hover:opacity-90">
            Subir foto
          </button>
        </form>

        <div className="space-y-2 rounded-md border border-zinc-700 bg-zinc-950 p-3">
          <p className="font-semibold text-white">Historial de fotos por placa</p>
          {loadingPhotos ? <p className="text-zinc-300">Cargando fotos...</p> : null}
          {!loadingPhotos && progressPhotos.length === 0 ? (
            <p className="text-zinc-300">No hay fotos para la placa seleccionada.</p>
          ) : null}
          {!loadingPhotos
            ? progressPhotos.map((photo) => (
                <article key={photo.id} className="rounded-md border border-zinc-700 p-3">
                  <p className="text-sm text-zinc-300">{new Date(photo.createdAt).toLocaleString()}</p>
                  <p className="mb-2 text-sm text-zinc-200">{photo.description}</p>
                  <img src={resolvePhotoUrl(photo.photoUrl)} alt={photo.description} className="max-h-48 rounded-md border border-zinc-700" />
                  <button
                    type="button"
                    onClick={() => deleteProgressPhoto(photo.id)}
                    className="mt-3 rounded-md border border-red-500 px-3 py-1 text-sm text-red-200 transition hover:bg-red-950/50"
                  >
                    Eliminar foto
                  </button>
                </article>
              ))
            : null}
        </div>
      </section>

      <section className="section-card">
        <h2 className="border-l-4 border-brandRed pl-3 text-xl font-semibold">Filtro general de registros (pruebas)</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <select
            value={recordsFilter.type}
            onChange={(e) => setRecordsFilter((prev) => ({ ...prev, type: e.target.value }))}
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white"
          >
            <option value="all">Todos</option>
            <option value="workshop">Vehiculos en taller</option>
            <option value="appointment">Citas</option>
            <option value="quote">Presupuestos</option>
          </select>
          <input
            value={recordsFilter.plate}
            onChange={(e) => setRecordsFilter((prev) => ({ ...prev, plate: e.target.value.toUpperCase() }))}
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white placeholder:text-zinc-400"
            placeholder="Filtrar por placa"
          />
          <input
            value={recordsFilter.customer}
            onChange={(e) => setRecordsFilter((prev) => ({ ...prev, customer: e.target.value }))}
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white placeholder:text-zinc-400"
            placeholder="Filtrar por cliente"
          />
          <input
            value={recordsFilter.search}
            onChange={(e) => setRecordsFilter((prev) => ({ ...prev, search: e.target.value }))}
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white placeholder:text-zinc-400"
            placeholder="Buscar en resumen o estado"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={() => setRecordsFilter({ type: "all", plate: "", customer: "", search: "" })}
            className="rounded-md border border-zinc-500 px-3 py-1 text-sm text-zinc-100 transition hover:border-white"
          >
            Limpiar filtros
          </button>
          <p className="self-center text-sm text-zinc-300">
            Mostrando {filteredUnifiedRecords.length} de {unifiedRecords.length} registros
          </p>
        </div>
        <div className="mt-3 space-y-2">
          {filteredUnifiedRecords.map((item) => (
            <article key={item.recordKey} className="rounded-md border border-zinc-700 bg-zinc-950 p-3">
              <p>
                [{labelByRecordType[item.type]}] #{item.id} - {item.customerName} - {item.summary} - {displayPlate(item.plate)}
              </p>
              <p className="text-sm text-zinc-300">Estado: {item.status}</p>
              <p className="text-sm text-zinc-300">Fecha: {item.date ? new Date(item.date).toLocaleString() : "Sin fecha"}</p>
              <p className="text-sm text-zinc-300">Detalle: {item.details || "Sin detalle"}</p>
              <button
                type="button"
                onClick={() => deleteUnifiedRecord(item)}
                disabled={deletingRecordKey === item.recordKey}
                className="mt-2 rounded-md border border-red-500 px-3 py-1 text-sm text-red-200 transition hover:bg-red-950/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deletingRecordKey === item.recordKey ? "Eliminando..." : "Eliminar registro"}
              </button>
            </article>
          ))}
          {unifiedRecords.length === 0 ? <p className="text-zinc-300">No hay registros para mostrar.</p> : null}
          {unifiedRecords.length > 0 && filteredUnifiedRecords.length === 0 ? (
            <p className="text-zinc-300">No hay resultados con esos filtros.</p>
          ) : null}
        </div>
      </section>

      <section className="section-card">
        <h2 className="border-l-4 border-brandRed pl-3 text-xl font-semibold">Citas</h2>
        <div className="mt-3 space-y-2">
          {appointments.map((item) => (
            <article key={item.id} className="rounded-md border border-zinc-700 bg-zinc-950 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold text-white">
                  #{item.id} - {item.customerName} - {item.vehicle}
                </p>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  item.contactChannel === "email"
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                }`}>
                  {item.contactChannel === "email" ? "✉️ Correo" : "🟢 WhatsApp"}
                </span>
              </div>
              <p className="text-sm text-zinc-300">Fecha y hora: {item.appointmentDate || "No especificada"}</p>
              <p className="text-sm text-zinc-300">Teléfono: {item.phone}</p>
              {item.email ? <p className="text-sm text-blue-400">Correo: {item.email}</p> : null}
              <p className="text-sm text-zinc-300">Estado: {item.status}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button onClick={() => markReady(item.id)} className="rounded-md bg-brandRed px-3 py-1 text-sm text-white font-medium">
                  Marcar listo
                </button>
              </div>
            </article>
          ))}
          {appointments.length === 0 ? <p className="text-zinc-300">No hay citas registradas.</p> : null}
        </div>
      </section>

      <section id="solicitudes-presupuestos" className="section-card scroll-mt-24">
        <h2 className="border-l-4 border-brandRed pl-3 text-xl font-semibold">Presupuestos</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <input
            type="month"
            value={quoteFilters.month}
            onChange={(e) => setQuoteFilters((prev) => ({ ...prev, month: e.target.value }))}
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white"
            title="Filtrar por mes"
          />
          <input
            value={quoteFilters.plate}
            onChange={(e) => setQuoteFilters((prev) => ({ ...prev, plate: e.target.value.toUpperCase() }))}
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white placeholder:text-zinc-400"
            placeholder="Filtrar por placa"
          />
          <select
            value={quoteFilters.status}
            onChange={(e) => setQuoteFilters((prev) => ({ ...prev, status: e.target.value }))}
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white"
          >
            <option value="">Todos los estados</option>
            <option value="received">Recibido</option>
            <option value="reviewing">En revision</option>
            <option value="quoted">Cotizado</option>
            <option value="approved">Aprobado</option>
          </select>
          <input
            value={quoteFilters.search}
            onChange={(e) => setQuoteFilters((prev) => ({ ...prev, search: e.target.value }))}
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white placeholder:text-zinc-400"
            placeholder="Buscar cliente, carro, detalle..."
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={() => setQuoteFilters({ month: "", plate: "", status: "", search: "" })}
            className="rounded-md border border-zinc-500 px-3 py-1 text-sm text-zinc-100 transition hover:border-white"
          >
            Limpiar filtros
          </button>
          <p className="self-center text-sm text-zinc-300">
            Mostrando {filteredQuotes.length} de {quotes.length} presupuestos
          </p>
        </div>
        <div className="mt-3 space-y-2">
          {filteredQuotes.map((item) => {
            const cleanDigits = String(item.phone || "").replace(/\D/g, "");
            const waNumber = cleanDigits.length === 8 ? `506${cleanDigits}` : cleanDigits;
            const partsList = Array.isArray(item.selectedParts) && item.selectedParts.length > 0
              ? item.selectedParts.join(", ")
              : "Por evaluar";
            const waQuoteTemplate = encodeURIComponent(
              `Hola ${item.customerName}, le saluda Randy de Taller Dayana 🚗🔧.\n\n` +
              `Con respecto a su solicitud de presupuesto para su ${item.vehicle}:\n` +
              `• Piezas indicadas: ${partsList}\n` +
              `• Detalle: ${item.damageDescription}\n\n` +
              `📋 ESTIMACIÓN DE PRESUPUESTO:\n` +
              `- Mano de obra y enderezado: ₡_____\n` +
              `- Preparación y pintura automotriz: ₡_____\n` +
              `💰 TOTAL ESTIMADO: ₡_____ (IVA incluido)\n` +
              `⏱️ Tiempo estimado: ___ días hábiles.\n` +
              `🛡️ Garantía por escrito en tono y acabado.\n\n` +
              `¿Gusta que coordinemos un espacio para inspeccionar el vehículo en el taller?`
            );
            const emailQuoteTemplate = encodeURIComponent(
              `Estimado(a) ${item.customerName},\n\n` +
              `Le saluda Randy de Taller Dayana. En atención a su solicitud de presupuesto para su vehículo ${item.vehicle}:\n\n` +
              `• Piezas a reparar/pintar: ${partsList}\n` +
              `• Daño reportado: ${item.damageDescription}\n\n` +
              `ESTIMACIÓN DE PRESUPUESTO:\n` +
              `- Mano de obra y enderezado: ₡_____\n` +
              `- Pintura automotriz y materiales: ₡_____\n` +
              `TOTAL ESTIMADO: ₡_____\n` +
              `Tiempo estimado de entrega: ___ días hábiles.\n\n` +
              `Contamos con garantía de calidad y color por escrito. Quedamos a su orden para coordinar la revisión presencial cuando guste.\n\n` +
              `Atentamente,\nRandy - Taller Dayana\nAlajuela, Costa Rica`
            );

            return (
              <article key={item.id} className="rounded-md border border-zinc-700 bg-zinc-950 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
                  <p className="font-bold text-white text-base">
                    #{item.id} - {item.customerName} • {item.vehicle}
                  </p>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    item.contactChannel === "email"
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  }`}>
                    {item.contactChannel === "email" ? "✉️ Responder por Correo" : "🟢 Responder por WhatsApp"}
                  </span>
                </div>

                <div className="mt-2.5 grid gap-1.5 text-xs sm:grid-cols-2">
                  <p className="text-zinc-300"><strong>Teléfono:</strong> {item.phone || "No indicado"}</p>
                  {item.email ? <p className="text-blue-400"><strong>Correo:</strong> {item.email}</p> : null}
                  <p className="text-zinc-300"><strong>Fecha:</strong> {item.createdAt ? new Date(item.createdAt).toLocaleString("es-CR") : "Sin fecha"}</p>
                  <p className="text-zinc-300"><strong>Estado:</strong> {item.status}</p>
                </div>

                {Array.isArray(item.selectedParts) && item.selectedParts.length > 0 ? (
                  <div className="mt-2 rounded bg-zinc-900/90 p-2">
                    <p className="text-xs font-semibold text-brandRed">🧩 Piezas seleccionadas en la plantilla:</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {item.selectedParts.map((p) => (
                        <span key={p} className="rounded bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-200">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                <p className="mt-2 text-xs text-zinc-300">
                  <strong>Detalle del daño:</strong> {item.damageDescription}
                </p>

                {Array.isArray(item.photos) && item.photos.length > 0 ? (
                  <div className="mt-3">
                    <p className="text-xs text-zinc-400 mb-1">Fotos adjuntas ({item.photos.length}):</p>
                    <div className="grid gap-2 grid-cols-3 sm:grid-cols-5">
                      {item.photos.map((photo, idx) => (
                        <a
                          key={`${item.id}-photo-${idx}`}
                          href={photo.dataUrl}
                          download={photo.name || `presupuesto-${idx + 1}.jpg`}
                          className="block overflow-hidden rounded border border-zinc-700 bg-zinc-900 p-1"
                          title="Clic para ver/descargar foto"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <img
                            src={photo.dataUrl}
                            alt={photo.name || `Foto ${idx + 1}`}
                            className="h-20 w-full rounded object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}

                {/* Fast Response Action Buttons for Don Randy */}
                <div className="mt-3.5 flex flex-wrap gap-2 border-t border-zinc-800 pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setQuoteAssistant((prev) => ({
                        ...prev,
                        customerName: item.customerName || "Cliente",
                        customerPhone: item.phone || "",
                        vehicle: item.vehicle || "Vehículo",
                        selectedParts: Array.isArray(item.selectedParts) && item.selectedParts.length > 0 ? item.selectedParts : ["Bumper delantero"],
                        customNotes: item.damageDescription || "",
                        calculated: false
                      }));
                      const el = document.getElementById("asistente-gemini");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:opacity-95 shadow-md shadow-purple-900/40"
                  >
                    ⚡ Cotizar con Asistente Gemini & Generar PDF
                  </button>
                  {waNumber ? (
                    <a
                      href={`https://wa.me/${waNumber}?text=${waQuoteTemplate}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-green-500 shadow-sm"
                    >
                      📲 Responder por WhatsApp (Plantilla)
                    </a>
                  ) : null}
                  {item.email ? (
                    <a
                      href={`mailto:${item.email}?subject=${encodeURIComponent(`Presupuesto Estimado - Taller Dayana (${item.vehicle})`)}&body=${emailQuoteTemplate}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-blue-500 shadow-sm"
                    >
                      ✉️ Responder por Correo (Plantilla)
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })}
          {quotes.length === 0 ? <p className="text-zinc-300">No hay presupuestos registrados.</p> : null}
          {quotes.length > 0 && filteredQuotes.length === 0 ? (
            <p className="text-zinc-300">No hay resultados con esos filtros.</p>
          ) : null}
        </div>
      </section>

      {/* Social Media Content Generator & Metricool Studio */}
      <section className="section-card space-y-5 border-emerald-500/40 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-zinc-800 pb-4">
          <div>
            <span className="inline-block rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/30">
              🚀 Generador de Contenido & Metricool (Social Studio)
            </span>
            <h2 className="mt-1 text-2xl font-bold text-white">Generar Publicación y Video "Antes y Después"</h2>
            <p className="text-xs text-zinc-300">
              Cree copys profesionales, ensamble imágenes comparativas en HD y guiones de video listos para programar en Metricool hacia Facebook, Instagram y TikTok.
            </p>
          </div>
          <a
            href="https://app.metricool.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition hover:opacity-90"
          >
            📅 Abrir Metricool (Programador) ↗
          </a>
        </div>

        {/* Presets Bar */}
        <div>
          <label className="block text-xs font-bold text-zinc-300 mb-2">Seleccionar Caso Rápido o Personalizar:</label>
          <div className="flex flex-wrap gap-2">
            {SOCIAL_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() =>
                  setSocialStudio((prev) => ({
                    ...prev,
                    vehicle: preset.vehicle,
                    workType: preset.workType,
                    beforeImage: preset.beforeImage,
                    afterImage: preset.afterImage,
                    notes: preset.notes
                  }))
                }
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:border-emerald-500 hover:text-white"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Inputs */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-300">Vehículo</label>
            <input
              value={socialStudio.vehicle}
              onChange={(e) => setSocialStudio((prev) => ({ ...prev, vehicle: e.target.value }))}
              className="rounded-md border border-zinc-700 bg-zinc-950 p-2.5 text-xs text-white w-full"
              placeholder="Ej. Toyota Corolla 2019"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-300">Trabajo realizado</label>
            <input
              value={socialStudio.workType}
              onChange={(e) => setSocialStudio((prev) => ({ ...prev, workType: e.target.value }))}
              className="rounded-md border border-zinc-700 bg-zinc-950 p-2.5 text-xs text-white w-full"
              placeholder="Ej. Enderezado de chasis y pintura bicapa"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-300">Ruta / URL Foto Antes</label>
            <input
              value={socialStudio.beforeImage}
              onChange={(e) => setSocialStudio((prev) => ({ ...prev, beforeImage: e.target.value }))}
              className="rounded-md border border-zinc-700 bg-zinc-950 p-2.5 text-xs text-white w-full"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-zinc-300">Ruta / URL Foto Después</label>
            <input
              value={socialStudio.afterImage}
              onChange={(e) => setSocialStudio((prev) => ({ ...prev, afterImage: e.target.value }))}
              className="rounded-md border border-zinc-700 bg-zinc-950 p-2.5 text-xs text-white w-full"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-zinc-300">Detalles de calidad / Notas</label>
            <input
              value={socialStudio.notes}
              onChange={(e) => setSocialStudio((prev) => ({ ...prev, notes: e.target.value }))}
              className="rounded-md border border-zinc-700 bg-zinc-950 p-2.5 text-xs text-white w-full"
              placeholder="Ej. Alineación milimétrica y garantía de color por escrito."
            />
          </div>
        </div>

        {/* Visual Preview & Canvas Generator */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-3">
            <p className="text-xs font-bold text-white">Previsualización de Imagen "Antes y Después":</p>
            <button
              type="button"
              onClick={generateAndDownloadComposite}
              disabled={socialStudio.generatingImage}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {socialStudio.generatingImage ? "Generando..." : "🖼️ Descargar Imagen Combinada en HD"}
            </button>
          </div>

          <div className="relative overflow-hidden rounded-lg border border-zinc-700 grid grid-cols-2 gap-1 bg-black p-1 max-h-72">
            <div className="relative overflow-hidden rounded">
              <img src={socialStudio.beforeImage} alt="Antes" className="h-48 w-full object-cover" />
              <span className="absolute top-2 left-2 rounded bg-red-600/90 px-2.5 py-0.5 text-[10px] font-black text-white">
                ANTES
              </span>
            </div>
            <div className="relative overflow-hidden rounded">
              <img src={socialStudio.afterImage} alt="Después" className="h-48 w-full object-cover" />
              <span className="absolute top-2 left-2 rounded bg-green-600/90 px-2.5 py-0.5 text-[10px] font-black text-white">
                DESPUÉS
              </span>
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Social Copy Generator */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSocialStudio((prev) => ({ ...prev, platform: "facebook_instagram" }))}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  socialStudio.platform === "facebook_instagram"
                    ? "bg-blue-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                Facebook & Instagram
              </button>
              <button
                type="button"
                onClick={() => setSocialStudio((prev) => ({ ...prev, platform: "tiktok" }))}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                  socialStudio.platform === "tiktok"
                    ? "bg-cyan-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                TikTok & Reels
              </button>
            </div>

            <button
              type="button"
              onClick={copySocialText}
              className="rounded-lg bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-semibold text-emerald-400 transition"
            >
              {socialStudio.copySuccess ? "✓ ¡Copiado al portapapeles!" : "📋 Copiar Texto"}
            </button>
          </div>

          <pre className="whitespace-pre-wrap rounded-lg bg-zinc-900/90 p-3 text-xs leading-relaxed text-zinc-200 font-sans border border-zinc-800">
            {generatedSocialCopy}
          </pre>
        </div>

        {/* 15-Second Video Reel Script Template */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
            🎬 Plantilla de Guión de Video (15 Segundos para CapCut / TikTok / Reels)
          </p>
          <div className="grid gap-2 text-xs sm:grid-cols-4">
            <div className="rounded bg-zinc-900 p-2.5 border border-zinc-800">
              <span className="font-bold text-brandRed">0-3 seg (Hook)</span>
              <p className="mt-1 text-zinc-300">Mostrar foto/clip del golpe severo.</p>
              <p className="text-[11px] text-zinc-400 italic mt-1">Texto en pantalla: "¿Creían que no tenía arreglo? 😱"</p>
            </div>
            <div className="rounded bg-zinc-900 p-2.5 border border-zinc-800">
              <span className="font-bold text-amber-400">3-7 seg (Proceso)</span>
              <p className="mt-1 text-zinc-300">Banco de enderezado y lija.</p>
              <p className="text-[11px] text-zinc-400 italic mt-1">Texto en pantalla: "Alineación de chasis milimétrica 🔧"</p>
            </div>
            <div className="rounded bg-zinc-900 p-2.5 border border-zinc-800">
              <span className="font-bold text-emerald-400">7-12 seg (El Brillo)</span>
              <p className="mt-1 text-zinc-300">Transición al auto listo en cabina.</p>
              <p className="text-[11px] text-zinc-400 italic mt-1">Texto en pantalla: "¡Como de agencia! Pintura al horno ✨"</p>
            </div>
            <div className="rounded bg-zinc-900 p-2.5 border border-zinc-800">
              <span className="font-bold text-blue-400">12-15 seg (CTA)</span>
              <p className="mt-1 text-zinc-300">Logo Taller Dayana y WhatsApp.</p>
              <p className="text-[11px] text-zinc-400 italic mt-1">Texto en pantalla: "Cotizá al 7043-9248 • Alajuela 📲"</p>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-zinc-400">
            💡 <em>Consejo de algoritmo:</em> En CapCut use un audio trending de "transformación" o sonido de golpe seguido de beat drop para maximizar reproducciones en Costa Rica.
          </p>
        </div>
      </section>
      {/* MODAL FORMAL DE PROPUESTA MEMBRETADA PARA PDF / IMPRESIÓN */}
      {showPdfProposalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm print:p-0 print:bg-white">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-zinc-700 bg-white p-8 text-zinc-900 shadow-2xl print:border-none print:shadow-none print:p-0 print:max-h-none print:w-full">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <span className="flex h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Vista Previa de Propuesta Oficial Membretada
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-purple-700 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-purple-600"
                >
                  🖨️ Imprimir / Guardar en PDF
                </button>
                <button
                  type="button"
                  onClick={() => setShowPdfProposalModal(false)}
                  className="rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-200"
                >
                  ✕ Cerrar
                </button>
              </div>
            </div>

            <div className="mt-6 space-y-6 print:mt-0 font-sans">
              <div className="flex items-start justify-between border-b-2 border-red-700 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-red-700 px-2.5 py-1 text-base font-black tracking-wider text-white">TD</span>
                    <h1 className="text-2xl font-black tracking-tight text-zinc-900">TALLER DAYANA</h1>
                  </div>
                  <p className="text-xs font-bold uppercase tracking-widest text-red-700 mt-1">Enderezado y Pintura Automotriz de Precisión</p>
                  <p className="text-xs text-zinc-600">Fundado por Dagoberto Barrantes • Más de 60 años de tradición familiar</p>
                  <p className="text-xs text-zinc-600">Barrio San José de Alajuela (Costado norte de plaza de deportes)</p>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded border border-zinc-300 bg-zinc-50 px-2.5 py-1 text-xs font-mono font-bold text-zinc-700">
                    COTIZACIÓN: {quoteProposalCode}
                  </span>
                  <p className="mt-2 text-xs text-zinc-500">Fecha: {new Date().toLocaleDateString("es-CR", { year: "numeric", month: "long", day: "numeric" })}</p>
                  <p className="text-xs font-semibold text-emerald-700">Validez: 15 días naturales</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs">
                <div>
                  <p className="text-zinc-500 font-medium">Cliente:</p>
                  <p className="text-sm font-bold text-zinc-900">{quoteAssistant.customerName || "Estimado Cliente"}</p>
                  <p className="text-zinc-500 mt-1 font-medium">Teléfono / WhatsApp:</p>
                  <p className="font-semibold text-zinc-800">{quoteAssistant.customerPhone || "Registrado en consulta"}</p>
                </div>
                <div>
                  <p className="text-zinc-500 font-medium">Vehículo:</p>
                  <p className="text-sm font-bold text-zinc-900">{quoteAssistant.vehicle || "Vehículo del cliente"}</p>
                  <p className="text-zinc-500 mt-1 font-medium">Nivel de intervención técnica:</p>
                  <p className="font-semibold text-zinc-800 capitalize">
                    {quoteAssistant.damageLevel === "leve" ? "Leve (Pintura / Rayón superficial)" : quoteAssistant.damageLevel === "medio" ? "Medio (Desabollado de lámina y corrección)" : "Fuerte (Enderezado estructural y escuadre)"}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 mb-2">Desglose de Piezas y Trabajos a Realizar</h3>
                <table className="w-full text-left text-xs border border-zinc-200">
                  <thead className="bg-zinc-100 text-zinc-700 border-b border-zinc-200 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Ítem</th>
                      <th className="p-2.5">Pieza / Componente</th>
                      <th className="p-2.5">Proceso Técnico</th>
                      <th className="p-2.5 text-right">Rango Estimado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200">
                    {(quoteAssistant.selectedParts || []).map((part, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50">
                        <td className="p-2.5 font-mono text-zinc-500">#{idx + 1}</td>
                        <td className="p-2.5 font-bold text-zinc-900">{part}</td>
                        <td className="p-2.5 text-zinc-600">Desabollado, sellador epóxico y pintura al horno</td>
                        <td className="p-2.5 text-right font-medium text-zinc-800">Incluido en total</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-xl border border-zinc-200 p-4 bg-zinc-50/50 text-xs space-y-1.5 text-zinc-700">
                <p className="font-bold text-zinc-900 text-xs uppercase tracking-wider">🔬 Certificación de Materiales & Proceso:</p>
                <p>• <strong>Pintura:</strong> Poliuretano bicapa con igualación computarizada y barniz de alto sólido (HS).</p>
                <p>• <strong>Cabina:</strong> Horneado en cabina presurizada libre de polvo para un curado parejo y sin imperfecciones.</p>
                <p>• <strong>Anticorrosivo:</strong> Imprimación epóxica en lámina viva para protección duradera contra óxido.</p>
                <p>• <strong>Acabado de entrega:</strong> Desmotado y pulido profesional 3M de cortesía incluido.</p>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-zinc-900 p-4 text-white">
                <div>
                  <p className="text-xs uppercase tracking-wider text-zinc-400 font-bold">Total Inversión Estimada</p>
                  <p className="text-xs text-zinc-400">Tiempo de entrega: <strong>{quoteAssistant.deliveryDays}</strong></p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-emerald-400">
                    ₡{quoteAssistant.minEstimate.toLocaleString("es-CR")} - ₡{quoteAssistant.maxEstimate.toLocaleString("es-CR")}
                  </p>
                  <p className="text-[10px] text-zinc-400">Colones costarricenses (IVA y materiales incluidos)</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-zinc-200 text-xs">
                <div>
                  <p className="font-bold text-zinc-900">Garantía Escrita Taller Dayana:</p>
                  <p className="text-zinc-600 mt-1">Garantizamos por escrito la igualación de color, el brillo permanente y la adherencia de pintura.</p>
                </div>
                <div className="text-center pt-4">
                  <div className="border-b border-zinc-400 w-48 mx-auto" />
                  <p className="font-bold text-zinc-900 mt-2">Don Randy Barrantes</p>
                  <p className="text-zinc-500 text-[11px]">Maestro Encargado de Taller • Tel: 7043-9248</p>
                  <p className="text-red-700 font-bold text-[10px] uppercase">Taller Dayana • Alajuela, C.R.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
