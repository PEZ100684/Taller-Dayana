const jwt = require("jsonwebtoken");

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === "change-me") {
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "⚠️ ALERTA DE SEGURIDAD: JWT_SECRET no está configurado o usa valor por defecto. Configure un JWT_SECRET robusto de 64 caracteres en sus variables de entorno de producción."
      );
    }
    return "taller-dayana-cr-saas-gam-2026-auth-shield-jwt-token-key";
  }
  return secret;
}

function signAdminToken(username) {
  return jwt.sign({ role: "admin", username }, getJwtSecret(), {
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
    req.user = jwt.verify(token, getJwtSecret());
    return next();
  } catch (error) {
    return res.status(401).json({ error: "Token invalido o expirado" });
  }
}

module.exports = {
  signAdminToken,
  requireAdmin
};
