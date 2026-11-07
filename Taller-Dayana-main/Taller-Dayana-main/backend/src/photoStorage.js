const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const DEFAULT_PHOTOS_DIR = path.resolve(process.cwd(), "..", "FOTOS VEHICULOS");

const MIME_TO_EXT = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif"
};

function getVehiclePhotosDir() {
  return process.env.VEHICLE_PHOTOS_DIR || DEFAULT_PHOTOS_DIR;
}

function ensurePhotosDir() {
  const dir = getVehiclePhotosDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function safePlate(plate) {
  return String(plate || "vehiculo")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "-")
    .slice(0, 32) || "VEHICULO";
}

function ensurePlateDir(plate) {
  const plateDir = path.join(ensurePhotosDir(), safePlate(plate));
  if (!fs.existsSync(plateDir)) {
    fs.mkdirSync(plateDir, { recursive: true });
  }
  return plateDir;
}

function toPublicUploadsUrl(fileName) {
  const segments = String(fileName || "")
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      try {
        return encodeURIComponent(decodeURIComponent(segment));
      } catch (_err) {
        return encodeURIComponent(segment);
      }
    });
  return `/api/uploads/${segments.join("/")}`;
}

function toPublicPhotoUrl(photoUrl) {
  if (typeof photoUrl !== "string" || !photoUrl.trim()) {
    return null;
  }

  const raw = photoUrl.trim();

  if (
    raw.startsWith("http://") ||
    raw.startsWith("https://") ||
    raw.startsWith("data:image/")
  ) {
    return raw;
  }

  if (raw.startsWith("/api/uploads/")) {
    const suffix = raw.slice("/api/uploads/".length);
    return toPublicUploadsUrl(suffix);
  }

  const normalized = raw.replace(/\\/g, "/");
  const baseName = path.basename(normalized);

  if (!baseName || baseName === "." || baseName === "/") {
    return raw;
  }

  return toPublicUploadsUrl(baseName);
}

function saveDataUrlPhoto(dataUrl, plate) {
  const match = String(dataUrl || "").match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    return null;
  }

  const mimeType = match[1].toLowerCase();
  const base64Payload = match[2];
  const extension = MIME_TO_EXT[mimeType] || "jpg";
  const plateSafe = safePlate(plate);

  const fileName = `${plateSafe}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${extension}`;
  const outputPath = path.join(ensurePlateDir(plateSafe), fileName);

  fs.writeFileSync(outputPath, Buffer.from(base64Payload, "base64"));

  return toPublicUploadsUrl(`${plateSafe}/${fileName}`);
}

function normalizeIncomingPhotoUrl(photoUrl, plate) {
  if (typeof photoUrl !== "string" || !photoUrl.trim()) {
    return null;
  }

  if (photoUrl.startsWith("data:image/")) {
    return saveDataUrlPhoto(photoUrl, plate);
  }

  return toPublicPhotoUrl(photoUrl);
}

function extractManagedFileName(photoUrl) {
  const publicUrl = toPublicPhotoUrl(photoUrl);

  if (!publicUrl || !publicUrl.startsWith("/api/uploads/")) {
    return null;
  }

  const encodedPath = publicUrl.replace("/api/uploads/", "").trim();
  if (!encodedPath) {
    return null;
  }

  const filePath = decodeURIComponent(encodedPath);

  if (!filePath || filePath.includes("\\") || filePath.includes("..")) {
    return null;
  }

  return filePath;
}

function deleteManagedPhotoFile(photoUrl) {
  const fileName = extractManagedFileName(photoUrl);
  if (!fileName) {
    return false;
  }

  const absolutePath = path.join(getVehiclePhotosDir(), fileName);

  if (!fs.existsSync(absolutePath)) {
    return false;
  }

  fs.unlinkSync(absolutePath);
  return true;
}

function discoverPhotosFromFilesystem() {
  const photosDir = getVehiclePhotosDir();
  const discovered = [];

  if (!fs.existsSync(photosDir)) {
    return discovered;
  }

  try {
    const items = fs.readdirSync(photosDir, { withFileTypes: true });

    for (const item of items) {
      if (!item.isDirectory()) continue;

      const plate = item.name.toUpperCase();
      const plateDir = path.join(photosDir, item.name);

      try {
        const files = fs.readdirSync(plateDir);

        for (const file of files) {
          const ext = path.extname(file).toLowerCase();
          const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

          if (!imageExts.includes(ext)) continue;

          const filePath = path.join(plateDir, file);
          const stats = fs.statSync(filePath);
          const relativePath = `${plate}/${file}`;

          discovered.push({
            plate,
            fileName: file,
            filePath,
            photoUrl: toPublicUploadsUrl(relativePath),
            description: `Photo: ${file}`,
            timestamp: stats.mtimeMs || Date.now(),
            createdAt: new Date(stats.mtime || Date.now()).toISOString()
          });
        }
      } catch (err) {
        console.warn(`Failed to read plate directory ${plateDir}:`, err.message);
      }
    }
  } catch (err) {
    console.warn(`Failed to discover photos in ${photosDir}:`, err.message);
  }

  return discovered;
}

module.exports = {
  getVehiclePhotosDir,
  toPublicPhotoUrl,
  normalizeIncomingPhotoUrl,
  deleteManagedPhotoFile,
  discoverPhotosFromFilesystem
};
