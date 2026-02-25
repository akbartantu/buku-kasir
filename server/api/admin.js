const express = require("express");
const sheets = require("../sheets/client");
const authStore = require("../auth/store");

const router = express.Router();

function ensureSheets(req, res, next) {
  if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID || !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return res.status(503).json({ error: "Google Sheets not configured" });
  }
  next();
}

async function isAdmin(userId) {
  const user = await authStore.findById(userId);
  if (user && user.role === "admin") return true;
  const ids = process.env.ADMIN_USER_IDS;
  if (!ids || typeof ids !== "string") return false;
  const list = ids.split(",").map((s) => s.trim()).filter(Boolean);
  return list.includes(userId);
}

router.get("/users", ensureSheets, async (req, res) => {
  if (!(await isAdmin(req.userId))) {
    return res.status(403).json({ error: "Akses hanya untuk admin. Set ADMIN_USER_IDS di server." });
  }
  try {
    const users = await sheets.getUsers();
    const safe = users.map((u) => ({
      id: u.id,
      username: u.username,
      fullName: u.fullName,
      email: u.email,
      createdAt: u.createdAt,
      role: u.role || "seller",
    }));
    res.json(safe);
  } catch (e) {
    console.error("GET /api/admin/users", e);
    res.status(500).json({ error: e.message || "Failed to get users" });
  }
});

router.get("/products", ensureSheets, async (req, res) => {
  if (!(await isAdmin(req.userId))) {
    return res.status(403).json({ error: "Akses hanya untuk admin. Set ADMIN_USER_IDS di server." });
  }
  try {
    let list = await sheets.getAllProducts();
    const userId = typeof req.query.userId === "string" ? req.query.userId.trim() : "";
    if (userId) list = list.filter((p) => p.userId === userId);
    const users = await sheets.getUsers();
    const byId = Object.fromEntries(users.map((u) => [u.id, u.fullName || u.username || u.id]));
    const out = list.map((p) => ({
      ...p,
      sellerName: byId[p.userId] ?? p.userId,
    }));
    res.json(out);
  } catch (e) {
    console.error("GET /api/admin/products", e);
    res.status(500).json({ error: e.message || "Failed to get products" });
  }
});

router.get("/orders", ensureSheets, async (req, res) => {
  if (!(await isAdmin(req.userId))) {
    return res.status(403).json({ error: "Akses hanya untuk admin. Set ADMIN_USER_IDS di server." });
  }
  try {
    let list = await sheets.getAllOrders();
    const userId = typeof req.query.userId === "string" ? req.query.userId.trim() : "";
    if (userId) list = list.filter((o) => o.userId === userId);
    const users = await sheets.getUsers();
    const byId = Object.fromEntries(users.map((u) => [u.id, u.fullName || u.username || u.id]));
    const out = list.map((o) => ({
      ...o,
      sellerName: byId[o.userId] ?? o.userId,
    }));
    res.json(out);
  } catch (e) {
    console.error("GET /api/admin/orders", e);
    res.status(500).json({ error: e.message || "Failed to get orders" });
  }
});

router.get("/transactions", ensureSheets, async (req, res) => {
  if (!(await isAdmin(req.userId))) {
    return res.status(403).json({ error: "Akses hanya untuk admin. Set ADMIN_USER_IDS di server." });
  }
  try {
    let list = await sheets.getAllTransactions();
    const startDate = typeof req.query.startDate === "string" ? req.query.startDate.trim() : "";
    const endDate = typeof req.query.endDate === "string" ? req.query.endDate.trim() : "";
    const userId = typeof req.query.userId === "string" ? req.query.userId.trim() : "";
    if (userId) list = list.filter((tx) => tx.userId === userId);
    if (startDate) list = list.filter((tx) => tx.date >= startDate);
    if (endDate) list = list.filter((tx) => tx.date <= endDate);
    const users = await sheets.getUsers();
    const byId = Object.fromEntries(users.map((u) => [u.id, u.fullName || u.username || u.id]));
    const userIds = [...new Set(list.map((tx) => tx.userId))];
    const productNameByKey = new Map();
    for (const uid of userIds) {
      const products = await sheets.getProducts(uid);
      for (const p of products) productNameByKey.set(`${uid}:${p.id}`, p.name);
    }
    const out = list.map((tx) => {
      const sellerName = byId[tx.userId] ?? tx.userId;
      const productName =
        tx.type === "sale" && tx.productId ? (productNameByKey.get(`${tx.userId}:${tx.productId}`) ?? "") : undefined;
      return { ...tx, sellerName, ...(productName !== undefined && { productName }) };
    });
    res.json(out);
  } catch (e) {
    console.error("GET /api/admin/transactions", e);
    res.status(500).json({ error: e.message || "Failed to get transactions" });
  }
});

router.delete("/transactions/:id", ensureSheets, async (req, res) => {
  if (!(await isAdmin(req.userId))) {
    return res.status(403).json({ error: "Akses hanya untuk admin. Set ADMIN_USER_IDS di server." });
  }
  try {
    const deleted = await sheets.deleteTransaction(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Transaksi tidak ditemukan" });
    res.status(204).send();
  } catch (e) {
    console.error("DELETE /api/admin/transactions/:id", e);
    res.status(500).json({ error: e.message || "Failed to delete transaction" });
  }
});

router.patch("/transactions/:id", ensureSheets, async (req, res) => {
  if (!(await isAdmin(req.userId))) {
    return res.status(403).json({ error: "Akses hanya untuk admin. Set ADMIN_USER_IDS di server." });
  }
  try {
    const updated = await sheets.updateTransaction(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Transaksi tidak ditemukan" });
    const users = await sheets.getUsers();
    const byId = Object.fromEntries(users.map((u) => [u.id, u.fullName || u.username || u.id]));
    let productName;
    if (updated.type === "sale" && updated.productId && updated.userId) {
      const products = await sheets.getProducts(updated.userId);
      const p = products.find((x) => x.id === updated.productId);
      productName = p ? p.name : undefined;
    }
    res.json({
      ...updated,
      sellerName: byId[updated.userId] ?? updated.userId,
      ...(productName !== undefined && { productName }),
    });
  } catch (e) {
    console.error("PATCH /api/admin/transactions/:id", e);
    res.status(500).json({ error: e.message || "Failed to update transaction" });
  }
});

module.exports = router;
