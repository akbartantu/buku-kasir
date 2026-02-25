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

const VALID_PAYMENT_METHODS = new Set(["tunai", "e-wallet", "transfer"]);

function normalizePaymentMethod(v) {
  if (v == null || v === "") return undefined;
  const s = String(v).trim().toLowerCase();
  return VALID_PAYMENT_METHODS.has(s) ? s : undefined;
}

router.post("/", ensureSheets, async (req, res) => {
  try {
    const { customerName, productId, productName, quantity, scheduledAt, paymentMethod } = req.body || {};
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
    const pm = normalizePaymentMethod(paymentMethod);
    if (pm) order.paymentMethod = pm;
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
    const { collected, paid, paymentMethod } = req.body || {};
    const updates = {};
    if (collected === "yes" || collected === "no") updates.collected = collected;
    if (paid === "yes" || paid === "no" || paid === "dp") updates.paid = paid;
    const pm = normalizePaymentMethod(paymentMethod);
    if (pm !== undefined) updates.paymentMethod = pm;
    const order = await sheets.updateOrder(req.userId, id, updates);
    if (!order) return res.status(404).json({ error: "Order not found" });

    if (order.paid === "yes" && order.collected === "yes") {
      const existing = await sheets.getTransactions(req.userId);
      if (!existing.some((t) => t.orderId === order.id)) {
        const products = await sheets.getProducts(req.userId);
        const product = products.find((p) => p.id === order.productId);
        const amount = product ? product.price * order.quantity : 0;
        // Use today so the transaction appears in admin/ringkasan when filter includes today
        const dateStr = new Date().toISOString().split("T")[0];
        const transaction = {
          id: crypto.randomUUID(),
          type: "sale",
          productId: order.productId,
          productName: order.productName,
          quantity: order.quantity,
          amount,
          date: dateStr,
          orderId: order.id,
          timestamp: Date.now(),
          paymentMethod: order.paymentMethod ?? "tunai",
        };
        await sheets.appendTransaction(req.userId, transaction);
      }
    }

    res.json(order);
  } catch (e) {
    console.error("PATCH /api/orders/:id", e);
    res.status(500).json({ error: e.message || "Failed to update order" });
  }
});

module.exports = router;
