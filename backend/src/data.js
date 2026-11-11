const fs = require("fs");
const path = require("path");

const services = [
  { id: 1, name: "Enderezado", photo: "service-enderezado.jpg" },
  { id: 2, name: "Pintura", photo: "service-pintura.jpg" },
  { id: 3, name: "Reparacion de carroceria", photo: "service-carroceria.jpg" }
];

const DRIVE_PHOTO_IDS = [
  "1yea1pPwHO4Rz7UjSDWzdjmKDPG_ad_pn",
  "1JLYBJ3cJ_2o5Vlq1CvpkEnSb9UJQhLQS",
  "1BU_xOLtjy4ylRv3KfcGoNIH5LNF5Oumt",
  "1aE4MArUsnksMRr4w6p_Akgs8Rc-9saNN",
  "1G8ESeAcCCbFzqpq0762R7TY88FycV2MV",
  "17-7AjFROhYb4SA5Zk-tsfNoorGxAmFU0",
  "10IW-y3dd93jzzbDilnzTCd286VDem4Dz",
  "12G5d9VD3z_V4M-fNHyq4pNDcAtYxnBbY",
  "1Zt5Ak3GbIRpFJY1mLqXXnU5Z84o96mNP",
  "1ege8PpMVgVBFLf8w1_W51KaqnU6_THkd",
  "1l3d-H_MALf8PKT6y2DjSbWJslZ_u_1sI",
  "1fyeEBgCNMIKuzQwc-_C0ShB1aqkhwBrn",
  "12xZjYVRwEUBw2VViELSrTA3BeFgxL8KL",
  "1dCd4ot4NmkwjSJXDwY0kvx2-EZ6n6UAf",
  "1jRT5dw9ABF7bAb6yIb08SctqbR8h3Awb",
  "1DI0UkL3Vbx78SS4_pl9B26lvMv88yenO",
  "12so7ZKOj5lglu7iWeMbw6nxH1KSOjD06",
  "1ggKT0Hb364wq8d59okul3M25Q2MbNjgV",
  "1IAAYCkrgaMJ1NGbtrjZNBBgcVRd9yFno",
  "1l_8iD2vbarnDOA1kneT2BhxeBhkxVXCi",
  "1U-nX_8DucllOfQMO_GpKonaTEU8i0Fqk",
  "1kCrB7l1JXvqVEAUOMrGcLazI0iA8icNo",
  "1XxKvjQXCthYVjx7KZinvezR1ypXchC73",
  "1cXtvqDquTw-T1hqRNdxwBr9TmrVwsaAG",
  "1RMom2T6lcuPPXHodezdagZJ96JzEbC-G",
  "130faaVBNtO5DpE0cmta8gOcH_nDP7Q5X",
  "1ZH_75DfaG2PMA-9-7fp9IltKAck2noRP",
  "1l5q3UtPtfCDCDHJ7JeUm5SXmg3NcArZh",
  "1_zf8vwMglMjNfB4dC88QW0TtxN82uTN-",
  "1vyPTu-56IOw-k1-PNHFjPNi2OJZpZhku",
  "1Rrg6lw_uvWttDdkwyHlUJjFF3Ai_j1-J",
  "1teIdowFG5jqHFuOE5zjPBn5RBnnY71So",
  "1b3P59HPathOgDJycZqhceu53d8h9gzJZ",
  "14O1MzVEzwUJ8B2vsTpDdnvMtzZ5HI2Vs",
  "1x5N9a1ftZk06GIl0AVL7YyyFXKOGc-T2",
  "17CH-1YnOjq4ZtIJ6YAGAfX71vyiis0Wl",
  "1K9FJfOhDyiAnBAFgbWaka8-6E-6jv7a-",
  "1ft52W_eC8fU5KiyyoHxsI5kXDBblJ5dA",
  "1aj1rxrBiJuCciCTXsz5rFEol_UVt2XC7",
  "1t6GFdoVrhPi_MsisaE0XepKONU0oig43",
  "1uzWFEwnoWe8L6UEpn5HTNgM5bRefd3j6",
  "1bhzqT77hw-Dgk-HF-GDy4a-YzbJFrlTN",
  "15z3rgWjqNlyo1pLdcCNHlVLRCofOEHLp",
  "1a1HMp4lMlMy09-Q-TCutF-xaWkUlXn6J",
  "1ZCiwM3kQgHix4yVe9l-rE-zucHms75Sh",
  "1zlWQ87FaIzsrcsjq2wFG0v8gNjdnMBio",
  "1tBM5bUVmWAcc-B8BNqbtOenqrITbIuzN",
  "12SVgf7csQ6PotxpNtMgFlloUz3pApJyi",
  "1Z1QlHBG3CmDYOuW_jcloFFLL01jS7A-s",
  "1XNN7fN7psTawz6rvu9h1WCas08MUdDw1",
  "1AR1WefP_alJIFaR9t8EEeNwp86QBJHFg",
  "1aSb8RphAGBzANjKiKbUx6SU-r4rqRBQK",
  "1rgTeni7r-209QiKEnBpauzYGNg9YyxD0",
  "1GstRcI0N5YDIFJf9zVVwxEKVs00GL8tl",
  "1EKblFINt9hYzUEk-CapHzqCsQtNK4sO0",
  "1RaSEBgZ6DquCXzbJD74LBgiRxa6q-Mkb",
  "1drmKVfw9S4fwtxg-5EtFcQxDJxrelYOW",
  "1asfzNFZs0lFUJjU3mC_LIR0bc4Hy7zVK",
  "1RoKkjsQC08UqZ6JRdDGytf9N-NJcq4OA",
  "1-jk1xZBo0Hu1HpE8eVfqJJhBYAThtsnL",
  "17RfIEyxFJDkRDi27IE6PGdT5FIE9ucsI",
  "1kllt9VwXRIlchVkf_OxKz9ySUCa9iX-M",
  "18tKxzppgiwolKh17qfPTOCfPhxv8LCOL",
  "1u3JFoGBXM1lbfRZ8zVLrs-ax9kOssFx7",
  "1Dxf9oIS-0ZnM9TMkZSHgwXxsjUWy7BjV",
  "11etId1hy1uM-b-sN-Dm8B5DBGQs9jKEU",
  "1_I8RceSSgpIE2udTpM3OBZBARwND9hDE",
  "1gHGz2bhQ6F0VxDYltUp1DSwtiQ3mvLpB",
  "1akwTBu-OmzxAajSQ3ZYOpXKUrZvDVGU6",
  "1XdT-l_GJIpQndxYE68CdJ_6MDzwNlZEf",
  "141zLnD6xE8IlIxgVt4o4x1JP0Bjoaysx",
  "1UWvTxWZHklZzlag-_rtP8v-2GsVhHODN",
  "11uPZixKCHl78se-aQFtFcdkWKM0_lCoi",
  "1xXJmwe2uKdXvD2SiZJ5f0wig5CmI43cc",
  "1K_b18aHCw05ECKII-DrB4ywdhW5bwA5Y",
  "1MF7UPDLpec6wqEZSnXpAKX2bt7CcD3pi",
  "1qkt9EDfOc-D5OBqGoaY71Laaq55u6-Gn",
  "10FG9goB3tWOeCJPcr_iNIKSPifHCCzv1",
  "1nwd3BbNUWw8RiE9g9zHeKVrH_ukqR7i5",
  "1L4lBO3JIMnckm8n5fXC2-CB8_SjQ65rA",
  "1UlNw63oGzf0EZ_OE9oYdmRgLZnaibYjo",
  "15F8M-UBJ9lAvTX2n83MjEVxyNAjpZNJy",
  "1XfQJaQG5KG98YwZclAXyX3t3d-SpJkK3",
  "1H4sg05hxlgc-3W0dD8l1IgXbXEjTLKgq",
  "1UB6UwsET11DlTzjP_lMyISKzZeDLgOcK",
  "1L0gajE5G7z7FqUFDD6Db8_kd7VDDwMk-",
  "1cVW69dufG3bDJMM58TlLMczWyEfMES5U",
  "1EyvOmA2ULSNYvziQSj9S2VCtp5NYwjaK",
  "1CrfuQLXZFPwT1e0TM2pJ0fZnssm5Lv0I",
  "12ZcvOhFGRqmnmNtMkr7KT7cFUdyTiq-o",
  "14CpfHabecgoa44KCv8oZArKjvnU8kzA6",
  "1ca4JeLixy3q4kvFswKVN0IRZQYuORbKu",
  "1MGnl4Vztct0Pb-HAZUUOFmYXPkpFTy8m",
  "151SSpse75q4s30I2F6vfz24EXy70axh3",
  "1ZIC1YNINPNIpTH5qzMlFfVhZ54e_E-jt",
  "1dPWMhEN5aSDhlqhDDztO1QG0YCP8Xm-_",
  "1KUFsuwMl7QI6ZW1govXfnbM4P_Qd-mJf",
  "1M2Up1MXcUkuMLazNapvkaYgTAey9-Q8N",
  "1Uv6JIEphjgZkRVAzuSKdppAzB9zjvhFL",
  "1bRyOvONsKbWFEYBtmGi5bszE2azPjZNP"
];

const gallery = DRIVE_PHOTO_IDS.map((id, index) => ({
  id,
  title: `Caso atendido #${index + 1}`,
  image: `https://drive.google.com/thumbnail?id=${id}&sz=w1000`,
  fullImage: `https://drive.google.com/thumbnail?id=${id}&sz=w1600`
}));

const dataDir = path.join(__dirname, "..", "data");
const dataFilePath = path.join(dataDir, "local-store.json");

const defaultWorkshopVehicles = [
  {
    id: 1,
    plate: "BLC990",
    customerName: "Vehículo en Taller",
    workType: "Enderezado y pintura",
    status: "in_progress",
    notes: "Proceso de enderezado y pintura en curso",
    createdAt: "2026-11-06T18:00:00.000Z"
  },
  {
    id: 2,
    plate: "537676",
    customerName: "Vehículo en Taller",
    workType: "Enderezado y pintura",
    status: "in_progress",
    notes: "Proceso de pintura y acabado",
    createdAt: "2026-11-06T18:00:00.000Z"
  },
  {
    id: 3,
    plate: "514471",
    customerName: "Vehículo en Taller",
    workType: "Enderezado y pintura",
    status: "in_progress",
    notes: "Proceso de reparación",
    createdAt: "2026-11-06T18:00:00.000Z"
  },
  {
    id: 4,
    plate: "ADT564",
    customerName: "Vehículo en Taller",
    workType: "Enderezado y pintura",
    status: "in_progress",
    notes: "Ingreso reciente por WhatsApp / Google Drive",
    createdAt: "2026-11-10T18:26:00.000Z"
  }
];

const defaultWorkshopProgressPhotos = [
  { id: 1, workshopVehicleId: 1, plate: "BLC990", photoUrl: "https://drive.google.com/thumbnail?id=1C8UgbvQAhV6DUWzs_4fVB3zjJ0GS69dl&sz=w1200", description: "Avance de reparación - Foto 1", createdAt: "2026-11-06T18:10:00.000Z" },
  { id: 2, workshopVehicleId: 1, plate: "BLC990", photoUrl: "https://drive.google.com/thumbnail?id=1vAILWRXxJFkh2UO_8oJgLcMDR2NvLz7I&sz=w1200", description: "Avance de reparación - Foto 2", createdAt: "2026-11-06T18:11:00.000Z" },
  { id: 3, workshopVehicleId: 1, plate: "BLC990", photoUrl: "https://drive.google.com/thumbnail?id=1IAHskzL4KFc-G1HS849wMI8ylHRbtKk1&sz=w1200", description: "Avance de reparación - Foto 3", createdAt: "2026-11-06T18:12:00.000Z" },
  { id: 4, workshopVehicleId: 1, plate: "BLC990", photoUrl: "https://drive.google.com/thumbnail?id=1iETMmviO-81cHFvG-E3z8HIje4IYQ2Uc&sz=w1200", description: "Avance de reparación - Foto 4", createdAt: "2026-11-06T18:13:00.000Z" },
  { id: 5, workshopVehicleId: 2, plate: "537676", photoUrl: "https://drive.google.com/thumbnail?id=1dpUNMGpTKvHDhl02jPkrHG5FJnH1flYb&sz=w1200", description: "Avance de reparación - Foto 1", createdAt: "2026-11-06T18:20:00.000Z" },
  { id: 6, workshopVehicleId: 2, plate: "537676", photoUrl: "https://drive.google.com/thumbnail?id=1ULiEoKj94rcO-IHjCsuaeZx8_X003MWU&sz=w1200", description: "Avance de reparación - Foto 2", createdAt: "2026-11-06T18:21:00.000Z" },
  { id: 7, workshopVehicleId: 2, plate: "537676", photoUrl: "https://drive.google.com/thumbnail?id=1h-n4F4xqdq94L7cUfBN7adQzUmeGTRIc&sz=w1200", description: "Avance de reparación - Foto 3", createdAt: "2026-11-06T18:22:00.000Z" },
  { id: 8, workshopVehicleId: 2, plate: "537676", photoUrl: "https://drive.google.com/thumbnail?id=17NbmT4FpQPAbxL4egWTxk6NAlS0bVAoJ&sz=w1200", description: "Avance de reparación - Foto 4", createdAt: "2026-11-06T18:23:00.000Z" },
  { id: 9, workshopVehicleId: 2, plate: "537676", photoUrl: "https://drive.google.com/thumbnail?id=1VE0x7c7ROWG1-309teKqdq_6yJs6z0tk&sz=w1200", description: "Avance de reparación - Foto 5", createdAt: "2026-11-06T18:24:00.000Z" },
  { id: 10, workshopVehicleId: 2, plate: "537676", photoUrl: "https://drive.google.com/thumbnail?id=1GF9H1-vDtj52liBIFpCAkjt2UOVdXSVX&sz=w1200", description: "Avance de reparación - Foto 6", createdAt: "2026-11-06T18:25:00.000Z" },
  { id: 11, workshopVehicleId: 3, plate: "514471", photoUrl: "https://drive.google.com/thumbnail?id=1jNoctxVXwMGVHZ5gccrKcc_k9TjkRKgF&sz=w1200", description: "Avance de reparación - Foto 1", createdAt: "2026-11-06T18:30:00.000Z" },
  { id: 12, workshopVehicleId: 3, plate: "514471", photoUrl: "https://drive.google.com/thumbnail?id=16KHqtFTh-h5hyGsaJqA5MHNUfWAUmECB&sz=w1200", description: "Avance de reparación - Foto 2", createdAt: "2026-11-06T18:31:00.000Z" },
  { id: 13, workshopVehicleId: 4, plate: "ADT564", photoUrl: "https://drive.google.com/thumbnail?id=1FiaohCuvwBZ4TGAiCuwr46SQeicA_vtj&sz=w1200", description: "Avance de reparación - IMG-20261110-WA0011.jpg", createdAt: "2026-11-10T18:26:51.800Z" },
  { id: 14, workshopVehicleId: 4, plate: "ADT564", photoUrl: "https://drive.google.com/thumbnail?id=1_vZ9maXZrHL1Z0DCFi25SUBlo7YUBXEj&sz=w1200", description: "Avance de reparación - IMG-20261110-WA0012.jpg", createdAt: "2026-11-10T18:26:51.613Z" },
  { id: 15, workshopVehicleId: 4, plate: "ADT564", photoUrl: "https://drive.google.com/thumbnail?id=1BO_Iga3FzTkveFWuo-K0hp2TNT1blL4Q&sz=w1200", description: "Avance de reparación - IMG-20261110-WA0013.jpg", createdAt: "2026-11-10T18:26:51.730Z" },
  { id: 16, workshopVehicleId: 4, plate: "ADT564", photoUrl: "https://drive.google.com/thumbnail?id=1kd5dNX5Px6jib1R2WEOC6aBCnEtjcVsh&sz=w1200", description: "Avance de reparación - IMG-20261110-WA0014.jpg", createdAt: "2026-11-10T18:26:51.430Z" },
  { id: 17, workshopVehicleId: 4, plate: "ADT564", photoUrl: "https://drive.google.com/thumbnail?id=1yBO5tYLBhEYtpeaVN7G4SmkcAWZ-vABD&sz=w1200", description: "Avance de reparación - IMG-20261110-WA0015.jpg", createdAt: "2026-11-10T18:26:51.228Z" },
  { id: 18, workshopVehicleId: 4, plate: "ADT564", photoUrl: "https://drive.google.com/thumbnail?id=1nDOWLVytWX9jjW0lBwFevCLrwxYn6nH_&sz=w1200", description: "Avance de reparación - IMG-20261110-WA0017.jpg", createdAt: "2026-11-10T18:26:50.693Z" },
  { id: 19, workshopVehicleId: 4, plate: "ADT564", photoUrl: "https://drive.google.com/thumbnail?id=13U5kTsZk7EjwYpRYmczCdDfeHGBAalat&sz=w1200", description: "Avance de reparación - IMG-20261110-WA0018.jpg", createdAt: "2026-11-10T18:26:50.974Z" },
  { id: 20, workshopVehicleId: 4, plate: "ADT564", photoUrl: "https://drive.google.com/thumbnail?id=1Rxos354Uu8ZPh-rootRst5Z3AaDAOQB3&sz=w1200", description: "Avance de reparación - IMG-20261110-WA0020.jpg", createdAt: "2026-11-10T19:40:47.791Z" }
];

const defaultTowTrucks = [
  {
    id: 1,
    name: "Grúas San José & Alajuela",
    driverName: "Carlos Mora",
    phone: "8333-4455",
    whatsapp: "50683334455",
    zones: ["Alajuela Centro", "Barrio San José", "San Rafael", "Aeropuerto"],
    type: "Plataforma Hidráulica",
    rating: 5.0,
    priceRange: "₡25,000 - ₡35,000",
    notes: "Rápidos, plataforma para autos bajos y 4x4. Entrega directa a Taller Dayana."
  },
  {
    id: 2,
    name: "Grúas Hermanos Vargas",
    driverName: "Esteban Vargas",
    phone: "8822-1144",
    whatsapp: "50688221144",
    zones: ["El Coyol", "Radial Alajuela", "Autopista Bernardo Soto (Ruta 1)"],
    type: "Plataforma Pesada & Liviana",
    rating: 4.9,
    priceRange: "₡30,000 - ₡45,000",
    notes: "Especialistas en rescates en autopista y zona franca El Coyol."
  },
  {
    id: 3,
    name: "Grúas del Valle Central",
    driverName: "Mauricio Alfaro",
    phone: "8700-1234",
    whatsapp: "50687001234",
    zones: ["Heredia Centro", "San Joaquín de Flores", "Barva", "Santa Bárbara"],
    type: "Plataforma Hidráulica",
    rating: 4.8,
    priceRange: "₡28,000 - ₡40,000",
    notes: "Cobertura completa zona Heredia y traslados hacia Alajuela."
  },
  {
    id: 4,
    name: "Asistencia Ruta 27 & Orotina",
    driverName: "Jorge Quesada",
    phone: "8911-2233",
    whatsapp: "50689112233",
    zones: ["Ruta 27", "Turrúcares", "Atenas", "Orotina"],
    type: "Plataforma doble tracción",
    rating: 4.9,
    priceRange: "₡35,000 - ₡50,000",
    notes: "Respuesta inmediata en Ruta 27 con convenio de llegada a taller."
  }
];

const defaultTenants = [
  {
    id: 1,
    slug: "taller-dayana",
    name: "Taller Dayana",
    legalName: "Taller Dayana S.A.",
    ownerName: "Dagoberto y Randy Barrantes",
    phone: "7043-9248",
    whatsapp: "50670439248",
    email: "tallerdayanacr@gmail.com",
    province: "Alajuela",
    canton: "Barrio San José",
    address: "Barrio San José, Alajuela, Costa Rica (Costado norte de la plaza de deportes)",
    mapsUrl: "https://www.google.com/maps/place/Taller+Dayana/@10.0189955,-84.2360667,20.5z",
    wazeUrl: "https://waze.com/ul?ll=10.0188372,-84.2361356&navigate=yes",
    brandColor: "#d62828",
    secondaryColor: "#18181b",
    logoUrl: "/cases/case-6.jpg",
    customDomain: "tallerdayana.vercel.app",
    plan: "elite",
    monthlyFee: 0,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: 2,
    slug: "autofix-heredia",
    name: "AutoFix Heredia",
    legalName: "AutoFix San Pablo S.R.L.",
    ownerName: "Carlos Méndez",
    phone: "8312-4455",
    whatsapp: "50683124455",
    email: "contacto@autofixheredia.cr",
    province: "Heredia",
    canton: "San Pablo",
    address: "300m Norte del Masxmenos, San Pablo de Heredia",
    mapsUrl: "https://maps.google.com/?q=San+Pablo+Heredia",
    wazeUrl: "https://waze.com/ul?q=San+Pablo+Heredia",
    brandColor: "#2563eb",
    secondaryColor: "#0f172a",
    logoUrl: "",
    customDomain: "",
    plan: "pro",
    monthlyFee: 45000,
    isActive: true,
    createdAt: "2026-02-15T10:00:00.000Z"
  },
  {
    id: 3,
    slug: "enderezado-coyol",
    name: "Enderezado El Coyol",
    legalName: "Taller Automotriz El Coyol",
    ownerName: "Esteban Rojas",
    phone: "8765-1122",
    whatsapp: "50687651122",
    email: "tallerelcoyol@gmail.com",
    province: "Alajuela",
    canton: "El Coyol",
    address: "Frente a Parque Industrial Zona Franca, El Coyol de Alajuela",
    mapsUrl: "https://maps.google.com/?q=El+Coyol+Alajuela",
    wazeUrl: "https://waze.com/ul?q=El+Coyol+Alajuela",
    brandColor: "#059669",
    secondaryColor: "#064e3b",
    logoUrl: "",
    customDomain: "",
    plan: "basico",
    monthlyFee: 25000,
    isActive: true,
    createdAt: "2026-03-01T14:30:00.000Z"
  }
];

function defaultData() {
  return {
    tenants: [...defaultTenants],
    quotes: [],
    appointments: [],
    notifications: [],
    workshopVehicles: [...defaultWorkshopVehicles],
    workshopProgressPhotos: [...defaultWorkshopProgressPhotos],
    towTrucks: [...defaultTowTrucks]
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
      tenants: Array.isArray(parsed.tenants) && parsed.tenants.length > 0 ? parsed.tenants : base.tenants,
      quotes: Array.isArray(parsed.quotes) ? parsed.quotes : base.quotes,
      appointments: Array.isArray(parsed.appointments) ? parsed.appointments : base.appointments,
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : base.notifications,
      workshopVehicles: Array.isArray(parsed.workshopVehicles) ? parsed.workshopVehicles : base.workshopVehicles,
      workshopProgressPhotos: Array.isArray(parsed.workshopProgressPhotos)
        ? parsed.workshopProgressPhotos
        : base.workshopProgressPhotos,
      towTrucks: Array.isArray(parsed.towTrucks) && parsed.towTrucks.length > 0 ? parsed.towTrucks : base.towTrucks
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
const tenants = persisted.tenants;
const quotes = persisted.quotes;
const appointments = persisted.appointments;
const notifications = persisted.notifications;
const workshopVehicles = persisted.workshopVehicles;
const workshopProgressPhotos = persisted.workshopProgressPhotos;
const towTrucks = persisted.towTrucks || [...defaultTowTrucks];

function reloadLocalData() {
  if (process.env.DATABASE_URL) {
    return;
  }
  try {
    const fresh = loadPersistedData();
    workshopVehicles.length = 0;
    workshopVehicles.push(...fresh.workshopVehicles);
    workshopProgressPhotos.length = 0;
    workshopProgressPhotos.push(...fresh.workshopProgressPhotos);
    quotes.length = 0;
    quotes.push(...fresh.quotes);
    appointments.length = 0;
    appointments.push(...fresh.appointments);
    tenants.length = 0;
    tenants.push(...fresh.tenants);
    towTrucks.length = 0;
    towTrucks.push(...(fresh.towTrucks || defaultTowTrucks));
    return fresh;
  } catch (_e) {
    // ignorar error si archivo temporalmente bloqueado
  }
}

module.exports = {
  services,
  gallery,
  tenants,
  defaultTenants,
  quotes,
  appointments,
  notifications,
  workshopVehicles,
  workshopProgressPhotos,
  towTrucks,
  defaultTowTrucks,
  persistLocalData,
  reloadLocalData,
  dataFilePath
};
