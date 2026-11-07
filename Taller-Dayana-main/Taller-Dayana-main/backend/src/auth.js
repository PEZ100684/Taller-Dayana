const jwt = require("jsonwebtoken");

function signAdminToken(username) {
  return jwt.sign({ role: "admin", username }, process.env.JWT_SECRET || "change-me", {
    expiresIn: "8h"
  });
}

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Token requerido" });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "change-me");
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Token invalido" });
  }
}

module.exports = {
  signAdminToken,
  requireAdmin
};
