const express = require("express");
const sheets = require("../sheets/client");
const authStore = require("../auth/store");

const router = express.Router();

async function isAdmin(userId) {
  const user = await authStore.findById(userId);
  if (user && user.role === "admin") return true;
  const ids = process.env.ADMIN_USER_IDS;
  if (!ids || typeof ids !== "string") return false;
  const list = ids.split(",").map((s) => s.trim()).filter(Boolean);
  return list.includes(userId);
}

router.get("/users", async (req, res) => {
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

module.exports = router;
