const { google } = require("googleapis");

const DEFAULT_CALENDAR_ID = "gabriel100684@gmail.com";
const DEFAULT_TIMEZONE = "America/Costa_Rica";

function normalizePrivateKey(value) {
  return String(value || "")
    .trim()
    .replace(/^"|"$/g, "")
    .replace(/\\\\n/g, "\n")
    .replace(/\\n/g, "\n");
}

function toBool(value) {
  return String(value || "").toLowerCase() === "true";
}

function getCalendarConfig() {
  return {
    enabled: toBool(process.env.GOOGLE_CALENDAR_ENABLED),
    calendarId: process.env.GOOGLE_CALENDAR_ID || DEFAULT_CALENDAR_ID,
    timezone: process.env.GOOGLE_CALENDAR_TIMEZONE || DEFAULT_TIMEZONE,
    addAttendees: toBool(process.env.GOOGLE_CALENDAR_ADD_ATTENDEES),
    serviceEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "",
    privateKey: normalizePrivateKey(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY),
    notifyEmails: String(process.env.GOOGLE_CALENDAR_NOTIFY_EMAILS || "pescado100684@yahoo.es")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  };
}

function validateConfig(config) {
  if (!config.enabled) {
    return { ok: false, reason: "disabled" };
  }

  if (!config.calendarId) {
    return { ok: false, reason: "missing_calendar_id" };
  }

  if (!config.serviceEmail || !config.privateKey) {
    return { ok: false, reason: "missing_service_account_credentials" };
  }

  return { ok: true };
}

function buildEventPayload({
  summary,
  description,
  eventStart,
  eventEnd,
  timezone,
  attendees
}) {
  return {
    summary,
    description,
    start: {
      dateTime: eventStart.toISOString(),
      timeZone: timezone
    },
    end: {
      dateTime: eventEnd.toISOString(),
      timeZone: timezone
    },
    attendees,
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 10 },
        { method: "email", minutes: 15 }
      ]
    }
  };
}

async function createQuoteCalendarAlert(quote) {
  const config = getCalendarConfig();
  const validation = validateConfig(config);

  if (!validation.ok) {
    return { sent: false, reason: validation.reason };
  }

  try {
    const auth = new google.auth.JWT({
      email: config.serviceEmail,
      key: config.privateKey,
      scopes: ["https://www.googleapis.com/auth/calendar"]
    });

    const calendar = google.calendar({ version: "v3", auth });

    // Si es una cita, usar appointmentDate; si no, usar createdAt
    let eventStart;
    let eventEnd;
    let summary;
    let description;

    if (quote.status === "appointment" && quote.appointmentDate) {
      eventStart = new Date(quote.appointmentDate);
      eventEnd = new Date(eventStart.getTime() + 30 * 60 * 1000);
      summary = `Cita de atención - ${quote.plate}`;
      description = [
        `Cliente: ${quote.customerName}`,
        `Telefono: ${quote.phone}`,
        `Vehiculo: ${quote.vehicle}`,
        `Placa: ${quote.plate}`,
        `Hora programada: ${eventStart.toLocaleString("es-CR", { timeZone: config.timezone })}`
      ].join("\n");
    } else {
      eventStart = quote.createdAt ? new Date(quote.createdAt) : new Date();
      eventEnd = new Date(eventStart.getTime() + 30 * 60 * 1000);
      summary = `Nuevo presupuesto - ${quote.plate}`;
      description = [
        `Cliente: ${quote.customerName}`,
        `Telefono: ${quote.phone}`,
        `Vehiculo: ${quote.vehicle}`,
        `Placa: ${quote.plate}`,
        `Detalle: ${quote.damageDescription}`
      ].join("\n");
    }

    const attendees = config.addAttendees
      ? config.notifyEmails.map((email) => ({ email }))
      : [];

    let response;
    let usedAttendeesFallback = false;
    try {
      response = await calendar.events.insert({
        calendarId: config.calendarId,
        sendUpdates: config.addAttendees && config.notifyEmails.length > 0 ? "all" : "none",
        requestBody: buildEventPayload({
          summary,
          description,
          eventStart,
          eventEnd,
          timezone: config.timezone,
          attendees
        })
      });
    } catch (error) {
      const cannotInviteWithServiceAccount = String(error?.message || "")
        .includes("Service accounts cannot invite attendees");

      if (!cannotInviteWithServiceAccount) {
        throw error;
      }

      usedAttendeesFallback = true;

      response = await calendar.events.insert({
        calendarId: config.calendarId,
        sendUpdates: "none",
        requestBody: buildEventPayload({
          summary,
          description,
          eventStart,
          eventEnd,
          timezone: config.timezone,
          attendees: []
        })
      });
    }

    return {
      sent: true,
      eventId: response.data?.id || null,
      htmlLink: response.data?.htmlLink || null,
      warning: usedAttendeesFallback ? "attendees_not_supported_for_service_account" : null
    };
  } catch (error) {
    return {
      sent: false,
      reason: error.message
    };
  }
}

module.exports = {
  createQuoteCalendarAlert,
  getCalendarConfig
};
