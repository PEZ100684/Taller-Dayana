const DEFAULT_WEB_URL = "https://tallerdayana.vercel.app";

// Evitar enviar múltiples mensajes seguidos a la misma placa en menos de 10 minutos
const recentlyNotifiedByPlate = new Map();
const COOLDOWN_MS = Math.max(60000, Number(process.env.WHATSAPP_NOTIFY_COOLDOWN_MS || 10 * 60 * 1000));

function normalizeCostaRicaPhone(rawPhone) {
  const digits = String(rawPhone || "").replace(/\D+/g, "");
  if (!digits) return "";
  if (digits.length === 8) return `506${digits}`;
  if (digits.startsWith("506") && digits.length === 11) return digits;
  return digits;
}

function getTrackingUrl(plate) {
  const base = String(process.env.PUBLIC_WEB_URL || process.env.FRONTEND_URL || DEFAULT_WEB_URL)
    .trim()
    .replace(/\/+$/, "");
  const cleanPlate = encodeURIComponent(String(plate || "").trim().toUpperCase());
  return `${base}/seguimiento?plate=${cleanPlate}`;
}

function buildProgressWhatsAppMessage({ customerName, plate, photoCount = 1, description = "" }) {
  const cleanPlate = String(plate || "").trim().toUpperCase();
  const greeting = customerName ? `Hola ${String(customerName).trim()},` : "Hola,";
  const trackingUrl = getTrackingUrl(cleanPlate);
  const photoLabel = photoCount > 1 ? `${photoCount} nuevos avances fotográficos` : "un nuevo avance fotográfico";
  const noteLine = description && description.trim() ? `\nDetalle: ${description.trim()}` : "";

  return (
    `${greeting} le saludamos de *Taller Dayana*. ` +
    `Le informamos que su vehículo placa *${cleanPlate}* se encuentra *En Proceso* de reparación y acabamos de registrar ${photoLabel}.${noteLine}\n\n` +
    `Puede consultar lo que se está realizando y ver las fotos en vivo en nuestra página web ingresando su placa aquí:\n` +
    `${trackingUrl}`
  );
}

function buildWaMeUrl(rawPhone, message) {
  const phone = normalizeCostaRicaPhone(rawPhone);
  if (!phone) return null;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

async function sendViaMetaCloudApi({ phone, message, plate, customerName, trackingUrl }) {
  const token = String(process.env.WHATSAPP_CLOUD_TOKEN || "").trim();
  const phoneNumberId = String(process.env.WHATSAPP_PHONE_NUMBER_ID || "").trim();
  if (!token || !phoneNumberId) {
    return { attempted: false, sent: false };
  }

  const templateName = String(process.env.WHATSAPP_TEMPLATE_NAME || "").trim();
  const templateLang = String(process.env.WHATSAPP_TEMPLATE_LANG || "es").trim();

  const payload = templateName
    ? {
        messaging_product: "whatsapp",
        to: phone,
        type: "template",
        template: {
          name: templateName,
          language: { code: templateLang },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: customerName || "Cliente" },
                { type: "text", text: plate },
                { type: "text", text: trackingUrl }
              ]
            }
          ]
        }
      }
    : {
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: {
          preview_url: true,
          body: message
        }
      };

  const endpoint = `https://graph.facebook.com/v20.0/${encodeURIComponent(phoneNumberId)}/messages`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    return {
      attempted: true,
      sent: false,
      provider: "meta-cloud-api",
      error: `Meta API HTTP ${response.status}: ${errText.slice(0, 200)}`
    };
  }

  const data = await response.json().catch(() => ({}));
  return {
    attempted: true,
    sent: true,
    provider: "meta-cloud-api",
    messageId: data?.messages?.[0]?.id || null
  };
}

async function sendViaCustomWebhook({ phone, customerName, plate, message, trackingUrl, photoCount }) {
  const webhookUrl = String(process.env.WHATSAPP_WEBHOOK_URL || "").trim();
  if (!webhookUrl) {
    return { attempted: false, sent: false };
  }

  const headers = { "Content-Type": "application/json" };
  const secret = String(process.env.WHATSAPP_WEBHOOK_SECRET || "").trim();
  if (secret) {
    headers["X-Webhook-Secret"] = secret;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      event: "vehicle_progress_photo_uploaded",
      phone,
      customerName: customerName || "",
      plate,
      message,
      trackingUrl,
      photoCount,
      timestamp: new Date().toISOString()
    })
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    return {
      attempted: true,
      sent: false,
      provider: "custom-webhook",
      error: `Webhook HTTP ${response.status}: ${errText.slice(0, 200)}`
    };
  }

  return {
    attempted: true,
    sent: true,
    provider: "custom-webhook"
  };
}

async function notifyCustomerProgressPhoto({
  plate,
  customerName = "",
  customerPhone = "",
  photoCount = 1,
  description = "",
  respectCooldown = false
}) {
  const cleanPlate = String(plate || "").trim().toUpperCase();
  const phone = normalizeCostaRicaPhone(customerPhone);
  const trackingUrl = getTrackingUrl(cleanPlate);
  const message = buildProgressWhatsAppMessage({
    customerName,
    plate: cleanPlate,
    photoCount,
    description
  });
  const whatsappUrl = buildWaMeUrl(phone, message);

  if (!phone) {
    return {
      phone: "",
      plate: cleanPlate,
      trackingUrl,
      message,
      whatsappUrl: null,
      sentAutomatically: false,
      provider: "none",
      reason: "Vehículo sin número de celular registrado"
    };
  }

  if (respectCooldown) {
    const lastSentAt = recentlyNotifiedByPlate.get(cleanPlate) || 0;
    if (Date.now() - lastSentAt < COOLDOWN_MS) {
      return {
        phone,
        plate: cleanPlate,
        trackingUrl,
        message,
        whatsappUrl,
        sentAutomatically: false,
        provider: "cooldown",
        reason: "Notificación reciente ya enviada para esta placa"
      };
    }
  }

  // 1. Intentar envío automático vía Meta WhatsApp Business Cloud API
  try {
    const metaResult = await sendViaMetaCloudApi({
      phone,
      message,
      plate: cleanPlate,
      customerName,
      trackingUrl
    });
    if (metaResult.attempted) {
      if (metaResult.sent) {
        recentlyNotifiedByPlate.set(cleanPlate, Date.now());
      }
      return {
        phone,
        plate: cleanPlate,
        trackingUrl,
        message,
        whatsappUrl,
        sentAutomatically: metaResult.sent,
        provider: metaResult.provider,
        messageId: metaResult.messageId || null,
        error: metaResult.error || null
      };
    }
  } catch (err) {
    return {
      phone,
      plate: cleanPlate,
      trackingUrl,
      message,
      whatsappUrl,
      sentAutomatically: false,
      provider: "meta-cloud-api",
      error: err.message
    };
  }

  // 2. Intentar envío automático vía Webhook externo (n8n / Make / UltraMsg / Evolution API)
  try {
    const webhookResult = await sendViaCustomWebhook({
      phone,
      customerName,
      plate: cleanPlate,
      message,
      trackingUrl,
      photoCount
    });
    if (webhookResult.attempted) {
      if (webhookResult.sent) {
        recentlyNotifiedByPlate.set(cleanPlate, Date.now());
      }
      return {
        phone,
        plate: cleanPlate,
        trackingUrl,
        message,
        whatsappUrl,
        sentAutomatically: webhookResult.sent,
        provider: webhookResult.provider,
        error: webhookResult.error || null
      };
    }
  } catch (err) {
    return {
      phone,
      plate: cleanPlate,
      trackingUrl,
      message,
      whatsappUrl,
      sentAutomatically: false,
      provider: "custom-webhook",
      error: err.message
    };
  }

  // 3. Modo inmediato sin API configurada: devuelve enlace wa.me listo para 1 clic
  return {
    phone,
    plate: cleanPlate,
    trackingUrl,
    message,
    whatsappUrl,
    sentAutomatically: false,
    provider: "wa-me-manual",
    reason: "Configura WHATSAPP_CLOUD_TOKEN + WHATSAPP_PHONE_NUMBER_ID (o WHATSAPP_WEBHOOK_URL) en Render para envío 100% automático sin clic."
  };
}

module.exports = {
  normalizeCostaRicaPhone,
  getTrackingUrl,
  buildProgressWhatsAppMessage,
  buildWaMeUrl,
  notifyCustomerProgressPhoto
};
