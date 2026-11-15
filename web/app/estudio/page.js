"use client";

import { useEffect, useRef, useState } from "react";
import BrandLogo from "../components/BrandLogo";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_API_BASE_URL ||
  "https://taller-dayana-api.onrender.com";

const SOCIAL_FORMATS = [
  { id: "9:16", label: "TikTok / Reels / Stories (9:16)", width: 1080, height: 1920 },
  { id: "1:1", label: "Instagram / FB Cuadrado (1:1)", width: 1080, height: 1080 },
  { id: "4:5", label: "Instagram Vertical (4:5)", width: 1080, height: 1350 },
  { id: "16:9", label: "YouTube / Portada (16:9)", width: 1920, height: 1080 }
];

const FALLBACK_LOCAL_PHOTOS = [
  { id: "loc-1", title: "Acabado al Horno Final", url: "/cases/caso-final-1.jpg" },
  { id: "loc-2", title: "Proceso en Taller", url: "/cases/caso-proceso-1.jpg" },
  { id: "loc-3", title: "Entrega Impecable", url: "/cases/caso-final-2.jpg" },
  { id: "loc-4", title: "Preparación de Carrocería", url: "/cases/caso-proceso-2.jpg" },
  { id: "loc-5", title: "Pintura Bicapa", url: "/gallery/case_36_clean.jpg" },
  { id: "loc-6", title: "Restauración General", url: "/gallery/case_6_clean.jpg" }
];

function toCorsSafeUrl(url) {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("blob:") || url.startsWith("/")) {
    return url;
  }
  return `${API_BASE}/api/social-studio/proxy-image?url=${encodeURIComponent(url)}`;
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = toCorsSafeUrl(src);
  });
}

export default function SocialMediaStudioPage() {
  const [activeTab, setActiveTab] = useState("image"); // "image" | "video"
  const [drivePhotos, setDrivePhotos] = useState(FALLBACK_LOCAL_PHOTOS);
  const [plateSearch, setPlateSearch] = useState("AROS1");
  const [loadingDrive, setLoadingDrive] = useState(false);

  // Estado del Editor de Imagen
  const [formatId, setFormatId] = useState("9:16");
  const [layoutMode, setLayoutMode] = useState("single"); // "single" | "before-after"
  const [primaryImageSrc, setPrimaryImageSrc] = useState("/cases/caso-final-1.jpg");
  const [secondaryImageSrc, setSecondaryImageSrc] = useState("/cases/caso-proceso-1.jpg");

  const [headline, setHeadline] = useState("ACABADO DE FÁBRICA EN CABINA PRESURIZADA");
  const [subheadline, setSubheadline] = useState("📲 WhatsApp 7043-9248 / 8869-8157 • Alajuela, CR");
  const [badgeText, setBadgeText] = useState("GARANTÍA POR ESCRITO");
  const [showLogo, setShowLogo] = useState(true);
  const [showBanner, setShowBanner] = useState(true);

  const [brightness, setBrightness] = useState(105);
  const [contrast, setContrast] = useState(112);
  const [saturation, setSaturation] = useState(115);
  const [vignette, setVignette] = useState(45);
  const [redGlow, setRedGlow] = useState(35);
  const [zoom, setZoom] = useState(100);

  // IA Gemini (Edición de imagen + Copy de redes)
  const [aiPrompt, setAiPrompt] = useState(
    "Realza el brillo metálico de la pintura con iluminación dramática de estudio en tonos rojo, negro y gris."
  );
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiStatusMsg, setAiStatusMsg] = useState("");
  const [socialCaption, setSocialCaption] = useState("");
  const [generatingCaption, setGeneratingCaption] = useState(false);

  // Estado del Creador de Video con Audio
  const [selectedVideoSlides, setSelectedVideoSlides] = useState([
    "/cases/caso-proceso-1.jpg",
    "/cases/caso-final-1.jpg",
    "/cases/caso-proceso-2.jpg",
    "/cases/caso-final-2.jpg"
  ]);
  const [slideDurationSec, setSlideDurationSec] = useState(2.5);
  const [audioStyle, setAudioStyle] = useState("sport"); // "sport" | "cinematic" | "urban"
  const [recordingVideo, setRecordingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState("/videos/taller-promo.mp4");

  const imageCanvasRef = useRef(null);
  const videoCanvasRef = useRef(null);

  const currentFormat = SOCIAL_FORMATS.find((f) => f.id === formatId) || SOCIAL_FORMATS[0];

  // Cargar fotos reales de la galería de Google Drive al iniciar
  useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/api/gallery`)
      .then((r) => (r.ok ? r.json() : []))
      .then((items) => {
        if (!active || !Array.isArray(items) || items.length === 0) return;
        const mapped = items
          .filter((it) => it && (it.image || it.photoUrl) && it.mediaType !== "video")
          .slice(0, 24)
          .map((it, idx) => ({
            id: `drive-${it.id || idx}`,
            title: it.title || it.description || `Drive #${idx + 1}`,
            url: it.image || it.photoUrl
          }));
        if (mapped.length > 0) {
          setDrivePhotos([...mapped, ...FALLBACK_LOCAL_PHOTOS]);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const searchPhotosByPlate = async (e) => {
    if (e) e.preventDefault();
    const clean = String(plateSearch || "").trim().toUpperCase();
    if (!clean) return;
    setLoadingDrive(true);
    try {
      const res = await fetch(`${API_BASE}/api/repairs/status/${encodeURIComponent(clean)}`);
      const data = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(data.progressPhotos) && data.progressPhotos.length > 0) {
        const plateItems = data.progressPhotos
          .filter((p) => p.mediaType !== "video" && p.photoUrl)
          .map((p, idx) => ({
            id: `plate-${clean}-${idx}`,
            title: `${clean} • Foto #${idx + 1}`,
            url: p.photoUrl
          }));
        if (plateItems.length > 0) {
          setDrivePhotos((prev) => [...plateItems, ...prev]);
          setPrimaryImageSrc(plateItems[plateItems.length - 1].url);
          if (plateItems.length >= 2) {
            setSecondaryImageSrc(plateItems[0].url);
          }
          setSelectedVideoSlides(plateItems.slice(0, 6).map((x) => x.url));
        }
      }
    } catch (_err) {
      // Conservar galería actual
    } finally {
      setLoadingDrive(false);
    }
  };

  // Subir imagen propia desde el dispositivo
  const handleLocalFileUpload = (e, target = "primary") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      if (!dataUrl) return;
      setDrivePhotos((prev) => [
        { id: `upload-${Date.now()}`, title: file.name, url: dataUrl },
        ...prev
      ]);
      if (target === "secondary") {
        setSecondaryImageSrc(dataUrl);
      } else {
        setPrimaryImageSrc(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Dibujar imagen centrada tipo object-cover en un rectángulo
  const drawCoverImage = (ctx, img, x, y, w, h, extraScale = 1) => {
    const scale = Math.max(w / img.width, h / img.height) * extraScale;
    const nw = img.width * scale;
    const nh = img.height * scale;
    const nx = x + (w - nw) / 2;
    const ny = y + (h - nh) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.drawImage(img, nx, ny, nw, nh);
    ctx.restore();
  };

  // Renderizado en vivo del Editor de Imagen
  useEffect(() => {
    let cancelled = false;
    const renderCanvas = async () => {
      const canvas = imageCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const W = currentFormat.width;
      const H = currentFormat.height;
      canvas.width = W;
      canvas.height = H;

      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, W, H);

      try {
        const mainImg = await loadImageElement(primaryImageSrc);
        if (cancelled) return;

        ctx.save();
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

        if (layoutMode === "before-after") {
          const secondImg = await loadImageElement(secondaryImageSrc).catch(() => mainImg);
          if (cancelled) return;
          const halfH = Math.floor(H / 2);
          drawCoverImage(ctx, secondImg, 0, 0, W, halfH, zoom / 100);
          drawCoverImage(ctx, mainImg, 0, halfH, W, H - halfH, zoom / 100);

          ctx.filter = "none";
          // Línea divisoria láser roja
          ctx.fillStyle = "#dc2626";
          ctx.fillRect(0, halfH - 5, W, 10);

          // Etiquetas ANTES / DESPUÉS
          ctx.fillStyle = "rgba(9, 9, 11, 0.85)";
          ctx.fillRect(32, 32, 220, 58);
          ctx.strokeStyle = "#71717a";
          ctx.lineWidth = 3;
          ctx.strokeRect(32, 32, 220, 58);
          ctx.fillStyle = "#f8fafc";
          ctx.font = "900 28px Inter, Arial, sans-serif";
          ctx.fillText("ANTES", 88, 70);

          ctx.fillStyle = "rgba(220, 38, 38, 0.92)";
          ctx.fillRect(32, halfH + 28, 250, 58);
          ctx.fillStyle = "#ffffff";
          ctx.font = "900 28px Inter, Arial, sans-serif";
          ctx.fillText("DESPUÉS", 78, halfH + 66);
        } else {
          drawCoverImage(ctx, mainImg, 0, 0, W, H, zoom / 100);
        }
        ctx.restore();

        // Viñeta oscura cinematográfica
        if (vignette > 0) {
          const rad = ctx.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, Math.max(W, H) * 0.72);
          rad.addColorStop(0, "rgba(0,0,0,0)");
          rad.addColorStop(1, `rgba(9,9,11,${(vignette / 100) * 0.88})`);
          ctx.fillStyle = rad;
          ctx.fillRect(0, 0, W, H);
        }

        // Resplandor rojo automotriz (Red Glow)
        if (redGlow > 0) {
          const glow = ctx.createLinearGradient(0, H * 0.55, 0, H);
          glow.addColorStop(0, "rgba(220, 38, 38, 0)");
          glow.addColorStop(1, `rgba(220, 38, 38, ${(redGlow / 100) * 0.55})`);
          ctx.fillStyle = glow;
          ctx.fillRect(0, 0, W, H);
        }

        // Marco exterior metálico rojo/gris
        ctx.strokeStyle = "rgba(220, 38, 38, 0.75)";
        ctx.lineWidth = 10;
        ctx.strokeRect(18, 18, W - 36, H - 36);

        // Logo Oficial Taller Dayana
        if (showLogo) {
          try {
            const logoImg = await loadImageElement("/logo-taller-dayana.jpg");
            if (!cancelled) {
              const logoSize = Math.round(Math.min(W, H) * 0.16);
              const lx = W - logoSize - 42;
              const ly = 42;
              ctx.save();
              ctx.beginPath();
              ctx.arc(lx + logoSize / 2, ly + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
              ctx.closePath();
              ctx.clip();
              ctx.drawImage(logoImg, lx, ly, logoSize, logoSize);
              ctx.restore();

              ctx.beginPath();
              ctx.arc(lx + logoSize / 2, ly + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
              ctx.strokeStyle = "#dc2626";
              ctx.lineWidth = 6;
              ctx.stroke();
            }
          } catch (_e) {
            // Continuar si el logo no carga
          }
        }

        // Cintillo inferior profesional de marca
        if (showBanner) {
          const bannerH = Math.round(H * 0.2);
          const by = H - bannerH;
          const bGrad = ctx.createLinearGradient(0, by - 40, 0, H);
          bGrad.addColorStop(0, "rgba(9, 9, 11, 0)");
          bGrad.addColorStop(0.25, "rgba(9, 9, 11, 0.92)");
          bGrad.addColorStop(1, "rgba(9, 9, 11, 0.98)");
          ctx.fillStyle = bGrad;
          ctx.fillRect(0, by - 40, W, bannerH + 40);

          // Barra de acento roja
          ctx.fillStyle = "#dc2626";
          ctx.fillRect(48, by + 18, 14, bannerH - 58);

          // Badge superior
          if (badgeText) {
            ctx.font = "800 22px Inter, Arial, sans-serif";
            const bw = ctx.measureText(badgeText.toUpperCase()).width + 36;
            ctx.fillStyle = "#dc2626";
            ctx.fillRect(78, by + 14, bw, 38);
            ctx.fillStyle = "#ffffff";
            ctx.fillText(badgeText.toUpperCase(), 96, by + 40);
          }

          // Título principal
          ctx.fillStyle = "#f8fafc";
          ctx.font = `900 ${Math.round(W * 0.038)}px Inter, Arial, sans-serif`;
          ctx.fillText(headline.slice(0, 44), 78, by + 95);

          // Subtítulo de contacto
          ctx.fillStyle = "#d4d4d8";
          ctx.font = `600 ${Math.round(W * 0.025)}px Inter, Arial, sans-serif`;
          ctx.fillText(subheadline.slice(0, 65), 78, by + 142);
        }
      } catch (_err) {
        // Error cargando imagen
      }
    };

    renderCanvas();
    return () => {
      cancelled = true;
    };
  }, [
    currentFormat,
    layoutMode,
    primaryImageSrc,
    secondaryImageSrc,
    headline,
    subheadline,
    badgeText,
    showLogo,
    showBanner,
    brightness,
    contrast,
    saturation,
    vignette,
    redGlow,
    zoom
  ]);

  const downloadEditedImage = () => {
    const canvas = imageCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png", 1.0);
    const link = document.createElement("a");
    link.download = `taller-dayana-${formatId.replace(":", "x")}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Transformar la imagen actual con Gemini Image IA
  const applyGeminiImageEdit = async () => {
    const canvas = imageCanvasRef.current;
    if (!canvas || aiProcessing) return;
    setAiProcessing(true);
    setAiStatusMsg("Gemini está retocando tu imagen...");
    try {
      const base64Data = canvas.toDataURL("image/jpeg", 0.88);
      const response = await fetch(`${API_BASE}/api/social-studio/ai-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: "image/jpeg",
          prompt: aiPrompt
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.imageDataUrl) {
        throw new Error(payload.error || "No se pudo transformar la imagen con Gemini.");
      }
      setPrimaryImageSrc(payload.imageDataUrl);
      setAiStatusMsg("¡Imagen transformada con Gemini IA! Podés descargarla o seguir ajustándola.");
    } catch (err) {
      setAiStatusMsg(`Nota: ${err.message}`);
    } finally {
      setAiProcessing(false);
    }
  };

  // Generar Copy persuasivo y hashtags para redes sociales con Gemini
  const generateSocialCopy = async () => {
    if (generatingCaption) return;
    setGeneratingCaption(true);
    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Redacta una publicación corta, atractiva y profesional para Instagram, TikTok y Facebook de Taller Dayana sobre: "${headline}". Incluye llamada a la acción al WhatsApp 7043-9248, ubicación en Barrio San José de Alajuela y 6 hashtags relevantes.`
        })
      });
      const data = await response.json().catch(() => ({}));
      if (data.reply) {
        setSocialCaption(data.reply);
      }
    } catch (_e) {
      setSocialCaption(
        `🔥 ${headline} en Taller Dayana 🚗✨\n\nMás de 60 años devolviendo el brillo y la línea original a su vehículo en Barrio San José de Alajuela. Garantía por escrito en tono y acabado.\n\n📲 Cotizaciones y citas al WhatsApp: 7043-9248 / 8869-8157\n#TallerDayana #EnderezadoYPintura #Alajuela #CostaRica #PinturaAutomotriz #AutosCR`
      );
    } finally {
      setGeneratingCaption(false);
    }
  };

  // Creador de Videos con Audio Integrado (Web Audio API + Canvas 30fps + MediaRecorder)
  const generateSocialVideoWithAudio = async () => {
    if (recordingVideo || selectedVideoSlides.length === 0) return;
    const canvas = videoCanvasRef.current;
    if (!canvas) return;

    setRecordingVideo(true);
    setVideoProgress(5);

    const W = formatId === "16:9" ? 1280 : 720;
    const H = formatId === "16:9" ? 720 : 1280;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    try {
      const loadedSlides = [];
      for (const src of selectedVideoSlides) {
        try {
          const img = await loadImageElement(src);
          loadedSlides.push(img);
        } catch (_e) {
          // Ignorar imagen fallida
        }
      }
      if (loadedSlides.length === 0) {
        throw new Error("No se pudieron cargar las imágenes seleccionadas.");
      }

      let logoImg = null;
      try {
        logoImg = await loadImageElement("/logo-taller-dayana.jpg");
      } catch (_e) {}

      // Sintetizador de Audio Automotriz en Vivo (Web Audio API)
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      const dest = audioCtx.createMediaStreamDestination();

      const totalDurationSec = loadedSlides.length * slideDurationSec;
      const now = audioCtx.currentTime;

      // Bajo rítmico + acordes modernos según el estilo elegido
      const bpm = audioStyle === "sport" ? 124 : audioStyle === "urban" ? 105 : 92;
      const beatInterval = 60 / bpm;
      const totalBeats = Math.ceil(totalDurationSec / beatInterval);
      const notes =
        audioStyle === "sport"
          ? [110, 110, 130.81, 146.83, 164.81, 130.81]
          : audioStyle === "urban"
            ? [98, 116.54, 130.81, 146.83]
            : [82.41, 110, 123.47, 164.81];

      for (let b = 0; b < totalBeats; b++) {
        const t = now + b * beatInterval;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = audioStyle === "cinematic" ? "triangle" : "sawtooth";
        osc.frequency.setValueAtTime(notes[b % notes.length], t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.exponentialRampToValueAtTime(0.16, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + beatInterval * 0.88);

        osc.connect(gain);
        gain.connect(dest);
        osc.start(t);
        osc.stop(t + beatInterval * 0.9);
      }

      const canvasStream = canvas.captureStream(30);
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...dest.stream.getAudioTracks()
      ]);

      const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : "video/webm";

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 4500000
      });

      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      const donePromise = new Promise((resolve) => {
        recorder.onstop = () => resolve();
      });

      recorder.start(100);

      const startTime = performance.now();
      const totalMs = totalDurationSec * 1000;

      await new Promise((resolve) => {
        const step = (ts) => {
          const elapsed = ts - startTime;
          const progressRatio = Math.min(1, elapsed / totalMs);
          setVideoProgress(Math.round(progressRatio * 100));

          const slideIndex = Math.min(
            loadedSlides.length - 1,
            Math.floor(elapsed / (slideDurationSec * 1000))
          );
          const slideElapsed = (elapsed % (slideDurationSec * 1000)) / (slideDurationSec * 1000);
          const currentImg = loadedSlides[slideIndex];

          ctx.fillStyle = "#09090b";
          ctx.fillRect(0, 0, W, H);

          // Efecto Ken Burns 3D (zoom suave progresivo)
          const dynamicZoom = 1.02 + slideElapsed * 0.12;
          drawCoverImage(ctx, currentImg, 0, 0, W, H, dynamicZoom);

          // Resplandor rojo inferior
          const grad = ctx.createLinearGradient(0, H * 0.55, 0, H);
          grad.addColorStop(0, "rgba(9,9,11,0)");
          grad.addColorStop(0.65, "rgba(9,9,11,0.82)");
          grad.addColorStop(1, "rgba(220,38,38,0.48)");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, W, H);

          // Marco láser rojo
          ctx.strokeStyle = "rgba(220,38,38,0.85)";
          ctx.lineWidth = 8;
          ctx.strokeRect(14, 14, W - 28, H - 28);

          // Logo superior
          if (logoImg) {
            const lSize = Math.round(Math.min(W, H) * 0.15);
            const lx = W - lSize - 28;
            const ly = 28;
            ctx.save();
            ctx.beginPath();
            ctx.arc(lx + lSize / 2, ly + lSize / 2, lSize / 2, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(logoImg, lx, ly, lSize, lSize);
            ctx.restore();
          }

          // Textos dinámicos
          ctx.fillStyle = "#dc2626";
          ctx.fillRect(36, H - 175, 220, 32);
          ctx.fillStyle = "#ffffff";
          ctx.font = "900 17px Inter, Arial, sans-serif";
          ctx.fillText(badgeText.toUpperCase().slice(0, 22), 48, H - 153);

          ctx.fillStyle = "#f8fafc";
          ctx.font = `900 ${Math.round(W * 0.042)}px Inter, Arial, sans-serif`;
          ctx.fillText(headline.slice(0, 36), 36, H - 105);

          ctx.fillStyle = "#e4e4e7";
          ctx.font = `700 ${Math.round(W * 0.028)}px Inter, Arial, sans-serif`;
          ctx.fillText(subheadline.slice(0, 52), 36, H - 62);

          // Barra de progreso roja inferior
          ctx.fillStyle = "#dc2626";
          ctx.fillRect(14, H - 22, (W - 28) * progressRatio, 8);

          if (elapsed < totalMs) {
            requestAnimationFrame(step);
          } else {
            resolve();
          }
        };
        requestAnimationFrame(step);
      });

      recorder.stop();
      await donePromise;
      audioCtx.close().catch(() => {});

      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setGeneratedVideoUrl(url);
    } catch (err) {
      setAiStatusMsg(`Error generando video: ${err.message}`);
    } finally {
      setRecordingVideo(false);
    }
  };

  const toggleSlideSelection = (url) => {
    setSelectedVideoSlides((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  return (
    <div className="min-h-screen pb-20 text-white">
      {/* Barra superior */}
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <BrandLogo className="h-10 w-10 rounded-full object-cover ring-2 ring-red-600" />
            <div>
              <h1 className="text-base font-black tracking-tight text-white">
                Estudio Creativo IA • Taller Dayana
              </h1>
              <p className="text-xs text-zinc-400">
                Editor Personal de Fotos y Creador de Videos con Audio para Redes Sociales
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              className="rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-bold text-zinc-200 transition hover:border-red-500 hover:text-white"
            >
              ← Volver al Inicio
            </a>
            <a
              href="/admin"
              className="rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-red-500"
            >
              Panel Admin
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto mt-6 flex max-w-6xl flex-col gap-6 px-4 md:px-8">
        {/* Selector de Modo Principal */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/90 p-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("image")}
              className={`rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${
                activeTab === "image"
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                  : "bg-zinc-950 text-zinc-300 hover:text-white"
              }`}
            >
              🎨 1. Editor Personal de Imágenes (Posts / Antes y Después)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("video")}
              className={`rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${
                activeTab === "video"
                  ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                  : "bg-zinc-950 text-zinc-300 hover:text-white"
              }`}
            >
              🎬 2. Creador de Videos con Audio (TikTok / Reels / Shorts)
            </button>
          </div>

          {/* Buscador de fotos de Google Drive por Placa */}
          <form onSubmit={searchPhotosByPlate} className="flex items-center gap-2">
            <input
              type="text"
              value={plateSearch}
              onChange={(e) => setPlateSearch(e.target.value)}
              placeholder="Cargar placa (ej. AROS1)"
              className="w-40 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loadingDrive}
              className="rounded-xl border border-red-500/50 bg-red-600/20 px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-600 hover:text-white"
            >
              {loadingDrive ? "Cargando..." : "📂 Traer de Drive"}
            </button>
          </form>
        </div>

        {/* Galería rápida de Google Drive + Subida de Fotos Propias */}
        <section className="section-card p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-red-400">
                📂 Tus Fotos de Google Drive y Archivos Propios
              </h2>
              <p className="text-xs text-zinc-300">
                Tocá cualquier foto para usarla en tu diseño o subí una imagen desde tu celular/computadora.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="cursor-pointer rounded-xl bg-red-600 px-3.5 py-2 text-xs font-extrabold text-white transition hover:bg-red-500">
                📤 Subir Mi Propia Foto (Principal)
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLocalFileUpload(e, "primary")}
                  className="hidden"
                />
              </label>
              {layoutMode === "before-after" ? (
                <label className="cursor-pointer rounded-xl border border-zinc-600 bg-zinc-800 px-3.5 py-2 text-xs font-bold text-zinc-100 transition hover:border-white">
                  📤 Subir Foto &quot;Antes&quot;
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLocalFileUpload(e, "secondary")}
                    className="hidden"
                  />
                </label>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
            {drivePhotos.map((item) => {
              const isSelectedVideo = selectedVideoSlides.includes(item.url);
              const isPrimary = primaryImageSrc === item.url;
              return (
                <div
                  key={item.id}
                  className={`group relative w-28 shrink-0 overflow-hidden rounded-xl border-2 bg-zinc-950 transition ${
                    isPrimary || (activeTab === "video" && isSelectedVideo)
                      ? "border-red-500 shadow-lg shadow-red-600/30"
                      : "border-zinc-800 hover:border-zinc-600"
                  }`}
                >
                  <img
                    src={item.url}
                    alt={item.title}
                    data-no-lightbox="true"
                    onClick={() => {
                      if (activeTab === "video") {
                        toggleSlideSelection(item.url);
                      } else {
                        setPrimaryImageSrc(item.url);
                      }
                    }}
                    className="h-24 w-full cursor-pointer object-cover"
                  />
                  <div className="flex items-center justify-between gap-1 bg-zinc-950 px-1.5 py-1 text-[10px]">
                    <span className="truncate text-zinc-300">{item.title}</span>
                    {activeTab === "image" && layoutMode === "before-after" ? (
                      <button
                        type="button"
                        onClick={() => setSecondaryImageSrc(item.url)}
                        className="rounded bg-zinc-800 px-1.5 py-0.5 font-bold text-red-400 hover:bg-red-600 hover:text-white"
                        title="Usar como foto ANTES"
                      >
                        Antes
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {activeTab === "image" ? (
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Vista Previa del Lienzo (<canvas>) */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 p-5 lg:col-span-6">
              <div className="mb-3 flex w-full items-center justify-between text-xs text-zinc-400">
                <span className="font-bold text-white">Vista Previa en Tiempo Real</span>
                <span>
                  {currentFormat.width} × {currentFormat.height} px
                </span>
              </div>

              <div className="flex max-h-[540px] w-full items-center justify-center overflow-hidden rounded-xl border border-zinc-800 bg-black p-2">
                <canvas
                  ref={imageCanvasRef}
                  className="max-h-[510px] w-auto max-w-full rounded-lg object-contain shadow-2xl"
                />
              </div>

              <div className="mt-4 flex w-full flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={downloadEditedImage}
                  className="flex-1 rounded-xl bg-red-600 px-5 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-600/30 transition hover:bg-red-500"
                >
                  ⬇️ Descargar Imagen Lista para Redes (PNG HD)
                </button>
              </div>
            </div>

            {/* Controles del Editor Personal */}
            <div className="flex flex-col gap-4 lg:col-span-6">
              <div className="section-card space-y-4 p-5">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-400">
                  1. Formato de Red Social y Diseño
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  {SOCIAL_FORMATS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFormatId(f.id)}
                      className={`rounded-xl border px-3 py-2 text-left text-xs font-bold transition ${
                        formatId === f.id
                          ? "border-red-500 bg-red-600/20 text-white"
                          : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-600"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setLayoutMode("single")}
                    className={`flex-1 rounded-xl border px-3 py-2 text-xs font-bold ${
                      layoutMode === "single"
                        ? "border-red-500 bg-red-600 text-white"
                        : "border-zinc-700 bg-zinc-950 text-zinc-300"
                    }`}
                  >
                    Foto Individual
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayoutMode("before-after")}
                    className={`flex-1 rounded-xl border px-3 py-2 text-xs font-bold ${
                      layoutMode === "before-after"
                        ? "border-red-500 bg-red-600 text-white"
                        : "border-zinc-700 bg-zinc-950 text-zinc-300"
                    }`}
                  >
                    Comparativa Antes / Después
                  </button>
                </div>
              </div>

              <div className="section-card space-y-3 p-5">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-400">
                  2. Textos y Sello Oficial Taller Dayana
                </h3>
                <div>
                  <label className="text-[11px] font-bold text-zinc-300">Título Principal</label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="input-modern mt-1 py-2 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-300">Subtítulo / WhatsApp</label>
                    <input
                      type="text"
                      value={subheadline}
                      onChange={(e) => setSubheadline(e.target.value)}
                      className="input-modern mt-1 py-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-300">Insignia Roja</label>
                    <input
                      type="text"
                      value={badgeText}
                      onChange={(e) => setBadgeText(e.target.value)}
                      className="input-modern mt-1 py-2 text-xs"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 pt-1 text-xs">
                  <label className="flex items-center gap-2 font-semibold text-zinc-200">
                    <input
                      type="checkbox"
                      checked={showLogo}
                      onChange={(e) => setShowLogo(e.target.checked)}
                    />
                    Incluir Logo Oficial Taller Dayana
                  </label>
                  <label className="flex items-center gap-2 font-semibold text-zinc-200">
                    <input
                      type="checkbox"
                      checked={showBanner}
                      onChange={(e) => setShowBanner(e.target.checked)}
                    />
                    Incluir Cintillo Inferior
                  </label>
                </div>
              </div>

              <div className="section-card space-y-3 p-5">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-400">
                  3. Ajustes de Color, Brillo y Efecto 3D Rojo/Negro
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <label className="flex flex-col gap-1">
                    <span>Brillo ({brightness}%)</span>
                    <input
                      type="range"
                      min={60}
                      max={150}
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>Contraste ({contrast}%)</span>
                    <input
                      type="range"
                      min={70}
                      max={160}
                      value={contrast}
                      onChange={(e) => setContrast(Number(e.target.value))}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>Saturación ({saturation}%)</span>
                    <input
                      type="range"
                      min={50}
                      max={170}
                      value={saturation}
                      onChange={(e) => setSaturation(Number(e.target.value))}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>Resplandor Rojo ({redGlow}%)</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={redGlow}
                      onChange={(e) => setRedGlow(Number(e.target.value))}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>Viñeta Oscura ({vignette}%)</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={vignette}
                      onChange={(e) => setVignette(Number(e.target.value))}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span>Zoom ({zoom}%)</span>
                    <input
                      type="range"
                      min={100}
                      max={160}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                    />
                  </label>
                </div>
              </div>

              {/* Retoque con Gemini IA y Generador de Copy */}
              <div className="section-card space-y-3 border-red-600/40 p-5">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-400">
                  4. Asistente Creativo Gemini IA (Imagen + Texto para Redes)
                </h3>
                <textarea
                  rows={2}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  className="input-modern text-xs"
                  placeholder="Instrucción para que Gemini retoque la imagen..."
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={applyGeminiImageEdit}
                    disabled={aiProcessing}
                    className="rounded-xl bg-red-600 px-3.5 py-2 text-xs font-extrabold text-white transition hover:bg-red-500 disabled:opacity-50"
                  >
                    {aiProcessing ? "Procesando con Gemini..." : "✨ Retocar Foto con Gemini IA"}
                  </button>
                  <button
                    type="button"
                    onClick={generateSocialCopy}
                    disabled={generatingCaption}
                    className="rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-xs font-bold text-zinc-200 transition hover:border-red-500 hover:text-white"
                  >
                    {generatingCaption ? "Redactando..." : "📝 Generar Texto y Hashtags"}
                  </button>
                </div>
                {aiStatusMsg ? <p className="text-xs text-amber-300">{aiStatusMsg}</p> : null}
                {socialCaption ? (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-200">
                    <p className="whitespace-pre-wrap">{socialCaption}</p>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(socialCaption)}
                      className="mt-2 rounded-lg bg-zinc-800 px-2.5 py-1 text-[11px] font-bold text-red-400 hover:text-white"
                    >
                      📋 Copiar texto para Instagram / TikTok
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          /* Pestaña 2: Creador de Videos con Audio */
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950 p-5 lg:col-span-6">
              <div className="mb-3 flex w-full items-center justify-between text-xs">
                <span className="font-bold text-white">Reproductor y Grabador de Video con Audio</span>
                <span className="text-red-400">{selectedVideoSlides.length} fotos en secuencia</span>
              </div>

              <canvas ref={videoCanvasRef} className="hidden" />

              {generatedVideoUrl ? (
                <video
                  key={generatedVideoUrl}
                  src={generatedVideoUrl}
                  controls
                  playsInline
                  className="max-h-[480px] w-auto rounded-xl border border-zinc-800 bg-black shadow-2xl"
                />
              ) : null}

              <div className="mt-4 flex w-full flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={generateSocialVideoWithAudio}
                  disabled={recordingVideo}
                  className="flex-1 rounded-xl bg-red-600 px-5 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-red-600/30 transition hover:bg-red-500 disabled:opacity-50"
                >
                  {recordingVideo
                    ? `🎬 Renderizando Video + Audio (${videoProgress}%)...`
                    : "🎬 Generar Nuevo Video con Audio desde Fotos Seleccionadas"}
                </button>
                {generatedVideoUrl ? (
                  <a
                    href={generatedVideoUrl}
                    download={`taller-dayana-reel-${Date.now()}.webm`}
                    className="inline-flex items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-xs font-bold text-white transition hover:border-red-500"
                  >
                    ⬇️ Descargar Video
                  </a>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:col-span-6">
              <div className="section-card space-y-4 p-5">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-red-400">
                  Configuración del Video para TikTok / Reels / Shorts
                </h3>
                <p className="text-xs text-zinc-300">
                  Seleccioná arriba las fotos de tu carpeta de Google Drive (o subí las tuyas). El estudio creará automáticamente un video con movimiento 3D, logo oficial de Taller Dayana y pista musical integrada.
                </p>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-zinc-300">Formato de Video</label>
                    <select
                      value={formatId}
                      onChange={(e) => setFormatId(e.target.value)}
                      className="input-modern mt-1 py-2 text-xs"
                    >
                      <option value="9:16">Vertical 9:16 (TikTok / Reels / Stories)</option>
                      <option value="16:9">Horizontal 16:9 (YouTube / Web)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-zinc-300">Duración por Foto</label>
                    <select
                      value={slideDurationSec}
                      onChange={(e) => setSlideDurationSec(Number(e.target.value))}
                      className="input-modern mt-1 py-2 text-xs"
                    >
                      <option value={2}>2.0 segundos (Dinámico)</option>
                      <option value={2.5}>2.5 segundos (Recomendado)</option>
                      <option value={3.5}>3.5 segundos (Detallado)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300">Estilo de Audio Integrado</label>
                  <div className="mt-1.5 grid grid-cols-3 gap-2 text-xs">
                    {[
                      { id: "sport", label: "🔊 Beat Deportivo" },
                      { id: "urban", label: "🎵 Pulso Urbano" },
                      { id: "cinematic", label: "🎬 Cinemático" }
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setAudioStyle(st.id)}
                        className={`rounded-xl border px-3 py-2 font-bold ${
                          audioStyle === st.id
                            ? "border-red-500 bg-red-600 text-white"
                            : "border-zinc-800 bg-zinc-950 text-zinc-300"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
