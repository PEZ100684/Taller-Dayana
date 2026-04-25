const { Pool } = require("pg");
const dns = require("dns");

let pool;

if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder(process.env.DNS_RESULT_ORDER || "ipv4first");
}

function buildPoolConfig() {
  const baseUrl = process.env.DATABASE_URL;
  let connectionString = baseUrl;

  if (baseUrl && process.env.DB_HOST_IPV4) {
    try {
      const parsed = new URL(baseUrl);
      parsed.hostname = process.env.DB_HOST_IPV4.trim();
      connectionString = parsed.toString();
    } catch (_error) {
      connectionString = baseUrl;
    }
  }

  const config = {
    connectionString,
    max: Number(process.env.PG_POOL_MAX || 10),
    connectionTimeoutMillis: Number(process.env.PG_CONNECT_TIMEOUT_MS || 10000),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30000),
    keepAlive: true
  };

  const sslMode = (process.env.PG_SSL_MODE || "").toLowerCase();
  if (sslMode === "disable") {
    config.ssl = false;
  } else if (sslMode === "require") {
    config.ssl = {
      rejectUnauthorized: process.env.PG_SSL_REJECT_UNAUTHORIZED === "true"
    };
  }

  return config;
}

function getPool() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  if (!pool) {
    pool = new Pool(buildPoolConfig());
  }

  return pool;
}

module.exports = { getPool };
