/**
 * One-time script: ensure the spreadsheet has Users, Shop, Products, Transactions,
 * OperationalCosts, and Orders sheets with the correct header row. Run from server dir:
 * node scripts/ensure-sheets-tables.js
 */
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const { google } = require("googleapis");

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const serverDir = path.join(__dirname, "..");
function resolveCredentialsPath() {
  const raw = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!raw) return "";
  const resolved = path.isAbsolute(raw) ? raw : path.join(serverDir, raw);
  if (fs.existsSync(resolved)) return resolved;
  const fallback = path.join(serverDir, "service-account.json");
  if (fs.existsSync(fallback)) return fallback;
  return resolved;
}
const CREDENTIALS_PATH = resolveCredentialsPath();

const USERS_HEADERS = ["id", "username", "fullName", "email", "passwordHash", "createdAt"];
const SHOP_HEADERS = ["id", "userId", "name", "createdAt"];
const PRODUCTS_HEADERS = ["id", "userId", "name", "emoji", "price", "stock", "lowStockThreshold"];
const TRANSACTIONS_HEADERS = ["id", "userId", "type", "productId", "quantity", "amount", "category", "subCategory", "description", "timestamp", "date", "orderId"];
const OPERATIONAL_COSTS_HEADERS = ["id", "userId", "category", "amount", "period", "type", "description", "createdAt"];
const ORDERS_HEADERS = ["id", "userId", "customerName", "productId", "productName", "quantity", "scheduledAt", "collected", "paid", "createdAt"];

const SHEETS_CONFIG = [
  { name: "Users", headers: USERS_HEADERS, col: "F" },
  { name: "Shop", headers: SHOP_HEADERS, col: "D" },
  { name: "Products", headers: PRODUCTS_HEADERS, col: "G" },
  { name: "Transactions", headers: TRANSACTIONS_HEADERS, col: "L" },
  { name: "OperationalCosts", headers: OPERATIONAL_COSTS_HEADERS, col: "H" },
  { name: "Orders", headers: ORDERS_HEADERS, col: "J" },
];

async function main() {
  if (!SPREADSHEET_ID || !CREDENTIALS_PATH) {
    console.error("Set GOOGLE_SHEETS_SPREADSHEET_ID and GOOGLE_APPLICATION_CREDENTIALS in server/.env");
    process.exit(1);
  }
  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheetNames = (meta.data.sheets || []).map((s) => s.properties.title);
  const requests = [];
  for (const { name } of SHEETS_CONFIG) {
    if (!sheetNames.includes(name)) {
      requests.push({ addSheet: { properties: { title: name } } });
    }
  }
  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { requests },
    });
    console.log("Added missing sheet(s).");
  }

  const data = [];
  for (const { name, headers, col } of SHEETS_CONFIG) {
    const range = `${name}!A1:${col}1`;
    const hasHeader = await hasHeaderRow(sheets, name, headers);
    if (!hasHeader) {
      data.push({ range, values: [headers] });
    }
  }
  if (data.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { valueInputOption: "USER_ENTERED", data },
    });
    console.log("Written header row(s).");
  }
  console.log("Done. Users, Shop, Products, Transactions, OperationalCosts, and Orders sheets are ready.");
}

async function hasHeaderRow(sheets, sheetName, expected) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:${String.fromCharCode(64 + expected.length)}1`,
    });
    const row = (res.data.values || [])[0] || [];
    return expected.every((h, i) => row[i] === h);
  } catch {
    return false;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
