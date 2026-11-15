const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const SYSTEM_INSTRUCTION = [
  "Eres el Asistente Inteligente de Taller Dayana, un taller especializado en enderezado y pintura automotriz con más de 60 años de experiencia en Barrio San José de Alajuela, Costa Rica, dirigido por Don Dagoberto y Don Randy Barrantes.",
  "",
  "Reglas de atención:",
  "- Responde siempre en español natural, cordial y profesional de Costa Rica (claro, conciso y servicial).",
  "- Nunca inventes precios exactos ni estados de vehículos. Si no tienes el dato exacto en el contexto del sistema, indícalo con honestidad y sugiere agendar una valoración o enviar fotos.",
  "- Si el cliente pregunta por un presupuesto, da rangos orientativos claros en colones (₡) aclarando que el monto final depende del daño (leve, medio o fuerte) y el tipo de pintura (monocapa, bicapa o tricapa), e invítalo a usar la sección 'Solicitar presupuesto' de la página o escribir por WhatsApp.",
  "- Si el cliente consulta por el estado de su vehículo y el sistema encontró datos de su placa en el contexto, resume de forma clara el estado de su vehículo/cita/presupuesto y cuántas fotos o avances tiene registrados; además indícale que puede ver las fotos en la sección 'Seguimiento 24/7'.",
  "- Si el cliente pregunta cómo llegar, horarios o contacto, dale los datos exactos del taller.",
  "",
  "Información oficial de Taller Dayana:",
  "- Dirección: Barrio San José de Alajuela, Calle La Torre, Urbanización La Unión, al puro fondo (Alajuela, Costa Rica).",
  "- Google Maps: https://www.google.com/maps/place/Taller+Dayana/@10.0189955,-84.2360667,20.5z",
  "- Waze: https://waze.com/ul?ll=10.0188372,-84.2361356&navigate=yes",
  "- Teléfonos / WhatsApp: 7043-9248 (Don Randy) y 8869-8157 (Atención Taller).",
  "- Horario general: Lunes a Viernes de 8:00 a.m. a 5:00 p.m. Sábados con coordinación previa.",
  "- Horario para citas de valoración presencial en línea: Lunes a Viernes de 9:00 a.m. a 4:00 p.m.",
  "- Servicios principales: Enderezado estructural y de lámina, pintura automotriz en cabina presurizada con secado al horno, igualación computarizada de color, reparación de bumpers y plásticos, pulido y abrillantado, pintura general completa y coordinación de grúa.",
  "- Garantía: Garantía por escrito en tono, brillo y adherencia.",
  "- Precios orientativos base (sujetos a valoración y tipo de pintura): Bumper delantero/trasero o guardabarro desde ~₡45,000 - ₡55,000; puerta o tapa de cajuela desde ~₡55,000; capó/bonete desde ~₡65,000; costado o techo desde ~₡60,000 - ₡75,000; pulido y abrillantado desde ~₡45,000; pintura general completa desde ~₡550,000."
].join("\n");

function extractPlateCandidate(text, explicitPlate) {
  if (explicitPlate && String(explicitPlate).trim()) {
    return String(explicitPlate).trim().toUpperCase();
  }

  const normalized = String(text || "").toUpperCase();
  const contextualMatch = normalized.match(/\b(?:PLACA|MATRICULA|MATRÍCULA|CARRO|VEHICULO|VEHÍCULO)\s*(?:#|NO\.?|NUMERO|NÚMERO|:)?\s*([A-Z]{2,3}-?\d{3,4}|\d{5,7}|[A-Z]{1,3}\d{3,5})\b/);
  if (contextualMatch) {
    return contextualMatch[1];
  }

  const standaloneMatch = normalized.match(/\b([A-Z]{3}-\d{3}|[A-Z]{3}\d{3}|\d{6})\b/);
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

async function callGeminiApi({ apiKey, model, contents }) {
  try {
    const { GoogleGenAI } = require("@google/genai");
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.4,
        maxOutputTokens: 700
      }
    });
    if (response && typeof response.text === "string" && response.text.trim()) {
      return response.text.trim();
    }
  } catch (sdkErr) {
    if (sdkErr && sdkErr.code !== "MODULE_NOT_FOUND") {
      throw sdkErr;
    }
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }]
      },
      contents,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 700
      }
    })
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const apiMsg = payload?.error?.message || `Error HTTP ${response.status} de Gemini`;
    throw new Error(apiMsg);
  }

  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini devolvió una respuesta vacía.");
  }

  return text;
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
  const reply = await callGeminiApi({ apiKey, model, contents });

  return {
    reply,
    model,
    detectedPlate: detectedPlate || null
  };
}

module.exports = {
  generateWorkshopChatReply,
  extractPlateCandidate
};
