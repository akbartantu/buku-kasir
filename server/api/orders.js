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
    const orders = await sheets.getOrders(req.userId);
    res.json(orders);
  } catch (e) {
    console.error("GET /api/orders", e);
    res.status(500).json({ error: e.message || "Failed to get orders" });
  }
});

router.post("/", ensureSheets, async (req, res) => {
  try {
    const { customerName, productId, productName, quantity, scheduledAt } = req.body || {};
    const now = new Date().toISOString();
    const order = {
      id: crypto.randomUUID(),
      customerName: String(customerName ?? "").trim(),
      productId: String(productId ?? ""),
      productName: String(productName ?? "").trim(),
      quantity: Number(quantity) || 0,
      scheduledAt: String(scheduledAt ?? "").trim(),
      collected: "no",
      paid: "no",
      createdAt: now,
    };
    await sheets.appendOrder(req.userId, order);
    res.status(201).json({ ...order, userId: req.userId });
  } catch (e) {
    console.error("POST /api/orders", e);
    res.status(500).json({ error: e.message || "Failed to create order" });
  }
});

router.patch("/:id", ensureSheets, async (req, res) => {
  try {
    const { id } = req.params;
    const { collected, paid } = req.body || {};
    const updates = {};
    if (collected === "yes" || collected === "no") updates.collected = collected;
    if (paid === "yes" || paid === "no" || paid === "dp") updates.paid = paid;
    const order = await sheets.updateOrder(req.userId, id, updates);
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (e) {
    console.error("PATCH /api/orders/:id", e);
    res.status(500).json({ error: e.message || "Failed to update order" });
  }
});

module.exports = router;
