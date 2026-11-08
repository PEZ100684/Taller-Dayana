const { getPool } = require("./db");
const { discoverPhotosFromFilesystem } = require("./photoStorage");
const {
  quotes,
  appointments,
  notifications,
  workshopVehicles,
  workshopProgressPhotos,
  persistLocalData
} = require("./data");

function persistIfLocal() {
  persistLocalData({
    quotes,
    appointments,
    notifications,
    workshopVehicles,
    workshopProgressPhotos
  });
}

function formatDateOnly(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return String(value).slice(0, 10);
}

function formatDateTime(value) {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  return String(value);
}

function nextId(collection) {
  if (!Array.isArray(collection) || collection.length === 0) {
    return 1;
  }

  return Math.max(0, ...collection.map((item) => Number(item?.id) || 0)) + 1;
}

function buildQuoteRow(input, id = nextId(quotes)) {
  return {
    id,
    customerName: input.customerName,
    phone: input.phone,
    email: input.email || "",
    contactChannel: input.contactChannel || (input.email ? "email" : "whatsapp"),
    selectedParts: Array.isArray(input.selectedParts) ? input.selectedParts : [],
    vehicle: input.vehicle,
    plate: String(input.plate || "").trim().toUpperCase() || ("SP-" + Date.now().toString().slice(-6)),
    damageDescription: input.damageDescription,
    photos: Array.isArray(input.photos) ? input.photos : [],
    status: input.status || "received",
    createdAt: input.createdAt || new Date().toISOString()
  };
}

function buildAppointmentRow(input, id = nextId(appointments)) {
  return {
    id,
    customerName: input.customerName,
    phone: input.phone,
    email: input.email || "",
    contactChannel: input.contactChannel || (input.email ? "email" : "whatsapp"),
    vehicle: input.vehicle,
    plate: String(input.plate || "").trim().toUpperCase() || ("SP-" + Date.now().toString().slice(-6)),
    appointmentDate: input.appointmentDate || null,
    status: input.status || "scheduled",
    createdAt: input.createdAt || new Date().toISOString()
  };
}

function buildWorkshopVehicleRow(input, id = nextId(workshopVehicles)) {
  return {
    id,
    plate: String(input.plate || "").trim().toUpperCase(),
    customerName: input.customerName,
    workType: input.workType,
    entryDate: input.entryDate,
    status: input.status || "received",
    createdAt: input.createdAt || new Date().toISOString(),
    photoCount: input.photoCount || 0,
    lastPhotoAt: input.lastPhotoAt || null
  };
}

function buildProgressPhotoRow(input, id = nextId(workshopProgressPhotos)) {
  return {
    id,
    workshopVehicleId: input.workshopVehicleId,
    plate: String(input.plate || "").trim().toUpperCase(),
    photoUrl: input.photoUrl,
    description: input.description,
    createdAt: input.createdAt || new Date().toISOString()
  };
}

async function runInTransaction(pool, callback) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function createQuote(input) {
  const pool = getPool();
  const normalizedPlate = String(input.plate || "").trim().toUpperCase() || `SP-${Date.now().toString().slice(-6)}`;

  if (!pool) {
    const quote = buildQuoteRow({ ...input, plate: normalizedPlate });
    quotes.push(quote);
    persistIfLocal();
    return quote;
  }

  return runInTransaction(pool, async (client) => {
    const clientResult = await client.query(
      "INSERT INTO clients (name, phone) VALUES ($1, $2) RETURNING id",
      [input.customerName, input.phone]
    );
    const clientId = clientResult.rows[0].id;

    const vehicleResult = await client.query(
      `INSERT INTO vehicles (client_id, make_model, plate)
       VALUES ($1, $2, $3)
       ON CONFLICT (plate) DO UPDATE
         SET client_id = EXCLUDED.client_id,
             make_model = EXCLUDED.make_model
       RETURNING id`,
      [clientId, input.vehicle, normalizedPlate]
    );
    const vehicleId = vehicleResult.rows[0].id;

    let quoteResult;
    try {
      quoteResult = await client.query(
        "INSERT INTO quotes (client_id, vehicle_id, damage_description, photos_json, status, contact_channel, email, selected_parts) VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8::jsonb) RETURNING id, created_at",
        [clientId, vehicleId, input.damageDescription, JSON.stringify(input.photos || []), "received", input.contactChannel || "whatsapp", input.email || "", JSON.stringify(input.selectedParts || [])]
      );
    } catch {
      quoteResult = await client.query(
        "INSERT INTO quotes (client_id, vehicle_id, damage_description, photos_json, status) VALUES ($1, $2, $3, $4::jsonb, $5) RETURNING id, created_at",
        [clientId, vehicleId, input.damageDescription, JSON.stringify(input.photos || []), "received"]
      );
    }

    return buildQuoteRow(
      {
        ...input,
        plate: normalizedPlate,
        photos: input.photos || [],
        status: "received",
        createdAt: quoteResult.rows[0].created_at.toISOString()
      },
      quoteResult.rows[0].id
    );
  });
}

async function createAppointment(input) {
  const pool = getPool();
  const normalizedPlate = String(input.plate || "").trim().toUpperCase() || `SP-${Date.now().toString().slice(-6)}`;

  if (!pool) {
    const appointment = buildAppointmentRow({ ...input, plate: normalizedPlate });
    appointments.push(appointment);
    persistIfLocal();
    return appointment;
  }

  return runInTransaction(pool, async (client) => {
    const clientResult = await client.query(
      "INSERT INTO clients (name, phone) VALUES ($1, $2) RETURNING id",
      [input.customerName, input.phone]
    );
    const clientId = clientResult.rows[0].id;

    const vehicleResult = await client.query(
      `INSERT INTO vehicles (client_id, make_model, plate)
       VALUES ($1, $2, $3)
       ON CONFLICT (plate) DO UPDATE
         SET client_id = EXCLUDED.client_id,
             make_model = EXCLUDED.make_model
       RETURNING id`,
      [clientId, input.vehicle, normalizedPlate]
    );
    const vehicleId = vehicleResult.rows[0].id;

    let appointmentResult;
    try {
      appointmentResult = await client.query(
        "INSERT INTO appointments (client_id, vehicle_id, appointment_date, status, contact_channel, email) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at, appointment_date",
        [clientId, vehicleId, input.appointmentDate || null, "scheduled", input.contactChannel || "whatsapp", input.email || ""]
      );
    } catch {
      appointmentResult = await client.query(
        "INSERT INTO appointments (client_id, vehicle_id, appointment_date, status) VALUES ($1, $2, $3, $4) RETURNING id, created_at, appointment_date",
        [clientId, vehicleId, input.appointmentDate || null, "scheduled"]
      );
    }

    return buildAppointmentRow(
      {
        ...input,
        plate: normalizedPlate,
        status: "scheduled",
        createdAt: appointmentResult.rows[0].created_at.toISOString(),
        appointmentDate: formatDateTime(appointmentResult.rows[0].appointment_date)
      },
      appointmentResult.rows[0].id
    );
  });
}

async function listAppointments() {
  const pool = getPool();

  if (!pool) {
    return appointments;
  }

  let result;
  try {
    result = await pool.query(
      `SELECT
        a.id,
        c.name AS "customerName",
        c.phone,
        COALESCE(a.email, '') AS "email",
        COALESCE(a.contact_channel, 'whatsapp') AS "contactChannel",
        v.make_model AS "vehicle",
        v.plate,
        a.appointment_date AS "appointmentDate",
        a.status,
        a.created_at AS "createdAt"
      FROM appointments a
      JOIN clients c ON c.id = a.client_id
      JOIN vehicles v ON v.id = a.vehicle_id
      ORDER BY a.id ASC`
    );
  } catch {
    result = await pool.query(
      `SELECT
        a.id,
        c.name AS "customerName",
        c.phone,
        v.make_model AS "vehicle",
        v.plate,
        a.appointment_date AS "appointmentDate",
        a.status,
        a.created_at AS "createdAt"
      FROM appointments a
      JOIN clients c ON c.id = a.client_id
      JOIN vehicles v ON v.id = a.vehicle_id
      ORDER BY a.id ASC`
    );
  }

  return result.rows.map((row) => ({
    ...row,
    contactChannel: row.contactChannel || "whatsapp",
    email: row.email || "",
    appointmentDate: formatDateTime(row.appointmentDate),
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt
  }));
}

async function listQuotes() {
  const pool = getPool();

  if (!pool) {
    return quotes;
  }

  let result;
  try {
    result = await pool.query(
      `SELECT
        q.id,
        c.name AS "customerName",
        c.phone,
        COALESCE(q.email, '') AS "email",
        COALESCE(q.contact_channel, 'whatsapp') AS "contactChannel",
        COALESCE(q.selected_parts, '[]'::jsonb) AS "selectedParts",
        v.make_model AS "vehicle",
        v.plate,
        q.damage_description AS "damageDescription",
        q.photos_json AS photos,
        q.status,
        q.created_at AS "createdAt"
      FROM quotes q
      JOIN clients c ON c.id = q.client_id
      JOIN vehicles v ON v.id = q.vehicle_id
      ORDER BY q.id ASC`
    );
  } catch {
    result = await pool.query(
      `SELECT
        q.id,
        c.name AS "customerName",
        c.phone,
        v.make_model AS "vehicle",
        v.plate,
        q.damage_description AS "damageDescription",
        q.photos_json AS photos,
        q.status,
        q.created_at AS "createdAt"
      FROM quotes q
      JOIN clients c ON c.id = q.client_id
      JOIN vehicles v ON v.id = q.vehicle_id
      ORDER BY q.id ASC`
    );
  }

  return result.rows.map((row) => ({
    ...row,
    contactChannel: row.contactChannel || "whatsapp",
    email: row.email || "",
    selectedParts: Array.isArray(row.selectedParts) ? row.selectedParts : [],
    photos: Array.isArray(row.photos) ? row.photos : [],
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt
  }));
}

async function getRepairStatus(plate) {
  const pool = getPool();
  const normalized = plate.trim().toLowerCase();

  if (!pool) {
    const appointment = [...appointments].reverse().find((item) => item.plate.toLowerCase() === normalized);
    const quote = [...quotes].reverse().find((item) => item.plate.toLowerCase() === normalized);
    const workshopVehicle = [...workshopVehicles].reverse().find((item) => item.plate.toLowerCase() === normalized);
    return {
      appointment: appointment || (workshopVehicle ? { status: workshopVehicle.status } : null),
      quote
    };
  }

  const appointmentResult = await pool.query(
    `SELECT a.status
     FROM appointments a
     JOIN vehicles v ON v.id = a.vehicle_id
     WHERE LOWER(v.plate) = $1
     ORDER BY a.created_at DESC
     LIMIT 1`,
    [normalized]
  );

  const quoteResult = await pool.query(
    `SELECT q.status
     FROM quotes q
     JOIN vehicles v ON v.id = q.vehicle_id
     WHERE LOWER(v.plate) = $1
     ORDER BY q.created_at DESC
     LIMIT 1`,
    [normalized]
  );

  const workshopResult = await pool.query(
    `SELECT status
     FROM workshop_vehicles
     WHERE LOWER(plate) = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [normalized]
  );

  return {
    appointment:
      appointmentResult.rows[0]
        ? { status: appointmentResult.rows[0].status }
        : workshopResult.rows[0]
          ? { status: workshopResult.rows[0].status }
          : null,
    quote: quoteResult.rows[0] ? { status: quoteResult.rows[0].status } : null
  };
}

async function listNotificationsByPlate(plate) {
  const pool = getPool();
  const normalized = plate.trim().toLowerCase();

  if (!pool) {
    return notifications.filter((item) => item.plate.toLowerCase() === normalized);
  }

  const result = await pool.query(
    `SELECT id, plate, message, created_at AS "createdAt"
     FROM notifications
     WHERE LOWER(plate) = $1
     ORDER BY created_at ASC`,
    [normalized]
  );

  return result.rows.map((row) => ({
    ...row,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt
  }));
}

async function updateAppointmentStatus(id, status) {
  const pool = getPool();
  const numericId = Number(id);

  if (!pool) {
    const target = appointments.find((item) => item.id === numericId);
    if (!target) {
      return null;
    }

    target.status = status;

    if (status.toLowerCase() === "ready") {
      notifications.push({
        id: nextId(notifications),
        plate: target.plate,
        message: "Su vehiculo esta listo para retiro",
        createdAt: new Date().toISOString()
      });
    }

    persistIfLocal();

    return target;
  }

  return runInTransaction(pool, async (client) => {
    const updateResult = await client.query(
      `UPDATE appointments
       SET status = $1
       WHERE id = $2
       RETURNING id, status, created_at, client_id, vehicle_id`,
      [status, numericId]
    );

    if (!updateResult.rows[0]) {
      return null;
    }

    if (status.toLowerCase() === "ready") {
      const vehicleResult = await client.query("SELECT plate FROM vehicles WHERE id = $1", [updateResult.rows[0].vehicle_id]);
      const plate = vehicleResult.rows[0]?.plate;

      if (plate) {
        await client.query(
          "INSERT INTO notifications (plate, message) VALUES ($1, $2)",
          [plate, "Su vehiculo esta listo para retiro"]
        );
      }
    }

    return {
      id: updateResult.rows[0].id,
      status: updateResult.rows[0].status,
      createdAt: updateResult.rows[0].created_at instanceof Date ? updateResult.rows[0].created_at.toISOString() : updateResult.rows[0].created_at
    };
  });
}

async function deleteAppointment(id) {
  const pool = getPool();
  const numericId = Number(id);

  if (!pool) {
    const index = appointments.findIndex((item) => item.id === numericId);
    if (index < 0) {
      return null;
    }

    const [deleted] = appointments.splice(index, 1);
    persistIfLocal();
    return deleted;
  }

  const result = await pool.query(
    `DELETE FROM appointments
     WHERE id = $1
     RETURNING id, status, created_at, appointment_date`,
    [numericId]
  );

  if (!result.rows[0]) {
    return null;
  }

  return {
    id: result.rows[0].id,
    status: result.rows[0].status,
    createdAt:
      result.rows[0].created_at instanceof Date
        ? result.rows[0].created_at.toISOString()
        : result.rows[0].created_at,
    appointmentDate: formatDateTime(result.rows[0].appointment_date)
  };
}

async function registerWorkshopVehicle(input) {
  const pool = getPool();

  if (!pool) {
    const item = buildWorkshopVehicleRow(input);
    workshopVehicles.push(item);
    persistIfLocal();
    return item;
  }

  const result = await pool.query(
    `INSERT INTO workshop_vehicles (plate, customer_name, work_type, entry_date, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, plate, customer_name, work_type, entry_date, status, created_at`,
    [input.plate, input.customerName, input.workType, input.entryDate, input.status || "received"]
  );

  const row = result.rows[0];
  return {
    id: row.id,
    plate: row.plate,
    customerName: row.customer_name,
    workType: row.work_type,
    entryDate: formatDateOnly(row.entry_date),
    status: row.status,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    photoCount: 0,
    lastPhotoAt: null
  };
}

async function deleteQuote(id) {
  const pool = getPool();
  const numericId = Number(id);

  if (!pool) {
    const index = quotes.findIndex((item) => item.id === numericId);
    if (index < 0) {
      return null;
    }

    const [deleted] = quotes.splice(index, 1);
    persistIfLocal();
    return deleted;
  }

  const result = await pool.query(
    `DELETE FROM quotes
     WHERE id = $1
     RETURNING id, status, created_at`,
    [numericId]
  );

  if (!result.rows[0]) {
    return null;
  }

  return {
    id: result.rows[0].id,
    status: result.rows[0].status,
    createdAt:
      result.rows[0].created_at instanceof Date
        ? result.rows[0].created_at.toISOString()
        : result.rows[0].created_at
  };
}

async function listWorkshopVehicles() {
  const pool = getPool();

  if (!pool) {
    return [...workshopVehicles]
      .sort((a, b) => Number(b.id) - Number(a.id))
      .map((vehicle) => {
        const photos = workshopProgressPhotos.filter((photo) => photo.workshopVehicleId === vehicle.id);
        const lastPhoto = photos.length > 0 ? photos[photos.length - 1] : null;

        return {
          ...vehicle,
          photoCount: photos.length,
          lastPhotoAt: lastPhoto ? lastPhoto.createdAt : null
        };
      });
  }

  const result = await pool.query(
    `SELECT
      wv.id,
      wv.plate,
      wv.customer_name,
      wv.work_type,
      wv.entry_date,
      wv.status,
      wv.created_at,
      COUNT(wpp.id)::int AS photo_count,
      MAX(wpp.created_at) AS last_photo_at
    FROM workshop_vehicles wv
    LEFT JOIN workshop_progress_photos wpp ON wpp.workshop_vehicle_id = wv.id
    GROUP BY wv.id
    ORDER BY wv.id DESC`
  );

  return result.rows.map((row) => ({
    id: row.id,
    plate: row.plate,
    customerName: row.customer_name,
    workType: row.work_type,
    entryDate: formatDateOnly(row.entry_date),
    status: row.status,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    photoCount: row.photo_count,
    lastPhotoAt: row.last_photo_at instanceof Date ? row.last_photo_at.toISOString() : row.last_photo_at
  }));
}

async function updateWorkshopVehicleStatus(id, status) {
  const pool = getPool();
  const numericId = Number(id);

  if (!pool) {
    const target = workshopVehicles.find((item) => item.id === numericId);
    if (!target) {
      return null;
    }

    target.status = status;
    persistIfLocal();
    return target;
  }

  const result = await pool.query(
    `UPDATE workshop_vehicles
     SET status = $1
     WHERE id = $2
     RETURNING id, plate, customer_name, work_type, entry_date, status, created_at`,
    [status, numericId]
  );

  if (!result.rows[0]) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    plate: row.plate,
    customerName: row.customer_name,
    workType: row.work_type,
    entryDate: formatDateOnly(row.entry_date),
    status: row.status,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
  };
}

async function deleteWorkshopVehicle(id) {
  const pool = getPool();
  const numericId = Number(id);

  if (!pool) {
    const index = workshopVehicles.findIndex((item) => item.id === numericId);
    if (index < 0) {
      return null;
    }

    const [deleted] = workshopVehicles.splice(index, 1);
    const deletedPhotos = workshopProgressPhotos
      .filter((item) => item.workshopVehicleId === numericId)
      .map((item) => item.photoUrl);

    for (let i = workshopProgressPhotos.length - 1; i >= 0; i -= 1) {
      if (workshopProgressPhotos[i].workshopVehicleId === numericId) {
        workshopProgressPhotos.splice(i, 1);
      }
    }

    persistIfLocal();
    return {
      ...deleted,
      deletedPhotoUrls: deletedPhotos
    };
  }

  return runInTransaction(pool, async (client) => {
    const photoRows = await client.query(
      `SELECT photo_url
       FROM workshop_progress_photos
       WHERE workshop_vehicle_id = $1`,
      [numericId]
    );

    const deleteResult = await client.query(
      `DELETE FROM workshop_vehicles
       WHERE id = $1
       RETURNING id, plate, customer_name, work_type, entry_date, status, created_at`,
      [numericId]
    );

    if (!deleteResult.rows[0]) {
      return null;
    }

    const row = deleteResult.rows[0];
    return {
      id: row.id,
      plate: row.plate,
      customerName: row.customer_name,
      workType: row.work_type,
      entryDate: formatDateOnly(row.entry_date),
      status: row.status,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
      deletedPhotoUrls: photoRows.rows.map((photo) => photo.photo_url).filter(Boolean)
    };
  });
}

async function addWorkshopProgressPhoto(input) {
  const pool = getPool();
  const normalizedPlate = input.plate.trim().toUpperCase();

  if (!pool) {
    const targetVehicle = [...workshopVehicles].reverse().find((item) => item.plate.toUpperCase() === normalizedPlate);

    if (!targetVehicle) {
      return null;
    }

    const photo = buildProgressPhotoRow({
      workshopVehicleId: targetVehicle.id,
      plate: targetVehicle.plate,
      photoUrl: input.photoUrl,
      description: input.description
    });

    workshopProgressPhotos.push(photo);
    persistIfLocal();
    return photo;
  }

  const vehicleResult = await pool.query(
    `SELECT id, plate
     FROM workshop_vehicles
     WHERE UPPER(plate) = $1
     ORDER BY id DESC
     LIMIT 1`,
    [normalizedPlate]
  );

  const vehicle = vehicleResult.rows[0];
  if (!vehicle) {
    return null;
  }

  const photoResult = await pool.query(
    `INSERT INTO workshop_progress_photos (workshop_vehicle_id, plate, photo_url, description)
     VALUES ($1, $2, $3, $4)
     RETURNING id, workshop_vehicle_id, plate, photo_url, description, created_at`,
    [vehicle.id, vehicle.plate, input.photoUrl, input.description]
  );

  const row = photoResult.rows[0];
  return {
    id: row.id,
    workshopVehicleId: row.workshop_vehicle_id,
    plate: row.plate,
    photoUrl: row.photo_url,
    description: row.description,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
  };
}

async function listWorkshopProgressPhotos(plate) {
  const pool = getPool();
  const normalizedPlate = plate ? plate.trim().toUpperCase() : "";

  if (!pool) {
    const filtered = normalizedPlate
      ? workshopProgressPhotos.filter((item) => item.plate.toUpperCase() === normalizedPlate)
      : workshopProgressPhotos;
    return filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  if (!normalizedPlate) {
    const result = await pool.query(
      `SELECT id, workshop_vehicle_id, plate, photo_url, description, created_at
       FROM workshop_progress_photos
       ORDER BY created_at ASC`
    );
    return result.rows.map((row) => ({
      id: row.id,
      workshopVehicleId: row.workshop_vehicle_id,
      plate: row.plate,
      photoUrl: row.photo_url,
      description: row.description,
      createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
    }));
  }

  const result = await pool.query(
    `SELECT id, workshop_vehicle_id, plate, photo_url, description, created_at
     FROM workshop_progress_photos
     WHERE UPPER(plate) = $1
     ORDER BY created_at ASC`,
    [normalizedPlate]
  );

  return result.rows.map((row) => ({
    id: row.id,
    workshopVehicleId: row.workshop_vehicle_id,
    plate: row.plate,
    photoUrl: row.photo_url,
    description: row.description,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
  }));
}

async function deleteWorkshopProgressPhoto(id) {
  const pool = getPool();
  const numericId = Number(id);

  if (!pool) {
    const index = workshopProgressPhotos.findIndex((item) => item.id === numericId);
    if (index < 0) {
      return null;
    }

    const [deleted] = workshopProgressPhotos.splice(index, 1);
    persistIfLocal();
    return deleted;
  }

  const result = await pool.query(
    `DELETE FROM workshop_progress_photos
     WHERE id = $1
     RETURNING id, workshop_vehicle_id, plate, photo_url, description, created_at`,
    [numericId]
  );

  if (!result.rows[0]) {
    return null;
  }

  const row = result.rows[0];
  return {
    id: row.id,
    workshopVehicleId: row.workshop_vehicle_id,
    plate: row.plate,
    photoUrl: row.photo_url,
    description: row.description,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
  };
}

async function syncPhotosFromFilesystem() {
  const discovered = discoverPhotosFromFilesystem();
  const pool = getPool();

  if (!pool) {
    const synced = [];

    for (const photo of discovered) {
      const existing = workshopProgressPhotos.find(
        (p) => p.plate === photo.plate && p.photoUrl === photo.photoUrl
      );

      if (!existing) {
        const targetVehicle = [...workshopVehicles]
          .reverse()
          .find((item) => item.plate.toUpperCase() === photo.plate.toUpperCase());

        const newPhoto = buildProgressPhotoRow(
          {
            workshopVehicleId: targetVehicle ? targetVehicle.id : null,
            plate: photo.plate,
            photoUrl: photo.photoUrl,
            description: photo.description,
            createdAt: photo.createdAt
          },
          nextId(workshopProgressPhotos)
        );

        workshopProgressPhotos.push(newPhoto);
        synced.push(newPhoto);
      }
    }

    if (synced.length > 0) {
      persistIfLocal();
    }

    return synced;
  }

  const synced = [];

  for (const photo of discovered) {
    const existing = await pool.query(
      `SELECT id FROM workshop_progress_photos WHERE UPPER(plate) = $1 AND photo_url = $2`,
      [photo.plate.toUpperCase(), photo.photoUrl]
    );

    if (!existing.rows[0]) {
      const vehicleResult = await pool.query(
        `SELECT id, plate FROM workshop_vehicles WHERE UPPER(plate) = $1 ORDER BY id DESC LIMIT 1`,
        [photo.plate.toUpperCase()]
      );

      const vehicle = vehicleResult.rows[0];
      if (!vehicle) {
        continue;
      }

      const result = await pool.query(
        `INSERT INTO workshop_progress_photos (workshop_vehicle_id, plate, photo_url, description, created_at)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, workshop_vehicle_id, plate, photo_url, description, created_at`,
        [vehicle.id, vehicle.plate, photo.photoUrl, photo.description, photo.createdAt]
      );

      if (result.rows[0]) {
        const row = result.rows[0];
        synced.push({
          id: row.id,
          workshopVehicleId: row.workshop_vehicle_id,
          plate: row.plate,
          photoUrl: row.photo_url,
          description: row.description,
          createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
        });
      }
    }
  }

  return synced;
}

async function listReviews() {
  const pool = getPool();
  const defaultSeed = [
    {
      id: "rev-1",
      customerName: "Macaco",
      plate: "ADT564",
      comment: "Excelente trabajo de pintura y entrega puntual. El carro quedó como salido de agencia.",
      ratings: { servicio: 5, trato: 5, calidad: 5, precio: 5 },
      average: 5,
      date: "Reciente"
    }
  ];

  if (!pool) {
    return defaultSeed;
  }

  try {
    const result = await pool.query(
      `SELECT id, customer_name, plate, comment, ratings_json, average_rating, created_at
       FROM reviews
       ORDER BY id DESC
       LIMIT 30`
    );
    const dbRows = result.rows.map((row) => ({
      id: `db-${row.id}`,
      customerName: row.customer_name,
      plate: row.plate || "",
      comment: row.comment,
      ratings: row.ratings_json || { servicio: 5, trato: 5, calidad: 5, precio: 5 },
      average: Number(row.average_rating) || 5,
      date: row.created_at instanceof Date ? row.created_at.toLocaleDateString("es-CR") : "Reciente"
    }));
    return [...dbRows, ...defaultSeed];
  } catch {
    return defaultSeed;
  }
}

async function createReview(input) {
  const pool = getPool();
  const ratings = input.ratings || { servicio: 5, trato: 5, calidad: 5, precio: 5 };
  const average =
    Number(
      (
        (Number(ratings.servicio || 5) +
          Number(ratings.trato || 5) +
          Number(ratings.calidad || 5) +
          Number(ratings.precio || 5) +
          Number(ratings.puntualidad || 5)) /
        5
      ).toFixed(1)
    ) || 5;

  if (!pool) {
    return {
      id: `rev-${Date.now()}`,
      customerName: input.customerName,
      plate: input.plate || "",
      comment: input.comment,
      ratings,
      average,
      date: new Date().toLocaleDateString("es-CR")
    };
  }

  const result = await pool.query(
    `INSERT INTO reviews (customer_name, plate, comment, ratings_json, average_rating)
     VALUES ($1, $2, $3, $4::jsonb, $5)
     RETURNING id, customer_name, plate, comment, ratings_json, average_rating, created_at`,
    [
      String(input.customerName || "Cliente").trim(),
      String(input.plate || "").trim().toUpperCase(),
      String(input.comment || "").trim(),
      JSON.stringify(ratings),
      average
    ]
  );

  const row = result.rows[0];
  return {
    id: `db-${row.id}`,
    customerName: row.customer_name,
    plate: row.plate || "",
    comment: row.comment,
    ratings: row.ratings_json,
    average: Number(row.average_rating),
    date: row.created_at instanceof Date ? row.created_at.toLocaleDateString("es-CR") : "Reciente"
  };
}

module.exports = {
  createQuote,
  createAppointment,
  listAppointments,
  listQuotes,
  getRepairStatus,
  listNotificationsByPlate,
  updateAppointmentStatus,
  deleteAppointment,
  registerWorkshopVehicle,
  listWorkshopVehicles,
  updateWorkshopVehicleStatus,
  deleteWorkshopVehicle,
  deleteQuote,
  addWorkshopProgressPhoto,
  listWorkshopProgressPhotos,
  deleteWorkshopProgressPhoto,
  syncPhotosFromFilesystem,
  listReviews,
  createReview
};