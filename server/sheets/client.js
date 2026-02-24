const { google } = require("googleapis");

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const USERS_SHEET = "Users";
const SHOP_SHEET = "Shop";
const PRODUCTS_SHEET = "Products";
const TRANSACTIONS_SHEET = "Transactions";
const OPERATIONAL_COSTS_SHEET = "OperationalCosts";
const ORDERS_SHEET = "Orders";

const USERS_HEADERS = ["id", "username", "fullName", "email", "passwordHash", "createdAt", "role"];
const SHOP_HEADERS = ["id", "userId", "name", "createdAt"];
const PRODUCTS_HEADERS = ["id", "userId", "name", "emoji", "price", "stock", "lowStockThreshold"];
const TRANSACTIONS_HEADERS = ["id", "userId", "type", "productId", "quantity", "amount", "category", "subCategory", "description", "timestamp", "date", "orderId"];
const OPERATIONAL_COSTS_HEADERS = ["id", "userId", "category", "amount", "period", "type", "description", "createdAt"];
const ORDERS_HEADERS = ["id", "userId", "customerName", "productId", "productName", "quantity", "scheduledAt", "collected", "paid", "createdAt"];

function getAuth() {
  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!keyFile) throw new Error("GOOGLE_APPLICATION_CREDENTIALS is not set");
  return new google.auth.GoogleAuth({
    keyFile,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheets() {
  if (!SPREADSHEET_ID) throw new Error("GOOGLE_SHEETS_SPREADSHEET_ID is not set");
  const auth = getAuth();
  return google.sheets({ version: "v4", auth });
}

function rowToUser(row) {
  if (!row || row.length < 6) return null;
  const rawRole = row[6] ? String(row[6]).trim().toLowerCase() : "";
  const role = rawRole === "admin" ? "admin" : "seller";
  return {
    id: String(row[0] ?? ""),
    username: row[1] ? String(row[1]).trim() || null : null,
    fullName: row[2] ? String(row[2]).trim() || null : null,
    email: row[3] ? String(row[3]).trim().toLowerCase() || null : null,
    passwordHash: String(row[4] ?? ""),
    createdAt: String(row[5] ?? ""),
    role,
  };
}

function userToRow(u) {
  return [
    u.id,
    u.username ?? "",
    u.fullName ?? "",
    u.email ?? "",
    u.passwordHash,
    u.createdAt ?? "",
    (u.role === "admin" ? "admin" : "seller"),
  ];
}

function rowToShop(row) {
  if (!row || row.length < 4) return null;
  return {
    id: String(row[0] ?? ""),
    userId: String(row[1] ?? ""),
    name: String(row[2] ?? ""),
    createdAt: String(row[3] ?? ""),
  };
}

function shopToRow(s) {
  return [s.id, s.userId, s.name, s.createdAt];
}

function rowToOperationalCost(row) {
  if (!row || row.length < 8) return null;
  return {
    id: String(row[0] ?? ""),
    userId: String(row[1] ?? ""),
    category: String(row[2] ?? ""),
    amount: Number(row[3]) || 0,
    period: String(row[4] ?? ""),
    type: row[5] === "one-time" ? "one-time" : "recurring",
    description: row[6] ? String(row[6]) : "",
    createdAt: String(row[7] ?? ""),
  };
}

function operationalCostToRow(o) {
  return [
    o.id,
    o.userId,
    o.category,
    o.amount,
    o.period ?? "",
    o.type ?? "recurring",
    o.description ?? "",
    o.createdAt,
  ];
}

function rowToOrder(row) {
  if (!row || row.length < 10) return null;
  return {
    id: String(row[0] ?? ""),
    userId: String(row[1] ?? ""),
    customerName: String(row[2] ?? ""),
    productId: String(row[3] ?? ""),
    productName: String(row[4] ?? ""),
    quantity: Number(row[5]) || 0,
    scheduledAt: String(row[6] ?? ""),
    collected: row[7] === "yes" ? "yes" : "no",
    paid: row[8] === "yes" ? "yes" : row[8] === "dp" ? "dp" : "no",
    createdAt: String(row[9] ?? ""),
  };
}

function orderToRow(o) {
  return [
    o.id,
    o.userId,
    o.customerName ?? "",
    o.productId ?? "",
    o.productName ?? "",
    o.quantity ?? 0,
    o.scheduledAt ?? "",
    o.collected === "yes" ? "yes" : "no",
    o.paid === "yes" ? "yes" : o.paid === "dp" ? "dp" : "no",
    o.createdAt ?? "",
  ];
}

function rowToProduct(row) {
  if (!row || row.length < 7) return null;
  const rawStock = row[5];
  const stock =
    rawStock === "" || rawStock === undefined || rawStock === null
      ? null
      : Math.max(0, Number(rawStock));
  return {
    id: String(row[0] ?? ""),
    name: String(row[2] ?? ""),
    emoji: String(row[3] ?? ""),
    price: Number(row[4]) || 0,
    stock,
    lowStockThreshold: Number(row[6]) || 0,
  };
}

function productToRow(p) {
  const stock = p.stock === null || p.stock === undefined ? "" : p.stock;
  return [p.id, p.userId, p.name, p.emoji, p.price, stock, p.lowStockThreshold];
}

function parseDescriptionTriple(combined) {
  if (!combined || typeof combined !== "string") return { category: "", subCategory: "", description: "" };
  const parts = String(combined).split(" — ").map((s) => s.trim());
  return {
    category: parts[0] ?? "",
    subCategory: parts[1] ?? "",
    description: parts.slice(2).join(" — ").trim() || "",
  };
}

function rowToTransaction(row) {
  if (!row || row.length < 9) return null;
  const isNewFormat = row.length >= 11;
  const tx = {
    id: String(row[0] ?? ""),
    type: row[2] === "sale" || row[2] === "expense" ? row[2] : "sale",
    amount: Number(row[5]) || 0,
    timestamp: Number(isNewFormat ? row[9] : row[7]) || 0,
    date: String((isNewFormat ? row[10] : row[8]) ?? ""),
  };
  if (row[3]) tx.productId = String(row[3]);
  if (row[4] !== "" && row[4] !== undefined) tx.quantity = Number(row[4]);
  if (isNewFormat && (row[6] != null || row[7] != null || row[8] != null)) {
    tx.category = String(row[6] ?? "").trim();
    tx.subCategory = String(row[7] ?? "").trim();
    tx.description = String(row[8] ?? "").trim();
  } else if (row[6]) {
    const parsed = parseDescriptionTriple(row[6]);
    tx.category = parsed.category;
    tx.subCategory = parsed.subCategory;
    tx.description = parsed.description;
  }
  if (tx.description === undefined) tx.description = "";
  if (tx.category || tx.subCategory) {
    const combined = [tx.category, tx.subCategory, tx.description].filter(Boolean).join(" — ");
    if (combined) tx.description = combined;
  }
  if (row.length >= 12) {
    const oid = String(row[11] ?? "").trim();
    if (oid) tx.orderId = oid;
  }
  return tx;
}

function transactionToRow(t) {
  const category = t.category ?? "";
  const subCategory = t.subCategory ?? "";
  let description = t.description ?? "";
  if (!category && !subCategory && description && String(description).includes(" — ")) {
    const parsed = parseDescriptionTriple(description);
    return [
      t.id,
      t.userId,
      t.type,
      t.productId ?? "",
      t.quantity ?? "",
      t.amount,
      parsed.category,
      parsed.subCategory,
      parsed.description,
      t.timestamp,
      t.date,
    ];
  }
  return [
    t.id,
    t.userId,
    t.type,
    t.productId ?? "",
    t.quantity ?? "",
    t.amount,
    category,
    subCategory,
    description,
    t.timestamp,
    t.date,
  ];
}

async function getUsers() {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${USERS_SHEET}!A2:G`,
  });
  const rows = res.data.values || [];
  return rows.map(rowToUser).filter(Boolean);
}

async function appendUser(user) {
  const sheets = getSheets();
  const row = userToRow(user);
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${USERS_SHEET}!A:G`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
  return user;
}

async function updateUser(userId, updates) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${USERS_SHEET}!A2:G`,
  });
  const rows = res.data.values || [];
  const index = rows.findIndex((r) => String(r[0] ?? "") === userId);
  if (index < 0) return null;
  const existing = rowToUser(rows[index]);
  if (!existing) return null;
  const merged = { ...existing };
  if (updates.fullName !== undefined) merged.fullName = updates.fullName;
  if (updates.email !== undefined) merged.email = updates.email;
  if (updates.passwordHash !== undefined) merged.passwordHash = updates.passwordHash;
  if (updates.role !== undefined) merged.role = updates.role === "admin" ? "admin" : "seller";
  const row = userToRow(merged);
  const rowIndex = index + 2;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${USERS_SHEET}!A${rowIndex}:G${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });
  return { ...merged };
}

async function getShop(userId) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHOP_SHEET}!A2:D`,
  });
  const rows = res.data.values || [];
  const row = rows.find((r) => String(r[1] ?? "") === userId);
  return row ? rowToShop(row) : null;
}

async function upsertShop(userId, name) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHOP_SHEET}!A2:D`,
  });
  const rows = res.data.values || [];
  const index = rows.findIndex((r) => String(r[1] ?? "") === userId);
  const id = index >= 0 ? String(rows[index][0]) : require("crypto").randomUUID();
  const createdAt = index >= 0 ? String(rows[index][3] ?? "") : new Date().toISOString();
  const shop = { id, userId, name: String(name ?? "").trim(), createdAt };
  const row = shopToRow(shop);
  if (index >= 0) {
    const rowIndex = index + 2;
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHOP_SHEET}!A${rowIndex}:D${rowIndex}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHOP_SHEET}!A:D`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });
  }
  return shop;
}

async function getOperationalCosts(userId) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${OPERATIONAL_COSTS_SHEET}!A2:H`,
  });
  const rows = res.data.values || [];
  return rows
    .filter((r) => String(r[1] ?? "") === userId)
    .map(rowToOperationalCost)
    .filter(Boolean);
}

async function appendOperationalCost(userId, cost) {
  const sheets = getSheets();
  const row = operationalCostToRow({ ...cost, userId });
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${OPERATIONAL_COSTS_SHEET}!A:H`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
  return { ...cost, userId };
}

async function getProducts(userId) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${PRODUCTS_SHEET}!A2:G`,
  });
  const rows = res.data.values || [];
  return rows
    .filter((row) => String(row[1] ?? "") === userId)
    .map(rowToProduct)
    .filter(Boolean);
}

async function getAllProducts() {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${PRODUCTS_SHEET}!A2:G`,
  });
  const rows = res.data.values || [];
  return rows
    .map((row) => {
      const p = rowToProduct(row);
      if (!p) return null;
      p.userId = String(row[1] ?? "");
      return p;
    })
    .filter(Boolean);
}

async function appendProduct(userId, product) {
  const sheets = getSheets();
  const row = productToRow({ ...product, userId });
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${PRODUCTS_SHEET}!A:G`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
  return product;
}

async function updateProduct(userId, productId, updates) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${PRODUCTS_SHEET}!A2:G`,
  });
  const rows = res.data.values || [];
  const index = rows.findIndex((row) => String(row[0]) === productId && String(row[1]) === userId);
  if (index < 0) return null;
  const rowIndex = index + 2;
  const existing = rowToProduct(rows[index]);
  if (!existing) return null;
  const merged = { ...existing, id: productId, userId, ...updates };
  const row = productToRow(merged);
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${PRODUCTS_SHEET}!A${rowIndex}:G${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });
  return { ...merged };
}

async function deleteProduct(userId, productId) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${PRODUCTS_SHEET}!A2:G`,
  });
  const rows = res.data.values || [];
  const index = rows.findIndex((row) => String(row[0]) === productId && String(row[1]) === userId);
  if (index < 0) return false;
  const rowIndex = index + 2;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${PRODUCTS_SHEET}!A${rowIndex}:G${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [Array(7).fill("")] },
  });
  return true;
}

async function getTransactions(userId) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${TRANSACTIONS_SHEET}!A2:L`,
  });
  const rows = res.data.values || [];
  return rows
    .filter((row) => String(row[1] ?? "") === userId)
    .map(rowToTransaction)
    .filter(Boolean)
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

async function getAllTransactions() {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${TRANSACTIONS_SHEET}!A2:L`,
  });
  const rows = res.data.values || [];
  return rows
    .map((row) => {
      const tx = rowToTransaction(row);
      if (!tx) return null;
      tx.userId = String(row[1] ?? "");
      return tx;
    })
    .filter(Boolean)
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

async function appendTransaction(userId, transaction) {
  const sheets = getSheets();
  const row = transactionToRow({ ...transaction, userId });
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${TRANSACTIONS_SHEET}!A:L`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
  return { ...transaction, userId };
}

async function getOrders(userId) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${ORDERS_SHEET}!A2:J`,
  });
  const rows = res.data.values || [];
  return rows
    .filter((r) => String(r[1] ?? "") === userId)
    .map(rowToOrder)
    .filter(Boolean)
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

async function getAllOrders() {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${ORDERS_SHEET}!A2:J`,
  });
  const rows = res.data.values || [];
  return rows
    .map(rowToOrder)
    .filter(Boolean)
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

async function appendOrder(userId, order) {
  const sheets = getSheets();
  const row = orderToRow({ ...order, userId });
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${ORDERS_SHEET}!A:J`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
  return { ...order, userId };
}

async function updateOrder(userId, orderId, updates) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${ORDERS_SHEET}!A2:J`,
  });
  const rows = res.data.values || [];
  const index = rows.findIndex((r) => String(r[0]) === orderId && String(r[1]) === userId);
  if (index < 0) return null;
  const rowIndex = index + 2;
  const existing = rowToOrder(rows[index]);
  if (!existing) return null;
  const merged = { ...existing, ...updates };
  const row = orderToRow(merged);
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${ORDERS_SHEET}!A${rowIndex}:J${rowIndex}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });
  return { ...merged };
}

module.exports = {
  getUsers,
  appendUser,
  updateUser,
  getShop,
  upsertShop,
  getOperationalCosts,
  appendOperationalCost,
  getProducts,
  getAllProducts,
  appendProduct,
  updateProduct,
  deleteProduct,
  getTransactions,
  getAllTransactions,
  appendTransaction,
  getOrders,
  getAllOrders,
  appendOrder,
  updateOrder,
  USERS_HEADERS,
  SHOP_HEADERS,
  PRODUCTS_HEADERS,
  TRANSACTIONS_HEADERS,
  OPERATIONAL_COSTS_HEADERS,
  ORDERS_HEADERS,
};
