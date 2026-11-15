const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
const FALLBACK_GEMINI_MODELS = ["gemini-flash-lite-latest", "gemini-3.1-flash-lite-preview"];

const SYSTEM_INSTRUCTION = [
  "Eres el Asistente de Taller Dayana (taller de enderezado y pintura automotriz en Alajuela, Costa Rica).",
  "",
  "REGLA OBLIGATORIA DE ESTILO:",
  "- Responde DIRECTO, CONCISO Y AL GRANO. Cero saludos largos, cero presentaciones repetitivas y cero rodeos.",
  "- NUNCA inicies con frases como '¡Hola! Un gusto saludarle de parte de Taller Dayana en Barrio San José de Alajuela' ni introducciones decorativas. No adornes la conversación: responde inmediatamente lo que el usuario preguntó.",
  "- Tono profesional, claro, breve y sin relleno.",
  "",
  "Reglas de respuesta:",
  "- Si consultan por una placa: da directamente el estado del vehículo, avances fotográficos registrados y que pueden ver las fotos en la sección 'Seguimiento 24/7' o por WhatsApp.",
  "- Si no hay datos de la placa: di directamente que no aparece registro activo con esa placa y que pueden coordinar al WhatsApp 7043-9248.",
  "- Si preguntan por presupuesto o precios: da directamente el rango orientativo en colones (₡) y aclara brevemente que depende del nivel de daño y tipo de pintura.",
  "- Si preguntan horarios, ubicación o contacto: da los datos directos sin preámbulos.",
  "- Nunca inventes precios cerrados ni datos de vehículos no existentes.",
  "",
  "Datos oficiales de Taller Dayana:",
  "- Dirección: Barrio San José de Alajuela, Calle La Torre, Urbanización La Unión, al puro fondo.",
  "- Google Maps: https://www.google.com/maps/place/Taller+Dayana/@10.0189955,-84.2360667,20.5z",
  "- Waze: https://waze.com/ul?ll=10.0188372,-84.2361356&navigate=yes",
  "- Teléfonos / WhatsApp: 7043-9248 (Don Randy) / 8869-8157.",
  "- Horario de atención: Lunes a Viernes de 8:00 a.m. a 5:00 p.m. Citas de valoración presencial: 9:00 a.m. a 4:00 p.m.",
  "- Precios base aproximados: Bumper o guardabarro: ₡45,000 - ₡55,000 | Puerta: ₡55,000 | Capó: ₡65,000 | Costado o techo: ₡60,000 - ₡75,000 | Pulido: ₡45,000 | Pintura general: desde ₡550,000.",
  "- Garantía por escrito en tono, brillo y adherencia."
].join("\n");

function extractPlateCandidate(text, explicitPlate) {
  if (explicitPlate && String(explicitPlate).trim()) {
    return String(explicitPlate).trim().toUpperCase();
  }

  const normalized = String(text || "").trim().toUpperCase();
  const contextualMatch = normalized.match(/\b(?:PLACA|MATRICULA|MATRÍCULA|CARRO|VEHICULO|VEHÍCULO)\s*(?:#|NO\.?|NUMERO|NÚMERO|:)?\s*([A-Z0-9-]{4,10})\b/);
  if (contextualMatch && /\d/.test(contextualMatch[1])) {
    return contextualMatch[1];
  }

  if (/^[A-Z0-9-]{4,10}$/.test(normalized) && /\d/.test(normalized)) {
    return normalized;
  }

  const standaloneMatch = normalized.match(/\b([A-Z]{2,4}-?\d{1,4}|\d{5,7})\b/);
  return standaloneMatch ? standaloneMatch[1] : "";
}

async function buildLiveContext(plate, deps) {
  if (!plate || !deps || typeof deps.getRepairStatus !== "function") {
    return "";
  }

  try {
    const [{ appointment, quote, workshopVehicle }, notifications, photos] = await Promise.all([
      deps.getRepairStatus(plate, null),
      typeof deps.listNotificationsByPlate === "function" ? deps.listNotificationsByPlate(plate) : Promise.resolve([]),
      typeof deps.listWorkshopProgressPhotos === "function" ? deps.listWorkshopProgressPhotos(plate) : Promise.resolve([])
    ]);

    if (!appointment && !quote && !workshopVehicle && (!photos || photos.length === 0)) {
      return `Consulta de sistema para la placa ${plate}: No se encontraron registros activos con esa placa en la base de datos.`;
    }

    const lines = [`Datos en tiempo real del taller para la placa ${plate}:`];
    if (workshopVehicle) {
      lines.push(`- Vehículo en taller: ${workshopVehicle.vehicle || "Registrado"} | Estado actual: ${workshopVehicle.status || "En proceso"} | Cliente: ${workshopVehicle.customerName || "N/D"}`);
      if (workshopVehicle.notes) {
        lines.push(`- Notas del taller: ${workshopVehicle.notes}`);
      }
    }
    if (appointment) {
      lines.push(`- Cita registrada: Estado=${appointment.status || "scheduled"}, Fecha/hora=${appointment.appointmentDate || "Por definir"}, Vehículo=${appointment.vehicle || "N/D"}`);
    }
    if (quote) {
      lines.push(`- Presupuesto registrado: Estado=${quote.status || "received"}, Descripción=${quote.damageDescription || "N/D"}`);
    }
    if (Array.isArray(photos) && photos.length > 0) {
      lines.push(`- Avances multimedia registrados: ${photos.length} foto(s)/video(s) disponibles en Seguimiento 24/7.`);
    }
    if (Array.isArray(notifications) && notifications.length > 0) {
      const latest = notifications[notifications.length - 1];
      lines.push(`- Última notificación: ${latest.message}`);
    }
    return lines.join("\n");
  } catch (error) {
    return `No se pudo consultar la placa ${plate} en este momento (${error.message}).`;
  }
}

function buildGeminiContents(history, message, liveContext) {
  const safeHistory = Array.isArray(history)
    ? history
        .slice(-12)
        .filter((item) => item && typeof item.text === "string" && item.text.trim())
        .map((item) => ({
          role: item.role === "model" ? "model" : "user",
          parts: [{ text: item.text.trim().slice(0, 1500) }]
        }))
    : [];

  const userText = liveContext
    ? `[CONTEXTO_SISTEMA]\n${liveContext}\n[/CONTEXTO_SISTEMA]\n\nMensaje del cliente: ${message}`
    : message;

  return [
    ...safeHistory,
    {
      role: "user",
      parts: [{ text: userText }]
    }
  ];
}

async function callGeminiSingleModel({ apiKey, model, contents, timeoutMs = 10000 }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }]
        },
        contents,
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2500,
          thinkingConfig: { thinkingBudget: 0 }
        }
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const apiMsg = payload?.error?.message || `Error HTTP ${response.status} de Gemini`;
      const err = new Error(apiMsg);
      err.httpStatus = response.status;
      throw err;
    }

    const text = payload?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();

    if (!text) {
      throw new Error("Gemini devolvió una respuesta vacía.");
    }

    return text;
  } finally {
    clearTimeout(timer);
  }
}

async function callGeminiApi({ apiKey, model, contents }) {
  const candidates = Array.from(new Set([model, ...FALLBACK_GEMINI_MODELS].filter(Boolean)));
  let lastError = null;

  for (const candidateModel of candidates) {
    try {
      const text = await callGeminiSingleModel({
        apiKey,
        model: candidateModel,
        contents,
        timeoutMs: 10000
      });
      return { text, usedModel: candidateModel };
    } catch (err) {
      lastError = err;
      const msg = String(err?.message || "");
      const retryable =
        err?.name === "AbortError" ||
        err?.httpStatus === 404 ||
        err?.httpStatus === 429 ||
        err?.httpStatus === 503 ||
        /high demand|timed out|abort|not found/i.test(msg);
      if (!retryable) {
        throw err;
      }
    }
  }

  throw lastError || new Error("No se pudo obtener respuesta de Gemini.");
}

async function generateWorkshopChatReply({ message, history = [], plate = "", deps = {} }) {
  const apiKey = String(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "").trim();
  if (!apiKey) {
    const err = new Error("GEMINI_API_KEY no está configurada en el servidor.");
    err.statusCode = 503;
    throw err;
  }

  const cleanMessage = String(message || "").trim().slice(0, 1500);
  if (!cleanMessage) {
    const err = new Error("El mensaje no puede estar vacío.");
    err.statusCode = 400;
    throw err;
  }

  const detectedPlate = extractPlateCandidate(cleanMessage, plate);
  const liveContext = await buildLiveContext(detectedPlate, deps);
  const contents = buildGeminiContents(history, cleanMessage, liveContext);
  const model = DEFAULT_GEMINI_MODEL;

  try {
    const { text, usedModel } = await callGeminiApi({ apiKey, model, contents });
    return {
      reply: text,
      model: usedModel,
      detectedPlate: detectedPlate || null
    };
  } catch (apiError) {
    const rawMsg = String(apiError?.message || "");
    const isBillingOrQuota = /402|429|RESOURCE_EXHAUSTED|prepayment credits|quota/i.test(rawMsg);

    if (isBillingOrQuota && detectedPlate && liveContext) {
      return {
        reply: `${liveContext}\n\nPodés ver las fotos y el avance completo en la sección "Seguimiento 24/7" de la página, o escribirnos por WhatsApp al 7043-9248.`,
        model: "fallback-db",
        detectedPlate
      };
    }

    if (isBillingOrQuota) {
      const err = new Error("El servicio de Gemini alcanzó temporalmente su límite de créditos en Google AI Studio. Por favor escribinos directo por WhatsApp al 7043-9248 para atenderte de inmediato.");
      err.statusCode = 503;
      throw err;
    }

    throw apiError;
  }
}

module.exports = {
  generateWorkshopChatReply,
  extractPlateCandidate
};
