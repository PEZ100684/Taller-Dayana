"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { defaultDriveGallery } from "./driveGalleryData";

const services = [
  {
    title: "Enderezado",
    image: "/images/services/enderezado.jpeg"
  },
  {
    title: "Pintura",
    image: "/images/services/pintura.jpeg"
  },
  {
    title: "Reparacion de carroceria",
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
  { number: "7043-9248", link: "https://wa.me/50670439248" },
  { number: "8869-8157", link: "https://wa.me/50688698157" }
];
const mapsLink =
  "https://www.google.com/maps/place/Taller+Dayana/@10.0189955,-84.2360667,20.5z/data=!4m11!1m4!7m3!1m1!1s116661075415157394462!2e2!3m5!1s0x8fa0f9604b8acd11:0xe3eb01ff61086c8b!8m2!3d10.0188372!4d-84.2361356!16s%2Fg%2F11hdkshc7w?entry=ttu&g_ep=EgoyMDI2MDQxNS4wIKXMDSoASAFQAw%3D%3D";

const navigationTabs = [
  { id: "servicios", label: "Servicios" },
  { id: "galeria-trabajos", label: "Proyectos y casos atendidos" },
  { id: "seguimiento-reparacion", label: "Seguimiento de reparacion" },
  { id: "solicitar-presupuesto", label: "Solicitar presupuesto" },
  { id: "solicitar-cita-visita", label: "Solicitar cita para visita" }
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
  const [selectedPhoto, setSelectedPhoto] = useState(null);

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

    const appointmentDateTime = appointmentForm.appointmentDate && appointmentForm.appointmentTime
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

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-8 md:px-8">
      <section className="section-card">
        <p className="text-sm uppercase tracking-[0.3em] text-brandRed">Costa Rica</p>
        <h1 className="mt-2 text-4xl font-bold md:text-5xl">Taller Dayana</h1>
        <p className="mt-2 text-zinc-200">
          Propietario: <span className="font-semibold text-white">Randy</span>
        </p>
        <p className="mt-3 max-w-3xl text-zinc-200">
          Taller de enderezado y pintura automotriz con atencion profesional, acabados de alta calidad y seguimiento del
          estado de reparacion de su vehiculo.
        </p>
      </section>

      <section id="navegacion-rapida" className="section-card border-brandRed/40 bg-zinc-950/90 scroll-mt-28">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brandRed">Navegacion rapida</p>
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {navigationTabs.map((tab) => (
            <a
              key={tab.id}
              href={`#${tab.id}`}
              className="whitespace-nowrap rounded-md border border-zinc-600 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:border-brandRed hover:text-white"
            >
              {tab.label}
            </a>
          ))}
        </div>
      </section>

      <section className="section-card border-brandRed/40 bg-gradient-to-br from-zinc-950 to-zinc-900">
        <p className="text-sm uppercase tracking-[0.3em] text-brandRed">Nuestra Historia</p>
        <h2 className="mt-2 text-3xl font-bold md:text-4xl">Orgullo familiar que cruza generaciones</h2>
        <p className="mt-3 max-w-3xl text-zinc-200">
          Taller Dayana es un negocio familiar construido sobre confianza, trabajo duro y pasion por hacer las cosas bien.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <article className="rounded-xl border border-zinc-700 bg-zinc-950/80 p-4">
            <img
              src="/dagoberto-barrantes.jpg"
              alt="Dagoberto Barrantes"
              className="mx-auto h-[350px] w-[350px] max-w-full rounded-xl bg-zinc-950 object-contain object-center"
            />
            <p className="mt-3 text-sm uppercase tracking-wider text-brandRed">Fundador</p>
            <p className="text-lg font-semibold text-white">Dagoberto Barrantes Murillo</p>
            <p className="mt-3 text-sm font-semibold text-zinc-100">
              "Lo que empezó como una pasión, se convirtió en el corazón de una familia."
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-200">
              Había algo especial en las manos de Dagoberto. Desde los 13 años, cuando apenas era un muchacho, ya
              sabía que su lugar estaba ahí, entre el olor a pintura fresca, el sonido del metal y la satisfacción
              de devolver vida a cada vehículo que llegaba dañado.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-200">
              Con los años, ese fuego no se apagó, creció. Con esfuerzo, sacrificio y un talento que pocos tienen,
              Dagoberto construyó varios talleres en Alajuela y se ganó algo que no se compra: el respeto genuino
              de toda una comunidad. Pero lo más grande que edificó nunca tuvo paredes ni techo. Fue una familia.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-200">
              Los Barrantes llevan la reparación automotriz en la sangre, en el alma, en la historia de cada uno.
              Hermanos, primos, tíos, generación tras generación, cada miembro de la familia encontró naturalmente
              su lugar entre carrocerías, pintura y motores.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-200">No fue casualidad. Fue herencia.</p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-200">
              No fue solo trabajo. Fue vocación, fue identidad y fue amor por la satisfacción de ver los clientes
              felices.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-200">
              Más de 50 años después, ese mismo fuego sigue vivo. Hoy arde en las manos de su hijo Randy, quien
              dirige el Taller Dayana con el mismo orgullo, la misma dedicación y el mismo amor por el trabajo bien
              hecho que aprendió de su padre.
            </p>
          </article>

          <article className="rounded-xl border border-zinc-700 bg-zinc-950/80 p-4">
            <img
              src="/randy-barrantes.jpg"
              alt="Randy Barrantes"
              className="mx-auto h-[350px] w-[350px] max-w-full rounded-xl bg-zinc-950 object-contain object-center"
            />
            <p className="mt-3 text-sm uppercase tracking-wider text-brandRed">Director actual</p>
            <p className="text-lg font-semibold text-white">Randy</p>
            <p className="mt-3 text-sm font-semibold text-zinc-100">
              "No eligio este oficio por necesidad, lo eligio por amor."
            </p>
            <p className="mt-2 text-sm leading-relaxed text-zinc-200">
              A los 24 años, Randy tomo una decision que cambiaria su vida: unirse al taller de
              su padre Dagoberto para trabajar hombro a hombro con el. No fue por obligacion ni por falta de
              opciones, fue por el deseo genuino de compartir cada dia junto a quienes mas admiraba. Aprendio el
              arte del enderezado y la pintura de las dos personas mas importantes de su vida: su padre, quien
              construyo este legado con sus propias manos desde los 13 años, y su esposa Ana Beatriz, quien ya
              conocia el oficio desde joven y se convirtio en su companera de vida y de trabajo. Hoy, con 60 años
              y mas de tres decadas de experiencia, Randy sigue llegando al taller con las mismas ganas del primer
              dia, honrando el legado familiar con cada vehiculo que pasa por sus manos.
            </p>
          </article>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {historyTimeline.map((item) => (
            <article key={item.title} className="relative rounded-xl border border-zinc-700 bg-zinc-950/80 p-4">
              <span className="absolute left-4 top-0 h-full w-[2px] bg-brandRed/60" aria-hidden="true" />
              <p className="pl-4 text-xs uppercase tracking-[0.2em] text-brandRed">{item.period}</p>
              <h3 className="pl-4 pt-2 text-lg font-semibold text-white">{item.title}</h3>
              <p className="pl-4 pt-2 text-sm text-zinc-200">{item.description}</p>
            </article>
          ))}
        </div>

        <blockquote className="mt-7 rounded-xl border border-brandRed/70 bg-brandRed/10 p-5 text-xl font-bold italic text-white md:text-2xl">
          "No reparamos solo carrocerias: protegemos el legado de una familia que aprendio a convertir golpes en orgullo."
        </blockquote>
      </section>

      <section id="servicios" className="section-card scroll-mt-28">
        <h2 className="text-2xl font-semibold">Servicios</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {services.map((service) => (
            <article key={service.title} className="overflow-hidden rounded-lg border border-zinc-700 bg-zinc-950">
              <img src={service.image} alt={service.title} className="h-40 w-full object-cover" />
              <p className="p-3 text-center font-medium">{service.title}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="galeria-trabajos" className="section-card scroll-mt-28">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Galeria de proyectos y casos atendidos</h2>
            <p className="mt-1 max-w-4xl text-sm text-zinc-300">
              Asi llegan y se trabajan los vehiculos que han pasado por nuestras manos: atendemos carros antiguos y
              modernos, aros, golpes pequenos, danos fuertes por colision y proyectos de restauracion.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {galleryItems.slice(0, visibleCount).map((item) => (
            <article
              key={item.id || item.title}
              onClick={() => setSelectedPhoto(item)}
              className="group cursor-pointer overflow-hidden rounded-lg border border-zinc-700 bg-zinc-950 transition hover:border-brandRed"
            >
              <img
                src={item.image}
                alt={item.title}
                loading="lazy"
                className="h-52 w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <p className="p-3 text-center text-sm text-zinc-200">{item.title}</p>
            </article>
          ))}
        </div>
        {visibleCount < galleryItems.length ? (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => Math.min(prev + 12, galleryItems.length))}
              className="rounded-md bg-brandRed px-6 py-3 font-semibold text-white transition hover:opacity-90"
            >
              Ver 12 fotos mas ({visibleCount} de {galleryItems.length})
            </button>
            <button
              type="button"
              onClick={() => setVisibleCount(galleryItems.length)}
              className="rounded-md border border-zinc-500 bg-zinc-900 px-6 py-3 font-semibold text-zinc-100 transition hover:border-white"
            >
              Ver todas las fotos ({galleryItems.length})
            </button>
          </div>
        ) : galleryItems.length > 12 ? (
          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => setVisibleCount(12)}
              className="rounded-md border border-zinc-500 bg-zinc-900 px-6 py-3 font-semibold text-zinc-100 transition hover:border-white"
            >
              Mostrar menos fotos
            </button>
          </div>
        ) : null}
      </section>

      {selectedPhoto ? (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950 p-3"
          >
            <img
              src={selectedPhoto.fullImage || selectedPhoto.image}
              alt={selectedPhoto.title}
              className="max-h-[78vh] w-auto rounded-lg object-contain"
            />
            <div className="mt-3 flex items-center justify-between gap-4 px-2">
              <p className="text-sm font-semibold text-white">{selectedPhoto.title}</p>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="rounded-md bg-brandRed px-4 py-1.5 text-sm font-semibold text-white"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section id="solicitar-presupuesto" className="section-card scroll-mt-28">
        <h2 className="text-2xl font-semibold">Solicitar presupuesto</h2>
        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
          <input
            name="customerName"
            value={formData.customerName}
            onChange={onChange}
            required
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3"
            placeholder="Nombre completo"
          />
          <input
            name="phone"
            value={formData.phone}
            onChange={onChange}
            required
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3"
            placeholder="Telefono"
          />
          <input
            name="vehicle"
            value={formData.vehicle}
            onChange={onChange}
            required
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3"
            placeholder="Marca y modelo"
          />
          <input
            name="plate"
            value={formData.plate}
            onChange={onChange}
            required
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3"
            placeholder="Placa"
          />
          <textarea
            name="damageDescription"
            value={formData.damageDescription}
            onChange={onChange}
            required
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3 md:col-span-2"
            rows={4}
            placeholder="Describa el daño"
          />
          <div className="rounded-md border border-zinc-700 bg-zinc-950 p-4 md:col-span-2">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-white">Fotos del vehiculo (maximo 5)</p>
                <p className="text-sm text-zinc-300">Adjunta imagenes del dano para realizar mejor el presupuesto.</p>
              </div>
              <label className="inline-flex cursor-pointer rounded-md border border-zinc-500 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:border-white">
                Agregar fotos
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
              <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {formData.photos.map((photo, index) => (
                  <article key={`${photo.name}-${index}`} className="rounded-md border border-zinc-700 bg-zinc-900 p-2">
                    <img src={photo.dataUrl} alt={photo.name} className="h-28 w-full rounded object-cover" />
                    <p className="mt-2 truncate text-xs text-zinc-300" title={photo.name}>
                      {photo.name}
                    </p>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
          <button type="submit" className="rounded-md bg-brandRed px-4 py-3 font-semibold text-white md:col-span-2">
            Enviar solicitud
          </button>
          {status.type !== "idle" ? (
            <div className="md:col-span-2 space-y-3">
              <p
                className={
                  status.type === "error" ? "text-red-400" : status.type === "success" ? "text-green-400" : "text-zinc-300"
                }
              >
                {status.message}
              </p>
              {status.type === "success" && Array.isArray(status.waLinks) ? (
                <div className="flex flex-wrap gap-3">
                  {status.waLinks.map((item) => (
                    <a
                      key={item.number}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-500"
                    >
                      Enviar presupuesto por WhatsApp ({item.number})
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </form>
      </section>

      <section id="solicitar-cita-visita" className="section-card scroll-mt-28">
        <h2 className="text-2xl font-semibold">Solicitar cita de atencion</h2>
        <p className="mt-3 text-zinc-200">
          Elija su fecha en calendario. Horario disponible: lunes a viernes, de 9:00 a.m. a 4:00 p.m.
        </p>

        <form className="mt-4 grid gap-3 md:grid-cols-2" onSubmit={onAppointmentSubmit}>
          <input
            name="customerName"
            value={appointmentForm.customerName}
            onChange={onAppointmentChange}
            required
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3"
            placeholder="Nombre completo"
          />
          <input
            name="phone"
            value={appointmentForm.phone}
            onChange={onAppointmentChange}
            required
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3"
            placeholder="Telefono"
          />
          <input
            name="vehicle"
            value={appointmentForm.vehicle}
            onChange={onAppointmentChange}
            required
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3"
            placeholder="Marca y modelo"
          />
          <input
            name="plate"
            value={appointmentForm.plate}
            onChange={onAppointmentChange}
            required
            className="rounded-md border border-zinc-600 bg-zinc-950 p-3"
            placeholder="Placa"
          />

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-zinc-200">Fecha de la cita</label>
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <input
                type="date"
                name="appointmentDate"
                ref={appointmentDateInputRef}
                value={appointmentForm.appointmentDate}
                onChange={onAppointmentChange}
                min={appointmentMinDate}
                required
                className="w-full rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white"
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
                className="rounded-md border border-zinc-500 bg-zinc-950 px-4 py-3 text-zinc-100 transition hover:border-white"
              >
                Abrir calendario
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-zinc-200">Hora de la cita</label>
            <select
              name="appointmentTime"
              value={appointmentForm.appointmentTime}
              onChange={onAppointmentChange}
              required
              className="w-full rounded-md border border-zinc-600 bg-zinc-950 p-3 text-white"
            >
              <option value="">Seleccione una hora</option>
              {appointmentTimeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-zinc-300">Solo se aceptan citas de lunes a viernes entre 9:00 a.m. y 4:00 p.m.</p>
          </div>

          <button type="submit" className="rounded-md bg-brandRed px-4 py-3 font-semibold text-white md:col-span-2">
            Solicitar cita
          </button>

          {appointmentStatus.type !== "idle" ? (
            <div className="md:col-span-2 space-y-3">
              <p
                className={
                  appointmentStatus.type === "error"
                    ? "text-red-400"
                    : appointmentStatus.type === "success"
                      ? "text-green-400"
                      : "text-zinc-300"
                }
              >
                {appointmentStatus.message}
              </p>
              {appointmentStatus.type === "success" && Array.isArray(appointmentStatus.waLinks) ? (
                <div className="flex flex-wrap gap-3">
                  {appointmentStatus.waLinks.map((item) => (
                    <a
                      key={item.number}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-500"
                    >
                      Confirmar cita por WhatsApp ({item.number})
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </form>
      </section>

      <section id="seguimiento-reparacion" className="section-card scroll-mt-28">
        <h2 className="text-2xl font-semibold">Seguimiento de tu reparacion</h2>
        <p className="mt-3 text-zinc-200">
          ¿Quieres saber en que estado se encuentra tu vehiculo? Ingresa la placa y conoce el estado actual de tu reparacion en tiempo real.
        </p>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row">
          <a
            href="/seguimiento"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center rounded-md bg-brandRed px-6 py-3 font-semibold text-white transition hover:opacity-90"
          >
            Ver estado de mi vehiculo
          </a>
          <p className="flex items-center text-sm text-zinc-300">
            <span className="mr-3 inline-block h-1 w-1 rounded-full bg-brandRed" />
            Consulta disponible 24/7
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="section-card">
          <h2 className="text-2xl font-semibold">Ubicacion y horarios</h2>
          <p className="mt-3 text-zinc-200">
            Barrio San Jose de Alajuela, Calle La Torre, Urbanizacion La Union, al puro fondo.
          </p>
          <p className="text-zinc-200">Lunes a Viernes: 8:00 a.m. - 6:00 p.m.</p>
          <p className="text-zinc-200">Sabado: 8:00 a.m. - 1:00 p.m.</p>
          <a
            href={mapsLink}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex rounded-md border border-zinc-500 px-4 py-3 font-semibold text-white transition hover:border-white"
          >
            Ver ubicacion en Google Maps
          </a>
          <p className="mt-4 text-zinc-200">
            WhatsApp:{" "}
            <span className="font-semibold text-white">
              {whatsappContacts.map((item) => item.number).join(" / ")}
            </span>
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {whatsappContacts.map((contact) => (
              <a
                key={contact.number}
                href={contact.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-md bg-brandRed px-4 py-3 font-semibold text-white transition hover:opacity-90"
              >
                WhatsApp ({contact.number})
              </a>
            ))}
          </div>
        </article>

        <article className="section-card">
          <h2 className="text-2xl font-semibold">Testimonios</h2>
          <div className="mt-3 space-y-3 text-zinc-200">
            <p>"Excelente trabajo de pintura y entrega puntual." - Cliente A</p>
            <p>"Muy buena comunicacion durante toda la reparacion." - Cliente B</p>
          </div>
        </article>
      </section>

      <a
        href="#navegacion-rapida"
        className="fixed bottom-5 right-5 z-50 rounded-full bg-brandRed px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-black/40 transition hover:opacity-90"
      >
        Volver a navegacion rapida
      </a>
    </main>
  );
}
