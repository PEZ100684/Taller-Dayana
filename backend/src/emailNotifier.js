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
  const summary = `Cita Taller Dayana - ${appointment.vehicle} (${appointment.customerName})`;
  const description = `Cliente: ${appointment.customerName}\\nTelefono: ${appointment.phone}\\nVehiculo: ${appointment.vehicle}`;

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
  const partsText = Array.isArray(quote.selectedParts) && quote.selectedParts.length > 0
    ? quote.selectedParts.join(", ")
    : "Por evaluar";
  const channelText = quote.contactChannel === "email"
    ? `Correo electrónico (${quote.email || "No especificado"})`
    : `WhatsApp (${quote.phone})`;

  const cleanPhoneDigits = String(quote.phone || "").replace(/\D/g, "");
  const waPhone = cleanPhoneDigits.length === 8 ? `506${cleanPhoneDigits}` : cleanPhoneDigits;
  const waReplyMsg = encodeURIComponent(
    `Hola ${quote.customerName}, le saluda Randy de Taller Dayana 🚗🔧.\n\n` +
    `Con respecto a su solicitud de presupuesto para su ${quote.vehicle}:\n` +
    `• Piezas indicadas: ${partsText}\n` +
    `• Detalle: ${quote.damageDescription}\n\n` +
    `📋 ESTIMACIÓN DE PRESUPUESTO:\n` +
    `- Mano de obra y enderezado: ₡_____\n` +
    `- Preparación y pintura automotriz: ₡_____\n` +
    `💰 TOTAL ESTIMADO: ₡_____ (IVA incluido)\n` +
    `⏱️ Tiempo estimado: ___ días hábiles.\n` +
    `🛡️ Garantía en tono y acabado.\n\n` +
    `¿Gusta que coordinemos un espacio para inspeccionar el vehículo sin compromiso?`
  );
  const waReplyUrl = waPhone ? `https://wa.me/${waPhone}?text=${waReplyMsg}` : null;

  const emailReplySubject = encodeURIComponent(`Presupuesto Estimado - Taller Dayana (${quote.vehicle})`);
  const emailReplyBody = encodeURIComponent(
    `Estimado(a) ${quote.customerName},\n\n` +
    `Le saluda Randy de Taller Dayana. En atención a su solicitud de presupuesto para su vehículo ${quote.vehicle}:\n\n` +
    `• Piezas a reparar/pintar: ${partsText}\n` +
    `• Daño reportado: ${quote.damageDescription}\n\n` +
    `ESTIMACIÓN DE PRESUPUESTO:\n` +
    `- Mano de obra y enderezado: ₡_____\n` +
    `- Pintura automotriz y materiales: ₡_____\n` +
    `TOTAL ESTIMADO: ₡_____\n` +
    `Tiempo estimado de entrega: ___ días hábiles.\n\n` +
    `Contamos con garantía de calidad y color por escrito. Si desea coordinar la revisión presencial, puede responder a este correo o escribirnos al WhatsApp 7043-9248.\n\n` +
    `Atentamente,\nRandy - Taller Dayana\nAlajuela, Costa Rica`
  );
  const emailReplyUrl = quote.email ? `mailto:${quote.email}?subject=${emailReplySubject}&body=${emailReplyBody}` : null;

  const subject = `Nuevo presupuesto solicitado - ${quote.vehicle} (${quote.customerName})`;
  const text = [
    "Se registró una nueva solicitud de presupuesto en Taller Dayana.",
    "",
    `Cliente: ${quote.customerName}`,
    `Teléfono: ${quote.phone}`,
    quote.email ? `Correo: ${quote.email}` : null,
    `Medio preferido de respuesta: ${channelText}`,
    `Vehículo: ${quote.vehicle}`,
    `Piezas a cotizar: ${partsText}`,
    `Descripción: ${quote.damageDescription}`,
    `Fotos adjuntas: ${photoCount}`,
    `Fecha: ${quote.createdAt}`,
    "",
    waReplyUrl ? `Responder por WhatsApp: ${waReplyUrl}` : null,
    emailReplyUrl ? `Responder por Correo: ${emailReplyUrl}` : null
  ].filter(Boolean).join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px; background: #ffffff;">
      <h2 style="color: #dc2626; margin-top: 0;">🚗 Nueva Solicitud de Presupuesto</h2>
      <p style="font-size: 15px; color: #18181b;">Se ha recibido una nueva solicitud en el sitio web de Taller Dayana.</p>
      
      <div style="background: #f4f4f5; padding: 15px; border-radius: 8px; margin: 15px 0; line-height: 1.6;">
        <p style="margin: 4px 0;"><strong>Cliente:</strong> ${quote.customerName}</p>
        <p style="margin: 4px 0;"><strong>Teléfono:</strong> ${quote.phone}</p>
        ${quote.email ? `<p style="margin: 4px 0;"><strong>Correo:</strong> ${quote.email}</p>` : ""}
        <p style="margin: 4px 0; color: #dc2626;"><strong>Medio preferido de respuesta:</strong> ${channelText}</p>
        <p style="margin: 4px 0;"><strong>Vehículo:</strong> ${quote.vehicle}</p>
        <p style="margin: 4px 0;"><strong>Piezas indicadas:</strong> ${partsText}</p>
        <p style="margin: 4px 0;"><strong>Descripción:</strong> ${quote.damageDescription}</p>
        <p style="margin: 4px 0;"><strong>Fotos adjuntas:</strong> ${photoCount}</p>
      </div>

      <p style="font-weight: bold; margin-bottom: 10px;">Plantilla de Respuesta Rápida para Don Randy:</p>
      <div style="margin: 15px 0;">
        ${waReplyUrl ? `<a href="${waReplyUrl}" style="display: inline-block; background: #16a34a; color: #ffffff; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-right: 10px; margin-bottom: 8px;">📲 Responder por WhatsApp con Plantilla</a>` : ""}
        ${emailReplyUrl ? `<a href="${emailReplyUrl}" style="display: inline-block; background: #0284c7; color: #ffffff; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-bottom: 8px;">✉️ Responder por Correo con Plantilla</a>` : ""}
      </div>
    </div>
  `;

  const attachments = Array.isArray(quote.photos)
    ? quote.photos
        .filter((photo) => photo && typeof photo.dataUrl === "string" && photo.dataUrl.startsWith("data:image/"))
        .map((photo, index) => ({
          filename: photo.name || `vehiculo-${index + 1}.jpg`,
          path: photo.dataUrl
        }))
    : [];

  await transporter.sendMail({
    from,
    to: recipients,
    subject,
    text,
    html,
    attachments
  });

  // Si el cliente indicó correo y prefiere correo, enviarle acuse de recibo automático
  if (quote.email && quote.contactChannel === "email") {
    try {
      await transporter.sendMail({
        from,
        to: quote.email,
        subject: `Hemos recibido su solicitud de presupuesto - Taller Dayana`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px; background: #ffffff;">
            <h2 style="color: #dc2626; margin-top: 0;">¡Solicitud de Presupuesto Recibida! 🚗🔧</h2>
            <p>Estimado(a) <strong>${quote.customerName}</strong>,</p>
            <p>Hemos recibido correctamente su solicitud de valoración para su vehículo <strong>${quote.vehicle}</strong>.</p>
            
            <div style="background: #f4f4f5; padding: 15px; border-radius: 8px; margin: 15px 0; line-height: 1.6;">
              <p style="margin: 4px 0;"><strong>Piezas indicadas:</strong> ${partsText}</p>
              <p style="margin: 4px 0;"><strong>Detalle:</strong> ${quote.damageDescription}</p>
            </div>

            <p>Don Randy y nuestro equipo técnico evaluarán las fotos y detalles para enviarle la estimación formal directamente a este correo electrónico.</p>
            <p style="font-size: 13px; color: #71717a;">
              Taller Dayana • Alajuela, Costa Rica<br>
              Teléfonos: 7043-9248 / 8869-8157
            </p>
          </div>
        `
      });
    } catch (clientMailError) {
      console.error("No se pudo enviar acuse al cliente:", clientMailError.message);
    }
  }

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

  const googleMapsUrl = "https://www.google.com/maps/place/Taller+Dayana/@10.0189955,-84.2360667,20.5z";
  const wazeUrl = "https://waze.com/ul?ll=10.0188372,-84.2361356&navigate=yes";

  const subject = `Nueva cita de atención - ${appointment.vehicle} (${appointment.customerName})`;
  const text = [
    "Se registró una nueva cita de atención en Taller Dayana.",
    "",
    `Cliente: ${appointment.customerName}`,
    `Teléfono: ${appointment.phone}`,
    appointment.email ? `Correo: ${appointment.email}` : null,
    `Vehículo: ${appointment.vehicle}`,
    `Fecha y hora programada: ${appointmentTime}`,
    `Fecha de registro: ${appointment.createdAt}`
  ].filter(Boolean).join("\n");

  const icsContent = buildIcsCalendarInvite(appointment, parsedStart);

  await transporter.sendMail({
    from,
    to: recipients,
    subject,
    text,
    icalEvent: {
      filename: `cita-taller-dayana.ics`,
      method: "REQUEST",
      content: icsContent
    }
  });

  // Si el cliente indicó correo, enviarle confirmación con los datos y enlaces de Waze / Google Maps
  if (appointment.email) {
    try {
      await transporter.sendMail({
        from,
        to: appointment.email,
        subject: `Confirmación de Cita de Atención - Taller Dayana`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e4e4e7; border-radius: 12px; background: #ffffff;">
            <h2 style="color: #dc2626; margin-top: 0;">¡Cita Agendada en Taller Dayana! 🚗🔧</h2>
            <p>Estimado(a) <strong>${appointment.customerName}</strong>,</p>
            <p>Su cita para valoración y revisión presencial de su vehículo ha sido confirmada:</p>
            
            <div style="background: #f4f4f5; padding: 15px; border-radius: 8px; margin: 15px 0; line-height: 1.6;">
              <p style="margin: 4px 0;"><strong>Vehículo:</strong> ${appointment.vehicle}</p>
              <p style="margin: 4px 0;"><strong>Fecha y hora:</strong> ${appointmentTime}</p>
              <p style="margin: 4px 0;"><strong>Lugar:</strong> Barrio San José de Alajuela, Costa Rica</p>
            </div>

            <p style="font-weight: bold; margin-bottom: 10px;">¿Cómo llegar al taller?</p>
            <div style="margin: 15px 0;">
              <a href="${googleMapsUrl}" style="display: inline-block; background: #dc2626; color: #ffffff; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-right: 10px; margin-bottom: 8px;">🗺️ Abrir en Google Maps</a>
              <a href="${wazeUrl}" style="display: inline-block; background: #0284c7; color: #ffffff; padding: 10px 18px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-bottom: 8px;">🚗 Abrir en Waze</a>
            </div>

            <p style="font-size: 13px; color: #71717a;">
              Si necesita reprogramar o tiene alguna consulta, comuníquese con Don Randy al <strong>7043-9248</strong> o <strong>8869-8157</strong>.<br>
              ¡Le esperamos puntualmente!
            </p>
          </div>
        `,
        icalEvent: {
          filename: `cita-taller-dayana.ics`,
          method: "REQUEST",
          content: icsContent
        }
      });
    } catch (clientMailError) {
      console.error("No se pudo enviar confirmación al cliente por correo:", clientMailError.message);
    }
  }

  return {
    sent: true,
    recipients
  };
}

module.exports = {
  sendQuoteNotification,
  sendAppointmentNotification
};
