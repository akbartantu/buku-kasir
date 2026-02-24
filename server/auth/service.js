const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const store = require("./store");

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

function signResetToken(userId) {
  return jwt.sign({ sub: userId, purpose: "password-reset" }, JWT_SECRET, { expiresIn: "1h" });
}

function verifyResetToken(token) {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload && payload.purpose === "password-reset" && payload.sub ? payload : null;
  } catch {
    return null;
  }
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function toSafeUser(user) {
  if (!user) return null;
  const { passwordHash, ...rest } = user;
  return {
    ...rest,
    username: rest.username ?? null,
    fullName: rest.fullName ?? null,
    email: rest.email ?? null,
  };
}

function isEmail(value) {
  return typeof value === "string" && value.includes("@");
}

async function register({ username, fullName, email, password }) {
  const trimmedUsername = (username || "").trim();
  const trimmedFullName = (fullName || "").trim() || null;
  const trimmedEmail = email ? (email || "").trim().toLowerCase() || null : null;

  if (!trimmedUsername) {
    return { error: "Username is required" };
  }
  if (!password) {
    return { error: "Password is required" };
  }
  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" };
  }
  const existingByUsername = await store.findByUsername(trimmedUsername);
  if (existingByUsername) return { error: "Username already registered" };
  if (trimmedEmail) {
    const existingByEmail = await store.findByEmail(trimmedEmail);
    if (existingByEmail) return { error: "Email already registered" };
  }

  const id = crypto.randomUUID();
  const user = {
    id,
    username: trimmedUsername,
    fullName: trimmedFullName,
    email: trimmedEmail,
    passwordHash: hashPassword(password),
    createdAt: new Date().toISOString(),
    role: "seller",
  };
  const created = await store.createUser(user);
  if (!created) return { error: "Registration failed" };
  const token = signToken({ sub: id });
  return { user: toSafeUser(created), token };
}

async function login({ usernameOrEmail, password }) {
  const value = (usernameOrEmail || "").trim();
  if (!value || !password) {
    return { error: "Username/email and password are required" };
  }
  const user = isEmail(value)
    ? await store.findByEmail(value)
    : await store.findByUsername(value);
  if (!user) {
    return { error: "Invalid username/email or password" };
  }
  if (!verifyPassword(password, user.passwordHash)) {
    return { error: "Invalid username/email or password" };
  }
  const token = signToken({ sub: user.id });
  return { user: toSafeUser(user), token };
}

async function getMe(token) {
  const payload = verifyToken(token);
  if (!payload || !payload.sub) return null;
  const user = await store.findById(payload.sub);
  return user ? toSafeUser(user) : null;
}

async function updateProfile(userId, updates) {
  const updated = await store.updateUser(userId, updates);
  if (!updated) return null;
  return toSafeUser(updated);
}

async function requestPasswordReset(email) {
  const e = (email || "").trim().toLowerCase();
  if (!e || !e.includes("@")) {
    return { ok: true };
  }
  const user = await store.findByEmail(e);
  if (!user) {
    return { ok: true };
  }
  const token = signResetToken(user.id);
  return { ok: true, token };
}

async function resetPassword(token, newPassword) {
  const payload = verifyResetToken(token);
  if (!payload || !payload.sub) {
    return { error: "Link tidak valid atau sudah kadaluarsa" };
  }
  if (!newPassword || typeof newPassword !== "string") {
    return { error: "Kata sandi baru wajib diisi" };
  }
  if (newPassword.length < 6) {
    return { error: "Kata sandi minimal 6 karakter" };
  }
  const user = await store.findById(payload.sub);
  if (!user) {
    return { error: "Pengguna tidak ditemukan" };
  }
  const hashed = hashPassword(newPassword);
  const updated = await store.updateUser(user.id, { passwordHash: hashed });
  if (!updated) {
    return { error: "Gagal mengubah kata sandi" };
  }
  return { ok: true };
}

async function resetPasswordByUsername(username, newPassword) {
  const raw = (username || "").trim();
  if (!raw) {
    return { error: "Username wajib diisi" };
  }
  if (!newPassword || typeof newPassword !== "string") {
    return { error: "Kata sandi baru wajib diisi" };
  }
  if (newPassword.length < 6) {
    return { error: "Kata sandi minimal 6 karakter" };
  }
  const user = await store.findByUsername(raw);
  if (!user) {
    return { error: "Username tidak ditemukan" };
  }
  const hashed = hashPassword(newPassword);
  const updated = await store.updateUser(user.id, { passwordHash: hashed });
  if (!updated) {
    return { error: "Gagal mengubah kata sandi" };
  }
  return { ok: true };
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  requestPasswordReset,
  resetPassword,
  resetPasswordByUsername,
  verifyToken,
};
