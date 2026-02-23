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
    const transactions = await sheets.getTransactions(req.userId);
    res.json(transactions);
  } catch (e) {
    console.error("GET /api/transactions", e);
    res.status(500).json({ error: e.message || "Failed to get transactions" });
  }
});

function splitExpenseDescription(combined) {
  if (!combined || typeof combined !== "string") return { category: "", subCategory: "", description: "" };
  const parts = String(combined).trim().split(" — ").map((s) => s.trim());
  return {
    category: parts[0] ?? "",
    subCategory: parts[1] ?? "",
    description: parts.slice(2).join(" — ").trim() || "",
  };
}

function isValidDateStr(s) {
  if (!s || typeof s !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const t = new Date(y, m - 1, d);
  return t.getFullYear() === y && t.getMonth() === m - 1 && t.getDate() === d;
}

router.post("/", ensureSheets, async (req, res) => {
  try {
    const { type, productId, productName, quantity, amount, description, category, subCategory, date: bodyDate, orderId } = req.body || {};
    const now = new Date();
    const dateStr = bodyDate != null && isValidDateStr(bodyDate) ? String(bodyDate).trim() : now.toISOString().split("T")[0];

    if (orderId != null && String(orderId).trim()) {
      const existing = await sheets.getTransactions(req.userId);
      const found = existing.find((t) => t.orderId === String(orderId).trim());
      if (found) {
        return res.status(201).json(found);
      }
    }

    const transaction = {
      id: crypto.randomUUID(),
      type: type === "expense" ? "expense" : "sale",
      amount: Number(amount) || 0,
      timestamp: now.getTime(),
      date: dateStr,
    };
    if (productId) transaction.productId = productId;
    if (productName) transaction.productName = productName;
    if (quantity !== undefined && quantity !== null) transaction.quantity = Number(quantity) || 0;
    if (category != null) transaction.category = String(category).trim();
    if (subCategory != null) transaction.subCategory = String(subCategory).trim();
    if (description != null) transaction.description = String(description).trim();
    if (orderId != null && String(orderId).trim()) transaction.orderId = String(orderId).trim();
    if (transaction.type === "expense" && !transaction.category && !transaction.subCategory && transaction.description && transaction.description.includes(" — ")) {
      const parsed = splitExpenseDescription(transaction.description);
      transaction.category = parsed.category;
      transaction.subCategory = parsed.subCategory;
      transaction.description = parsed.description;
    }
    await sheets.appendTransaction(req.userId, transaction);
    res.status(201).json(transaction);
  } catch (e) {
    console.error("POST /api/transactions", e);
    res.status(500).json({ error: e.message || "Failed to create transaction" });
  }
});

module.exports = router;
