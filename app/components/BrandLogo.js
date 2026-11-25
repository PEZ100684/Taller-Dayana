"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function BrandLogo({
  src = "/logo-taller-dayana.jpg",
  alt = "Logo Taller Dayana",
  className = "h-12 w-12 rounded-full object-cover ring-2 ring-brandRed/50 shadow-lg"
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen(true);
        }}
        title="Clic para ampliar el logo"
        aria-label="Ampliar logo de Taller Dayana"
        className="group relative shrink-0 cursor-zoom-in rounded-full focus:outline-none focus:ring-2 focus:ring-brandRed"
      >
        <img
          src={src}
          alt={alt}
          className={`${className} transition duration-200 group-hover:scale-105`}
        />
      </button>

      {mounted &&
        open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Logo ampliado de Taller Dayana"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          >
            <div
              onClick={(event) => event.stopPropagation()}
              className="relative flex max-w-lg flex-col items-center gap-4 rounded-2xl border border-zinc-700 bg-zinc-950 p-5 shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar vista ampliada"
                className="absolute right-3 top-3 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs font-bold text-zinc-200 transition hover:border-brandRed hover:text-white"
              >
                ✕ Cerrar
              </button>
              <img
                src={src}
                alt={alt}
                className="mt-4 max-h-[75vh] w-full max-w-md rounded-2xl object-contain shadow-xl"
              />
              <p className="text-center text-xs text-zinc-400">
                Taller Dayana • Servicio Automotriz • Calidad &amp; Confianza
              </p>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
