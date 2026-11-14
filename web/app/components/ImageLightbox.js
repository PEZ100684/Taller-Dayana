"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export function openMediaLightbox({ kind = "image", src, title = "" }) {
  if (typeof window === "undefined" || !src) return;
  window.dispatchEvent(
    new CustomEvent("taller-open-media", {
      detail: { kind, src, title }
    })
  );
}

export default function ImageLightbox() {
  const [activeMedia, setActiveMedia] = useState(null);
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

      setActiveMedia({
        kind: "image",
        src,
        title: target.getAttribute("alt") || "Imagen ampliada"
      });
    };

    const handleCustomMedia = (event) => {
      const detail = event && event.detail ? event.detail : null;
      if (!detail || !detail.src) return;
      setActiveMedia({
        kind: detail.kind || "image",
        src: detail.src,
        title: detail.title || ""
      });
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setActiveMedia(null);
      }
    };

    document.addEventListener("click", handleClick);
    window.addEventListener("taller-open-media", handleCustomMedia);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("taller-open-media", handleCustomMedia);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!mounted || !activeMedia) {
    return null;
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={activeMedia.title || "Vista ampliada"}
      onClick={() => setActiveMedia(null)}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col items-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-950 p-4 shadow-2xl"
      >
        <button
          type="button"
          onClick={() => setActiveMedia(null)}
          aria-label="Cerrar vista ampliada"
          className="absolute right-3 top-3 z-10 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs font-bold text-zinc-200 transition hover:border-brandRed hover:text-white"
        >
          ✕ Cerrar
        </button>

        {activeMedia.kind === "iframe" ? (
          <div className="mt-6 aspect-video w-full overflow-hidden rounded-xl bg-black">
            <iframe
              src={activeMedia.src}
              className="h-full w-full border-0"
              allow="autoplay; encrypted-media; fullscreen"
              allowFullScreen
              title={activeMedia.title || "Video ampliado"}
            />
          </div>
        ) : activeMedia.kind === "video" ? (
          <video
            src={activeMedia.src}
            controls
            autoPlay
            playsInline
            className="mt-6 max-h-[78vh] w-full rounded-xl bg-black object-contain"
          />
        ) : (
          <img
            src={activeMedia.src}
            alt={activeMedia.title || "Imagen ampliada"}
            referrerPolicy="no-referrer"
            className="mt-4 max-h-[78vh] w-full rounded-xl object-contain"
          />
        )}

        {activeMedia.title ? (
          <p className="text-center text-xs text-zinc-300">{activeMedia.title}</p>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
