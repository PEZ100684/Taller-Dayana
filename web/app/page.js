"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  cleanGalleryOverrides,
  defaultBeforeAfterCases,
  defaultDriveGallery,
  ownerPhotos,
  handleDriveImageError
} from "./driveGalleryData";

const services = [
  {
    title: "Enderezado",
    subtitle: "Alineación estructural, chasis y líneas originales de fábrica.",
    badge: "Precisión estructural",
    image: "/images/services/enderezado.jpeg"
  },
  {
    title: "Pintura",
    subtitle: "Igualación exacta de color, materiales de alta gama y brillo duradero.",
    badge: "Acabado profesional",
    image: "/images/services/pintura.jpeg"
  },
  {
    title: "Reparación de carrocería",
    subtitle: "Desde golpes leves y aros hasta colisiones fuertes y restauraciones completas.",
    badge: "Restauración integral",
    image: "/images/services/reparacion-carroceria.jpeg"
  }
];

const historyTimeline = [
  {
    period: "Origen",
    title: "Fundado por Dagoberto Barrantes",
    description: "El taller nace como un negocio familiar guiado por disciplina, detalle y respeto por cada cliente."
  },
  {
    period: "Legado",
    title: "Más de 60 años de experiencia",
    description: "Generaciones de trabajo consolidan una tradición de calidad en enderezado y pintura automotriz."
  },
  {
    period: "Actualidad",
    title: "Dirigido por Randy Barrantes Palma",
    description: "La nueva generación mantiene vivo el legado con atención cercana, tecnología y acabados de alto nivel."
  }
];

const whatsappContacts = [
  { number: "7043-9248", label: "Randy / Taller", link: "https://wa.me/50670439248" },
  { number: "8869-8157", label: "Atención Taller", link: "https://wa.me/50688698157" }
];
const mapsLink =
  "https://www.google.com/maps/place/Taller+Dayana/@10.0189955,-84.2360667,20.5z/data=!4m11!1m4!7m3!1m1!1s116661075415157394462!2e2!3m5!1s0x8fa0f9604b8acd11:0xe3eb01ff61086c8b!8m2!3d10.0188372!4d-84.2361356!16s%2Fg%2F11hdkshc7w?entry=ttu&g_ep=EgoyMDI2MDQxNS4wIKXMDSoASAFQAw%3D%3D";
const wazeLink = "https://waze.com/ul?ll=10.0188372,-84.2361356&navigate=yes";

const SOCIAL_LINKS = {
  facebook: "https://www.facebook.com/profile.php?id=61596264936919#",
  instagram: "https://instagram.com/tallerdayana",
  tiktok: "https://tiktok.com/@tallerdayanacr"
};

const navigationTabs = [
  { id: "servicios", label: "Servicios" },
  { id: "trabajos-listos", label: "Antes y después" },
  { id: "galeria-trabajos", label: "Proyectos y casos atendidos" },
  { id: "solicitar-presupuesto", label: "Solicitar presupuesto" },
  { id: "solicitar-cita-visita", label: "Agendar cita" },
  { id: "redes-sociales", label: "Redes sociales" },
  { id: "seguimiento-reparacion", label: "Seguimiento 24/7" },
  { id: "nuestra-historia", label: "Nuestra historia" },
  { id: "ubicacion-contacto", label: "Ubicación y contacto" }
];

const VEHICLE_PARTS = [
  "Bumper delantero",
  "Bumper trasero",
  "Bonete / Capó",
  "Puerta delantera izq.",
  "Puerta delantera der.",
  "Puerta trasera izq.",
  "Puerta trasera der.",
  "Guardabarro izq.",
  "Guardabarro der.",
  "Costado izq.",
  "Costado der.",
  "Tapa cajuela / baúl",
  "Techo",
  "Estribos / Faldones",
  "Pulido y abrillantado",
  "Pintura general completa"
];

const TENANT_PRESETS = {
  "taller-dayana": {
    id: 1,
    slug: "taller-dayana",
    initials: "TD",
    name: "Taller Dayana",
    tagline: "Enderezado y Pintura",
    ownerName: "Randy Barrantes",
    phone: "7043-9248",
    whatsapp: "50670439248",
    whatsappContacts: [
      { number: "7043-9248", label: "Randy / Taller", link: "https://wa.me/50670439248" },
      { number: "8869-8157", label: "Atención Taller", link: "https://wa.me/50688698157" }
    ],
    province: "Alajuela",
    canton: "Barrio San José",
    address: "Barrio San José, Alajuela, Costa Rica (Costado norte de la plaza de deportes)",
    mapsLink: mapsLink,
    wazeLink: wazeLink,
    brandColor: "#d62828",
    isSaasDemo: false
  },
  "autofix-heredia": {
    id: 2,
    slug: "autofix-heredia",
    initials: "AH",
    name: "AutoFix Heredia",
    tagline: "Carrocería y Pintura Automotriz",
    ownerName: "Carlos Méndez",
    phone: "8312-4455",
    whatsapp: "50683124455",
    whatsappContacts: [
      { number: "8312-4455", label: "Atención WhatsApp", link: "https://wa.me/50683124455" }
    ],
    province: "Heredia",
    canton: "San Pablo",
    address: "300m Norte del Masxmenos, San Pablo de Heredia, Costa Rica",
    mapsLink: "https://maps.google.com/?q=San+Pablo+Heredia",
    wazeLink: "https://waze.com/ul?q=San+Pablo+Heredia",
    brandColor: "#2563eb",
    isSaasDemo: true
  },
  "enderezado-coyol": {
    id: 3,
    slug: "enderezado-coyol",
    initials: "EC",
    name: "Enderezado El Coyol",
    tagline: "Enderezado de Chasis y Pintura Express",
    ownerName: "Esteban Rojas",
    phone: "8765-1122",
    whatsapp: "50687651122",
    whatsappContacts: [
      { number: "8765-1122", label: "Recepción Taller", link: "https://wa.me/50687651122" }
    ],
    province: "Alajuela",
    canton: "El Coyol",
    address: "Frente a Parque Industrial Zona Franca, El Coyol de Alajuela, Costa Rica",
    mapsLink: "https://maps.google.com/?q=El+Coyol+Alajuela",
    wazeLink: "https://waze.com/ul?q=El+Coyol+Alajuela",
    brandColor: "#059669",
    isSaasDemo: true
  }
};

export default function Home() {
  const appointmentDateInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    vehicle: "",
    contactChannel: "whatsapp",
    email: "",
    selectedParts: [],
    damageDescription: "",
    photos: []
  });
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [appointmentForm, setAppointmentForm] = useState({
    customerName: "",
    phone: "",
    vehicle: "",
    contactChannel: "whatsapp",
    email: "",
    appointmentDate: "",
    appointmentTime: ""
  });
  const [appointmentStatus, setAppointmentStatus] = useState({ type: "idle", message: "" });
  const [currentTenant, setCurrentTenant] = useState(TENANT_PRESETS["taller-dayana"]);
  const [isSaasPreview, setIsSaasPreview] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const queryTenant = params.get("tenant") || params.get("taller");
      const hasDemoParam = params.get("demo") === "saas" || Boolean(queryTenant);
      if (hasDemoParam) {
        setIsSaasPreview(true);
      }
      if (queryTenant) {
        const slug = queryTenant.toLowerCase();
        if (TENANT_PRESETS[slug]) {
          setCurrentTenant(TENANT_PRESETS[slug]);
        } else {
          const apiBase =
            process.env.NEXT_PUBLIC_API_BASE_URL ||
            process.env.NEXT_API_BASE_URL ||
            "https://taller-dayana-api.onrender.com";
          fetch(`${apiBase}/api/tenants/${slug}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              if (data && data.name) {
                setCurrentTenant({
                  id: data.id,
                  slug: data.slug,
                  initials: data.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase(),
                  name: data.name,
                  tagline: "Enderezado y Pintura Automotriz",
                  ownerName: data.ownerName || data.name,
                  phone: data.phone,
                  whatsapp: data.whatsapp || data.phone,
                  whatsappContacts: [
                    { number: data.phone, label: "Recepción", link: `https://wa.me/${data.whatsapp || data.phone}` }
                  ],
                  province: data.province || "Alajuela",
                  canton: data.canton || "Costa Rica",
                  address: data.address || `${data.province}, Costa Rica`,
                  mapsLink: data.mapsUrl || "https://maps.google.com",
                  wazeLink: data.wazeUrl || "https://waze.com",
                  brandColor: data.brandColor || "#2563eb",
                  isSaasDemo: true
                });
              }
            })
            .catch(() => {});
        }
      }
    }
  }, []);
  const [galleryItems, setGalleryItems] = useState(defaultDriveGallery);
  const [visibleCount, setVisibleCount] = useState(12);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [selectedLightboxPhoto, setSelectedLightboxPhoto] = useState(null);
  const [reviews, setReviews] = useState([
    {
      id: "rev-1",
      customerName: "Macaco",
      verified: true,
      comment: "Excelente trabajo de pintura y entrega puntual. El carro quedó como salido de agencia.",
      ratings: { servicio: 5, trato: 5, calidad: 5, precio: 5 },
      average: 5,
      date: "Reciente"
    }
  ]);
  const [reviewForm, setReviewForm] = useState({
    customerName: "",
    plate: "",
    comment: "",
    servicio: 5,
    trato: 5,
    calidad: 5,
    precio: 5
  });
  const [reviewStatus, setReviewStatus] = useState({ type: "idle", message: "" });

  useEffect(() => {
    const apiBase =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.NEXT_API_BASE_URL ||
      "https://taller-dayana-api.onrender.com";

    fetch(`${apiBase}/api/gallery`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
                if (Array.isArray(data) && data.length > 0 && data[0]?.image) {
          const sanitized = data.map((item) => {
            const cleanImage = cleanGalleryOverrides[item.id];
            if (cleanImage) {
              return {
                ...item,
                image: cleanImage,
                fullImage: cleanImage
              };
            }
            return item;
          });
          setGalleryItems(sanitized);
        }
      })
      .catch(() => {});

    fetch(`${apiBase}/api/reviews`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setReviews(data);
        }
      })
      .catch(() => {});

    try {
      const savedLocal = JSON.parse(localStorage.getItem("taller_dayana_reviews") || "[]").filter(
        (r) => r.id !== "rev-2" && r.plate !== "BLC990"
      );
      if (Array.isArray(savedLocal) && savedLocal.length > 0) {
        setReviews((prev) => {
          const existingIds = new Set(prev.map((r) => r.id));
          const merged = [
            ...savedLocal
              .map((r) => (r.id === "rev-1" ? { ...r, customerName: "Macaco" } : r))
              .filter((r) => !existingIds.has(r.id)),
            ...prev
          ];
          return merged;
        });
      }
    } catch {}
  }, []);

  const appointmentMinDate = useMemo(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 10);
  }, []);

  const appointmentTimeOptions = useMemo(() => {
    const options = [];
    for (let hour = 9; hour <= 16; hour += 1) {
      const value = `${String(hour).padStart(2, "0")}:00`;
      const suffix = hour >= 12 ? "p.m." : "a.m.";
      const hour12 = hour % 12 === 0 ? 12 : hour % 12;
      options.push({ value, label: `${hour12}:00 ${suffix}` });
    }
    return options;
  }, []);

  const isValidAppointmentDateTime = (value) => {
    if (!value) {
      return false;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return false;
    }

    const day = date.getDay();
    if (day === 0 || day === 6) {
      return false;
    }

    const totalMinutes = date.getHours() * 60 + date.getMinutes();
    return totalMinutes >= 9 * 60 && totalMinutes <= 16 * 60;
  };

  const toDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const onChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onAppointmentChange = (event) => {
    const { name, value } = event.target;
    setAppointmentForm((prev) => ({ ...prev, [name]: value }));
  };

  const onPhotosChange = async (event) => {
    const files = Array.from(event.target.files || []);

    if (files.length > 6) {
      setStatus({ type: "error", message: "Solo se permiten hasta 6 archivos multimedia (fotos o video corto)." });
      event.target.value = "";
      return;
    }

    const hasInvalidSize = files.some((file) => {
      const isVideo = file.type.startsWith("video/") || /\.(mp4|mov|webm)$/i.test(file.name);
      const maxSize = isVideo ? 25 * 1024 * 1024 : 10 * 1024 * 1024;
      return file.size > maxSize;
    });
    if (hasInvalidSize) {
      setStatus({ type: "error", message: "Las fotos deben ser menores a 10MB y los videos menores a 25MB." });
      event.target.value = "";
      return;
    }

    const hasInvalidType = files.some((file) => {
      const isImg = file.type.startsWith("image/");
      const isVid = file.type.startsWith("video/") || /\.(mp4|mov|webm)$/i.test(file.name);
      return !isImg && !isVid;
    });
    if (hasInvalidType) {
      setStatus({ type: "error", message: "Formato no compatible. Solo se permiten fotos (.jpg, .png) o videos (.mp4, .mov)." });
      event.target.value = "";
      return;
    }

    const photoItems = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        type: file.type || "image/jpeg",
        isVideo: file.type.startsWith("video/") || /\.(mp4|mov|webm)$/i.test(file.name),
        dataUrl: await toDataUrl(file)
      }))
    );

    setFormData((prev) => ({ ...prev, photos: photoItems }));
    setStatus({ type: "idle", message: "" });
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    if (formData.contactChannel === "email" && !formData.email.trim()) {
      setStatus({
        type: "error",
        message: "Por favor ingrese su correo electrónico para poder enviarle la respuesta del presupuesto."
      });
      return;
    }

    setStatus({ type: "loading", message: "Enviando solicitud de presupuesto..." });

    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        process.env.NEXT_API_BASE_URL ||
        "https://taller-dayana-api.onrender.com";
      const response = await fetch(`${apiBase}/api/quotes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customerName: formData.customerName,
          phone: formData.phone,
          vehicle: formData.vehicle,
          damageDescription: formData.damageDescription,
          contactChannel: formData.contactChannel,
          email: formData.email,
          selectedParts: formData.selectedParts,
          photos: formData.photos,
          tenantId: currentTenant.id
        })
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || "No se pudo enviar la solicitud.");
      }

      if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", "Lead", {
          content_name: "Solicitud de Presupuesto",
          vehicle: formData.vehicle,
          channel: formData.contactChannel
        });
      }
      if (typeof window !== "undefined" && window.ttq) {
        window.ttq.track("SubmitForm", {
          content_name: "Solicitud de Presupuesto"
        });
      }

      const partsText = formData.selectedParts.length > 0 ? formData.selectedParts.join(", ") : "Por evaluar según fotos";
      const channelText = formData.contactChannel === "email" ? `Correo electrónico (${formData.email})` : `WhatsApp (${formData.phone})`;

      const waText = encodeURIComponent(
        [
          `🚗 *SOLICITUD DE PRESUPUESTO - ${currentTenant.name.toUpperCase()}*`,
          `• Cliente: ${formData.customerName}`,
          `• Teléfono: ${formData.phone}`,
          formData.email ? `• Correo: ${formData.email}` : null,
          `• Responder por: ${channelText}`,
          `• Vehículo: ${formData.vehicle}`,
          `• Piezas a cotizar: ${partsText}`,
          `• Daño reportado: ${formData.damageDescription}`,
          `• Fotos adjuntas: ${formData.photos.length}`
        ].filter(Boolean).join("\n")
      );

      const waLinks = currentTenant.whatsappContacts.map((c) => {
        const rawDigits = c.number.replace(/[^0-9]/g, "");
        const cleanNumber = rawDigits.length <= 8 ? `506${rawDigits}` : rawDigits;
        return {
          number: c.number,
          url: `https://wa.me/${cleanNumber}?text=${waText}`
        };
      });

      const successMsg = formData.contactChannel === "email"
        ? `¡Solicitud recibida! Le hemos enviado confirmación a su correo (${formData.email}). ${currentTenant.ownerName} evaluará las fotos y detalles para enviarle la cotización estimada directamente a su correo.`
        : `¡Solicitud enviada! Se ha preparado el mensaje en WhatsApp para coordinar directamente con ${currentTenant.ownerName}:`;

      setStatus({
        type: "success",
        message: successMsg,
        waLinks: formData.contactChannel === "whatsapp" ? waLinks : []
      });

      if (formData.contactChannel === "whatsapp" && typeof window !== "undefined" && waLinks[0]?.url) {
        window.open(waLinks[0].url, "_blank", "noopener,noreferrer");
      }

      setFormData({
        customerName: "",
        phone: "",
        vehicle: "",
        contactChannel: "whatsapp",
        email: "",
        selectedParts: [],
        damageDescription: "",
        photos: []
      });
      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
    } catch (error) {
      setStatus({ type: "error", message: error.message || "Error inesperado." });
    }
  };

  const onAppointmentSubmit = async (event) => {
    event.preventDefault();

    const appointmentDateTime =
      appointmentForm.appointmentDate && appointmentForm.appointmentTime
        ? `${appointmentForm.appointmentDate}T${appointmentForm.appointmentTime}`
        : "";

    if (!isValidAppointmentDateTime(appointmentDateTime)) {
      setAppointmentStatus({
        type: "error",
        message: "Seleccione una fecha válida de lunes a viernes entre 9:00 a.m. y 4:00 p.m."
      });
      return;
    }

    if (appointmentForm.contactChannel === "email" && !appointmentForm.email.trim()) {
      setAppointmentStatus({
        type: "error",
        message: "Por favor ingrese su correo electrónico para poder enviarle la confirmación de la cita."
      });
      return;
    }

    setAppointmentStatus({ type: "loading", message: "Registrando cita de atención..." });

    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        process.env.NEXT_API_BASE_URL ||
        "https://taller-dayana-api.onrender.com";
      const response = await fetch(`${apiBase}/api/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customerName: appointmentForm.customerName,
          phone: appointmentForm.phone,
          vehicle: appointmentForm.vehicle,
          contactChannel: appointmentForm.contactChannel,
          email: appointmentForm.email,
          appointmentDate: appointmentDateTime,
          tenantId: currentTenant.id
        })
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || "No se pudo registrar la cita.");
      }

      if (typeof window !== "undefined" && window.fbq) {
        window.fbq("track", "Schedule", {
          content_name: "Cita de Atención",
          vehicle: appointmentForm.vehicle,
          date: appointmentForm.appointmentDate
        });
      }
      if (typeof window !== "undefined" && window.ttq) {
        window.ttq.track("CompleteRegistration", {
          content_name: "Cita de Atención"
        });
      }

      const channelText = appointmentForm.contactChannel === "email" ? `Correo electrónico (${appointmentForm.email})` : `WhatsApp (${appointmentForm.phone})`;

      const waText = encodeURIComponent(
        [
          `📅 *NUEVA CITA DE ATENCIÓN - ${currentTenant.name.toUpperCase()}*`,
          `• Cliente: ${appointmentForm.customerName}`,
          `• Teléfono: ${appointmentForm.phone}`,
          appointmentForm.email ? `• Correo: ${appointmentForm.email}` : null,
          `• Confirmar por: ${channelText}`,
          `• Vehículo: ${appointmentForm.vehicle}`,
          `• Fecha: ${appointmentForm.appointmentDate}`,
          `• Hora: ${appointmentForm.appointmentTime}`,
          "",
          `📍 Ubicación: ${currentTenant.address}`,
          `🗺️ Google Maps: ${currentTenant.mapsLink}`,
          `🚗 Waze: ${currentTenant.wazeLink}`
        ].filter(Boolean).join("\n")
      );

      const waLinks = currentTenant.whatsappContacts.map((c) => {
        const rawDigits = c.number.replace(/[^0-9]/g, "");
        const cleanNumber = rawDigits.length <= 8 ? `506${rawDigits}` : rawDigits;
        return {
          number: c.number,
          url: `https://wa.me/${cleanNumber}?text=${waText}`
        };
      });

      const successMsg = appointmentForm.contactChannel === "email"
        ? `¡Cita agendada correctamente! Hemos enviado los detalles y enlaces de ubicación (Waze y Google Maps) a: ${appointmentForm.email}`
        : "¡Cita agendada correctamente! Se ha abierto WhatsApp con los datos de su cita y enlaces de ubicación:";

      setAppointmentStatus({
        type: "success",
        message: successMsg,
        waLinks: appointmentForm.contactChannel === "whatsapp" ? waLinks : []
      });

      if (appointmentForm.contactChannel === "whatsapp" && typeof window !== "undefined" && waLinks[0]?.url) {
        window.open(waLinks[0].url, "_blank", "noopener,noreferrer");
      }

      setAppointmentForm({
        customerName: "",
        phone: "",
        vehicle: "",
        contactChannel: "whatsapp",
        email: "",
        appointmentDate: "",
        appointmentTime: ""
      });
    } catch (error) {
      setAppointmentStatus({ type: "error", message: error.message || "Error inesperado." });
    }
  };

  const onReviewSubmit = async (event) => {
    event.preventDefault();
    const ratings = {
      servicio: Number(reviewForm.servicio) || 5,
      trato: Number(reviewForm.trato) || 5,
      calidad: Number(reviewForm.calidad) || 5,
      precio: Number(reviewForm.precio) || 5,
    };
    const average = Number(
      ((ratings.servicio + ratings.trato + ratings.calidad + ratings.precio) / 4).toFixed(1)
    );
    const newEntry = {
      id: `rev-${Date.now()}`,
      customerName: reviewForm.customerName.trim(),
      plate: reviewForm.plate.trim().toUpperCase(),
      comment: reviewForm.comment.trim(),
      ratings,
      average,
      date: new Date().toLocaleDateString("es-CR")
    };

    setReviews((prev) => {
      const updated = [newEntry, ...prev];
      try {
        localStorage.setItem("taller_dayana_reviews", JSON.stringify(updated.slice(0, 20)));
      } catch {}
      return updated;
    });

    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        process.env.NEXT_API_BASE_URL ||
        "https://taller-dayana-api.onrender.com";
      await fetch(`${apiBase}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntry)
      });
    } catch {}

    setReviewForm({
      customerName: "",
      plate: "",
      comment: "",
      servicio: 5,
      trato: 5,
      calidad: 5,
      precio: 5,
    });
    setReviewStatus({
      type: "success",
      message: "¡Muchas gracias por su calificación! Su opinión ya está publicada."
    });
  };

  const selectedPhoto = selectedIndex !== null ? galleryItems[selectedIndex] : null;

  return (
    <div id="inicio" className="min-h-screen pb-16">
      {/* SaaS Multi-Taller Demo Bar */}
      {isSaasPreview && (
        <aside aria-label="Demo SaaS Multi-Taller" className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/30 bg-zinc-950/95 px-4 py-2 text-xs text-zinc-300 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-bold text-white">Plataforma SaaS Multi-Taller</span>
            <span className="hidden rounded bg-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-300 sm:inline-block">
              Demostración para Talleres de Alajuela & Heredia
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Ver como:</span>
            <button
              onClick={() => {
                if (typeof window !== "undefined") window.location.href = window.location.pathname;
              }}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition ${currentTenant.slug === "taller-dayana" ? "bg-brandRed text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
            >
              Taller Dayana (Alajuela)
            </button>
            <button
              onClick={() => {
                if (typeof window !== "undefined") window.location.href = `${window.location.pathname}?tenant=autofix-heredia`;
              }}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition ${currentTenant.slug === "autofix-heredia" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
            >
              AutoFix (Heredia)
            </button>
            <button
              onClick={() => {
                if (typeof window !== "undefined") window.location.href = `${window.location.pathname}?tenant=enderezado-coyol`;
              }}
              className={`rounded px-2.5 py-1 text-xs font-semibold transition ${currentTenant.slug === "enderezado-coyol" ? "bg-emerald-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
            >
              El Coyol (Alajuela)
            </button>
          </div>
        </aside>
      )}

      {/* Top Sticky Navbar */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <a href="#inicio" className="flex items-center gap-3">
            {currentTenant.slug === "taller-dayana" ? (
              <img
                src="/logo-taller-dayana.jpg"
                alt="Logo Taller Dayana"
                className="h-11 w-11 rounded-full object-cover ring-2 ring-brandRed/50 shadow-md shadow-brandRed/25"
              />
            ) : (
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl font-extrabold text-white shadow-md shadow-brandRed/30"
                style={{ backgroundColor: currentTenant.brandColor }}
              >
                {currentTenant.initials}
              </span>
            )}
            <div>
              <p className="text-base font-bold leading-tight text-white">{currentTenant.name}</p>
              <p className="text-xs text-zinc-400">{currentTenant.province}, Costa Rica</p>
            </div>
          </a>

          <nav className="hidden items-center gap-1 lg:flex">
            {navigationTabs.map((tab) => (
              <a
                key={tab.id}
                href={`#${tab.id}`}
                className="rounded-lg px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-800/80 hover:text-white"
              >
                {tab.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="/seguimiento"
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white transition hover:border-brandRed"
            >
              Mi Vehículo
            </a>
            <a
              href="#solicitar-presupuesto"
              className="rounded-xl bg-brandRed px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-brandRed/25 transition hover:opacity-90"
            >
              Cotizar
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pt-6 md:px-8 md:pt-10">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-950 to-black p-6 shadow-2xl md:p-12">
          <div className="grid items-center gap-8 lg:grid-cols-[1.25fr_0.75fr]">
            <div>
              <span
                className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-zinc-200"
                style={{ borderColor: `${currentTenant.brandColor}55`, backgroundColor: `${currentTenant.brandColor}22` }}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: currentTenant.brandColor }} />
                {currentTenant.isSaasDemo ? `Taller Afiliado • ${currentTenant.province}, Costa Rica` : "Más de 60 años de tradición en Alajuela"}
              </span>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
                {currentTenant.tagline} <span style={{ color: currentTenant.brandColor }}>{currentTenant.name}</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
                Dirigido por <span className="font-semibold text-white">{currentTenant.ownerName}</span>. Devolvemos la línea,
                el brillo y la seguridad original a su vehículo con atención honesta, materiales de primera y
                seguimiento en línea 24/7.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <a
                  href="#solicitar-presupuesto"
                  className="inline-flex items-center justify-center rounded-xl bg-brandRed px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-brandRed/30 transition hover:scale-[1.01] hover:opacity-95"
                >
                  Solicitar presupuesto en línea
                </a>
                <a
                  href="#solicitar-cita-visita"
                  className="inline-flex items-center justify-center rounded-xl border border-zinc-600 bg-zinc-900/90 px-6 py-3.5 text-sm font-bold text-white transition hover:border-white"
                >
                  Agendar cita de valoración
                </a>
                <a
                  href="/seguimiento"
                  className="inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-950/80 px-5 py-3.5 text-sm font-semibold text-zinc-200 transition hover:border-brandRed hover:text-white"
                >
                  Consultar estado por placa →
                </a>
              </div>
            </div>

            {/* Quick Contact & Highlights Card */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-5 shadow-xl">
              <p className="text-xs font-bold uppercase tracking-widest text-brandRed">Atención directa</p>
              <h2 className="mt-1 text-xl font-bold text-white">¿Necesita ayuda rápida?</h2>
              <p className="mt-1 text-sm text-zinc-300">
                Escríbanos por WhatsApp o visite nuestro taller en {currentTenant.address}.
              </p>

              <div className="mt-4 grid gap-2.5">
                {currentTenant.whatsappContacts.map((contact) => (
                  <a
                    key={contact.number}
                    href={contact.link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-xl border border-green-600/40 bg-green-600/15 px-4 py-3 text-sm font-semibold text-green-300 transition hover:bg-green-600 hover:text-white"
                  >
                    <span>WhatsApp {contact.number}</span>
                    <span className="text-xs opacity-90">Chatear ahora →</span>
                  </a>
                ))}
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={currentTenant.mapsLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-3 text-xs font-semibold text-zinc-200 transition hover:border-white hover:text-white"
                  >
                    <span>📍 Google Maps</span>
                    <span className="text-brandRed">Ir →</span>
                  </a>
                  <a
                    href={currentTenant.wazeLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-xl border border-sky-500/40 bg-sky-500/15 px-3.5 py-3 text-xs font-semibold text-sky-300 transition hover:bg-sky-500 hover:text-white"
                  >
                    <span>🚗 Ir con Waze</span>
                    <span>Abrir →</span>
                  </a>
                </div>

                {/* Social Media Quick Bar */}
                <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-2.5 text-xs">
                  <span className="text-zinc-400 font-medium pl-1">Redes:</span>
                  <div className="flex items-center gap-1.5">
                    <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-blue-600/20 px-2.5 py-1 font-bold text-blue-400 hover:bg-blue-600 hover:text-white transition">Facebook</a>
                    <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-pink-600/20 px-2.5 py-1 font-bold text-pink-400 hover:bg-pink-600 hover:text-white transition">Instagram</a>
                    <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-zinc-800 px-2.5 py-1 font-bold text-zinc-200 hover:bg-white hover:text-black transition">TikTok</a>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-zinc-800 pt-4 text-center">
                <div>
                  <p className="text-lg font-extrabold text-white">+60</p>
                  <p className="text-[11px] text-zinc-400">Años de legado</p>
                </div>
                <div>
                  <p className="text-lg font-extrabold text-white">100%</p>
                  <p className="text-[11px] text-zinc-400">Garantizado</p>
                </div>
                <div>
                  <p className="text-lg font-extrabold text-white">24/7</p>
                  <p className="text-[11px] text-zinc-400">Seguimiento web</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Quick Navigation Pills */}
          <div id="navegacion-rapida" className="mt-7 flex gap-2 overflow-x-auto border-t border-zinc-800/80 pt-5 lg:hidden">
            {navigationTabs.map((tab) => (
              <a
                key={tab.id}
                href={`#${tab.id}`}
                className="whitespace-nowrap rounded-xl border border-zinc-700 bg-zinc-900/90 px-4 py-2 text-xs font-semibold text-zinc-100 transition hover:border-brandRed"
              >
                {tab.label}
              </a>
            ))}
          </div>
        </section>

        {/* Services Section */}
        <section id="servicios" className="section-card scroll-mt-24">
          <div className="flex flex-col justify-between gap-2 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-brandRed">Especialidades</p>
              <h2 className="mt-1 text-3xl font-bold text-white">Nuestros Servicios</h2>
            </div>
            <p className="text-sm text-zinc-300">
              Recibimos carros antiguos, modernos, aros, golpes pequeños y colisiones mayores.
            </p>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {services.map((service) => (
              <article
                key={service.title}
                className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 transition hover:-translate-y-1 hover:border-brandRed/70"
              >
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-black/75 px-3 py-1 text-xs font-semibold text-red-300 backdrop-blur-sm">
                    {service.badge}
                  </span>
                </div>
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <h3 className="text-xl font-bold text-white">{service.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-zinc-300">{service.subtitle}</p>
                  </div>
                  <a
                    href="#solicitar-presupuesto"
                    className="mt-4 inline-flex items-center text-xs font-bold uppercase tracking-wider text-brandRed transition group-hover:text-red-400"
                  >
                    Cotizar este servicio →
                  </a>
                </div>
              </article>
            ))}
          </div>

          {/* Asistencia Vial y Grúas Banner */}
          <div className="mt-8 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-zinc-900 to-zinc-950 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-2xl border border-amber-500/30">
                🚜
              </div>
              <div>
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  Asistencia en Carretera & Grúas
                </span>
                <h3 className="mt-1 text-base font-bold text-white">¿Tuvo un accidente o su vehículo no camina?</h3>
                <p className="mt-0.5 text-xs text-zinc-300">
                  Coordinamos operadores de grúa de confianza en Alajuela, Heredia y GAM para trasladar su vehículo de inmediato a Taller Dayana.
                </p>
              </div>
            </div>
            <a
              href="https://wa.me/50670439248?text=Hola%2C%20tuve%20un%20accidente%20o%20el%20carro%20no%20me%20camina%2C%20ocupo%20asistencia%20de%20gr%C3%BAa%20para%20llevarlo%20a%20Taller%20Dayana."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-amber-600/20 transition hover:opacity-90"
            >
              <span>Pedir Asistencia / Grúa ➔</span>
            </a>
          </div>
        </section>

        {/* Before & After Section: Vehículos Listos (Antes y Después) */}
        <section id="trabajos-listos" className="section-card border-brandRed/40 scroll-mt-24">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-brandRed">Resultados Comprobados</p>
              <h2 className="mt-1 text-3xl font-bold text-white">Trabajos listos: Antes y Después</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-300">
                Conozca el proceso real de cómo ingresan los vehículos al taller y el acabado final con el que los
                entregamos a nuestros clientes.
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center rounded-xl border border-brandRed/50 bg-brandRed/10 px-3.5 py-2 text-xs font-bold text-red-200">
              {defaultBeforeAfterCases.length} {defaultBeforeAfterCases.length === 1 ? "vehículo documentado" : "vehículos documentados"}
            </span>
          </div>

          <div className="mt-6 space-y-8">
            {defaultBeforeAfterCases.map((vehicleCase) => (
              <div
                key={vehicleCase.plate}
                className="rounded-2xl border border-zinc-800 bg-zinc-950/90 p-5 shadow-xl md:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                  <div>
                    <span className="inline-block rounded-lg bg-brandRed px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white">
                      Trabajo Terminado • Privacidad Protegida
                    </span>
                    <h3 className="mt-2 text-xl font-bold text-white">{vehicleCase.title}</h3>
                    <p className="text-xs text-zinc-400">{vehicleCase.subtitle}</p>
                  </div>
                  <a
                    href="#solicitar-presupuesto"
                    className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:border-brandRed hover:text-white"
                  >
                    Cotizar un trabajo así →
                  </a>
                </div>

                <div className="mt-5 grid gap-6 lg:grid-cols-2">
                  {/* En Proceso / Antes */}
                  <div className="rounded-xl border border-amber-500/30 bg-amber-950/10 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                        <span className="h-2 w-2 rounded-full bg-amber-400" />
                        Antes / Fotos en proceso ({vehicleCase.beforePhotos.length})
                      </span>
                      <span className="text-[11px] text-zinc-400">Cómo ingresó y se trabajó</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {vehicleCase.beforePhotos.map((photo) => (
                        <article
                          key={photo.id}
                          onClick={() =>
                            setSelectedLightboxPhoto({
                              title: `Caso Terminado • ${photo.label}`,
                              image: photo.fullImage || photo.image
                            })
                          }
                          className="group relative cursor-pointer overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900"
                        >
                          <img
                            src={photo.image}
                            alt={`Placa ${vehicleCase.plate} - ${photo.label}`}
                            loading="lazy"
                            className="h-44 w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                          <span className="absolute bottom-2 left-2 rounded-md bg-black/80 px-2 py-1 text-[11px] font-semibold text-amber-300">
                            {photo.label}
                          </span>
                        </article>
                      ))}
                    </div>
                  </div>

                  {/* Fotos Finales / Después */}
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/10 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-300">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        Después / Fotos finales ({vehicleCase.afterPhotos.length})
                      </span>
                      <span className="text-[11px] text-zinc-400">Trabajo terminado</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {vehicleCase.afterPhotos.map((photo) => (
                        <article
                          key={photo.id}
                          onClick={() =>
                            setSelectedLightboxPhoto({
                              title: `Caso Terminado • ${photo.label}`,
                              image: photo.fullImage || photo.image
                            })
                          }
                          className="group relative cursor-pointer overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900"
                        >
                          <img
                            src={photo.image}
                            alt={`Placa ${vehicleCase.plate} - ${photo.label}`}
                            loading="lazy"
                            className="h-44 w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                          <span className="absolute bottom-2 left-2 rounded-md bg-black/80 px-2 py-1 text-[11px] font-semibold text-emerald-300">
                            {photo.label}
                          </span>
                        </article>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Lightbox Modal for Before/After Single Photo */}
        {selectedLightboxPhoto ? (
          <div
            onClick={() => setSelectedLightboxPhoto(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 p-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3">
                <p className="text-sm font-bold text-white">{selectedLightboxPhoto.title}</p>
                <button
                  type="button"
                  onClick={() => setSelectedLightboxPhoto(null)}
                  className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brandRed"
                >
                  ✕ Cerrar
                </button>
              </div>
              <div className="flex items-center justify-center overflow-hidden rounded-xl bg-black/60">
                <img
                  src={selectedLightboxPhoto.image}
                  alt={selectedLightboxPhoto.title}
                  className="max-h-[75vh] w-auto object-contain"
                />
              </div>
            </div>
          </div>
        ) : null}

        {/* Gallery Section */}
        <section id="galeria-trabajos" className="section-card scroll-mt-24">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-brandRed">Portafolio Real</p>
              <h2 className="mt-1 text-3xl font-bold text-white">Galería de proyectos y casos atendidos</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-300">
                Así llegan y se trabajan los vehículos que han pasado por nuestras manos: atendemos carros antiguos y
                modernos, aros, golpes pequeños, daños fuertes por colisión y proyectos de restauración.
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs font-semibold text-zinc-200">
              {galleryItems.length} fotos en galería
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {galleryItems.slice(0, visibleCount).map((item, idx) => (
              <article
                key={item.id || item.title}
                onClick={() => setSelectedIndex(idx)}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 transition hover:-translate-y-0.5 hover:border-brandRed"
              >
                <div className="relative h-56 overflow-hidden bg-zinc-900">
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => handleDriveImageError(e, item)}
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80 transition group-hover:opacity-100" />
                  <span className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-semibold text-white">
                    <span>{item.title}</span>
                    <span className="rounded-md bg-brandRed/90 px-2 py-0.5 text-[11px]">Ver foto</span>
                  </span>
                </div>
              </article>
            ))}
          </div>

          {visibleCount < galleryItems.length ? (
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => setVisibleCount((prev) => Math.min(prev + 12, galleryItems.length))}
                className="rounded-xl bg-brandRed px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brandRed/25 transition hover:opacity-90"
              >
                Ver 12 fotos más ({visibleCount} de {galleryItems.length})
              </button>
              <button
                type="button"
                onClick={() => setVisibleCount(galleryItems.length)}
                className="rounded-xl border border-zinc-600 bg-zinc-900 px-6 py-3 text-sm font-semibold text-zinc-100 transition hover:border-white"
              >
                Mostrar las {galleryItems.length} fotos
              </button>
            </div>
          ) : galleryItems.length > 12 ? (
            <div className="mt-7 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount(12)}
                className="rounded-xl border border-zinc-600 bg-zinc-900 px-6 py-3 text-sm font-semibold text-zinc-100 transition hover:border-white"
              >
                Mostrar menos fotos
              </button>
            </div>
          ) : null}
        </section>

        {/* Lightbox Modal for Gallery */}
        {selectedPhoto ? (
          <div
            onClick={() => setSelectedIndex(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 p-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3">
                <p className="text-sm font-bold text-white">
                  {selectedPhoto.title} ({selectedIndex + 1} de {galleryItems.length})
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedIndex(null)}
                  className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brandRed"
                >
                  ✕ Cerrar
                </button>
              </div>

              <div className="flex items-center justify-center bg-black/60 rounded-xl overflow-hidden">
                <img
                  src={selectedPhoto.fullImage || selectedPhoto.image}
                  alt={selectedPhoto.title}
                  referrerPolicy="no-referrer"
                  onError={(e) => handleDriveImageError(e, selectedPhoto)}
                  className="max-h-[72vh] w-auto object-contain"
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : galleryItems.length - 1))
                  }
                  className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition hover:border-brandRed"
                >
                  ← Anterior
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://tallerdayana.vercel.app")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-400 transition hover:bg-blue-600 hover:text-white"
                    title="Compartir en Facebook"
                  >
                    f Compartir
                  </a>
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent("Mire este trabajo de enderezado y pintura en Taller Dayana: https://tallerdayana.vercel.app")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400 transition hover:bg-emerald-600 hover:text-white"
                    title="Compartir por WhatsApp"
                  >
                    WhatsApp
                  </a>
                  <a
                    href="#solicitar-presupuesto"
                    onClick={() => setSelectedIndex(null)}
                    className="rounded-xl bg-brandRed px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
                  >
                    Cotizar un trabajo similar
                  </a>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedIndex((prev) => (prev < galleryItems.length - 1 ? prev + 1 : 0))
                  }
                  className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition hover:border-brandRed"
                >
                  Siguiente →
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {/* Two-Column Forms Section: Quote & Appointment */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Quote Request Form */}
          <section id="solicitar-presupuesto" className="section-card scroll-mt-24 flex flex-col justify-between">
            <div>
              <span className="inline-block rounded-lg bg-brandRed/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brandRed">
                Paso 1 • Cotización sin compromiso
              </span>
              <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">Solicitar presupuesto</h2>
              <p className="mt-2 text-sm text-zinc-300">
                Complete los datos de su vehículo y adjunte hasta 5 fotos del daño para enviarle una valoración rápida.
              </p>

              <form className="mt-6 grid gap-3.5 sm:grid-cols-2" onSubmit={onSubmit}>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">Nombre completo</label>
                  <input
                    name="customerName"
                    value={formData.customerName}
                    onChange={onChange}
                    required
                    className="input-modern"
                    placeholder="Ej. Juan Pérez"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">Teléfono / WhatsApp</label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={onChange}
                    required
                    className="input-modern"
                    placeholder="Ej. 8888-8888"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">Marca y modelo del vehículo</label>
                  <input
                    name="vehicle"
                    value={formData.vehicle}
                    onChange={onChange}
                    required
                    className="input-modern"
                    placeholder="Ej. Toyota Corolla 2019"
                  />
                </div>

                {/* Preferred response channel */}
                <div className="sm:col-span-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                  <label className="mb-1.5 block text-xs font-semibold text-zinc-200">
                    ¿Por cuál medio desea recibir la respuesta de su presupuesto?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, contactChannel: "whatsapp" }))}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 px-3 text-xs font-bold transition ${
                        formData.contactChannel === "whatsapp"
                          ? "border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-sm shadow-emerald-950"
                          : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      <span>🟢</span> Por WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, contactChannel: "email" }))}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 px-3 text-xs font-bold transition ${
                        formData.contactChannel === "email"
                          ? "border-blue-500 bg-blue-500/15 text-blue-400 shadow-sm shadow-blue-950"
                          : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      <span>✉️</span> Por Correo Electrónico
                    </button>
                  </div>

                  {formData.contactChannel === "email" ? (
                    <div className="mt-3">
                      <label className="mb-1 block text-xs font-semibold text-blue-300">
                        Correo electrónico para enviarle el presupuesto *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={onChange}
                        required
                        className="input-modern border-blue-500/50 focus:border-blue-500"
                        placeholder="su-correo@ejemplo.com"
                      />
                    </div>
                  ) : null}
                </div>

                {/* Vehicle Parts Template for Fast Estimation */}
                <div className="sm:col-span-2 rounded-xl border border-zinc-800 bg-zinc-950/80 p-3.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-zinc-200">
                      🧩 Plantilla rápida: Piezas a cotizar (opcional)
                    </label>
                    <span className="text-[11px] font-semibold text-brandRed">
                      {formData.selectedParts.length > 0 ? `${formData.selectedParts.length} seleccionada(s)` : "Opcional"}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-400">
                    Toque las piezas correspondientes para agilizar la estimación de Don Randy:
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {VEHICLE_PARTS.map((part) => {
                      const isSelected = formData.selectedParts.includes(part);
                      return (
                        <button
                          key={part}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              selectedParts: isSelected
                                ? prev.selectedParts.filter((p) => p !== part)
                                : [...prev.selectedParts, part]
                            }));
                          }}
                          className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                            isSelected
                              ? "bg-brandRed text-white shadow-sm shadow-brandRed/50"
                              : "border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:text-white"
                          }`}
                        >
                          {isSelected ? "✓ " : "+ "}
                          {part}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">Descripción del daño o trabajo</label>
                  <textarea
                    name="damageDescription"
                    value={formData.damageDescription}
                    onChange={onChange}
                    required
                    className="input-modern"
                    rows={3}
                    placeholder="Cuéntenos qué necesita su vehículo (enderezado, pintura, golpes, rayones, etc.)..."
                  />
                </div>

                <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/80 p-4 sm:col-span-2">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">Fotos o Video del vehículo (máximo 6)</p>
                      <p className="text-xs text-zinc-400">Opcional • Puede subir fotos o un video corto del golpe/rayón.</p>
                    </div>
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-zinc-600 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-100 transition hover:border-brandRed hover:text-white">
                      📷 🎥 Seleccionar fotos o video
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*,video/mp4,video/quicktime,video/webm"
                        multiple
                        className="hidden"
                        onChange={onPhotosChange}
                      />
                    </label>
                  </div>
                  {formData.photos.length > 0 ? (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {formData.photos.map((photo, index) => {
                        const isVid = photo.isVideo || photo.dataUrl.startsWith("data:video/") || /\.(mp4|mov|webm)$/i.test(photo.name);
                        return (
                          <article
                            key={`${photo.name}-${index}`}
                            className="relative overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 p-1.5"
                          >
                            {isVid ? (
                              <div className="relative aspect-video w-full overflow-hidden rounded bg-black">
                                <video src={photo.dataUrl} className="h-full w-full object-contain" muted controls />
                                <span className="pointer-events-none absolute left-1 top-1 rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
                                  VIDEO
                                </span>
                              </div>
                            ) : (
                              <img src={photo.dataUrl} alt={photo.name} className="h-24 w-full rounded object-cover" />
                            )}
                            <p className="mt-1 truncate text-[11px] text-zinc-300" title={photo.name}>
                              {photo.name}
                            </p>
                          </article>
                        );
                      })}
                    </div>
                  ) : null}
                </div>

                <button
                  type="submit"
                  className="rounded-xl bg-brandRed px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-brandRed/25 transition hover:opacity-95 sm:col-span-2"
                >
                  Enviar solicitud de presupuesto
                </button>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-zinc-400 sm:col-span-2">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    🔒 Cifrado SSL 256-bit
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span>🛡️ Protección de datos (Ley N° 8968 Costa Rica)</span>
                  <span className="text-zinc-600">•</span>
                  <span>Confidencialidad garantizada</span>
                </div>

                {status.type !== "idle" ? (
                  <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:col-span-2">
                    <p
                      className={
                        status.type === "error"
                          ? "text-sm font-medium text-red-400"
                          : status.type === "success"
                            ? "text-sm font-medium text-green-400"
                            : "text-sm text-zinc-300"
                      }
                    >
                      {status.message}
                    </p>
                    {status.type === "success" && Array.isArray(status.waLinks) && status.waLinks.length > 0 ? (
                      <div className="flex flex-wrap gap-2.5">
                        {status.waLinks.map((item) => (
                          <a
                            key={item.number}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex rounded-xl bg-green-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-green-500"
                          >
                            Enviar por WhatsApp ({item.number})
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </form>
            </div>
          </section>

          {/* Appointment Request Form */}
          <section id="solicitar-cita-visita" className="section-card scroll-mt-24 flex flex-col justify-between">
            <div>
              <span className="inline-block rounded-lg bg-brandRed/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brandRed">
                Paso 2 • Atención presencial
              </span>
              <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">Solicitar cita de atención</h2>
              <p className="mt-2 text-sm text-zinc-300">
                Elija el día y la hora para revisar su vehículo en el taller. Horario de citas: lunes a viernes de 9:00
                a.m. a 4:00 p.m.
              </p>

              <form className="mt-6 grid gap-3.5 sm:grid-cols-2" onSubmit={onAppointmentSubmit}>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">Nombre completo</label>
                  <input
                    name="customerName"
                    value={appointmentForm.customerName}
                    onChange={onAppointmentChange}
                    required
                    className="input-modern"
                    placeholder="Ej. María Rodríguez"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">Teléfono / WhatsApp</label>
                  <input
                    name="phone"
                    value={appointmentForm.phone}
                    onChange={onAppointmentChange}
                    required
                    className="input-modern"
                    placeholder="Ej. 8888-8888"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">Marca y modelo del vehículo</label>
                  <input
                    name="vehicle"
                    value={appointmentForm.vehicle}
                    onChange={onAppointmentChange}
                    required
                    className="input-modern"
                    placeholder="Ej. Hyundai Tucson"
                  />
                </div>

                {/* Preferred response channel for appointment */}
                <div className="sm:col-span-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
                  <label className="mb-1.5 block text-xs font-semibold text-zinc-200">
                    ¿Por cuál medio desea recibir la confirmación de su cita?
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAppointmentForm((prev) => ({ ...prev, contactChannel: "whatsapp" }))}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 px-3 text-xs font-bold transition ${
                        appointmentForm.contactChannel === "whatsapp"
                          ? "border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-sm shadow-emerald-950"
                          : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      <span>🟢</span> Por WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => setAppointmentForm((prev) => ({ ...prev, contactChannel: "email" }))}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 px-3 text-xs font-bold transition ${
                        appointmentForm.contactChannel === "email"
                          ? "border-blue-500 bg-blue-500/15 text-blue-400 shadow-sm shadow-blue-950"
                          : "border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                      }`}
                    >
                      <span>✉️</span> Por Correo Electrónico
                    </button>
                  </div>

                  {appointmentForm.contactChannel === "email" ? (
                    <div className="mt-3">
                      <label className="mb-1 block text-xs font-semibold text-blue-300">
                        Correo electrónico para confirmación de la cita *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={appointmentForm.email}
                        onChange={onAppointmentChange}
                        required
                        className="input-modern border-blue-500/50 focus:border-blue-500"
                        placeholder="su-correo@ejemplo.com"
                      />
                    </div>
                  ) : null}
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">Fecha de la cita (Lunes a Viernes)</label>
                  <div className="grid gap-2.5 sm:grid-cols-[minmax(0,1fr)_auto]">
                    <input
                      type="date"
                      name="appointmentDate"
                      ref={appointmentDateInputRef}
                      value={appointmentForm.appointmentDate}
                      onChange={onAppointmentChange}
                      min={appointmentMinDate}
                      required
                      className="input-modern"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (appointmentDateInputRef.current?.showPicker) {
                          appointmentDateInputRef.current.showPicker();
                        } else {
                          appointmentDateInputRef.current?.focus();
                        }
                      }}
                      className="rounded-xl border border-zinc-600 bg-zinc-900 px-4 py-3 text-xs font-semibold text-zinc-100 transition hover:border-white"
                    >
                      📅 Abrir calendario
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">Hora disponible</label>
                  <select
                    name="appointmentTime"
                    value={appointmentForm.appointmentTime}
                    onChange={onAppointmentChange}
                    required
                    className="input-modern"
                  >
                    <option value="">Seleccione una hora</option>
                    {appointmentTimeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-xs text-zinc-400">
                    Su cita se agenda automáticamente en nuestro calendario de atención.
                  </p>
                </div>

                <button
                  type="submit"
                  className="rounded-xl bg-brandRed px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-brandRed/25 transition hover:opacity-95 sm:col-span-2"
                >
                  Confirmar cita de atención
                </button>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-zinc-400 sm:col-span-2">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    🔒 Cita Segura y Cifrada
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span>🛡️ Cero spam ni divulgación a terceros</span>
                  <span className="text-zinc-600">•</span>
                  <span>Confirmación directa por WhatsApp / Correo</span>
                </div>

                {appointmentStatus.type !== "idle" ? (
                  <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-950 p-4 sm:col-span-2">
                    <p
                      className={
                        appointmentStatus.type === "error"
                          ? "text-sm font-medium text-red-400"
                          : appointmentStatus.type === "success"
                            ? "text-sm font-medium text-green-400"
                            : "text-sm text-zinc-300"
                      }
                    >
                      {appointmentStatus.message}
                    </p>
                    {appointmentStatus.type === "success" && (
                      <div className="mt-2 space-y-2">
                        {Array.isArray(appointmentStatus.waLinks) && appointmentStatus.waLinks.length > 0 ? (
                          <div className="flex flex-wrap gap-2.5">
                            {appointmentStatus.waLinks.map((item) => (
                              <a
                                key={item.number}
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex rounded-xl bg-green-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-green-500"
                              >
                                Confirmar por WhatsApp ({item.number})
                              </a>
                            ))}
                          </div>
                        ) : null}
                        <div className="flex flex-wrap gap-2 pt-1">
                          <a
                            href={googleMapsLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-brandRed hover:text-white"
                          >
                            🗺️ Ver ubicación en Google Maps
                          </a>
                          <a
                            href={wazeLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-sky-400 transition hover:border-sky-500 hover:text-white"
                          >
                            🚗 Navegar con Waze
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </form>
            </div>
          </section>
        </div>

        {/* Social Media & Multimedia Hub Section */}
        <section id="redes-sociales" className="section-card scroll-mt-24 border-brandRed/30 bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
          <div>
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="inline-block rounded-lg bg-brandRed/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brandRed">
                  Comunidad y Contenido en Vivo
                </span>
                <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">Conéctese con Taller Dayana en Redes Sociales</h2>
                <p className="mt-1 max-w-2xl text-sm text-zinc-300">
                  Síganos en nuestras plataformas oficiales para ver el detrás de cámaras, transformaciones de antes y después, acabados en cabina y consejos de cuidado automotriz.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2 md:pt-0">
                <span className="text-xs text-zinc-400 font-medium">Canal oficial:</span>
                <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs font-bold text-white">@tallerdayana</span>
              </div>
            </div>

            {/* 3 Social Media Platform Cards */}
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {/* Facebook Card */}
              <div className="flex flex-col justify-between rounded-2xl border border-blue-500/30 bg-gradient-to-b from-blue-950/20 to-zinc-950 p-5 transition hover:border-blue-500/60 hover:shadow-lg hover:shadow-blue-950/40">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-600/30 font-black text-xl">
                      f
                    </div>
                    <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-bold text-blue-400 border border-blue-500/20">
                      Facebook
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-white">Taller Dayana en Facebook</h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-300">
                    Proyectos finalizados, álbumes de fotos de entregas a clientes satisfechos, noticias del taller y atención directa por Messenger.
                  </p>
                </div>
                <a
                  href={SOCIAL_LINKS.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-500"
                >
                  Seguir en Facebook →
                </a>
              </div>

              {/* Instagram Card */}
              <div className="flex flex-col justify-between rounded-2xl border border-pink-500/30 bg-gradient-to-b from-pink-950/20 to-zinc-950 p-5 transition hover:border-pink-500/60 hover:shadow-lg hover:shadow-pink-950/40">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-md shadow-rose-600/30">
                      <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    </div>
                    <span className="rounded-full bg-pink-500/10 px-2.5 py-0.5 text-[11px] font-bold text-pink-400 border border-pink-500/20">
                      Instagram
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-white">Reels & Procesos HD</h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-300">
                    Reels diarios de antes y después, igualación de tono de pintura, perleados, tricapas y detalles de pulido cerámico.
                  </p>
                </div>
                <a
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-rose-600 to-amber-600 px-4 py-2.5 text-xs font-bold text-white transition hover:opacity-90"
                >
                  Ver Reels en Instagram →
                </a>
              </div>

              {/* TikTok Card */}
              <div className="flex flex-col justify-between rounded-2xl border border-zinc-700 bg-gradient-to-b from-zinc-900 to-black p-5 transition hover:border-zinc-500 hover:shadow-lg hover:shadow-zinc-900/50">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black border border-zinc-700 text-white shadow-md">
                      <svg className="h-6 w-6 fill-current text-cyan-400" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.5 2.77 1.81-.02 3.25-1.47 3.3-3.29.04-3.58.01-7.16.02-10.74V.02z"/></svg>
                    </div>
                    <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 text-[11px] font-bold text-cyan-400 border border-cyan-500/20">
                      TikTok
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-white">TikTok @tallerdayanacr</h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-300">
                    Transformaciones rápidas de carrocería, procesos en horno de secado, enderezado estructural y tips automotrices con Don Randy.
                  </p>
                </div>
                <a
                  href={SOCIAL_LINKS.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-zinc-800"
                >
                  Seguir en TikTok →
                </a>
              </div>
            </div>

            {/* Featured Transformation Reels Grid */}
            <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Videos y Transformaciones Destacadas
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <a
                  href={SOCIAL_LINKS.tiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-3 transition hover:border-brandRed"
                >
                  <div className="aspect-video w-full rounded-lg overflow-hidden bg-zinc-950 relative">
                    <img src="/cases/case-6.jpg" alt="Transformación Toyota" className="h-full w-full object-cover transition group-hover:scale-105" />
                    <span className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-0.5 text-[10px] font-bold text-white">▶ Ver Video</span>
                  </div>
                  <p className="mt-2 text-xs font-bold text-white group-hover:text-brandRed">Restauración de Golpe Frontal y Pintura</p>
                  <p className="text-[11px] text-zinc-400">Toyota Corolla • Enderezado de chasis y cabina</p>
                </a>

                <a
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-3 transition hover:border-pink-500"
                >
                  <div className="aspect-video w-full rounded-lg overflow-hidden bg-zinc-950 relative">
                    <img src="/cases/case-36.jpg" alt="Acabado en cabina" className="h-full w-full object-cover transition group-hover:scale-105" />
                    <span className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-0.5 text-[10px] font-bold text-white">▶ Ver Reel</span>
                  </div>
                  <p className="mt-2 text-xs font-bold text-white group-hover:text-pink-400">Pintura Bicapa y Horneado de Cabina</p>
                  <p className="text-[11px] text-zinc-400">Suzuki Swift • Acabado espejo de alta durabilidad</p>
                </a>

                <a
                  href={SOCIAL_LINKS.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 p-3 transition hover:border-blue-500"
                >
                  <div className="aspect-video w-full rounded-lg overflow-hidden bg-zinc-950 relative">
                    <img src="/cases/case-76.jpg" alt="Entrega a cliente" className="h-full w-full object-cover transition group-hover:scale-105" />
                    <span className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-0.5 text-[10px] font-bold text-white">▶ Ver Post</span>
                  </div>
                  <p className="mt-2 text-xs font-bold text-white group-hover:text-blue-400">Entrega de Vehículo y Prueba de Color</p>
                  <p className="text-[11px] text-zinc-400">Hyundai Tucson • Garantía de color por escrito</p>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 24/7 Repair Tracking Banner */}
        <section
          id="seguimiento-reparacion"
          className="section-card border-brandRed/40 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 scroll-mt-24"
        >
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-brandRed/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-300">
                <span className="h-2 w-2 rounded-full bg-brandRed" />
                Consulta en línea 24/7
              </span>
              <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">Seguimiento de tu reparación</h2>
              <p className="mt-2 max-w-2xl text-sm text-zinc-300">
                ¿Tu vehículo ya está en el taller? Ingresa el número de placa para ver en tiempo real el avance y las
                fotos del proceso de reparación.
              </p>
            </div>
            <a
              href="/seguimiento"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-brandRed px-7 py-4 text-sm font-bold text-white shadow-lg shadow-brandRed/30 transition hover:scale-[1.02] hover:opacity-95"
            >
              Ver estado de mi vehículo →
            </a>
          </div>
        </section>

        {/* Family History Section */}
        <section
          id="nuestra-historia"
          className="section-card border-brandRed/30 bg-gradient-to-br from-zinc-950 to-zinc-900 scroll-mt-24"
        >
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-brandRed">Nuestra Historia</p>
          <h2 className="mt-2 text-3xl font-bold text-white md:text-4xl">Orgullo familiar que cruza generaciones</h2>
          <p className="mt-3 max-w-3xl text-zinc-200">
            Taller Dayana es un negocio familiar construido sobre confianza, trabajo duro y pasión por hacer las cosas
            bien.
          </p>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <article className="rounded-2xl border border-zinc-800 bg-zinc-950/85 p-5 shadow-lg">
              <img
                src={ownerPhotos.dagoberto.localPath}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = ownerPhotos.dagoberto.driveUrl;
                }}
                alt="Dagoberto Barrantes"
                className="mx-auto h-[350px] w-[350px] max-w-full rounded-xl bg-zinc-950 object-contain object-center"
              />
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-brandRed">Fundador</p>
              <p className="text-xl font-bold text-white">Dagoberto Barrantes Murillo</p>
              <p className="mt-3 text-sm font-semibold italic text-zinc-100">
                "Lo que empezó como una pasión, se convirtió en el corazón de una familia."
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                Había algo especial en las manos de Dagoberto. Desde los 13 años, cuando apenas era un muchacho, ya
                sabía que su lugar estaba ahí, entre el olor a pintura fresca, el sonido del metal y la satisfacción de
                devolver vida a cada vehículo que llegaba dañado.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                Con los años, ese fuego no se apagó, creció. Con esfuerzo, sacrificio y un talento que pocos tienen,
                Dagoberto construyó varios talleres en Alajuela y se ganó algo que no se compra: el respeto genuino de
                toda una comunidad. Pero lo más grande que edificó nunca tuvo paredes ni techo. Fue una familia.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                Los Barrantes llevan la reparación automotriz en la sangre, en el alma, en la historia de cada uno.
                Hermanos, primos, tíos, generación tras generación, cada miembro de la familia encontró naturalmente su
                lugar entre carrocerías, pintura y motores.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">No fue casualidad. Fue herencia.</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                No fue solo trabajo. Fue vocación, fue identidad y fue amor por la satisfacción de ver los clientes
                felices.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                Más de 50 años después, ese mismo fuego sigue vivo. Hoy arde en las manos de su hijo Randy, quien dirige
                el Taller Dayana con el mismo orgullo, la misma dedicación y el mismo amor por el trabajo bien hecho que
                aprendió de su padre.
              </p>
            </article>

            <article className="rounded-2xl border border-zinc-800 bg-zinc-950/85 p-5 shadow-lg">
              <img
                src={ownerPhotos.randy.localPath}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = ownerPhotos.randy.driveUrl;
                }}
                alt="Randy Barrantes Palma"
                className="mx-auto h-[350px] w-[350px] max-w-full rounded-xl bg-zinc-950 object-contain object-center"
              />
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-brandRed">Director actual</p>
              <p className="text-xl font-bold text-white">Randy Barrantes Palma</p>
              <p className="mt-3 text-sm font-semibold italic text-zinc-100">
                "No eligió este oficio por necesidad, lo eligió por amor y vocación."
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                A los 24 años, Randy tomó una decisión que marcaría su destino: unirse al taller de su padre Dagoberto
                para trabajar hombro a hombro con él. No fue por obligación ni por falta de opciones, sino por el deseo
                genuino de aprender y compartir cada jornada junto a quienes más admiraba.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                Perfeccionó el arte del enderezado y la pintura de la mano de dos pilares fundamentales en su vida: su
                padre, quien forjó este legado desde los 13 años, y su esposa Ana Beatriz, quien conocía el oficio desde
                joven y se convirtió en su gran compañera de vida y de trabajo.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                Hoy, como director y administrador al frente de Taller Dayana, Randy es el motor diario que mantiene
                viva la tradición. Recibe personalmente a cada cliente, supervisa cada detalle en el área de trabajo y
                se asegura de que cada carrocería y cada acabado de pintura salgan con perfección.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                No es solo mantener un taller abierto. Es ganarse la confianza día a día.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                Por eso los clientes de toda la vida siguen viniendo y las nuevas generaciones confían sus vehículos en
                sus manos: porque saben que con don Randy hay palabra, honestidad y resultados que hablan por sí solos.
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                Con 60 años y más de tres décadas de entrega ininterrumpida, Randy llega cada mañana al taller con la
                misma energía del primer día, haciendo que los trabajos salgan impecables y llevando el apellido
                Barrantes aún más alto.
              </p>
            </article>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {historyTimeline.map((item) => (
              <article key={item.title} className="relative rounded-2xl border border-zinc-800 bg-zinc-950/85 p-5">
                <span className="absolute left-4 top-0 h-full w-[2px] bg-brandRed/60" aria-hidden="true" />
                <p className="pl-4 text-xs font-bold uppercase tracking-[0.2em] text-brandRed">{item.period}</p>
                <h3 className="pl-4 pt-2 text-lg font-semibold text-white">{item.title}</h3>
                <p className="pl-4 pt-2 text-sm text-zinc-300">{item.description}</p>
              </article>
            ))}
          </div>

          <blockquote className="mt-7 rounded-2xl border border-brandRed/60 bg-brandRed/10 p-6 text-xl font-bold italic text-white md:text-2xl">
            "No reparamos solo carrocerías: protegemos el legado de una familia que aprendió a convertir golpes en
            orgullo."
          </blockquote>
        </section>

        {/* Location, Hours & Testimonials */}
        <section id="ubicacion-contacto" className="grid gap-6 md:grid-cols-2 scroll-mt-24">
          <article className="section-card">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-brandRed">Visítenos</p>
            <h2 className="mt-1 text-2xl font-bold text-white">Ubicación y horarios</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-200">
              📍 Barrio San José de Alajuela, Calle La Torre, Urbanización La Unión, al puro fondo.
            </p>
            <div className="mt-4 space-y-1 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-200">
              <p>
                <span className="font-semibold text-white">Lunes a Viernes:</span> 8:00 a.m. - 6:00 p.m.
              </p>
              <p>
                <span className="font-semibold text-white">Sábado:</span> 8:00 a.m. - 1:00 p.m.
              </p>
            </div>
            <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
              <a
                href={mapsLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-600 bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:border-white"
              >
                📍 Abrir en Google Maps →
              </a>
              <a
                href={wazeLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center rounded-xl border border-sky-500/50 bg-sky-500/15 px-4 py-3 text-sm font-bold text-sky-300 transition hover:bg-sky-500 hover:text-white"
              >
                🚗 Abrir en Waze →
              </a>
            </div>
            <p className="mt-5 text-sm text-zinc-300">
              Teléfonos y WhatsApp:{" "}
              <span className="font-bold text-white">
                {whatsappContacts.map((item) => item.number).join(" / ")}
              </span>
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {whatsappContacts.map((contact) => (
                <a
                  key={contact.number}
                  href={contact.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-brandRed px-4 py-3 text-sm font-bold text-white transition hover:opacity-90"
                >
                  WhatsApp ({contact.number})
                </a>
              ))}
            </div>
          </article>

          <article className="section-card flex flex-col justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-brandRed">Confianza</p>
              <h2 className="mt-1 text-2xl font-bold text-white">Lo que dicen nuestros clientes</h2>
              <p className="mt-1 text-xs text-zinc-400">
                Calificaciones reales sobre servicio, trato, calidad y precio.
              </p>

              <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
                {reviews.map((rev) => (
                  <div key={rev.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-white">
                        {rev.customerName} <span className="text-[11px] font-normal text-emerald-400">• Cliente Verificado</span>
                      </span>
                      <span className="text-xs font-bold text-amber-400">
                        {"★".repeat(Math.round(rev.average || 5))} ({rev.average || 5}/5)
                      </span>
                    </div>
                    <p className="mt-2 text-sm italic text-zinc-200">"{rev.comment}"</p>
                    {rev.ratings ? (
                      <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px] text-zinc-300">
                        <span className="rounded bg-zinc-900 px-2 py-0.5">Servicio: {rev.ratings.servicio}★</span>
                        <span className="rounded bg-zinc-900 px-2 py-0.5">Trato: {rev.ratings.trato}★</span>
                        <span className="rounded bg-zinc-900 px-2 py-0.5">Calidad: {rev.ratings.calidad}★</span>
                        <span className="rounded bg-zinc-900 px-2 py-0.5">Precio: {rev.ratings.precio}★</span>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              {/* Formulario para calificar servicio */}
              <form onSubmit={onReviewSubmit} className="mt-5 space-y-3 rounded-xl border border-zinc-800 bg-zinc-950/90 p-4">
                <p className="text-sm font-bold text-white">⭐ Calificar nuestro servicio</p>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <input
                    value={reviewForm.customerName}
                    onChange={(e) => setReviewForm((prev) => ({ ...prev, customerName: e.target.value }))}
                    required
                    placeholder="Su nombre"
                    className="input-modern text-xs"
                  />
                  <input
                    value={reviewForm.plate}
                    onChange={(e) => setReviewForm((prev) => ({ ...prev, plate: e.target.value.toUpperCase() }))}
                    placeholder="Placa (privada / uso interno)"
                    className="input-modern text-xs uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { key: "servicio", label: "Servicio" },
                    { key: "trato", label: "Trato" },
                    { key: "calidad", label: "Calidad" },
                    { key: "precio", label: "Precio" },
                  ].map((cat) => (
                    <label key={cat.key} className="block rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-center">
                      <span className="block text-[11px] font-semibold text-zinc-300">{cat.label}</span>
                      <select
                        value={reviewForm[cat.key]}
                        onChange={(e) =>
                          setReviewForm((prev) => ({ ...prev, [cat.key]: Number(e.target.value) }))
                        }
                        className="mt-1 w-full rounded bg-zinc-950 px-1 py-1 text-center text-xs font-bold text-amber-400"
                      >
                        <option value={5}>5 ★</option>
                        <option value={4}>4 ★</option>
                        <option value={3}>3 ★</option>
                        <option value={2}>2 ★</option>
                        <option value={1}>1 ★</option>
                      </select>
                    </label>
                  ))}
                </div>

                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                  required
                  rows={2}
                  placeholder="Cuéntenos cómo quedó su vehículo y su experiencia con nosotros..."
                  className="input-modern text-xs"
                />

                <button
                  type="submit"
                  className="w-full rounded-xl bg-brandRed px-4 py-2.5 text-xs font-bold text-white transition hover:opacity-90"
                >
                  Publicar calificación
                </button>
                {reviewStatus.message ? (
                  <p className="text-xs font-medium text-green-400">{reviewStatus.message}</p>
                ) : null}
              </form>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-zinc-800 pt-4 text-xs text-zinc-400">
              <div className="space-y-1">
                <p>© {new Date().getFullYear()} {currentTenant.name} • {currentTenant.province}, Costa Rica</p>
                <p className="text-[11px] text-zinc-500">
                  🔒 Cifrado SSL 256-bit • 🛡️ Protección de Datos Ley N° 8968 (CR) • Software propietario protegido contra copia no autorizada.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-blue-400 transition">Facebook</a>
                <span className="text-zinc-600">•</span>
                <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-pink-400 transition">Instagram</a>
                <span className="text-zinc-600">•</span>
                <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition">TikTok</a>
                <span className="text-zinc-600">•</span>
                <a href="/admin" className="text-zinc-500 transition hover:text-zinc-300">
                  Acceso Taller
                </a>
              </div>
            </div>
          </article>
        </section>
      </main>

      <a
        href="#inicio"
        className="fixed bottom-5 right-5 z-40 rounded-full bg-brandRed px-5 py-3 text-xs font-bold text-white shadow-lg shadow-black/50 transition hover:scale-105 hover:opacity-95"
      >
        ↑ Subir al inicio
      </a>
    </div>
  );
}
