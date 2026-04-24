const { google } = require("googleapis");

const DEFAULT_SPREADSHEET_ID = "1Vckw1ZZUilqp5rYPU-zdTRY_1Ur5tBBPDgMrhedXdGU";
const DEFAULT_SHEET_NAME = "PRUEBAS";

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

function getSheetsConfig() {
  return {
    enabled: toBool(process.env.GOOGLE_SHEETS_ENABLED),
    spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || DEFAULT_SPREADSHEET_ID,
    sheetName: process.env.GOOGLE_SHEETS_WORKSHEET_NAME || DEFAULT_SHEET_NAME,
    serviceEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "",
    privateKey: normalizePrivateKey(process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)
  };
}

function validateConfig(config) {
  if (!config.enabled) {
    return { ok: false, reason: "disabled" };
  }

  if (!config.spreadsheetId) {
    return { ok: false, reason: "missing_spreadsheet_id" };
  }

  if (!config.serviceEmail || !config.privateKey) {
    return { ok: false, reason: "missing_service_account_credentials" };
  }

  return { ok: true };
}

function buildQuoteRow(quote) {
  return [
    quote.createdAt || new Date().toISOString(),
    quote.id,
    quote.customerName,
    quote.phone,
    quote.vehicle,
    quote.plate,
    quote.status || "received",
    Array.isArray(quote.photos) ? quote.photos.length : 0,
    quote.damageDescription
  ];
}

async function appendQuoteToSheet(quote) {
  const config = getSheetsConfig();
  const validation = validateConfig(config);

  if (!validation.ok) {
    return { sent: false, reason: validation.reason };
  }

  try {
    const auth = new google.auth.JWT({
      email: config.serviceEmail,
      key: config.privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"]
    });

    const sheets = google.sheets({ version: "v4", auth });

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: config.spreadsheetId,
      range: `${config.sheetName}!A:I`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [buildQuoteRow(quote)]
      }
    });

    return {
      sent: true,
      updatedRange: response.data?.updates?.updatedRange || null
    };
  } catch (error) {
    return {
      sent: false,
      reason: error.message
    };
  }
}

module.exports = {
  appendQuoteToSheet,
  getSheetsConfig
};
