"use client";

import { useState, useEffect, useCallback } from "react";

const statusColors = {
  scheduled: "bg-blue-950/40 border-blue-700 text-blue-100",
  in_progress: "bg-amber-950/40 border-amber-700 text-amber-100",
  ready: "bg-emerald-950/40 border-emerald-700 text-emerald-100",
  completed: "bg-green-950/40 border-green-700 text-green-100",
  received: "bg-zinc-800 border-zinc-600 text-zinc-100",
  no_appointment: "bg-zinc-900 border-zinc-700 text-zinc-200",
  "no appointment": "bg-zinc-900 border-zinc-700 text-zinc-200",
  no_quote: "bg-zinc-900 border-zinc-700 text-zinc-200",
  "no quote": "bg-zinc-900 border-zinc-700 text-zinc-200"
};

const statusLabels = {
  scheduled: "Cita Agendada",
  in_progress: "En Proceso",
  ready: "Listo para Recoger",
  completed: "Completado",
  received: "Presupuesto Recibido",
  no_appointment: "Sin Cita",
  "no appointment": "Sin Cita",
  no_quote: "Sin Presupuesto",
  "no quote": "Sin Presupuesto"
};

const whatsappContacts = [
  {
    number: "7043-9248",
    link: "https://wa.me/50670439248?text=Hola%2C%20quisiera%20saber%20sobre%20mi%20reparacion"
  },
  {
    number: "8869-8157",
    link: "https://wa.me/50688698157?text=Hola%2C%20quisiera%20saber%20sobre%20mi%20reparacion"
  }
];

export default function SeguimientoPage() {
  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_API_BASE_URL ||
    "https://taller-dayana-api.onrender.com";
  const [plate, setPlate] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStatusForPlate = useCallback(async (targetPlate) => {
    const clean = String(targetPlate || "").trim().toUpperCase();
    if (!clean) return;

    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const tenantParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("tenant") : "";
      const tenantQuery = tenantParam ? `?tenant=${encodeURIComponent(tenantParam)}` : "";
      const response = await fetch(`${apiBaseUrl}/api/repairs/status/${clean}${tenantQuery}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError("No se encontró información para esta placa. Verifica el número de placa.");
        } else {
          setError("Error al consultar el estado. Intenta de nuevo.");
        }
        return;
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError("Error de conexión. Verifica tu conexión a internet.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const paramPlate = new URLSearchParams(window.location.search).get("plate");
      if (paramPlate) {
        setPlate(paramPlate.toUpperCase());
        fetchStatusForPlate(paramPlate);
      }
    }
  }, [fetchStatusForPlate]);

  const isVideoItem = (item) => {
    if (!item) return false;
    if (item.mediaType === "video" || Boolean(item.videoUrl)) return true;
    const url = String(item.photoUrl || "").toLowerCase();
    const desc = String(item.description || "").toLowerCase();
    return (
      url.endsWith(".mp4") ||
      url.endsWith(".mov") ||
      url.endsWith(".webm") ||
      url.includes("/video") ||
      desc.includes("video")
    );
  };

  const resolvePhotoUrl = (photoUrl) => {
    if (!photoUrl || typeof photoUrl !== "string") {
      return "";
    }

    if (photoUrl.startsWith("/")) {
      return `${apiBaseUrl}${photoUrl}`;
    }

    return photoUrl;
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!plate.trim()) {
      setError("Por favor ingresa una placa de vehículo");
      return;
    }
    await fetchStatusForPlate(plate);
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-8 text-white md:px-8">
      {/* Header */}
      <section className="section-card border-brandRed/40 bg-gradient-to-br from-zinc-950 to-zinc-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-4xl">
            <p className="text-sm uppercase tracking-[0.3em] text-brandRed">Seguimiento</p>
            <h1 className="mb-2 mt-2 text-4xl font-bold">Seguimiento de tu Vehículo</h1>
            <p className="text-lg text-zinc-300">Consulta el estado actual de tu reparación</p>
          </div>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-zinc-600 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-100 transition hover:border-brandRed hover:text-white"
          >
            ← Volver al inicio
          </a>
        </div>
      </section>

      {/* Search Section */}
      <section className="section-card">
        <div className="mx-auto max-w-3xl">
          <form onSubmit={handleSearch} className="rounded-xl border border-zinc-700 bg-zinc-950 p-8">
            <label className="mb-4 block">
              <span className="mb-2 block font-semibold text-white">Ingresa la placa de tu vehículo</span>
              <input
                type="text"
                value={plate}
                onChange={(e) => setPlate(e.target.value.toUpperCase())}
                placeholder="Ej: CR123456"
                className="w-full rounded-lg border border-zinc-600 bg-zinc-900 px-4 py-3 text-lg text-white placeholder:text-zinc-400 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brandRed px-6 py-3 font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "Buscando..." : "Consultar Estado"}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="mt-6 rounded-lg border border-red-500/60 bg-red-950/40 p-4 text-red-100">
              <p className="font-semibold">{error}</p>
            </div>
          )}
        </div>
      </section>

      {/* Results Section */}
      {status && (
        <section className="section-card">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-xl border border-zinc-700 bg-zinc-950 p-8">
              {/* Plate Info */}
              <div className="mb-8 border-b border-zinc-700 pb-6">
                <p className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Placa de vehículo</p>
                <p className="mt-2 text-3xl font-bold text-white">{status.plate}</p>
              </div>

              {/* Status Cards */}
              <div className="space-y-6">
                {/* Appointment Status */}
                <div>
                  <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">Estado de Cita</p>
                  <div className={`rounded-lg border-2 p-4 ${statusColors[status.appointmentStatus] || statusColors.no_appointment}`}>
                    <p className="text-lg font-semibold">{statusLabels[status.appointmentStatus] || "Sin Cita"}</p>
                  </div>
                </div>

                {/* Quote Status */}
                <div>
                  <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">Estado de Presupuesto</p>
                  <div className={`rounded-lg border-2 p-4 ${statusColors[status.quoteStatus] || statusColors.no_quote}`}>
                    <p className="text-lg font-semibold">{statusLabels[status.quoteStatus] || "Sin Presupuesto"}</p>
                  </div>
                </div>
              </div>

              {/* Status Guide */}
              <div className="mt-8 rounded-lg border-l-4 border-brandRed bg-zinc-900 p-4">
                <p className="mb-3 font-semibold text-white">¿Qué significa cada estado?</p>
                <ul className="space-y-2 text-sm text-zinc-300">
                  <li>
                    <span className="font-semibold">Presupuesto Recibido:</span> Hemos evaluado tu vehículo
                  </li>
                  <li>
                    <span className="font-semibold">Cita Agendada:</span> Se ha confirmado la fecha de inicio
                  </li>
                  <li>
                    <span className="font-semibold">En Proceso:</span> Tu vehículo está siendo reparado
                  </li>
                  <li>
                    <span className="font-semibold">Listo para Recoger:</span> Finalizado, puedes venir a recogerlo
                  </li>
                </ul>
              </div>

              {/* Progress Photos and Videos */}
              <div className="mt-8">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
                    Fotos y Videos de Avance {Array.isArray(status.progressPhotos) ? `(${status.progressPhotos.length})` : ""}
                  </p>
                  <span className="text-xs text-zinc-400">Actualizado con Google Drive 24/7</span>
                </div>
                {Array.isArray(status.progressPhotos) && status.progressPhotos.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {[...status.progressPhotos]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((item) => {
                        const isVideo = isVideoItem(item);
                        const mediaSrc = resolvePhotoUrl(item.photoUrl);
                        return (
                          <article key={item.id} className="flex flex-col justify-between rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-lg">
                            <div>
                              {isVideo ? (
                                <div className="relative aspect-video w-full overflow-hidden rounded-md border border-zinc-700 bg-black">
                                  {item.videoUrl ? (
                                    <iframe
                                      src={item.videoUrl}
                                      className="h-full w-full border-0"
                                      allow="autoplay; encrypted-media; fullscreen"
                                      allowFullScreen
                                      title={item.description || "Video de avance"}
                                    />
                                  ) : (
                                    <video
                                      src={mediaSrc}
                                      controls
                                      playsInline
                                      className="h-full w-full object-contain"
                                    />
                                  )}
                                  <span className="pointer-events-none absolute left-2 top-2 rounded bg-red-600 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white shadow">
                                    ▶ Video
                                  </span>
                                </div>
                              ) : (
                                <div className="relative overflow-hidden rounded-md border border-zinc-700">
                                  <img
                                    src={mediaSrc}
                                    alt={item.description || "Foto de avance"}
                                    className="h-56 w-full object-cover transition duration-300 hover:scale-105"
                                    loading="lazy"
                                  />
                                  <span className="pointer-events-none absolute left-2 top-2 rounded bg-zinc-950/80 px-2 py-0.5 text-[11px] font-medium text-zinc-200 backdrop-blur">
                                    📷 Foto
                                  </span>
                                </div>
                              )}
                              <p className="mt-3 font-medium text-zinc-100">{item.description || (isVideo ? "Video de avance" : "Foto de avance")}</p>
                              <p className="mt-1 text-xs text-zinc-400">
                                {item.createdAt ? new Date(item.createdAt).toLocaleString("es-CR") : "Fecha no registrada"}
                              </p>
                            </div>
                            <div className="mt-3 flex items-center gap-2 border-t border-zinc-800 pt-3">
                              <a
                                href={item.videoUrl ? (item.fileId ? `https://drive.google.com/file/d/${item.fileId}/view` : mediaSrc) : mediaSrc}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-md border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-100 transition hover:border-brandRed hover:text-white"
                              >
                                {isVideo ? "Ver en Drive / Pantalla completa ↗" : "Ver en alta resolución ↗"}
                              </a>
                            </div>
                          </article>
                        );
                      })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-6 text-center text-sm text-zinc-300">
                    Aún no hay fotos o videos de avance registrados para esta placa.
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div className="mt-8 rounded-lg border border-zinc-700 bg-gradient-to-br from-zinc-900 to-zinc-950 p-4">
                <p className="mb-3 font-semibold text-white">¿Preguntas sobre tu reparación?</p>
                <p className="mb-4 text-sm text-zinc-300">
                  Contáctanos directamente por WhatsApp para más información
                </p>
                <div className="flex flex-wrap gap-3">
                  {whatsappContacts.map((contact) => (
                    <a
                      key={contact.number}
                      href={contact.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded-lg bg-green-500 px-6 py-2 font-semibold text-white transition hover:bg-green-600"
                    >
                      WhatsApp ({contact.number})
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Info Section */}
      <section className="section-card">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 border-l-4 border-brandRed pl-3 text-2xl font-bold text-white">Cómo usar el seguimiento</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border border-zinc-700 bg-zinc-950 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-red-900/30">
                <span className="text-2xl font-bold text-brandRed">1</span>
              </div>
              <h3 className="mb-2 font-semibold text-white">Ingresa tu placa</h3>
              <p className="text-sm text-zinc-300">Escribe el número de placa de tu vehículo en el campo de arriba</p>
            </div>
            <div className="rounded-lg border border-zinc-700 bg-zinc-950 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-red-900/30">
                <span className="text-2xl font-bold text-brandRed">2</span>
              </div>
              <h3 className="mb-2 font-semibold text-white">Consulta el estado</h3>
              <p className="text-sm text-zinc-300">Presiona el botón para ver el estado actual de tu reparación</p>
            </div>
            <div className="rounded-lg border border-zinc-700 bg-zinc-950 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-red-900/30">
                <span className="text-2xl font-bold text-brandRed">3</span>
              </div>
              <h3 className="mb-2 font-semibold text-white">Recibe actualizaciones</h3>
              <p className="text-sm text-zinc-300">Contáctanos si deseas más información detallada</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
