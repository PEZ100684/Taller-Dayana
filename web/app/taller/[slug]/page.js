"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

export default function WorkshopSlugPage() {
  const params = useParams();
  const slug = params?.slug;

  useEffect(() => {
    if (slug && typeof window !== "undefined") {
      window.location.replace(`/?tenant=${encodeURIComponent(slug)}`);
    }
  }, [slug]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
      <div className="text-center space-y-3">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <p className="text-sm font-semibold text-zinc-300">Cargando plataforma del taller...</p>
      </div>
    </div>
  );
}
