const express = require("express");
const crypto = require("crypto");
const sheets = require("../sheets/client");

const router = express.Router();

function ensureSheets(req, res, next) {
  if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID || !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return res.status(503).json({ error: "Google Sheets not configured" });
  }
  next();
}

router.get("/", ensureSheets, async (req, res) => {
  try {
    const products = await sheets.getProducts(req.userId);
    res.json(products);
  } catch (e) {
    console.error("GET /api/products", e);
    res.status(500).json({ error: e.message || "Failed to get products" });
  }
});

router.post("/", ensureSheets, async (req, res) => {
  try {
    const { name, emoji, price, stock } = req.body || {};
    const trimmedName = (name ?? "").trim().slice(0, 50);
    const numPrice = Number(price) || 0;
    const numStock =
      stock === undefined || stock === null || stock === ""
        ? null
        : Math.max(0, Number(stock));
    const lowStockThreshold =
      numStock != null ? Math.max(1, Math.round(numStock * 0.2)) : 0;
    const product = {
      id: crypto.randomUUID(),
      name: trimmedName,
      emoji: emoji ?? "📦",
      price: numPrice,
      stock: numStock,
      lowStockThreshold,
    };
    await sheets.appendProduct(req.userId, product);
    res.status(201).json(product);
  } catch (e) {
    console.error("POST /api/products", e);
    res.status(500).json({ error: e.message || "Failed to create product" });
  }
});

router.patch("/:id", ensureSheets, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};
    if (req.body.name !== undefined) updates.name = String(req.body.name).trim().slice(0, 50);
    if (req.body.emoji !== undefined) updates.emoji = req.body.emoji;
    if (req.body.price !== undefined) updates.price = Number(req.body.price) || 0;
    if (req.body.stock !== undefined) {
      updates.stock =
        req.body.stock === null || req.body.stock === ""
          ? null
          : Math.max(0, Number(req.body.stock) || 0);
    }
    if (req.body.lowStockThreshold !== undefined) updates.lowStockThreshold = Math.max(1, Number(req.body.lowStockThreshold) || 1);
    const updated = await sheets.updateProduct(req.userId, id, updates);
    if (!updated) return res.status(404).json({ error: "Product not found" });
    res.json(updated);
  } catch (e) {
    console.error("PATCH /api/products/:id", e);
    res.status(500).json({ error: e.message || "Failed to update product" });
  }
});

router.delete("/:id", ensureSheets, async (req, res) => {
  try {
    const found = await sheets.deleteProduct(req.userId, req.params.id);
    if (!found) return res.status(404).json({ error: "Product not found" });
    res.status(204).send();
  } catch (e) {
    console.error("DELETE /api/products/:id", e);
    res.status(500).json({ error: e.message || "Failed to delete product" });
  }
});

module.exports = router;
