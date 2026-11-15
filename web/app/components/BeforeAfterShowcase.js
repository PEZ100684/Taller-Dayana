"use client";

import { useState } from "react";

const TRANSFORMATION_CASES = [
  {
    id: "case-1",
    title: "Restauración de Colisión y Pintura al Horno",
    subtitle: "Alineación de carrocería, preparación en cabina y barniz de alto brillo",
    beforeImg: "/cases/caso-proceso-1.jpg",
    afterImg: "/cases/caso-final-1.jpg",
    tag: "Enderezado + Cabina Presurizada",
    stats: ["Igualación Computarizada", "Secado al Horno", "Garantía Escrita"]
  },
  {
    id: "case-2",
    title: "Reconstrucción de Costado y Acabado Espejo",
    subtitle: "Desabollado técnico sin exceso de masilla y aplicación bicapa",
    beforeImg: "/cases/caso-proceso-2.jpg",
    afterImg: "/cases/caso-final-2.jpg",
    tag: "Lámina & Pintura Bicapa",
    stats: ["Cero Ojos de Pez", "Brillo Profundo UHS", "Entrega Puntual"]
  },
  {
    id: "case-3",
    title: "Renovación General y Pulido Profesional",
    subtitle: "Corrección de líneas, fondeo anticorrosivo y sellado cerámico",
    beforeImg: "/gallery/case_6_clean.jpg",
    afterImg: "/gallery/case_36_clean.jpg",
    tag: "Restauración Completa",
    stats: ["60+ Años de Experiencia", "Cabina Libre de Polvo", "Alajuela, CR"]
  }
];

export default function BeforeAfterShowcase({ promoVideoUrl = "/videos/taller-promo.mp4" }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [sliderPos, setSliderPos] = useState(52);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const current = TRANSFORMATION_CASES[activeIndex] || TRANSFORMATION_CASES[0];

  const handleMouseMoveCard = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ rx: -y * 7, ry: x * 7 });
  };

  return (
    <section className="section-card relative overflow-hidden border-red-600/40 bg-gradient-to-br from-zinc-950 via-zinc-900/95 to-zinc-950">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-red-600/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-zinc-500/10 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-600/15 px-3.5 py-1 text-xs font-extrabold uppercase tracking-widest text-red-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            Experiencia Interactiva 3D • Taller Dayana
          </span>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white md:text-3xl">
            Deslice para Comparar el <span className="text-red-500">Antes y Después</span> en Tiempo Real
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-zinc-300">
            Mueva el control central de izquierda a derecha sobre la fotografía o explore nuestro video de acabado automotriz.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {TRANSFORMATION_CASES.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`rounded-xl border px-3.5 py-2 text-xs font-bold transition ${
                activeIndex === idx
                  ? "border-red-500 bg-red-600 text-white shadow-lg shadow-red-600/30"
                  : "border-zinc-700 bg-zinc-900/90 text-zinc-300 hover:border-zinc-500 hover:text-white"
              }`}
            >
              Caso #{idx + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 mt-6 grid gap-6 lg:grid-cols-12">
        {/* Comparador Interactivo 3D Antes / Después */}
        <div
          onMouseMove={handleMouseMoveCard}
          onMouseLeave={() => setTilt({ rx: 0, ry: 0 })}
          style={{
            transform: `perspective(1100px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
            transition: "transform 160ms ease-out"
          }}
          className="lg:col-span-7"
        >
          <div className="relative h-[340px] w-full select-none overflow-hidden rounded-2xl border border-zinc-700/90 bg-zinc-950 shadow-2xl shadow-black sm:h-[410px]">
            {/* Imagen DESPUÉS (fondo completo) */}
            <img
              src={current.afterImg}
              alt={`Después - ${current.title}`}
              data-no-lightbox="true"
              className="h-full w-full object-cover"
            />

            {/* Imagen ANTES (recortada según el slider) */}
            <div
              className="absolute inset-y-0 left-0 overflow-hidden"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={current.beforeImg}
                alt={`Antes - ${current.title}`}
                data-no-lightbox="true"
                className="h-full max-w-none object-cover filter saturate-75 contrast-110"
                style={{ width: "100vw", maxWidth: "720px" }}
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
            </div>

            {/* Línea divisoria láser roja */}
            <div
              className="pointer-events-none absolute inset-y-0 z-20 w-1 bg-red-600 shadow-[0_0_18px_rgba(220,38,38,0.95)]"
              style={{ left: `calc(${sliderPos}% - 2px)` }}
            >
              <div className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-red-600 text-xs font-black text-white shadow-xl">
                ↔
              </div>
            </div>

            {/* Etiquetas ANTES y DESPUÉS */}
            <span className="pointer-events-none absolute left-3 top-3 z-20 rounded-lg border border-zinc-600 bg-black/80 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-zinc-200 backdrop-blur-md">
              Antes (Ingreso)
            </span>
            <span className="pointer-events-none absolute right-3 top-3 z-20 rounded-lg border border-red-500/60 bg-red-600/90 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-white shadow-lg backdrop-blur-md">
              Después (Acabado Dayana)
            </span>

            {/* Control deslizante invisible superpuesto para arrastrar */}
            <input
              type="range"
              min={5}
              max={95}
              value={sliderPos}
              onChange={(e) => setSliderPos(Number(e.target.value))}
              aria-label="Comparador antes y después"
              className="absolute inset-0 z-30 h-full w-full cursor-ew-resize opacity-0"
            />

            {/* Cintillo inferior informativo */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black via-black/85 to-transparent p-4">
              <span className="inline-block rounded bg-red-600/25 px-2 py-0.5 text-[11px] font-bold text-red-300">
                {current.tag}
              </span>
              <h3 className="mt-1 text-base font-bold text-white sm:text-lg">{current.title}</h3>
              <p className="text-xs text-zinc-300">{current.subtitle}</p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2.5 text-xs text-zinc-300">
            <span>👆 Arrastre el círculo rojo para revelar la transformación</span>
            <div className="flex flex-wrap gap-2">
              {current.stats.map((badge) => (
                <span
                  key={badge}
                  className="rounded-md border border-zinc-700 bg-zinc-950 px-2.5 py-1 font-semibold text-zinc-200"
                >
                  ✓ {badge}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Video Showcase + Acceso al Estudio Creativo IA */}
        <div className="flex flex-col justify-between gap-4 lg:col-span-5">
          <div className="relative overflow-hidden rounded-2xl border border-zinc-700/90 bg-zinc-950 p-4 shadow-2xl">
            <div className="mb-2.5 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-red-400">
                <span>🎬</span> Video Oficial • Precisión y Brillo
              </span>
              <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-300">
                Audio + HD
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-black">
              <video
                src={promoVideoUrl}
                poster="/logo-taller-dayana.jpg"
                controls
                playsInline
                preload="metadata"
                className="h-[210px] w-full object-cover"
              />
            </div>

            <p className="mt-2.5 text-xs leading-relaxed text-zinc-300">
              Conozca nuestro estándar en enderezado estructural, laboratorio de color y pintura horneada en Barrio San José de Alajuela.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <a
                href="/videos/taller-reel-9x16.mp4"
                download="Taller-Dayana-Reel-9x16.mp4"
                className="inline-flex items-center gap-1 rounded-lg border border-red-500/40 bg-red-600/15 px-2.5 py-1.5 text-[11px] font-bold text-red-200 transition hover:bg-red-600/30"
              >
                ⬇️ Reel Vertical 9:16 (TikTok / IG)
              </a>
              <a
                href="/videos/taller-promo.mp4"
                download="Taller-Dayana-Promo-16x9.mp4"
                className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-[11px] font-bold text-zinc-200 transition hover:border-red-500"
              >
                ⬇️ Video Horizontal 16:9 (FB / YT)
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-red-600/40 bg-gradient-to-r from-red-950/50 via-zinc-900 to-zinc-950 p-4 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="rounded-md bg-red-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                  Nuevo • Herramienta Personal IA
                </span>
                <h3 className="mt-1.5 text-base font-extrabold text-white">
                  Estudio Creativo para Redes Sociales
                </h3>
                <p className="mt-1 text-xs text-zinc-300">
                  Edite sus propias fotos o las de Google Drive, aplique el sello oficial de Taller Dayana y genere videos con audio en formato TikTok, Reels e Instagram.
                </p>
              </div>
            </div>
            <div className="mt-3.5 flex flex-wrap gap-2">
              <a
                href="/estudio"
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-500"
              >
                🎨 Abrir Estudio de Fotos y Videos
              </a>
              <a
                href="#seguimiento-reparacion"
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2.5 text-xs font-bold text-zinc-200 transition hover:border-red-500 hover:text-white"
              >
                🔍 Consultar Placa en Vivo
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
