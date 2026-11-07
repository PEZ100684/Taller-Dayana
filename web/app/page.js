"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { defaultDriveGallery } from "./driveGalleryData";

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
    title: "Reparacion de carroceria",
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
    title: "Mas de 60 años de experiencia",
    description: "Generaciones de trabajo consolidan una tradicion de calidad en enderezado y pintura automotriz."
  },
  {
    period: "Actualidad",
    title: "Dirigido por Randy Barrantes",
    description: "La nueva generacion mantiene vivo el legado con atencion cercana, tecnologia y acabados de alto nivel."
  }
];

const whatsappContacts = [
  { number: "7043-9248", label: "Randy / Taller", link: "https://wa.me/50670439248" },
  { number: "8869-8157", label: "Atención Taller", link: "https://wa.me/50688698157" }
];
const mapsLink =
  "https://www.google.com/maps/place/Taller+Dayana/@10.0189955,-84.2360667,20.5z/data=!4m11!1m4!7m3!1m1!1s116661075415157394462!2e2!3m5!1s0x8fa0f9604b8acd11:0xe3eb01ff61086c8b!8m2!3d10.0188372!4d-84.2361356!16s%2Fg%2F11hdkshc7w?entry=ttu&g_ep=EgoyMDI2MDQxNS4wIKXMDSoASAFQAw%3D%3D";

const navigationTabs = [
  { id: "servicios", label: "Servicios" },
  { id: "galeria-trabajos", label: "Proyectos y casos atendidos" },
  { id: "solicitar-presupuesto", label: "Solicitar presupuesto" },
  { id: "solicitar-cita-visita", label: "Agendar cita" },
  { id: "seguimiento-reparacion", label: "Seguimiento 24/7" },
  { id: "nuestra-historia", label: "Nuestra historia" },
  { id: "ubicacion-contacto", label: "Ubicación y contacto" }
];

export default function Home() {
  const appointmentDateInputRef = useRef(null);
  const photoInputRef = useRef(null);
  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    vehicle: "",
    plate: "",
    damageDescription: "",
    photos: []
  });
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [appointmentForm, setAppointmentForm] = useState({
    customerName: "",
    phone: "",
    vehicle: "",
    plate: "",
    appointmentDate: "",
    appointmentTime: ""
  });
  const [appointmentStatus, setAppointmentStatus] = useState({ type: "idle", message: "" });
  const [galleryItems, setGalleryItems] = useState(defaultDriveGallery);
  const [visibleCount, setVisibleCount] = useState(12);
  const [selectedIndex, setSelectedIndex] = useState(null);

  useEffect(() => {
    const apiBase =
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      process.env.NEXT_API_BASE_URL ||
      "https://taller-dayana-api.onrender.com";

    fetch(`${apiBase}/api/gallery`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0 && data[0]?.image) {
          setGalleryItems(data);
        }
      })
      .catch(() => {});
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

    if (files.length > 5) {
      setStatus({ type: "error", message: "Solo se permiten hasta 5 fotos." });
      event.target.value = "";
      return;
    }

    const hasInvalidSize = files.some((file) => file.size > 4 * 1024 * 1024);
    if (hasInvalidSize) {
      setStatus({ type: "error", message: "Cada foto debe ser menor a 4MB." });
      event.target.value = "";
      return;
    }

    const hasInvalidType = files.some((file) => !file.type.startsWith("image/"));
    if (hasInvalidType) {
      setStatus({ type: "error", message: "Solo se permiten imagenes." });
      event.target.value = "";
      return;
    }

    const photoItems = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        dataUrl: await toDataUrl(file)
      }))
    );

    setFormData((prev) => ({ ...prev, photos: photoItems }));
    setStatus({ type: "idle", message: "" });
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setStatus({ type: "loading", message: "Enviando solicitud..." });

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
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || "No se pudo enviar la solicitud.");
      }

      const waText = encodeURIComponent(
        [
          "🚗 *SOLICITUD DE PRESUPUESTO - TALLER DAYANA*",
          `• Cliente: ${formData.customerName}`,
          `• Teléfono: ${formData.phone}`,
          `• Vehículo: ${formData.vehicle}`,
          `• Placa: ${formData.plate.toUpperCase()}`,
          `• Daño: ${formData.damageDescription}`,
          `• Fotos adjuntas: ${formData.photos.length}`
        ].join("\n")
      );

      const waLinks = [
        { number: "7043-9248", url: `https://wa.me/50670439248?text=${waText}` },
        { number: "8869-8157", url: `https://wa.me/50688698157?text=${waText}` }
      ];

      setStatus({
        type: "success",
        message: "Solicitud enviada correctamente. Notificación enviada al correo y lista para WhatsApp:",
        waLinks
      });
      if (typeof window !== "undefined" && waLinks[0]?.url) {
        window.open(waLinks[0].url, "_blank", "noopener,noreferrer");
      }
      setFormData({
        customerName: "",
        phone: "",
        vehicle: "",
        plate: "",
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
        message: "Seleccione una fecha valida de lunes a viernes entre 9:00 a.m. y 4:00 p.m."
      });
      return;
    }

    setAppointmentStatus({ type: "loading", message: "Enviando cita..." });

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
          plate: appointmentForm.plate,
          appointmentDate: appointmentDateTime
        })
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.error || "No se pudo registrar la cita.");
      }

      const waText = encodeURIComponent(
        [
          "📅 *NUEVA CITA DE ATENCIÓN - TALLER DAYANA*",
          `• Cliente: ${appointmentForm.customerName}`,
          `• Teléfono: ${appointmentForm.phone}`,
          `• Vehículo: ${appointmentForm.vehicle}`,
          `• Placa: ${appointmentForm.plate.toUpperCase()}`,
          `• Fecha: ${appointmentForm.appointmentDate}`,
          `• Hora: ${appointmentForm.appointmentTime}`
        ].join("\n")
      );

      const waLinks = [
        { number: "7043-9248", url: `https://wa.me/50670439248?text=${waText}` },
        { number: "8869-8157", url: `https://wa.me/50688698157?text=${waText}` }
      ];

      setAppointmentStatus({
        type: "success",
        message: "Cita registrada correctamente en el calendario y lista para WhatsApp:",
        waLinks
      });
      if (typeof window !== "undefined" && waLinks[0]?.url) {
        window.open(waLinks[0].url, "_blank", "noopener,noreferrer");
      }
      setAppointmentForm({
        customerName: "",
        phone: "",
        vehicle: "",
        plate: "",
        appointmentDate: "",
        appointmentTime: ""
      });
    } catch (error) {
      setAppointmentStatus({ type: "error", message: error.message || "Error inesperado." });
    }
  };

  const selectedPhoto = selectedIndex !== null ? galleryItems[selectedIndex] : null;

  return (
    <div id="inicio" className="min-h-screen pb-16">
      {/* Top Sticky Navbar */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <a href="#inicio" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brandRed font-extrabold text-white shadow-md shadow-brandRed/30">
              TD
            </span>
            <div>
              <p className="text-base font-bold leading-tight text-white">Taller Dayana</p>
              <p className="text-xs text-zinc-400">Alajuela, Costa Rica</p>
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
              <span className="inline-flex items-center gap-2 rounded-full border border-brandRed/40 bg-brandRed/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-red-300">
                <span className="h-2 w-2 rounded-full bg-brandRed" />
                Más de 60 años de tradición en Alajuela
              </span>
              <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
                Enderezado y Pintura <span className="text-brandRed">Taller Dayana</span>
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-300 md:text-lg">
                Dirigido por <span className="font-semibold text-white">Randy Barrantes</span>. Devolvemos la línea,
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
                Escríbanos por WhatsApp o visite nuestro taller en Barrio San José de Alajuela.
              </p>

              <div className="mt-4 grid gap-2.5">
                {whatsappContacts.map((contact) => (
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
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:border-white hover:text-white"
                >
                  <span>Cómo llegar en Google Maps</span>
                  <span className="text-xs text-brandRed">Abrir mapa →</span>
                </a>
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
        </section>

        {/* Gallery Section */}
        <section id="galeria-trabajos" className="section-card scroll-mt-24">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-brandRed">Portafolio Real</p>
              <h2 className="mt-1 text-3xl font-bold text-white">Galeria de proyectos y casos atendidos</h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-300">
                Asi llegan y se trabajan los vehiculos que han pasado por nuestras manos: atendemos carros antiguos y
                modernos, aros, golpes pequenos, danos fuertes por colision y proyectos de restauracion.
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
                  className="max-h-[72vh] w-auto object-contain"
                />
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : galleryItems.length - 1))
                  }
                  className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-xs font-semibold text-white transition hover:border-brandRed"
                >
                  ← Anterior
                </button>
                <a
                  href="#solicitar-presupuesto"
                  onClick={() => setSelectedIndex(null)}
                  className="rounded-xl bg-brandRed px-4 py-2 text-xs font-bold text-white transition hover:opacity-90"
                >
                  Cotizar un trabajo similar
                </a>
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
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">Marca y modelo</label>
                  <input
                    name="vehicle"
                    value={formData.vehicle}
                    onChange={onChange}
                    required
                    className="input-modern"
                    placeholder="Ej. Toyota Corolla 2019"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">Placa del vehículo</label>
                  <input
                    name="plate"
                    value={formData.plate}
                    onChange={onChange}
                    required
                    className="input-modern uppercase"
                    placeholder="Ej. ABC123"
                  />
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
                    placeholder="Cuéntenos qué parte del vehículo necesita enderezado, pintura o restauración..."
                  />
                </div>

                <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950/80 p-4 sm:col-span-2">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">Fotos del vehículo (máximo 5)</p>
                      <p className="text-xs text-zinc-400">Opcional • Hasta 4MB por imagen.</p>
                    </div>
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-zinc-600 bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-100 transition hover:border-brandRed hover:text-white">
                      📷 Seleccionar fotos
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={onPhotosChange}
                      />
                    </label>
                  </div>
                  {formData.photos.length > 0 ? (
                    <div className="mt-4 grid grid-cols-3 gap-2.5">
                      {formData.photos.map((photo, index) => (
                        <article
                          key={`${photo.name}-${index}`}
                          className="rounded-lg border border-zinc-700 bg-zinc-900 p-1.5"
                        >
                          <img src={photo.dataUrl} alt={photo.name} className="h-20 w-full rounded object-cover" />
                          <p className="mt-1 truncate text-[11px] text-zinc-300" title={photo.name}>
                            {photo.name}
                          </p>
                        </article>
                      ))}
                    </div>
                  ) : null}
                </div>

                <button
                  type="submit"
                  className="rounded-xl bg-brandRed px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-brandRed/25 transition hover:opacity-95 sm:col-span-2"
                >
                  Enviar solicitud de presupuesto
                </button>

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
                    {status.type === "success" && Array.isArray(status.waLinks) ? (
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
              <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">Solicitar cita de atencion</h2>
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
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">Marca y modelo</label>
                  <input
                    name="vehicle"
                    value={appointmentForm.vehicle}
                    onChange={onAppointmentChange}
                    required
                    className="input-modern"
                    placeholder="Ej. Hyundai Tucson"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">Placa del vehículo</label>
                  <input
                    name="plate"
                    value={appointmentForm.plate}
                    onChange={onAppointmentChange}
                    required
                    className="input-modern uppercase"
                    placeholder="Ej. ABC123"
                  />
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
                    {appointmentStatus.type === "success" && Array.isArray(appointmentStatus.waLinks) ? (
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
                  </div>
                ) : null}
              </form>
            </div>
          </section>
        </div>

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
              <h2 className="mt-2 text-2xl font-bold text-white md:text-3xl">Seguimiento de tu reparacion</h2>
              <p className="mt-2 max-w-2xl text-sm text-zinc-300">
                ¿Tu vehículo ya está en el taller? Ingresa el número de placa para ver en tiempo real el avance y las
                fotos del proceso de reparación.
              </p>
            </div>
            <a
              href="/seguimiento"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-brandRed px-7 py-4 text-sm font-bold text-white shadow-lg shadow-brandRed/30 transition hover:scale-[1.02] hover:opacity-95"
            >
              Ver estado de mi vehiculo →
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
            Taller Dayana es un negocio familiar construido sobre confianza, trabajo duro y pasion por hacer las cosas
            bien.
          </p>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <article className="rounded-2xl border border-zinc-800 bg-zinc-950/85 p-5 shadow-lg">
              <img
                src="/dagoberto-barrantes.jpg"
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
                src="/randy-barrantes.jpg"
                alt="Randy Barrantes"
                className="mx-auto h-[350px] w-[350px] max-w-full rounded-xl bg-zinc-950 object-contain object-center"
              />
              <p className="mt-4 text-xs font-bold uppercase tracking-wider text-brandRed">Director actual</p>
              <p className="text-xl font-bold text-white">Randy</p>
              <p className="mt-3 text-sm font-semibold italic text-zinc-100">
                "No eligio este oficio por necesidad, lo eligio por amor."
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">
                A los 24 años, Randy tomo una decision que cambiaria su vida: unirse al taller de su padre Dagoberto
                para trabajar hombro a hombro con el. No fue por obligacion ni por falta de opciones, fue por el deseo
                genuino de compartir cada dia junto a quienes mas admiraba. Aprendio el arte del enderezado y la pintura
                de las dos personas mas importantes de su vida: su padre, quien construyo este legado con sus propias
                manos desde los 13 años, y su esposa Ana Beatriz, quien ya conocia el oficio desde joven y se convirtio
                en su companera de vida y de trabajo. Hoy, con 60 años y mas de tres decadas de experiencia, Randy sigue
                llegando al taller con las mismas ganas del primer dia, honrando el legado familiar con cada vehiculo
                que pasa por sus manos.
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
            "No reparamos solo carrocerias: protegemos el legado de una familia que aprendio a convertir golpes en
            orgullo."
          </blockquote>
        </section>

        {/* Location, Hours & Testimonials */}
        <section id="ubicacion-contacto" className="grid gap-6 md:grid-cols-2 scroll-mt-24">
          <article className="section-card">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-brandRed">Visítenos</p>
            <h2 className="mt-1 text-2xl font-bold text-white">Ubicacion y horarios</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-200">
              📍 Barrio San Jose de Alajuela, Calle La Torre, Urbanizacion La Union, al puro fondo.
            </p>
            <div className="mt-4 space-y-1 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-200">
              <p>
                <span className="font-semibold text-white">Lunes a Viernes:</span> 8:00 a.m. - 6:00 p.m.
              </p>
              <p>
                <span className="font-semibold text-white">Sábado:</span> 8:00 a.m. - 1:00 p.m.
              </p>
            </div>
            <a
              href={mapsLink}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-zinc-600 bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:border-white"
            >
              Ver ubicacion en Google Maps →
            </a>
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
              <div className="mt-4 space-y-4">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <p className="text-sm italic text-zinc-200">
                    "Excelente trabajo de pintura y entrega puntual. El carro quedó como salido de agencia."
                  </p>
                  <p className="mt-2 text-xs font-semibold text-brandRed">★★★★★ — Cliente verificado</p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                  <p className="text-sm italic text-zinc-200">
                    "Muy buena comunicación durante toda la reparación y atención directa con don Randy."
                  </p>
                  <p className="mt-2 text-xs font-semibold text-brandRed">★★★★★ — Cliente verificado</p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-zinc-800 pt-4 text-xs text-zinc-400">
              <span>© {new Date().getFullYear()} Taller Dayana • Alajuela, Costa Rica</span>
              <a href="/admin" className="text-zinc-500 transition hover:text-zinc-300">
                Acceso Taller
              </a>
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
