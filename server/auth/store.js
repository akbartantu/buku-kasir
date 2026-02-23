const sheets = require("../sheets/client");

function normalizePhone(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits : null;
}

async function findByUsername(username) {
  const users = await sheets.getUsers();
  const raw = (username || "").trim();
  if (!raw) return null;
  return users.find((u) => u.username && u.username.toLowerCase() === raw.toLowerCase()) || null;
}

async function findByEmail(email) {
  const users = await sheets.getUsers();
  const e = (email || "").trim().toLowerCase();
  if (!e) return null;
  return users.find((u) => u.email && u.email.toLowerCase() === e) || null;
}

async function createUser(user) {
  const users = await sheets.getUsers();
  if (user.username) {
    if (users.some((u) => u.username && u.username.toLowerCase() === user.username.toLowerCase())) {
      return null;
    }
  }
  if (user.email) {
    if (users.some((u) => u.email && u.email.toLowerCase() === user.email.toLowerCase())) {
      return null;
    }
  }
  await sheets.appendUser(user);
  return user;
}

async function findById(id) {
  const users = await sheets.getUsers();
  return users.find((u) => u.id === id) || null;
}

async function updateUser(userId, updates) {
  const user = await findById(userId);
  if (!user) return null;
  const allowed = {};
  if (updates.fullName !== undefined) allowed.fullName = String(updates.fullName).trim() || null;
  if (updates.email !== undefined) allowed.email = updates.email ? String(updates.email).trim().toLowerCase() || null : null;
  if (updates.passwordHash !== undefined) allowed.passwordHash = updates.passwordHash;
  const merged = { ...user, ...allowed };
  await sheets.updateUser(userId, merged);
  return merged;
}

module.exports = {
  normalizePhone,
  findByUsername,
  findByEmail,
  createUser,
  findById,
  updateUser,
};
