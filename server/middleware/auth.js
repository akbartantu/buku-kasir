const { verifyToken } = require("../auth/service");

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  const token = auth && auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }
  const payload = verifyToken(token);
  if (!payload || !payload.sub) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  req.userId = payload.sub;
  next();
}

module.exports = { requireAuth };
