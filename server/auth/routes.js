const express = require("express");
const authService = require("./service");

const router = express.Router();

function getBearerToken(req) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

router.post("/register", async (req, res) => {
  const { username, fullName, email, password } = req.body || {};
  const result = await authService.register({ username, fullName, email, password });
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.status(201).json(result);
});

router.post("/login", async (req, res) => {
  const { usernameOrEmail, password } = req.body || {};
  const result = await authService.login({ usernameOrEmail, password });
  if (result.error) {
    return res.status(401).json({ error: result.error });
  }
  res.json(result);
});

router.get("/me", async (req, res) => {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }
  const user = await authService.getMe(token);
  if (!user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  res.json({ user });
});

router.patch("/me", async (req, res) => {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }
  const user = await authService.getMe(token);
  if (!user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  let fullName = req.body?.fullName;
  let email = req.body?.email;
  if (fullName !== undefined) fullName = typeof fullName === "string" ? fullName.trim() || null : null;
  if (email !== undefined) email = typeof email === "string" ? email.trim().toLowerCase() || null : null;
  const updates = {};
  if (fullName !== undefined) updates.fullName = fullName;
  if (email !== undefined) updates.email = email;
  const updated = await authService.updateProfile(user.id, updates);
  if (!updated) {
    return res.status(500).json({ error: "Update failed" });
  }
  res.json({ user: updated });
});

router.post("/logout", (req, res) => {
  // JWT is stateless; frontend discards token. Optionally blacklist token here later.
  res.json({ ok: true });
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body || {};
  const result = await authService.requestPasswordReset(email);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.json(result);
});

router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body || {};
  const result = await authService.resetPassword(token, newPassword);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.json(result);
});

router.post("/reset-password-by-username", async (req, res) => {
  const { username, newPassword } = req.body || {};
  const result = await authService.resetPasswordByUsername(username, newPassword);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.json(result);
});

module.exports = router;
