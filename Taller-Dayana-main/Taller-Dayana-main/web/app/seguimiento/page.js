"use client";

import { useState } from "react";

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
    number: "8689-8157",
    link: "https://wa.me/50686898157?text=Hola%2C%20quisiera%20saber%20sobre%20mi%20reparacion"
  }
];

export default function SeguimientoPage() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";
  const [plate, setPlate] = useState("");
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      setError("Por favor ingresa una placa de vehiculo");
      return;
    }

    setLoading(true);
    setError(null);
    setStatus(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/repairs/status/${plate.toUpperCase()}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError("No se encontro informacion para esta placa. Verifica el numero de placa.");
        } else {
          setError("Error al consultar el estado. Intenta de nuevo.");
        }
        return;
      }

      const data = await response.json();
      setStatus(data);
    } catch (err) {
      setError("Error de conexion. Verifica tu conexion a internet.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-8 text-white md:px-8">
      {/* Header */}
      <section className="section-card border-brandRed/40 bg-gradient-to-br from-zinc-950 to-zinc-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-4xl">
            <p className="text-sm uppercase tracking-[0.3em] text-brandRed">Seguimiento</p>
            <h1 className="mb-2 mt-2 text-4xl font-bold">Seguimiento de tu Vehiculo</h1>
            <p className="text-lg text-zinc-300">Consulta el estado actual de tu reparacion</p>
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
              <span className="mb-2 block font-semibold text-white">Ingresa la placa de tu vehiculo</span>
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
                <p className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Placa de vehiculo</p>
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
                <p className="mb-3 font-semibold text-white">¿Que significa cada estado?</p>
                <ul className="space-y-2 text-sm text-zinc-300">
                  <li>
                    <span className="font-semibold">Presupuesto Recibido:</span> Hemos evaluado tu vehiculo
                  </li>
                  <li>
                    <span className="font-semibold">Cita Agendada:</span> Se ha confirmado la fecha de inicio
                  </li>
                  <li>
                    <span className="font-semibold">En Proceso:</span> Tu vehiculo esta siendo reparado
                  </li>
                  <li>
                    <span className="font-semibold">Listo para Recoger:</span> Finalizado, puedes venir a recogerlo
                  </li>
                </ul>
              </div>

              {/* Progress Photos */}
              <div className="mt-8">
                <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">Fotos de Avance</p>
                {Array.isArray(status.progressPhotos) && status.progressPhotos.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {[...status.progressPhotos]
                      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .map((photo) => (
                        <article key={photo.id} className="rounded-lg border border-zinc-700 bg-zinc-900 p-3">
                          <img
                            src={resolvePhotoUrl(photo.photoUrl)}
                            alt={photo.description || "Foto de avance"}
                            className="h-52 w-full rounded-md border border-zinc-700 object-cover"
                          />
                          <p className="mt-3 text-sm text-zinc-200">{photo.description || "Avance registrado"}</p>
                          <p className="mt-1 text-xs text-zinc-400">{new Date(photo.createdAt).toLocaleString()}</p>
                          <a
                            href={resolvePhotoUrl(photo.photoUrl)}
                            download={`avance-${status.plate || "vehiculo"}-${photo.id}.jpg`}
                            className="mt-3 inline-block rounded-md border border-zinc-500 px-3 py-2 text-xs font-semibold text-zinc-100 transition hover:border-white"
                          >
                            Descargar foto
                          </a>
                        </article>
                      ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 text-sm text-zinc-300">
                    Aun no hay fotos de avance para esta placa.
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div className="mt-8 rounded-lg border border-zinc-700 bg-gradient-to-br from-zinc-900 to-zinc-950 p-4">
                <p className="mb-3 font-semibold text-white">¿Preguntas sobre tu reparacion?</p>
                <p className="mb-4 text-sm text-zinc-300">
                  Contactanos directamente por WhatsApp para mas informacion
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
          <h2 className="mb-8 border-l-4 border-brandRed pl-3 text-2xl font-bold text-white">Como usar el seguimiento</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border border-zinc-700 bg-zinc-950 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-red-900/30">
                <span className="text-2xl font-bold text-brandRed">1</span>
              </div>
              <h3 className="mb-2 font-semibold text-white">Ingresa tu placa</h3>
              <p className="text-sm text-zinc-300">Escribe el numero de placa de tu vehiculo en el campo de arriba</p>
            </div>
            <div className="rounded-lg border border-zinc-700 bg-zinc-950 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-red-900/30">
                <span className="text-2xl font-bold text-brandRed">2</span>
              </div>
              <h3 className="mb-2 font-semibold text-white">Consulta el estado</h3>
              <p className="text-sm text-zinc-300">Presiona el boton para ver el estado actual de tu reparacion</p>
            </div>
            <div className="rounded-lg border border-zinc-700 bg-zinc-950 p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-red-900/30">
                <span className="text-2xl font-bold text-brandRed">3</span>
              </div>
              <h3 className="mb-2 font-semibold text-white">Recibe actualizaciones</h3>
              <p className="text-sm text-zinc-300">Contactanos si deseas mas informacion detallada</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
