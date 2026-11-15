"use client";

import { useEffect, useRef, useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_API_BASE_URL ||
  "https://taller-dayana-api.onrender.com";

const QUICK_PROMPTS = [
  "¿Cuánto cuesta pintar un bumper?",
  "¿Dónde están ubicados y cuál es el horario?",
  "¿Cómo agendo una cita de valoración?",
  "Quiero consultar el estado de mi vehículo"
];

export default function GeminiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "model",
      text: "¡Hola! Soy el Asistente Inteligente de Taller Dayana (con Gemini). Puedo ayudarte con precios orientativos, horarios, ubicación, citas o consultar el estado de tu carro si me indicás tu placa."
    }
  ]);
  const endRef = useRef(null);

  useEffect(() => {
    if (isOpen && endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messages, loading]);

  const sendMessage = async (rawText) => {
    const text = String(rawText ?? input).trim();
    if (!text || loading) {
      return;
    }

    const nextMessages = [...messages, { role: "user", text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          message: text,
          history: nextMessages.slice(1, -1)
        })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.reply) {
        throw new Error(payload.error || "No pude conectarme con Gemini en este momento.");
      }

      setMessages((prev) => [...prev, { role: "model", text: payload.reply }]);
    } catch (error) {
      const errorText =
        error?.name === "AbortError"
          ? "La consulta tardó más de lo esperado."
          : error.message || "Hubo un problema de conexión.";
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: `${errorText} Si preferís atención inmediata, podés escribirnos directo por WhatsApp al 7043-9248.`
        }
      ]);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.text || "Hola, tengo una consulta sobre mi vehículo";
  const whatsappHandoffUrl = `https://wa.me/50670439248?text=${encodeURIComponent(
    `Hola Don Randy, vengo del asistente de la página web de Taller Dayana. Mi consulta es: ${lastUserMessage}`
  )}`;

  return (
    <div className="fixed bottom-4 right-4 z-[90] flex flex-col items-end gap-3">
      {isOpen ? (
        <div className="flex h-[500px] max-h-[82vh] w-[calc(100vw-2rem)] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl shadow-black/70">
          <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-white">Asistente IA • Taller Dayana</p>
              <p className="text-[11px] text-emerald-400">Impulsado por Gemini • Respuesta inmediata</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar asistente"
              className="rounded-lg border border-zinc-700 px-2.5 py-1 text-xs font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
            >
              Cerrar
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-3.5 py-3 text-sm">
            {messages.map((msg, idx) => (
              <div
                key={`${msg.role}-${idx}`}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                    msg.role === "user"
                      ? "bg-red-600 text-white"
                      : "border border-zinc-800 bg-zinc-900 text-zinc-100"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {loading ? (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-xs text-zinc-400">
                  Gemini está analizando tu consulta...
                </div>
              </div>
            ) : null}

            {messages.length <= 1 && !loading ? (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => sendMessage(prompt)}
                    className="rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-left text-xs text-zinc-200 transition hover:border-red-500 hover:text-white"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            ) : null}

            <div ref={endRef} />
          </div>

          <div className="border-t border-zinc-800 bg-zinc-900/90 p-2.5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribí tu consulta o placa..."
                className="flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-red-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-xl bg-red-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Enviar
              </button>
            </form>
            <div className="mt-2 flex items-center justify-between px-1 text-[11px]">
              <span className="text-zinc-400">¿Preferís atención humana?</span>
              <a
                href={whatsappHandoffUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-emerald-400 hover:text-emerald-300"
              >
                📲 Seguir por WhatsApp
              </a>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-red-500/40 bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-xl shadow-black/50 transition hover:scale-105 hover:bg-red-500"
      >
        <span>💬</span>
        <span>{isOpen ? "Ocultar Asistente" : "Asistente IA"}</span>
      </button>
    </div>
  );
}
