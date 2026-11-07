const https = require("https");

const DEFAULT_NUMBERS = ["50670439248", "50686898157"];

function getConfiguredTargets() {
  return [
    {
      phone: "50670439248",
      label: "7043-9248",
      apiKey: process.env.WHATSAPP_CALLMEBOT_KEY_70439248 || ""
    },
    {
      phone: "50686898157",
      label: "8689-8157",
      apiKey: process.env.WHATSAPP_CALLMEBOT_KEY_86898157 || ""
    }
  ];
}

function sendCallMeBotMessage(phone, text, apiKey) {
  return new Promise((resolve) => {
    if (!apiKey) {
      return resolve({ phone, sent: false, reason: "missing_callmebot_apikey" });
    }

    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(
      text
    )}&apikey=${encodeURIComponent(apiKey)}`;

    https
      .get(url, (res) => {
        res.on("data", () => {});
        res.on("end", () => {
          resolve({
            phone,
            sent: res.statusCode >= 200 && res.statusCode < 300,
            statusCode: res.statusCode
          });
        });
      })
      .on("error", (err) => {
        resolve({ phone, sent: false, reason: err.message });
      });
  });
}

function buildQuoteWhatsAppMessage(quote) {
  const photoCount = Array.isArray(quote.photos) ? quote.photos.length : 0;
  return [
    "🚗 *NUEVA SOLICITUD DE PRESUPUESTO - TALLER DAYANA*",
    `• *Cliente:* ${quote.customerName}`,
    `• *Teléfono:* ${quote.phone}`,
    `• *Vehículo:* ${quote.vehicle}`,
    `• *Placa:* ${quote.plate}`,
    `• *Daño:* ${quote.damageDescription}`,
    `• *Fotos adjuntas:* ${photoCount}`
  ].join("\n");
}

function buildAppointmentWhatsAppMessage(appointment) {
  return [
    "📅 *NUEVA CITA DE ATENCIÓN - TALLER DAYANA*",
    `• *Cliente:* ${appointment.customerName}`,
    `• *Teléfono:* ${appointment.phone}`,
    `• *Vehículo:* ${appointment.vehicle}`,
    `• *Placa:* ${appointment.plate}`,
    `• *Fecha y hora:* ${appointment.appointmentDate}`
  ].join("\n");
}

function buildDirectLinks(message) {
  const encoded = encodeURIComponent(message);
  return DEFAULT_NUMBERS.map((phone) => ({
    phone,
    label: phone === "50670439248" ? "7043-9248" : "8689-8157",
    url: `https://wa.me/${phone}?text=${encoded}`
  }));
}

async function sendQuoteWhatsAppAlerts(quote) {
  const message = buildQuoteWhatsAppMessage(quote);
  const targets = getConfiguredTargets();
  const results = await Promise.all(
    targets.map((target) => sendCallMeBotMessage(target.phone, message, target.apiKey))
  );

  return {
    sent: results.some((r) => r.sent),
    results,
    links: buildDirectLinks(message)
  };
}

async function sendAppointmentWhatsAppAlerts(appointment) {
  const message = buildAppointmentWhatsAppMessage(appointment);
  const targets = getConfiguredTargets();
  const results = await Promise.all(
    targets.map((target) => sendCallMeBotMessage(target.phone, message, target.apiKey))
  );

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
