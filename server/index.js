require("dotenv").config();

// On Render: if GOOGLE_CREDENTIALS_JSON is set, write it to a temp file and set GOOGLE_APPLICATION_CREDENTIALS
const credentialsJson = process.env.GOOGLE_CREDENTIALS_JSON;
if (credentialsJson && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const path = require("path");
  const fs = require("fs");
  const os = require("os");
  const tmpPath = path.join(os.tmpdir(), "google-credentials-" + Date.now() + ".json");
  try {
    const json = typeof credentialsJson === "string" ? credentialsJson : JSON.stringify(credentialsJson);
    fs.writeFileSync(tmpPath, json, "utf8");
    process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpPath;
  } catch (err) {
    console.error("Failed to write GOOGLE_CREDENTIALS_JSON to temp file:", err.message);
  }
}

const express = require("express");
const cors = require("cors");
const authRoutes = require("./auth/routes");
const { requireAuth } = require("./middleware/auth");
const productsRouter = require("./api/products");
const transactionsRouter = require("./api/transactions");
const shopRouter = require("./api/shop");
const operationalCostsRouter = require("./api/operational-costs");
const ordersRouter = require("./api/orders");
const adminRouter = require("./api/admin");

const app = express();
const PORT = process.env.PORT || 3000;

// Single origin only: multiple values in Access-Control-Allow-Origin break CORS.
const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:8080";
const originList = corsOrigin.split(",").map((s) => s.trim()).filter(Boolean);
const corsOptions = {
  origin: originList.length > 0 ? (originList.length === 1 ? originList[0] : originList) : "http://localhost:8080",
};
app.use(cors(corsOptions));
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/api/products", requireAuth, productsRouter);
app.use("/api/transactions", requireAuth, transactionsRouter);
app.use("/api/shop", requireAuth, shopRouter);
app.use("/api/operational-costs", requireAuth, operationalCostsRouter);
app.use("/api/orders", requireAuth, ordersRouter);
app.use("/api/admin", requireAuth, adminRouter);

app.get("/health", (_, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
