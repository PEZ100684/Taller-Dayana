const nodemailer = require("nodemailer");

const DEFAULT_RECIPIENT = "pescado100684@yahoo.es";

function isTruthy(value) {
  return String(value || "")
    .trim()
    .toLowerCase() === "true";
}

function normalizeRecipients(value) {
  const source = String(value || DEFAULT_RECIPIENT);
  return source
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .join(", ");
}

function buildTransportConfig() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = isTruthy(process.env.SMTP_SECURE);

  return {
    host,
    port,
    secure,
    auth: {
      user,
      pass
    }
  };
}

async function sendQuoteNotification(quote) {
  const recipients = normalizeRecipients(process.env.QUOTE_ALERT_RECIPIENTS);
  const transportConfig = buildTransportConfig();

  if (!transportConfig) {
    return {
      sent: false,
      reason: "smtp_not_configured",
      recipients
    };
  }

  const transporter = nodemailer.createTransport(transportConfig);
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const photoCount = Array.isArray(quote.photos) ? quote.photos.length : 0;

  const subject = `Nuevo presupuesto solicitado - ${quote.plate}`;
  const text = [
    "Se registro una nueva solicitud de presupuesto en Taller Dayana.",
    "",
    `Cliente: ${quote.customerName}`,
    `Telefono: ${quote.phone}`,
    `Vehiculo: ${quote.vehicle}`,
    `Placa: ${quote.plate}`,
    `Descripcion: ${quote.damageDescription}`,
    `Fotos adjuntas: ${photoCount}`,
    `Fecha: ${quote.createdAt}`
  ].join("\n");

  await transporter.sendMail({
    from,
    to: recipients,
    subject,
    text
  });

  return {
    sent: true,
    recipients
  };
}

async function sendAppointmentNotification(appointment) {
  const recipients = normalizeRecipients(process.env.QUOTE_ALERT_RECIPIENTS);
  const transportConfig = buildTransportConfig();

  if (!transportConfig) {
    return {
      sent: false,
      reason: "smtp_not_configured",
      recipients
    };
  }

  const transporter = nodemailer.createTransport(transportConfig);
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const appointmentTime = appointment.appointmentDate
    ? new Date(appointment.appointmentDate).toLocaleString("es-CR", {
        timeZone: "America/Costa_Rica",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : "Fecha no especificada";

  const subject = `Nueva cita de atención - ${appointment.plate}`;
  const text = [
    "Se registro una nueva cita de atención en Taller Dayana.",
    "",
    `Cliente: ${appointment.customerName}`,
    `Telefono: ${appointment.phone}`,
    `Vehiculo: ${appointment.vehicle}`,
    `Placa: ${appointment.plate}`,
    `Fecha y hora programada: ${appointmentTime}`,
    `Fecha de registro: ${appointment.createdAt}`
  ].join("\n");

  await transporter.sendMail({
    from,
    to: recipients,
    subject,
    text
  });

  return {
    sent: true,
    recipients
  };
}

module.exports = {
  sendQuoteNotification,
  sendAppointmentNotification
};
