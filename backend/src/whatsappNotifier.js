const https = require("https");

const DEFAULT_NUMBERS = ["50670439248", "50688698157"];

function getConfiguredTargets() {
  const sharedTextMeBotKey =
    process.env.TEXTMEBOT_API_KEY ||
    process.env.WHATSAPP_TEXTMEBOT_KEY ||
    "";

  return [
    {
      phone: "50670439248",
      label: "7043-9248",
      textMeBotKey:
        process.env.TEXTMEBOT_KEY_70439248 ||
        process.env.WHATSAPP_TEXTMEBOT_KEY_70439248 ||
        sharedTextMeBotKey,
      callMeBotKey: process.env.WHATSAPP_CALLMEBOT_KEY_70439248 || ""
    },
    {
      phone: "50688698157",
      label: "8869-8157",
      textMeBotKey:
        process.env.TEXTMEBOT_KEY_88698157 ||
        process.env.WHATSAPP_TEXTMEBOT_KEY_88698157 ||
        process.env.TEXTMEBOT_KEY_86898157 ||
        process.env.WHATSAPP_TEXTMEBOT_KEY_86898157 ||
        sharedTextMeBotKey,
      callMeBotKey:
        process.env.WHATSAPP_CALLMEBOT_KEY_88698157 ||
        process.env.WHATSAPP_CALLMEBOT_KEY_86898157 ||
        ""
    }
  ];
}

function sendHttpGet(url, phone, provider) {
  return new Promise((resolve) => {
    https
      .get(url, (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          resolve({
            phone,
            provider,
            sent: res.statusCode >= 200 && res.statusCode < 300,
            statusCode: res.statusCode,
            response: body.slice(0, 200)
          });
        });
      })
      .on("error", (err) => {
        resolve({ phone, provider, sent: false, reason: err.message });
      });
  });
}

function sendTextMeBotMessage(phone, text, apiKey) {
  const recipient = phone.startsWith("+") ? phone : `+${phone}`;
  const url = `https://api.textmebot.com/send.php?recipient=${encodeURIComponent(
    recipient
  )}&apikey=${encodeURIComponent(apiKey)}&text=${encodeURIComponent(text)}&json=yes`;
  return sendHttpGet(url, phone, "textmebot");
}

function sendCallMeBotMessage(phone, text, apiKey) {
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(
    text
  )}&apikey=${encodeURIComponent(apiKey)}`;
  return sendHttpGet(url, phone, "callmebot");
}

async function dispatchWhatsAppAlerts(message) {
  const targets = getConfiguredTargets();
  const sharedKey =
    targets.length === 2 &&
    targets[0].textMeBotKey &&
    targets[0].textMeBotKey === targets[1].textMeBotKey;

  if (sharedKey) {
    const firstResult = await sendTextMeBotMessage(targets[0].phone, message, targets[0].textMeBotKey);
    setTimeout(() => {
      sendTextMeBotMessage(targets[1].phone, message, targets[1].textMeBotKey).catch(() => {});
    }, 6000);

    return [
      firstResult,
      {
        phone: targets[1].phone,
        provider: "textmebot",
        sent: true,
        scheduledAfterMs: 6000
      }
    ];
  }

  return Promise.all(
    targets.map((target) => {
      if (target.textMeBotKey) {
        return sendTextMeBotMessage(target.phone, message, target.textMeBotKey);
      }
      if (target.callMeBotKey) {
        return sendCallMeBotMessage(target.phone, message, target.callMeBotKey);
      }
      return Promise.resolve({
        phone: target.phone,
        sent: false,
        reason: "missing_whatsapp_apikey"
      });
    })
  );
}

function buildQuoteWhatsAppMessage(quote) {
  const photoCount = Array.isArray(quote.photos) ? quote.photos.length : 0;
  const parts = Array.isArray(quote.selectedParts) && quote.selectedParts.length > 0
    ? quote.selectedParts.join(", ")
    : "Por evaluar";
  const channel = quote.contactChannel === "email"
    ? `✉️ Correo electrónico (${quote.email || "No indicado"})`
    : `🟢 WhatsApp (${quote.phone})`;

  return [
    "🚗 *NUEVA SOLICITUD DE PRESUPUESTO - TALLER DAYANA*",
    `• *Cliente:* ${quote.customerName}`,
    `• *Teléfono:* ${quote.phone}`,
    quote.email ? `• *Correo:* ${quote.email}` : null,
    `• *Responder por:* ${channel}`,
    `• *Vehículo:* ${quote.vehicle}`,
    `• *Piezas a cotizar:* ${parts}`,
    `• *Daño:* ${quote.damageDescription}`,
    `• *Fotos adjuntas:* ${photoCount}`
  ].filter(Boolean).join("\n");
}

function buildAppointmentWhatsAppMessage(appointment) {
  const channel = appointment.contactChannel === "email"
    ? `✉️ Correo (${appointment.email || "No indicado"})`
    : `🟢 WhatsApp (${appointment.phone})`;

  return [
    "📅 *NUEVA CITA DE ATENCIÓN - TALLER DAYANA*",
    `• *Cliente:* ${appointment.customerName}`,
    `• *Teléfono:* ${appointment.phone}`,
    appointment.email ? `• *Correo:* ${appointment.email}` : null,
    `• *Confirmación por:* ${channel}`,
    `• *Vehículo:* ${appointment.vehicle}`,
    `• *Fecha y hora:* ${appointment.appointmentDate}`
  ].filter(Boolean).join("\n");
}

function buildDirectLinks(message) {
  const encoded = encodeURIComponent(message);
  return DEFAULT_NUMBERS.map((phone) => ({
    phone,
    label: phone === "50670439248" ? "7043-9248" : "8869-8157",
    url: `https://wa.me/${phone}?text=${encoded}`
  }));
}

async function sendQuoteWhatsAppAlerts(quote) {
  const message = buildQuoteWhatsAppMessage(quote);
  const results = await dispatchWhatsAppAlerts(message);

  return {
    sent: results.some((r) => r.sent),
    results,
    links: buildDirectLinks(message)
  };
}

async function sendAppointmentWhatsAppAlerts(appointment) {
  const message = buildAppointmentWhatsAppMessage(appointment);
  const results = await dispatchWhatsAppAlerts(message);

  return {
    sent: results.some((r) => r.sent),
    results,
    links: buildDirectLinks(message)
  };
}

module.exports = {
  sendQuoteWhatsAppAlerts,
  sendAppointmentWhatsAppAlerts
};
