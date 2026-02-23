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
    const costs = await sheets.getOperationalCosts(req.userId);
    res.json(costs);
  } catch (e) {
    console.error("GET /api/operational-costs", e);
    res.status(500).json({ error: e.message || "Failed to get operational costs" });
  }
});

router.post("/", ensureSheets, async (req, res) => {
  try {
    const { category, amount, period, type, description } = req.body || {};
    const cost = {
      id: crypto.randomUUID(),
      category: String(category ?? "").trim(),
      amount: Number(amount) || 0,
      period: String(period ?? "").trim(),
      type: type === "one-time" ? "one-time" : "recurring",
      description: String(description ?? "").trim(),
      createdAt: new Date().toISOString(),
    };
    await sheets.appendOperationalCost(req.userId, cost);
    res.status(201).json(cost);
  } catch (e) {
    console.error("POST /api/operational-costs", e);
    res.status(500).json({ error: e.message || "Failed to create operational cost" });
  }
});

module.exports = router;
