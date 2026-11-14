"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function ImageLightbox() {
  const [activeImage, setActiveImage] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClick = (event) => {
      const target = event.target;
      if (!(target instanceof HTMLImageElement)) {
        return;
      }

      if (
        target.dataset.noLightbox === "true" ||
        target.closest("button, a, [role='dialog']")
      ) {
        return;
      }

      const rect = target.getBoundingClientRect();
      if (rect.width < 44 && rect.height < 44) {
        return;
      }

      const src = target.currentSrc || target.getAttribute("src");
      if (!src) {
        return;
      }

      setActiveImage({
        src,
        alt: target.getAttribute("alt") || "Imagen ampliada"
      });
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setActiveImage(null);
      }
    };

    document.addEventListener("click", handleClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!mounted || !activeImage) {
    return null;
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={activeImage.alt}
      onClick={() => setActiveImage(null)}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-950 p-4 shadow-2xl"
      >
        <button
          type="button"
          onClick={() => setActiveImage(null)}
          aria-label="Cerrar imagen ampliada"
          className="absolute right-3 top-3 z-10 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs font-bold text-zinc-200 transition hover:border-brandRed hover:text-white"
        >
          ✕ Cerrar
        </button>
        <img
          src={activeImage.src}
          alt={activeImage.alt}
          referrerPolicy="no-referrer"
          className="mt-4 max-h-[78vh] w-full rounded-xl object-contain"
        />
        {activeImage.alt ? (
          <p className="text-center text-xs text-zinc-300">{activeImage.alt}</p>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
