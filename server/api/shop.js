const express = require("express");
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
    const shop = await sheets.getShop(req.userId);
    res.json(shop || { id: null, userId: req.userId, name: "", createdAt: null });
  } catch (e) {
    console.error("GET /api/shop", e);
    res.status(500).json({ error: e.message || "Failed to get shop" });
  }
});

router.put("/", ensureSheets, async (req, res) => {
  try {
    const { name } = req.body || {};
    const shop = await sheets.upsertShop(req.userId, name ?? "");
    res.json(shop);
  } catch (e) {
    console.error("PUT /api/shop", e);
    res.status(500).json({ error: e.message || "Failed to update shop" });
  }
});

module.exports = router;
