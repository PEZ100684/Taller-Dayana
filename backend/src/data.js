const fs = require("fs");
const path = require("path");

const services = [
  { id: 1, name: "Enderezado", photo: "service-enderezado.jpg" },
  { id: 2, name: "Pintura", photo: "service-pintura.jpg" },
  { id: 3, name: "Reparacion de carroceria", photo: "service-carroceria.jpg" }
];

const gallery = [
  { id: 1, title: "Antes y despues 1", before: "before-1.jpg", after: "after-1.jpg" },
  { id: 2, title: "Antes y despues 2", before: "before-2.jpg", after: "after-2.jpg" }
];

const dataDir = path.join(__dirname, "..", "data");
const dataFilePath = path.join(dataDir, "local-store.json");

function defaultData() {
  return {
    quotes: [],
    appointments: [],
    notifications: [],
    workshopVehicles: [],
    workshopProgressPhotos: []
  };
}

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, JSON.stringify(defaultData(), null, 2), "utf8");
  }
}

function loadPersistedData() {
  try {
    ensureDataFile();
    const raw = fs.readFileSync(dataFilePath, "utf8");
    const parsed = JSON.parse(raw);
    const base = defaultData();
    return {
      ...base,
      ...parsed,
      quotes: Array.isArray(parsed.quotes) ? parsed.quotes : base.quotes,
      appointments: Array.isArray(parsed.appointments) ? parsed.appointments : base.appointments,
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : base.notifications,
      workshopVehicles: Array.isArray(parsed.workshopVehicles) ? parsed.workshopVehicles : base.workshopVehicles,
      workshopProgressPhotos: Array.isArray(parsed.workshopProgressPhotos)
        ? parsed.workshopProgressPhotos
        : base.workshopProgressPhotos
    };
  } catch (_error) {
    return defaultData();
  }
}

function persistLocalData(data) {
  if (process.env.DATABASE_URL) {
    return;
  }

  ensureDataFile();
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), "utf8");
}

const persisted = loadPersistedData();
const quotes = persisted.quotes;
const appointments = persisted.appointments;
const notifications = persisted.notifications;
const workshopVehicles = persisted.workshopVehicles;
const workshopProgressPhotos = persisted.workshopProgressPhotos;

module.exports = {
  services,
  gallery,
  quotes,
  appointments,
  notifications,
  workshopVehicles,
  workshopProgressPhotos,
  persistLocalData,
  dataFilePath
};
