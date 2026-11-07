const nodemailer = require("nodemailer");

const DEFAULT_RECIPIENT = "pescado100684@yahoo.es";
const DEFAULT_CALENDAR_EMAIL = "gabriel100684@gmail.com";

function isTruthy(value) {
  return String(value || "")
    .trim()
    .toLowerCase() === "true";
}

function normalizeRecipients(value, extraRecipient = "") {
  const combined = [String(value || DEFAULT_RECIPIENT), extraRecipient].filter(Boolean).join(",");
  const unique = Array.from(
    new Set(
      combined
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
  return unique.join(", ");
}

function parseCostaRicaDate(rawValue) {
  if (!rawValue) {
    return new Date();
  }
  const str = String(rawValue).trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(str)) {
    return new Date(`${str}:00-06:00`);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return new Date(`${str}T09:00:00-06:00`);
  }
  const parsed = new Date(str);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function formatIcsDate(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function buildIcsCalendarInvite(appointment, startDate) {
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
  const nowStamp = formatIcsDate(new Date());
  const dtStart = formatIcsDate(startDate);
  const dtEnd = formatIcsDate(endDate);
  const summary = `Cita Taller Dayana - ${appointment.plate} (${appointment.customerName})`;
  const description = `Cliente: ${appointment.customerName}\\nTelefono: ${appointment.phone}\\nVehiculo: ${appointment.vehicle}\\nPlaca: ${appointment.plate}`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Taller Dayana//Citas//ES",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:cita-${appointment.id || Date.now()}@tallerdayana.cr`,
    `DTSTAMP:${nowStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    "LOCATION:Taller Dayana, Barrio San Jose de Alajuela",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");
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
    connectionTimeout: 4000,
    greetingTimeout: 4000,
    socketTimeout: 6000,
    auth: {
      user,
      pass
    }
  };
}

async function sendViaGoogleAppsScript(payload) {
  const webhookUrl = String(process.env.GOOGLE_SCRIPT_WEBHOOK_URL || "").trim();
  if (!webhookUrl) {
    return null;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    redirect: "follow"
  });

  if (!response.ok) {
    throw new Error(`Google Script webhook error (${response.status})`);
  }

  const data = await response.json().catch(() => ({ ok: true }));
  return {
    sent: true,
    via: "google_apps_script",
    ...data
  };
}

async function sendQuoteNotification(quote) {
  const recipients = normalizeRecipients(process.env.QUOTE_ALERT_RECIPIENTS);

  const webhookResult = await sendViaGoogleAppsScript({
    type: "quote",
    recipients,
    quote
  });
  if (webhookResult) {
    return {
      ...webhookResult,
      recipients
    };
  }

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

  const attachments = Array.isArray(quote.photos)
    ? quote.photos
        .filter((photo) => photo && typeof photo.dataUrl === "string" && photo.dataUrl.startsWith("data:image/"))
        .map((photo, index) => ({
          filename: photo.name || `vehiculo-${quote.plate}-${index + 1}.jpg`,
          path: photo.dataUrl
        }))
    : [];

  await transporter.sendMail({
    from,
    to: recipients,
    subject,
    text,
    attachments
  });

  return {
    sent: true,
    recipients
  };
}

async function sendAppointmentNotification(appointment) {
  const calendarEmail = process.env.GOOGLE_CALENDAR_ID || DEFAULT_CALENDAR_EMAIL;
  const recipients = normalizeRecipients(process.env.QUOTE_ALERT_RECIPIENTS, calendarEmail);
  const parsedStart = parseCostaRicaDate(appointment.appointmentDate);
  const parsedEnd = new Date(parsedStart.getTime() + 60 * 60 * 1000);

  const webhookResult = await sendViaGoogleAppsScript({
    type: "appointment",
    recipients,
    calendarEmail,
    appointment,
    startIso: parsedStart.toISOString(),
    endIso: parsedEnd.toISOString()
  });
  if (webhookResult) {
    return {
      ...webhookResult,
      recipients
    };
  }

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
    ? parsedStart.toLocaleString("es-CR", {
        timeZone: "America/Costa_Rica",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    : "Fecha no especificada";

  const subject = `Nueva cita de atención - ${appointment.plate} (${appointment.customerName})`;
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

  const icsContent = buildIcsCalendarInvite(appointment, parsedStart);

  await transporter.sendMail({
    from,
    to: recipients,
    subject,
    text,
    icalEvent: {
      filename: `cita-${appointment.plate}.ics`,
      method: "REQUEST",
      content: icsContent
    }
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
