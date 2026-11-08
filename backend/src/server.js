require("dotenv").config();

const cors = require("cors");
const express = require("express");

const { signAdminToken, requireAdmin } = require("./auth");
const { services, gallery } = require("./data");
const { getPool } = require("./db");
const { sendQuoteNotification, sendAppointmentNotification } = require("./emailNotifier");
const { appendQuoteToSheet } = require("./googleSheets");
const { createQuoteCalendarAlert } = require("./googleCalendar");
const { sendQuoteWhatsAppAlerts, sendAppointmentWhatsAppAlerts } = require("./whatsappNotifier");
const { initializeDatabase } = require("./initDb");
const { getVehiclePhotosDir, toPublicPhotoUrl, normalizeIncomingPhotoUrl, deleteManagedPhotoFile } = require("./photoStorage");
const {
  createQuote,
  createAppointment,
  listAppointments,
  listQuotes,
  getRepairStatus,
  listNotificationsByPlate,
  updateAppointmentStatus,
  deleteAppointment,
  deleteQuote,
  registerWorkshopVehicle,
  listWorkshopVehicles,
  updateWorkshopVehicleStatus,
  deleteWorkshopVehicle,
  addWorkshopProgressPhoto,
  listWorkshopProgressPhotos,
  deleteWorkshopProgressPhoto,
  syncPhotosFromFilesystem,
  listReviews,
  createReview
} = require("./store");

const app = express();
const PORT = Number(process.env.PORT || 4000);

if (!Number.isInteger(PORT) || PORT <= 0) {
  throw new Error("PORT debe estar definido como entero positivo");
}

function normalizeOrigin(rawOrigin) {
  if (!rawOrigin || typeof rawOrigin !== "string") {
    return null;
  }

  try {
    return new URL(rawOrigin.trim()).origin.toLowerCase();
  } catch (_error) {
    return null;
  }
}

const extraFrontendUrls = String(process.env.FRONTEND_URLS || "")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const allowedOrigins = new Set(
  [
    process.env.FRONTEND_URL,
    process.env.FRONTEND_URL_WWW,
    ...extraFrontendUrls,
    "https://tallerdayana.vercel.app",
    "https://taller-dayana.vercel.app",
    "https://web-wine-kappa-14.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173"
  ]
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean)
);

function isValidAppointmentDateTime(value) {
  if (!value || typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();
  const localMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?$/);

  if (localMatch) {
    const year = Number(localMatch[1]);
    const month = Number(localMatch[2]);
    const dayOfMonth = Number(localMatch[3]);
    const hour = localMatch[4] !== undefined ? Number(localMatch[4]) : 9;
    const minute = localMatch[5] !== undefined ? Number(localMatch[5]) : 0;

    const utcDate = new Date(Date.UTC(year, month - 1, dayOfMonth, hour, minute));
    if (
      Number.isNaN(utcDate.getTime()) ||
      utcDate.getUTCFullYear() !== year ||
      utcDate.getUTCMonth() !== month - 1 ||
      utcDate.getUTCDate() !== dayOfMonth
    ) {
      return false;
    }

    const dayOfWeek = utcDate.getUTCDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }

    const totalMinutes = hour * 60 + minute;
    return totalMinutes >= 9 * 60 && totalMinutes <= 16 * 60;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return false;
  }

  const day = parsed.getDay();
  if (day === 0 || day === 6) {
    return false;
  }

  const totalMinutes = parsed.getHours() * 60 + parsed.getMinutes();
  return totalMinutes >= 9 * 60 && totalMinutes <= 16 * 60;
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = normalizeOrigin(origin);

      if (normalizedOrigin && allowedOrigins.has(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS origin no permitido"));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "50mb" }));
app.use("/api/uploads", express.static(getVehiclePhotosDir()));

app.get("/", (_req, res) => {
  res.json({
    service: "Taller Dayana API",
    status: "ok",
    health: "/health"
  });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  const expectedUser = process.env.ADMIN_USER || "admin";
  const expectedPass = process.env.ADMIN_PASSWORD || "admin123";

  if (username !== expectedUser || password !== expectedPass) {
    return res.status(401).json({ error: "Credenciales invalidas" });
  }

  const token = signAdminToken(username);
  return res.json({ token });
});

app.get("/api/services", (_req, res) => {
  res.json(services);
});

app.get("/api/reviews", async (_req, res) => {
  try {
    const items = await listReviews();
    return res.json(items);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/reviews", async (req, res) => {
  const { customerName, plate, comment, ratings } = req.body || {};
  if (!customerName || !comment) {
    return res.status(400).json({ error: "Nombre y comentario son requeridos" });
  }
  try {
    const created = await createReview({ customerName, plate, comment, ratings });
    return res.status(201).json(created);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/gallery", async (_req, res) => {
  const webhookUrl = String(process.env.GOOGLE_SCRIPT_WEBHOOK_URL || "").trim();
  const folderId = process.env.GOOGLE_DRIVE_GALLERY_FOLDER_ID || "1W3nJyaA8nMaI_HWQU_HD1xd8tkqzwR12";

  if (webhookUrl) {
    try {
      const response = await fetch(
        `${webhookUrl}${webhookUrl.includes("?") ? "&" : "?"}action=gallery&folderId=${encodeURIComponent(folderId)}`,
        { redirect: "follow" }
      );
      if (response.ok) {
        const payload = await response.json();
        if (payload && Array.isArray(payload.items) && payload.items.length > 0) {
          return res.json(payload.items);
        }
      }
    } catch (_err) {
      // Fallback to static gallery list
    }
  }

  return res.json(gallery);
});

app.post("/api/quotes", async (req, res) => {
  const { customerName, phone, vehicle, plate, damageDescription, photos, contactChannel, email, selectedParts } = req.body;

  if (!customerName || !phone || !vehicle || !damageDescription) {
    return res.status(400).json({ error: "Faltan campos requeridos" });
  }

  const cleanChannel = contactChannel === "email" ? "email" : "whatsapp";
  const cleanEmail = email ? String(email).trim() : "";
  if (cleanChannel === "email" && !cleanEmail) {
    return res.status(400).json({ error: "Debe ingresar su correo electrónico para responderle por ese medio" });
  }

  const cleanPlate = (plate && String(plate).trim()) ? String(plate).trim().toUpperCase() : `SP-${Date.now().toString().slice(-6)}`;
  const cleanParts = Array.isArray(selectedParts) ? selectedParts : [];

  const normalizedPhotos = Array.isArray(photos) ? photos : [];
  if (normalizedPhotos.length > 5) {
    return res.status(400).json({ error: "Solo se permiten hasta 5 fotos" });
  }

  const hasInvalidPhoto = normalizedPhotos.some(
    (item) => !item || typeof item.dataUrl !== "string" || !item.dataUrl.startsWith("data:image/")
  );

  if (hasInvalidPhoto) {
    return res.status(400).json({ error: "Formato de fotos invalido" });
  }

  try {
    const quote = await createQuote({
      customerName,
      phone,
      vehicle,
      plate: cleanPlate,
      damageDescription,
      photos: normalizedPhotos,
      contactChannel: cleanChannel,
      email: cleanEmail,
      selectedParts: cleanParts
    });
    let emailStatus = { sent: false, reason: "unknown" };
    let sheetsStatus = { sent: false, reason: "unknown" };
    let calendarStatus = { sent: false, reason: "unknown" };

    try {
      emailStatus = await sendQuoteNotification(quote);
    } catch (notifyError) {
      emailStatus = { sent: false, reason: notifyError.message };
      console.error("No se pudo enviar correo de aviso:", notifyError.message);
    }

    try {
      sheetsStatus = await appendQuoteToSheet(quote);
    } catch (sheetsError) {
      sheetsStatus = { sent: false, reason: sheetsError.message };
      console.error("No se pudo registrar en Google Sheets:", sheetsError.message);
    }

    try {
      calendarStatus = await createQuoteCalendarAlert(quote);
    } catch (calendarError) {
      calendarStatus = { sent: false, reason: calendarError.message };
      console.error("No se pudo crear aviso en Google Calendar:", calendarError.message);
    }

    let whatsappStatus = { sent: false, links: [] };
    try {
      whatsappStatus = await sendQuoteWhatsAppAlerts(quote);
    } catch (waError) {
      whatsappStatus = { sent: false, reason: waError.message, links: [] };
    }

    return res.status(201).json({
      ...quote,
      emailStatus,
      sheetsStatus,
      calendarStatus,
      whatsappStatus
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/appointments", async (req, res) => {
  const { customerName, phone, vehicle, plate, appointmentDate, contactChannel, email } = req.body;

  if (!customerName || !phone || !vehicle || !appointmentDate) {
    return res.status(400).json({ error: "Faltan campos requeridos" });
  }

  const cleanChannel = contactChannel === "email" ? "email" : "whatsapp";
  const cleanEmail = email ? String(email).trim() : "";
  if (cleanChannel === "email" && !cleanEmail) {
    return res.status(400).json({ error: "Debe ingresar su correo electrónico para recibir la confirmación de la cita" });
  }

  const cleanPlate = (plate && String(plate).trim()) ? String(plate).trim().toUpperCase() : `SP-${Date.now().toString().slice(-6)}`;

  if (!isValidAppointmentDateTime(appointmentDate)) {
    return res
      .status(400)
      .json({ error: "La cita debe ser de lunes a viernes entre 9:00 a.m. y 4:00 p.m." });
  }

  try {
    const appointment = await createAppointment({
      customerName,
      phone,
      vehicle,
      plate: cleanPlate,
      appointmentDate,
      contactChannel: cleanChannel,
      email: cleanEmail
    });
    let emailStatus = { sent: false, reason: "unknown" };
    let calendarStatus = { sent: false, reason: "unknown" };

    try {
      emailStatus = await sendAppointmentNotification(appointment);
    } catch (notifyError) {
      emailStatus = { sent: false, reason: notifyError.message };
      console.error("No se pudo enviar correo de aviso de cita:", notifyError.message);
    }

    try {
      calendarStatus = await createQuoteCalendarAlert({
        id: appointment.id,
        customerName,
        phone,
        vehicle,
        plate: cleanPlate,
        damageDescription: `Cita de atención para ${vehicle}`,
        photos: [],
        status: "appointment",
        createdAt: appointment.createdAt,
        appointmentDate
      });
    } catch (calendarError) {
      calendarStatus = { sent: false, reason: calendarError.message };
      console.error("No se pudo crear aviso en Google Calendar:", calendarError.message);
    }

    let whatsappStatus = { sent: false, links: [] };
    try {
      whatsappStatus = await sendAppointmentWhatsAppAlerts(appointment);
    } catch (waError) {
      whatsappStatus = { sent: false, reason: waError.message, links: [] };
    }

    return res.status(201).json({
      ...appointment,
      emailStatus,
      calendarStatus,
      whatsappStatus
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/repairs/status/:plate", async (req, res) => {
  const { plate } = req.params;
  const normalizedPlate = String(plate || "").trim().toUpperCase();
  const [{ appointment, quote }, dbProgressPhotos] = await Promise.all([
    getRepairStatus(normalizedPlate),
    listWorkshopProgressPhotos(normalizedPlate)
  ]);

  let drivePhotos = [];
  const webhookUrl = String(process.env.GOOGLE_SCRIPT_WEBHOOK_URL || "").trim();
  const folderId = process.env.GOOGLE_DRIVE_GALLERY_FOLDER_ID || "1W3nJyaA8nMaI_HWQU_HD1xd8tkqzwR12";

  if (webhookUrl && normalizedPlate) {
    try {
      const response = await fetch(
        `${webhookUrl}${webhookUrl.includes("?") ? "&" : "?"}action=plate_photos&folderId=${encodeURIComponent(folderId)}&plate=${encodeURIComponent(normalizedPlate)}`,
        { redirect: "follow" }
      );
      if (response.ok) {
        const payload = await response.json();
        if (payload && Array.isArray(payload.items) && payload.items.length > 0) {
          drivePhotos = payload.items.map((item, idx) => ({
            id: `drive-${item.id || idx + 1}`,
            plate: normalizedPlate,
            photoUrl: item.image || `https://drive.google.com/thumbnail?id=${item.id}&sz=w1400`,
            description: item.description || `Avance en proceso (${idx + 1})`,
            createdAt: item.createdAt || new Date().toISOString()
          }));
        }
      }
    } catch (_err) {
      // Continuar con fotos en base de datos si el webhook no responde
    }
  }

  const combinedPhotos = [
    ...(Array.isArray(dbProgressPhotos)
      ? dbProgressPhotos.map((photo) => ({
          ...photo,
          photoUrl: toPublicPhotoUrl(photo.photoUrl)
        }))
      : []),
    ...drivePhotos
  ];

  // Deduplicar por URL
  const uniquePhotos = [];
  const seenUrls = new Set();
  for (const photo of combinedPhotos) {
    if (photo.photoUrl && !seenUrls.has(photo.photoUrl)) {
      seenUrls.add(photo.photoUrl);
      uniquePhotos.push(photo);
    }
  }

  if (!appointment && !quote && uniquePhotos.length === 0) {
    return res.status(404).json({ error: "No se encontro informacion para esta placa" });
  }

  return res.json({
    plate: normalizedPlate,
    appointmentStatus: appointment ? appointment.status : uniquePhotos.length > 0 ? "in_progress" : "no_appointment",
    quoteStatus: quote ? quote.status : "no_quote",
    progressPhotos: uniquePhotos
  });
});

app.get("/api/notifications/:plate", (req, res) => {
  listNotificationsByPlate(req.params.plate)
    .then((plateNotifications) => res.json(plateNotifications))
    .catch((error) => res.status(500).json({ error: error.message }));
});

app.get("/api/admin/appointments", requireAdmin, async (_req, res) => {
  try {
    const items = await listAppointments();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch("/api/admin/appointments/:id/status", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Estado requerido" });
  }

  try {
    const target = await updateAppointmentStatus(id, status);

    if (!target) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    return res.json(target);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.delete("/api/admin/appointments/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ error: "ID invalido" });
  }

  try {
    const deleted = await deleteAppointment(id);

    if (!deleted) {
      return res.status(404).json({ error: "Cita no encontrada" });
    }

    return res.json({ deleted: true, id: deleted.id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/quotes", requireAdmin, async (_req, res) => {
  try {
    const items = await listQuotes();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/admin/quotes/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ error: "ID invalido" });
  }

  try {
    const deleted = await deleteQuote(id);

    if (!deleted) {
      return res.status(404).json({ error: "Presupuesto no encontrado" });
    }

    return res.json({ deleted: true, id: deleted.id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/workshop-vehicles", requireAdmin, async (req, res) => {
  const { plate, customerName, workType, entryDate, status } = req.body;

  if (!plate || !customerName || !workType || !entryDate || !status) {
    return res.status(400).json({ error: "Faltan campos requeridos" });
  }

  try {
    const item = await registerWorkshopVehicle({
      plate: cleanPlate,
      customerName: customerName.trim(),
      workType,
      entryDate,
      status
    });
    return res.status(201).json(item);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/workshop-vehicles", requireAdmin, async (_req, res) => {
  try {
    const items = await listWorkshopVehicles();
    return res.json(items);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.patch("/api/admin/workshop-vehicles/:id/status", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: "Estado requerido" });
  }

  try {
    const target = await updateWorkshopVehicleStatus(id, status);

    if (!target) {
      return res.status(404).json({ error: "Vehiculo no encontrado" });
    }

    return res.json(target);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.delete("/api/admin/workshop-vehicles/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ error: "ID invalido" });
  }

  try {
    const deleted = await deleteWorkshopVehicle(id);

    if (!deleted) {
      return res.status(404).json({ error: "Vehiculo no encontrado" });
    }

    for (const photoUrl of deleted.deletedPhotoUrls || []) {
      try {
        deleteManagedPhotoFile(photoUrl);
      } catch (_error) {
        // No bloquear la API si el archivo ya no existe.
      }
    }

    return res.json({ deleted: true, id: deleted.id });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/workshop-progress-photos", requireAdmin, async (req, res) => {
  const { plate, photoUrl, photoUrls, description } = req.body;

  const incomingPhotoUrls = Array.isArray(photoUrls) ? photoUrls : photoUrl ? [photoUrl] : [];

  if (!plate || incomingPhotoUrls.length === 0 || !description) {
    return res.status(400).json({ error: "Faltan campos requeridos" });
  }

  const normalizedPhotoUrls = incomingPhotoUrls
    .map((url) => normalizeIncomingPhotoUrl(url, plate))
    .filter(Boolean);

  if (normalizedPhotoUrls.length !== incomingPhotoUrls.length) {
    return res.status(400).json({ error: "Formato de foto invalido" });
  }

  try {
    const createdPhotos = [];

    for (const normalizedPhotoUrl of normalizedPhotoUrls) {
      const photo = await addWorkshopProgressPhoto({
        plate,
        photoUrl: normalizedPhotoUrl,
        description
      });

      if (!photo) {
        return res.status(404).json({ error: "No existe un vehiculo registrado con esa placa" });
      }

      createdPhotos.push(photo);
    }

    const payload = createdPhotos.map((photo) => ({
      ...photo,
      photoUrl: toPublicPhotoUrl(photo.photoUrl)
    }));

    if (payload.length === 1) {
      return res.status(201).json(payload[0]);
    }

    return res.status(201).json(payload);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/admin/workshop-progress-photos/:plate", requireAdmin, async (req, res) => {
  const { plate } = req.params;

  try {
    const photos = await listWorkshopProgressPhotos(plate);
    return res.json(
      photos.map((photo) => ({
        ...photo,
        photoUrl: toPublicPhotoUrl(photo.photoUrl)
      }))
    );
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.delete("/api/admin/workshop-progress-photos/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ error: "ID invalido" });
  }

  try {
    const deleted = await deleteWorkshopProgressPhoto(id);
    if (!deleted) {
      return res.status(404).json({ error: "Foto no encontrada" });
    }

    try {
      deleteManagedPhotoFile(deleted.photoUrl);
    } catch (_error) {
      // No bloquear la API si el archivo fisico ya no existe o no es gestionado.
    }

    return res.json({
      deleted: true,
      id: deleted.id
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post("/api/admin/deduplicate-photos", requireAdmin, async (req, res) => {
  try {
    const allPhotos = await listWorkshopProgressPhotos("");
    
    if (!allPhotos || allPhotos.length === 0) {
      return res.json({ deduped: true, deleted: 0 });
    }

    const toDelete = [];
    const seen = new Map();

    for (const photo of allPhotos) {
      if (!photo.photoUrl || !photo.plate) continue;

      const photoFileName = photo.photoUrl.split("/").pop().toLowerCase();
      const key = `${photo.plate.toUpperCase()}_${photoFileName}`;

      if (seen.has(key)) {
        const existing = seen.get(key);
        const existingTime = new Date(existing.createdAt).getTime();
        const currentTime = new Date(photo.createdAt).getTime();

        if (currentTime > existingTime) {
          toDelete.push(existing.id);
          seen.set(key, photo);
        } else {
          toDelete.push(photo.id);
        }
      } else {
        seen.set(key, photo);
      }
    }

    let deletedCount = 0;
    for (const photoId of toDelete) {
      try {
        const deleted = await deleteWorkshopProgressPhoto(photoId);
        if (deleted) {
          deletedCount++;
          try {
            deleteManagedPhotoFile(deleted.photoUrl);
          } catch (_err) {
            // Ignorar si el archivo no existe
          }
        }
      } catch (_err) {
        // Ignorar errores al eliminar
      }
    }

    return res.json({
      deduped: true,
      deleted: deletedCount,
      message: `Eliminadas ${deletedCount} fotos duplicadas`
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get("/api/db/status", async (_req, res) => {
  const pool = getPool();

  if (!pool) {
    return res.json({ connected: false, message: "DATABASE_URL no configurado" });
  }

  try {
    await pool.query("SELECT 1");
    return res.json({ connected: true });
  } catch (error) {
    return res.status(500).json({ connected: false, error: error.message });
  }
});

async function startServer() {
  try {
    const dbStatus = await initializeDatabase();
    if (dbStatus.initialized) {
      console.log(dbStatus.message);
    }

    // Sincronizar fotos del filesystem
    try {
      const synced = await syncPhotosFromFilesystem();
      if (synced.length > 0) {
        console.log(`Sincronizadas ${synced.length} fotos del filesystem`);
      }
    } catch (error) {
      console.warn("Error al sincronizar fotos del filesystem:", error.message);
    }
  } catch (error) {
    console.error("No se pudo inicializar PostgreSQL:", error.message);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Taller Dayana backend activo en puerto ${PORT}`);
  });
}

startServer();
