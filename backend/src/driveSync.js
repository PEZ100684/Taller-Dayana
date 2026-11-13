const fs = require("fs");
const http = require("http");
const https = require("https");
const { google } = require("googleapis");
const { getPool } = require("./db");
const {
  quotes,
  appointments,
  notifications,
  tenants,
  towTrucks,
  workshopVehicles,
  workshopProgressPhotos,
  persistLocalData,
  reloadLocalData
} = require("./data");

const DEFAULT_ROOT_FOLDER_ID = "1W3nJyaA8nMaI_HWQU_HD1xd8tkqzwR12";
const DEFAULT_GALLERY_FOLDER_ID = "1DHB3yVKlVQyqMLroi70K4DqsMhrABoeb";
const SYNC_TTL_MS = Math.max(10000, Number(process.env.DRIVE_SYNC_TTL_MS || 45000));
const SYNC_INTERVAL_MS = Math.max(60000, Number(process.env.DRIVE_SYNC_INTERVAL_MS || 300000));

const IGNORED_FOLDER_NAMES = new Set([
  "FOTOS DUEÑOS",
  "FOTOS DUENOS",
  "GALERIA DE CASOS ATENDIDOS",
  "PLANTILLAS Y ESTIMACIONES DE PRECIOS",
  "VEHICULOS LISTOS (ANTES Y DESPUES)",
  "_PAPELERA_ADMIN"
]);

const VIDEO_EXTENSIONS = /\.(mp4|mov|webm|m4v|avi|mkv|3gp)$/i;
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|webp|gif|bmp|heic|heif)$/i;

const syncState = {
  lastAttemptAt: null,
  lastSuccessAt: null,
  mode: "pending",
  rootFolderId: process.env.GOOGLE_DRIVE_GALLERY_FOLDER_ID || DEFAULT_ROOT_FOLDER_ID,
  platesCount: 0,
  mediaCount: 0,
  lastError: null,
  lastSummary: null
};

let inFlightSync = null;
let galleryCache = { fetchedAt: 0, items: null };
let schedulerTimer = null;

function normalizePrivateKey(rawKey) {
  if (!rawKey || typeof rawKey !== "string") {
    return "";
  }
  return rawKey
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\\\\n/g, "\n")
    .replace(/\\n/g, "\n");
}

function tryParseServiceAccountJson(raw) {
  if (!raw || typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{")) {
    return null;
  }
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object" && (parsed.private_key || parsed.client_email)) {
      return parsed;
    }
  } catch (_err) {
    // ignorar si no es JSON válido
  }
  return null;
}

function getServiceAccountConfig() {
  let email = String(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "").trim();
  let rawKey = String(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || "").trim();

  const jsonCandidates = [
    rawKey,
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
    process.env.GOOGLE_SERVICE_ACCOUNT,
    process.env.GOOGLE_CREDENTIALS
  ];

  const fileCandidates = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    process.env.GOOGLE_SERVICE_ACCOUNT_FILE,
    "/etc/secrets/service-account.json",
    "/etc/secrets/google-service-account.json",
    "/etc/secrets/GOOGLE_SERVICE_ACCOUNT",
    "/etc/secrets/GOOGLE_SERVICE_ACCOUNT.json"
  ].filter(Boolean);

  for (const filePath of fileCandidates) {
    try {
      if (fs.existsSync(filePath)) {
        jsonCandidates.push(fs.readFileSync(filePath, "utf8"));
      }
    } catch (_err) {
      // ignorar si no se puede leer
    }
  }

  for (const candidate of jsonCandidates) {
    const parsed = tryParseServiceAccountJson(candidate);
    if (parsed) {
      if (!email && parsed.client_email) {
        email = String(parsed.client_email).trim();
      }
      if ((!rawKey || rawKey.trim().startsWith("{")) && parsed.private_key) {
        rawKey = String(parsed.private_key);
      }
    }
  }

  const privateKey = normalizePrivateKey(rawKey);
  return {
    configured: Boolean(email && privateKey),
    email,
    privateKey
  };
}

function createDriveClient() {
  const sa = getServiceAccountConfig();
  if (!sa.configured) {
    return null;
  }

  const auth = new google.auth.JWT({
    email: sa.email,
    key: sa.privateKey,
    scopes: ["https://www.googleapis.com/auth/drive"]
  });

  return google.drive({ version: "v3", auth });
}

function decodeHtmlEntities(str) {
  if (!str) return "";
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_m, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_m, dec) => String.fromCharCode(parseInt(dec, 10)));
}

function httpGetBuffer(targetUrl, maxRedirects = 5, timeoutMs = 15000, headers = {}) {
  return new Promise((resolve, reject) => {
    const client = targetUrl.startsWith("http://") ? http : https;
    const req = client.get(
      targetUrl,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; TallerDayanaSync/1.0)",
          ...headers
        },
        timeout: timeoutMs
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && maxRedirects > 0) {
          const nextUrl = new URL(res.headers.location, targetUrl).toString();
          res.resume();
          httpGetBuffer(nextUrl, maxRedirects - 1, timeoutMs, headers).then(resolve, reject);
          return;
        }

        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          resolve({
            statusCode: res.statusCode || 0,
            headers: res.headers,
            buffer: Buffer.concat(chunks)
          });
        });
      }
    );

    req.on("timeout", () => {
      req.destroy(new Error(`Timeout al conectar con ${targetUrl}`));
    });
    req.on("error", reject);
  });
}

async function httpGetText(targetUrl, timeoutMs = 15000) {
  const result = await httpGetBuffer(targetUrl, 5, timeoutMs);
  if (result.statusCode < 200 || result.statusCode >= 300) {
    throw new Error(`HTTP ${result.statusCode} desde ${targetUrl}`);
  }
  return result.buffer.toString("utf8");
}

function parseEmbeddedModifiedDate(rawLabel) {
  const clean = String(rawLabel || "").trim();
  const now = new Date();
  if (!clean) {
    return now.toISOString();
  }

  // Case 1: Time of day ("2:31 PM" or "14:31") -> today's date
  const timeMatch = clean.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);
  if (timeMatch) {
    let hour = Number(timeMatch[1]);
    const minute = Number(timeMatch[2]);
    const meridiem = timeMatch[3] ? timeMatch[3].toUpperCase() : null;
    if (meridiem === "PM" && hour < 12) hour += 12;
    if (meridiem === "AM" && hour === 12) hour = 0;
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
    return Number.isNaN(d.getTime()) ? now.toISOString() : d.toISOString();
  }

  // Case 2: "Nov 7" (no year)
  const monthDayMatch = clean.match(/^([A-Za-z]{3,9})\s+(\d{1,2})$/);
  if (monthDayMatch) {
    const year = now.getFullYear();
    let parsed = new Date(`${monthDayMatch[1]} ${monthDayMatch[2]}, ${year} 12:00:00 UTC`);
    if (!Number.isNaN(parsed.getTime())) {
      if (parsed.getTime() > now.getTime() + 7 * 24 * 60 * 60 * 1000) {
        parsed = new Date(`${monthDayMatch[1]} ${monthDayMatch[2]}, ${year - 1} 12:00:00 UTC`);
      }
      return parsed.toISOString();
    }
  }

  // Case 3: Full date string like "Nov 7, 2025" or ISO
  const direct = new Date(clean);
  if (!Number.isNaN(direct.getTime())) {
    return direct.toISOString();
  }

  return now.toISOString();
}

function parseEmbeddedFolderHtml(html) {
  const blocks = String(html || "").split('<div class="flip-entry"').slice(1);
  const entries = [];

  for (const block of blocks) {
    const idMatch = block.match(/id="entry-([^"]+)"/);
    const titleMatch = block.match(/<div class="flip-entry-title">([^<]*)<\/div>/);
    const hrefMatch = block.match(/href="([^"]+)"/);
    const altMatch = block.match(/alt="([^"]*)"/);
    const iconMatch = block.match(/\/type\/([a-zA-Z0-9.+_-]+\/[a-zA-Z0-9.+_-]+)/);
    const modMatch = block.match(/<div class="flip-entry-last-modified">\s*<div>([^<]*)<\/div>/);

    if (!idMatch || !titleMatch) {
      continue;
    }

    const id = idMatch[1].trim();
    const name = decodeHtmlEntities(titleMatch[1]).trim();
    const href = hrefMatch ? decodeHtmlEntities(hrefMatch[1]) : "";
    const alt = altMatch ? decodeHtmlEntities(altMatch[1]).trim() : "";
    const iconMime = iconMatch ? iconMatch[1].toLowerCase() : "";
    const modifiedTime = parseEmbeddedModifiedDate(modMatch ? modMatch[1] : "");

    const isFolder =
      href.includes("/drive/folders/") ||
      iconMime.includes("vnd.google-apps.folder");

    const isVideo =
      !isFolder &&
      (iconMime.startsWith("video/") ||
        /video/i.test(alt) ||
        VIDEO_EXTENSIONS.test(name));

    const isImage =
      !isFolder &&
      !isVideo &&
      (iconMime.startsWith("image/") ||
        /image|jpeg|png|webp|gif/i.test(alt) ||
        IMAGE_EXTENSIONS.test(name));

    entries.push({
      id,
      name,
      isFolder,
      isVideo,
      isImage,
      mimeType: iconMime || (isVideo ? "video/mp4" : isImage ? "image/jpeg" : "application/octet-stream"),
      modifiedTime
    });
  }

  return entries;
}

async function listFolderViaEmbedded(folderId) {
  const url = `https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(folderId)}#list`;
  const html = await httpGetText(url, 15000);
  if (!html.includes("flip-entry") && html.includes("accounts.google.com")) {
    throw new Error(`La carpeta ${folderId} requiere inicio de sesión o no es pública`);
  }
  return parseEmbeddedFolderHtml(html);
}

async function listFolderViaServiceAccount(drive, folderId) {
  const items = [];
  let pageToken = undefined;

  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType, createdTime, modifiedTime)",
      pageSize: 200,
      pageToken,
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    });

    const files = Array.isArray(res.data && res.data.files) ? res.data.files : [];
    for (const f of files) {
      const mimeType = String(f.mimeType || "").toLowerCase();
      const name = String(f.name || "").trim();
      const isFolder = mimeType === "application/vnd.google-apps.folder";
      const isVideo = !isFolder && (mimeType.startsWith("video/") || VIDEO_EXTENSIONS.test(name));
      const isImage = !isFolder && !isVideo && (mimeType.startsWith("image/") || IMAGE_EXTENSIONS.test(name));

      items.push({
        id: f.id,
        name,
        isFolder,
        isVideo,
        isImage,
        mimeType,
        modifiedTime: f.modifiedTime || f.createdTime || new Date().toISOString()
      });
    }

    pageToken = res.data ? res.data.nextPageToken : undefined;
  } while (pageToken);

  return items;
}

async function listFolderRecursive(listFn, folderId, depth = 0, visited = new Set()) {
  if (depth > 2 || visited.has(folderId)) {
    return [];
  }
  visited.add(folderId);

  const entries = await listFn(folderId);
  const mediaFiles = [];

  for (const entry of entries) {
    if (entry.isFolder) {
      try {
        const nested = await listFolderRecursive(listFn, entry.id, depth + 1, visited);
        mediaFiles.push(...nested);
      } catch (_err) {
        // Ignorar subcarpeta inaccesible sin detener la sincronización
      }
    } else if (entry.isVideo || entry.isImage) {
      mediaFiles.push(entry);
    }
  }

  return mediaFiles;
}

async function fetchDriveSnapshot(rootFolderId) {
  const driveClient = createDriveClient();
  let mode = "public_folder_view";
  let listFn = listFolderViaEmbedded;
  let rootEntries = null;

  if (driveClient) {
    try {
      const saRoot = await listFolderViaServiceAccount(driveClient, rootFolderId);
      if (Array.isArray(saRoot)) {
        mode = "service_account";
        listFn = (fid) => listFolderViaServiceAccount(driveClient, fid);
        rootEntries = saRoot;
      }
    } catch (saErr) {
      console.warn("⚠️ Drive Service Account fallback a vista pública:", saErr.message);
      mode = "public_folder_view";
      listFn = listFolderViaEmbedded;
    }
  }

  if (!rootEntries) {
    rootEntries = await listFn(rootFolderId);
  }

  // Si Service Account devolvió 0 elementos pero hay vista pública disponible, verificar vista pública
  if (mode === "service_account" && rootEntries.length === 0) {
    try {
      const publicEntries = await listFolderViaEmbedded(rootFolderId);
      if (publicEntries.length > 0) {
        rootEntries = publicEntries;
        listFn = listFolderViaEmbedded;
        mode = "public_folder_view";
      }
    } catch (_err) {
      // mantener resultado del service account
    }
  }

  const plateFolders = rootEntries.filter(
    (item) => item.isFolder && !IGNORED_FOLDER_NAMES.has(item.name.trim().toUpperCase())
  );

  const folders = [];
  for (const folder of plateFolders) {
    const plate = folder.name.trim().toUpperCase();
    if (!plate) continue;

    try {
      const files = await listFolderRecursive(listFn, folder.id, 0, new Set());
      const seenIds = new Set();
      const uniqueFiles = [];
      for (const file of files) {
        if (!file.id || seenIds.has(file.id)) continue;
        seenIds.add(file.id);
        uniqueFiles.push(file);
      }

      folders.push({
        folderId: folder.id,
        plate,
        modifiedTime: folder.modifiedTime || new Date().toISOString(),
        fetchOk: true,
        files: uniqueFiles
      });
    } catch (folderErr) {
      console.warn(`⚠️ No se pudo leer subcarpeta ${plate} (${folder.id}):`, folderErr.message);
      folders.push({
        folderId: folder.id,
        plate,
        modifiedTime: folder.modifiedTime || new Date().toISOString(),
        fetchOk: false,
        files: []
      });
    }
  }

  return {
    mode,
    rootFetchOk: rootEntries.length > 0,
    folders
  };
}

function extractDriveFileId(photo) {
  if (!photo) return null;
  if (photo.fileId && typeof photo.fileId === "string" && photo.fileId.trim()) {
    return photo.fileId.trim();
  }
  const url = String(photo.photoUrl || photo.photo_url || "");
  const match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/) || url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function isDrivePhotoRecord(photo) {
  const url = String(photo?.photoUrl || photo?.photo_url || "").toLowerCase();
  return Boolean(photo?.fileId) || url.includes("drive.google.com") || url.includes("googleusercontent.com");
}

function getNextId(collection) {
  return collection.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function isPreciseTimestamp(isoStr) {
  if (!isoStr || typeof isoStr !== "string") return false;
  // Timestamps parsed only from "Nov 7" default to exact ":00.000Z" seconds/ms
  return !isoStr.endsWith("T12:00:00.000Z");
}

function reconcileLocalStore(snapshot) {
  if (typeof reloadLocalData === "function") {
    reloadLocalData();
  }

  const drivePlates = new Set(snapshot.folders.map((f) => f.plate));
  let changed = false;

  // Map existing precise timestamps by fileId so we don't degrade exact ISO dates to day-only
  const existingByFileId = new Map();
  for (const p of workshopProgressPhotos) {
    const fid = extractDriveFileId(p);
    if (fid) {
      existingByFileId.set(fid, p);
    }
  }

  // 1. Upsert vehicles from Drive
  const vehicleByPlate = new Map();
  for (const v of workshopVehicles) {
    vehicleByPlate.set(String(v.plate || "").trim().toUpperCase(), v);
  }

  for (const folder of snapshot.folders) {
    let vehicle = vehicleByPlate.get(folder.plate);
    if (!vehicle) {
      vehicle = {
        id: getNextId(workshopVehicles),
        tenantId: 1,
        plate: folder.plate,
        customerName: "Vehículo en Taller",
        workType: "Enderezado y pintura",
        entryDate: String(folder.modifiedTime || new Date().toISOString()).slice(0, 10),
        status: "in_progress",
        createdAt: folder.modifiedTime || new Date().toISOString()
      };
      workshopVehicles.push(vehicle);
      vehicleByPlate.set(folder.plate, vehicle);
      changed = true;
    }

    if (!folder.fetchOk) {
      continue;
    }

    const activeFileIds = new Set(folder.files.map((f) => f.id));

    // Remove stale Drive-sourced photos removed from Drive for this plate
    for (let i = workshopProgressPhotos.length - 1; i >= 0; i -= 1) {
      const existing = workshopProgressPhotos[i];
      if (String(existing.plate || "").trim().toUpperCase() !== folder.plate) continue;
      if (!isDrivePhotoRecord(existing)) continue;
      const fid = extractDriveFileId(existing);
      if (fid && !activeFileIds.has(fid)) {
        workshopProgressPhotos.splice(i, 1);
        changed = true;
      }
    }

    // Add missing photos/videos and repair missing videoUrl/mediaType
    for (const file of folder.files) {
      const existing = existingByFileId.get(file.id);
      const expectedPhotoUrl = `https://drive.google.com/thumbnail?id=${file.id}&sz=w1200`;
      const expectedVideoUrl = file.isVideo ? `https://drive.google.com/file/d/${file.id}/preview` : null;
      const expectedMediaType = file.isVideo ? "video" : "image";
      const expectedDescription = file.isVideo
        ? `Video de avance - ${file.name}`
        : `Avance de reparación - ${file.name}`;

      if (existing && String(existing.plate || "").trim().toUpperCase() === folder.plate) {
        if (existing.workshopVehicleId !== vehicle.id) {
          existing.workshopVehicleId = vehicle.id;
          changed = true;
        }
        if (existing.mediaType !== expectedMediaType) {
          existing.mediaType = expectedMediaType;
          changed = true;
        }
        if (file.isVideo && existing.videoUrl !== expectedVideoUrl) {
          existing.videoUrl = expectedVideoUrl;
          changed = true;
        }
        if (!existing.fileId) {
          existing.fileId = file.id;
          changed = true;
        }
        if (isPreciseTimestamp(file.modifiedTime) && !isPreciseTimestamp(existing.createdAt)) {
          existing.createdAt = file.modifiedTime;
          changed = true;
        }
      } else {
        const newRow = {
          id: getNextId(workshopProgressPhotos),
          workshopVehicleId: vehicle.id,
          plate: folder.plate,
          fileId: file.id,
          mediaType: expectedMediaType,
          photoUrl: expectedPhotoUrl,
          videoUrl: expectedVideoUrl,
          description: expectedDescription,
          createdAt: file.modifiedTime || new Date().toISOString()
        };
        workshopProgressPhotos.push(newRow);
        existingByFileId.set(file.id, newRow);
        changed = true;
      }
    }
  }

  // 2. Reconcile deleted Drive plate folders cleanly
  if (snapshot.rootFetchOk) {
    for (let i = workshopVehicles.length - 1; i >= 0; i -= 1) {
      const v = workshopVehicles[i];
      const upperPlate = String(v.plate || "").trim().toUpperCase();
      if (!upperPlate || drivePlates.has(upperPlate)) continue;

      const platePhotos = workshopProgressPhotos.filter(
        (p) => String(p.plate || "").trim().toUpperCase() === upperPlate
      );
      const hasOnlyDrivePhotos = platePhotos.length > 0 && platePhotos.every((p) => isDrivePhotoRecord(p));
      const isAutoDriveVehicle = String(v.customerName || "").trim() === "Vehículo en Taller";

      if (hasOnlyDrivePhotos || (platePhotos.length === 0 && isAutoDriveVehicle)) {
        workshopVehicles.splice(i, 1);
        for (let j = workshopProgressPhotos.length - 1; j >= 0; j -= 1) {
          if (String(workshopProgressPhotos[j].plate || "").trim().toUpperCase() === upperPlate) {
            workshopProgressPhotos.splice(j, 1);
          }
        }
        changed = true;
      }
    }
  }

  // Refresh computed photoCount on local vehicles
  for (const v of workshopVehicles) {
    const count = workshopProgressPhotos.filter((p) => p.workshopVehicleId === v.id).length;
    if (v.photoCount !== count) {
      v.photoCount = count;
      changed = true;
    }
  }

  if (changed) {
    persistLocalData({
      tenants,
      quotes,
      appointments,
      notifications,
      workshopVehicles,
      workshopProgressPhotos,
      towTrucks
    });
  }

  return {
    changed,
    platesCount: snapshot.folders.length,
    mediaCount: workshopProgressPhotos.length
  };
}

async function reconcilePostgresStore(pool, snapshot) {
  const drivePlates = new Set(snapshot.folders.map((f) => f.plate));
  let addedPhotos = 0;
  let removedPhotos = 0;
  let addedVehicles = 0;
  let removedVehicles = 0;

  const vehiclesRes = await pool.query(
    `SELECT id, plate, customer_name, work_type, entry_date, status, created_at
     FROM workshop_vehicles
     ORDER BY id ASC`
  );
  const vehicleByPlate = new Map();
  for (const row of vehiclesRes.rows) {
    const key = String(row.plate || "").trim().toUpperCase();
    if (!vehicleByPlate.has(key)) {
      vehicleByPlate.set(key, row);
    }
  }

  let photosRes;
  let hasMediaColumns = true;
  try {
    photosRes = await pool.query(
      `SELECT id, workshop_vehicle_id, plate, photo_url, video_url, media_type, description, created_at
       FROM workshop_progress_photos`
    );
  } catch (_err) {
    hasMediaColumns = false;
    photosRes = await pool.query(
      `SELECT id, workshop_vehicle_id, plate, photo_url, description, created_at
       FROM workshop_progress_photos`
    );
  }

  for (const folder of snapshot.folders) {
    let vehicle = vehicleByPlate.get(folder.plate);
    if (!vehicle) {
      const entryDate = String(folder.modifiedTime || new Date().toISOString()).slice(0, 10);
      const inserted = await pool.query(
        `INSERT INTO workshop_vehicles (tenant_id, plate, customer_name, work_type, entry_date, status)
         VALUES (1, $1, $2, $3, $4, 'in_progress')
         RETURNING id, plate, customer_name, work_type, entry_date, status, created_at`,
        [folder.plate, "Vehículo en Taller", "Enderezado y pintura", entryDate]
      );
      vehicle = inserted.rows[0];
      vehicleByPlate.set(folder.plate, vehicle);
      addedVehicles += 1;
    }

    if (!folder.fetchOk) {
      continue;
    }

    const plateRows = photosRes.rows.filter(
      (r) => String(r.plate || "").trim().toUpperCase() === folder.plate
    );
    const existingByFileId = new Map();
    for (const r of plateRows) {
      const fid = extractDriveFileId(r);
      if (fid) existingByFileId.set(fid, r);
    }

    const activeIds = new Set(folder.files.map((f) => f.id));

    for (const r of plateRows) {
      if (!isDrivePhotoRecord(r)) continue;
      const fid = extractDriveFileId(r);
      if (fid && !activeIds.has(fid)) {
        await pool.query(`DELETE FROM workshop_progress_photos WHERE id = $1`, [r.id]);
        removedPhotos += 1;
      }
    }

    for (const file of folder.files) {
      const expectedPhotoUrl = `https://drive.google.com/thumbnail?id=${file.id}&sz=w1200`;
      const expectedVideoUrl = file.isVideo ? `https://drive.google.com/file/d/${file.id}/preview` : null;
      const expectedMediaType = file.isVideo ? "video" : "image";
      const expectedDescription = file.isVideo
        ? `Video de avance - ${file.name}`
        : `Avance de reparación - ${file.name}`;

      const existing = existingByFileId.get(file.id);
      if (existing) {
        if (hasMediaColumns && (existing.media_type !== expectedMediaType || (file.isVideo && existing.video_url !== expectedVideoUrl))) {
          await pool.query(
            `UPDATE workshop_progress_photos
             SET media_type = $1, video_url = $2
             WHERE id = $3`,
            [expectedMediaType, expectedVideoUrl, existing.id]
          );
        }
        continue;
      }

      if (hasMediaColumns) {
        await pool.query(
          `INSERT INTO workshop_progress_photos
             (workshop_vehicle_id, tenant_id, plate, photo_url, video_url, media_type, description, created_at)
           VALUES ($1, 1, $2, $3, $4, $5, $6, $7)`,
          [
            vehicle.id,
            folder.plate,
            expectedPhotoUrl,
            expectedVideoUrl,
            expectedMediaType,
            expectedDescription,
            file.modifiedTime || new Date().toISOString()
          ]
        );
      } else {
        await pool.query(
          `INSERT INTO workshop_progress_photos
             (workshop_vehicle_id, plate, photo_url, description, created_at)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            vehicle.id,
            folder.plate,
            expectedPhotoUrl,
            expectedDescription,
            file.modifiedTime || new Date().toISOString()
          ]
        );
      }
      addedPhotos += 1;
    }
  }

  if (snapshot.rootFetchOk) {
    for (const [plate, vehicle] of vehicleByPlate.entries()) {
      if (drivePlates.has(plate)) continue;
      const plateRows = photosRes.rows.filter(
        (r) => String(r.plate || "").trim().toUpperCase() === plate
      );
      const hasOnlyDrivePhotos = plateRows.length > 0 && plateRows.every((r) => isDrivePhotoRecord(r));
      const isAutoDriveVehicle = String(vehicle.customer_name || "").trim() === "Vehículo en Taller";

      if (hasOnlyDrivePhotos || (plateRows.length === 0 && isAutoDriveVehicle)) {
        await pool.query(`DELETE FROM workshop_vehicles WHERE id = $1`, [vehicle.id]);
        removedVehicles += 1;
      }
    }
  }

  return {
    addedVehicles,
    removedVehicles,
    addedPhotos,
    removedPhotos,
    platesCount: snapshot.folders.length
  };
}

async function syncFromGoogleDrive({ force = false } = {}) {
  const rootFolderId = String(process.env.GOOGLE_DRIVE_GALLERY_FOLDER_ID || DEFAULT_ROOT_FOLDER_ID).trim();
  syncState.rootFolderId = rootFolderId;

  if (inFlightSync) {
    return inFlightSync;
  }

  if (!force && syncState.lastSuccessAt && Date.now() - syncState.lastSuccessAt < SYNC_TTL_MS) {
    return { skipped: true, ...getDriveSyncStatus() };
  }

  inFlightSync = (async () => {
    syncState.lastAttemptAt = Date.now();
    try {
      const snapshot = await fetchDriveSnapshot(rootFolderId);
      const pool = getPool();
      const summary = pool
        ? await reconcilePostgresStore(pool, snapshot)
        : reconcileLocalStore(snapshot);

      syncState.mode = snapshot.mode;
      syncState.lastSuccessAt = Date.now();
      syncState.platesCount = snapshot.folders.length;
      syncState.mediaCount = snapshot.folders.reduce((acc, f) => acc + f.files.length, 0);
      syncState.lastError = null;
      syncState.lastSummary = summary;

      return {
        synced: true,
        ...getDriveSyncStatus()
      };
    } catch (error) {
      syncState.lastError = error.message || String(error);
      console.warn("⚠️ Error en auto-sincronización Drive:", syncState.lastError);
      return {
        synced: false,
        error: syncState.lastError,
        ...getDriveSyncStatus()
      };
    } finally {
      inFlightSync = null;
    }
  })();

  return inFlightSync;
}

async function ensureDriveSynced({ maxAgeMs = SYNC_TTL_MS } = {}) {
  if (inFlightSync) {
    return inFlightSync;
  }
  const now = Date.now();
  if (syncState.lastSuccessAt && now - syncState.lastSuccessAt < maxAgeMs) {
    return null;
  }
  if (syncState.lastAttemptAt && now - syncState.lastAttemptAt < 10000) {
    return null;
  }
  return syncFromGoogleDrive({ force: true });
}

function startDriveSyncScheduler() {
  if (schedulerTimer) {
    return;
  }
  schedulerTimer = setInterval(() => {
    syncFromGoogleDrive({ force: true }).catch(() => {});
  }, SYNC_INTERVAL_MS);

  if (typeof schedulerTimer.unref === "function") {
    schedulerTimer.unref();
  }
}

function getDriveSyncStatus() {
  const sa = getServiceAccountConfig();
  return {
    mode: syncState.mode,
    rootFolderId: syncState.rootFolderId,
    lastAttemptAt: syncState.lastAttemptAt ? new Date(syncState.lastAttemptAt).toISOString() : null,
    lastSuccessAt: syncState.lastSuccessAt ? new Date(syncState.lastSuccessAt).toISOString() : null,
    platesCount: syncState.platesCount,
    mediaCount: syncState.mediaCount,
    lastError: syncState.lastError,
    lastSummary: syncState.lastSummary,
    credentials: {
      serviceAccountConfigured: sa.configured,
      serviceAccountEmail: sa.configured ? sa.email : null,
      webhookConfigured: Boolean(String(process.env.GOOGLE_SCRIPT_WEBHOOK_URL || "").trim()),
      databaseConfigured: Boolean(getPool())
    }
  };
}

async function fetchDriveGalleryItems(folderId = DEFAULT_GALLERY_FOLDER_ID) {
  const now = Date.now();
  if (galleryCache.items && now - galleryCache.fetchedAt < SYNC_INTERVAL_MS) {
    return galleryCache.items;
  }

  const driveClient = createDriveClient();
  let entries = [];

  if (driveClient) {
    try {
      entries = await listFolderViaServiceAccount(driveClient, folderId);
    } catch (_err) {
      entries = [];
    }
  }

  if (entries.length === 0) {
    entries = await listFolderViaEmbedded(folderId);
  }

  const items = entries
    .filter((entry) => !entry.isFolder && !entry.isVideo)
    .map((entry, idx) => ({
      id: entry.id,
      title: `Caso atendido #${idx + 1}`,
      image: `https://drive.google.com/thumbnail?id=${entry.id}&sz=w1000`,
      fullImage: `https://drive.google.com/thumbnail?id=${entry.id}&sz=w1600`
    }));

  if (items.length > 0) {
    galleryCache = { fetchedAt: now, items };
  }

  return items;
}

async function fetchDriveMediaBuffer(fileId) {
  const cleanId = String(fileId || "").trim();
  if (!/^[a-zA-Z0-9_-]{10,120}$/.test(cleanId)) {
    throw new Error("ID de archivo inválido");
  }

  const candidateUrls = [
    `https://lh3.googleusercontent.com/d/${encodeURIComponent(cleanId)}=w1200`,
    `https://drive.google.com/thumbnail?id=${encodeURIComponent(cleanId)}&sz=w1200`
  ];

  for (const url of candidateUrls) {
    try {
      const resp = await httpGetBuffer(url, 5, 12000);
      const contentType = String(resp.headers["content-type"] || "");
      if (resp.statusCode >= 200 && resp.statusCode < 300 && contentType.startsWith("image/") && resp.buffer.length > 0) {
        return {
          contentType,
          buffer: resp.buffer
        };
      }
    } catch (_err) {
      // probar siguiente URL candidata
    }
  }

  const driveClient = createDriveClient();
  if (driveClient) {
    const mediaRes = await driveClient.files.get(
      { fileId: cleanId, alt: "media", supportsAllDrives: true },
      { responseType: "arraybuffer" }
    );
    return {
      contentType: String(mediaRes.headers && mediaRes.headers["content-type"]) || "image/jpeg",
      buffer: Buffer.from(mediaRes.data)
    };
  }

  throw new Error("No se pudo obtener la imagen desde Google Drive");
}

async function callDriveWebhook(payload) {
  const webhookUrl = String(process.env.GOOGLE_SCRIPT_WEBHOOK_URL || "").trim();
  if (!webhookUrl) {
    return null;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    redirect: "follow"
  });
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (_err) {
    return { ok: response.ok, raw: text };
  }
}

async function ensureDrivePlateFolder(plate) {
  const cleanPlate = String(plate || "").trim().toUpperCase();
  if (!cleanPlate) {
    return { created: false, reason: "Placa vacía" };
  }

  const rootFolderId = process.env.GOOGLE_DRIVE_GALLERY_FOLDER_ID || DEFAULT_ROOT_FOLDER_ID;
  const driveClient = createDriveClient();

  if (driveClient) {
    try {
      const entries = await listFolderViaServiceAccount(driveClient, rootFolderId);
      const existing = entries.find(
        (item) => item.isFolder && item.name.trim().toUpperCase() === cleanPlate
      );
      if (existing) {
        syncState.lastSuccessAt = null;
        return { created: false, exists: true, folderId: existing.id, method: "service_account" };
      }

      const created = await driveClient.files.create({
        supportsAllDrives: true,
        requestBody: {
          name: cleanPlate,
          mimeType: "application/vnd.google-apps.folder",
          parents: [rootFolderId]
        },
        fields: "id, name"
      });
      syncState.lastSuccessAt = null;
      return {
        created: true,
        exists: true,
        folderId: created.data && created.data.id ? created.data.id : null,
        method: "service_account"
      };
    } catch (err) {
      console.warn("⚠️ No se pudo crear carpeta en Drive con Service Account:", err.message);
    }
  }

  try {
    const webhookRes = await callDriveWebhook({
      action: "create_plate_folder",
      folderId: rootFolderId,
      plate: cleanPlate
    });
    if (webhookRes && webhookRes.ok) {
      syncState.lastSuccessAt = null;
      return {
        created: Boolean(webhookRes.created),
        exists: true,
        folderId: webhookRes.folderId || null,
        method: "webhook"
      };
    }
  } catch (err) {
    console.warn("⚠️ No se pudo crear carpeta en Drive vía webhook:", err.message);
  }

  return {
    created: false,
    reason: "Service Account sin permiso de Editor o webhook sin soporte de creación"
  };
}

async function trashDrivePlateFolder(plate) {
  const cleanPlate = String(plate || "").trim().toUpperCase();
  if (!cleanPlate) {
    return { trashed: false, count: 0, reason: "Placa vacía" };
  }

  const rootFolderId = process.env.GOOGLE_DRIVE_GALLERY_FOLDER_ID || DEFAULT_ROOT_FOLDER_ID;
  const driveClient = createDriveClient();
  let lastSaError = null;

  if (driveClient) {
    try {
      const entries = await listFolderViaServiceAccount(driveClient, rootFolderId);
      const matching = entries.filter(
        (item) => item.isFolder && item.name.trim().toUpperCase() === cleanPlate
      );
      if (matching.length === 0) {
        syncState.lastSuccessAt = null;
        return { trashed: false, count: 0, method: "service_account", reason: "Carpeta no encontrada en Drive" };
      }

      let removedCount = 0;
      let actionMode = "trashed";
      let trashBinFolderId = null;

      async function getOrCreateAdminTrashFolderId() {
        if (trashBinFolderId) {
          return trashBinFolderId;
        }
        const existingBin = entries.find(
          (item) => item.isFolder && item.name.trim().toUpperCase() === "_PAPELERA_ADMIN"
        );
        if (existingBin) {
          trashBinFolderId = existingBin.id;
          return trashBinFolderId;
        }
        const createdBin = await driveClient.files.create({
          supportsAllDrives: true,
          requestBody: {
            name: "_PAPELERA_ADMIN",
            mimeType: "application/vnd.google-apps.folder",
            parents: [rootFolderId]
          },
          fields: "id"
        });
        trashBinFolderId = createdBin.data.id;
        return trashBinFolderId;
      }

      for (const folder of matching) {
        try {
          await driveClient.files.update({
            fileId: folder.id,
            supportsAllDrives: true,
            requestBody: { trashed: true }
          });
          removedCount += 1;
        } catch (trashErr) {
          // Si la carpeta fue creada por el propietario en Mi unidad, un Editor tiene canTrash=false,
          // pero sí canRemoveMyDriveParent=true y canMoveItemWithinDrive=true.
          try {
            await driveClient.files.update({
              fileId: folder.id,
              removeParents: rootFolderId,
              supportsAllDrives: true
            });
            actionMode = "unlinked_from_folder";
            removedCount += 1;
            console.warn("⚠️ Carpeta retirada de carpeta raíz en Drive (Editor sin canTrash):", trashErr.message);
          } catch (unlinkErr) {
            const binId = await getOrCreateAdminTrashFolderId();
            await driveClient.files.update({
              fileId: folder.id,
              addParents: binId,
              removeParents: rootFolderId,
              supportsAllDrives: true
            });
            actionMode = "moved_to_papelera_admin";
            removedCount += 1;
            console.warn("⚠️ Carpeta movida a _PAPELERA_ADMIN en Drive:", unlinkErr.message);
          }
        }
      }
      syncState.lastSuccessAt = null;
      return { trashed: removedCount > 0, count: removedCount, method: "service_account", action: actionMode };
    } catch (err) {
      lastSaError = err.message;
      console.warn("⚠️ No se pudo eliminar/retirar carpeta en Drive con Service Account:", err.message);
    }
  }

  try {
    const webhookRes = await callDriveWebhook({
      action: "delete_plate_folder",
      folderId: rootFolderId,
      plate: cleanPlate
    });
    if (webhookRes && webhookRes.ok) {
      syncState.lastSuccessAt = null;
      return {
        trashed: Boolean(webhookRes.trashed),
        count: Number(webhookRes.count || 0),
        method: "webhook"
      };
    }
  } catch (err) {
    console.warn("⚠️ No se pudo enviar carpeta a papelera en Drive vía webhook:", err.message);
  }

  return {
    trashed: false,
    count: 0,
    reason: lastSaError || "Service Account sin permiso de Editor en la carpeta de Drive o webhook no configurado"
  };
}

module.exports = {
  DEFAULT_ROOT_FOLDER_ID,
  DEFAULT_GALLERY_FOLDER_ID,
  syncFromGoogleDrive,
  ensureDriveSynced,
  startDriveSyncScheduler,
  getDriveSyncStatus,
  fetchDriveGalleryItems,
  fetchDriveMediaBuffer,
  ensureDrivePlateFolder,
  trashDrivePlateFolder
};
