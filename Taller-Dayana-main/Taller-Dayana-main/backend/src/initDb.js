const fs = require("fs");
const path = require("path");

const { getPool } = require("./db");

async function seedDemoData(pool) {
  const existingCheck = await pool.query(
    "SELECT (SELECT COUNT(*)::int FROM quotes) + (SELECT COUNT(*)::int FROM vehicles) AS total"
  );
  const totalCount = existingCheck.rows[0].total;

  if (totalCount > 0) {
    return { seeded: false, message: "Datos demo existentes" };
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const clientResult = await client.query(
      "INSERT INTO clients (name, phone) VALUES ($1, $2) RETURNING id",
      ["Cliente Demo", "8888-8888"]
    );
    const clientId = clientResult.rows[0].id;

    const vehicleResult = await client.query(
      `INSERT INTO vehicles (client_id, make_model, plate)
       VALUES ($1, $2, $3)
       ON CONFLICT (plate) DO UPDATE
         SET client_id = EXCLUDED.client_id,
             make_model = EXCLUDED.make_model
       RETURNING id`,
      [clientId, "Toyota Corolla", "CR1234"]
    );
    const vehicleId = vehicleResult.rows[0].id;

    await client.query(
      "INSERT INTO quotes (client_id, vehicle_id, damage_description, status) VALUES ($1, $2, $3, $4)",
      [clientId, vehicleId, "Golpe lateral en puerta trasera", "received"]
    );

    await client.query(
      "INSERT INTO appointments (client_id, vehicle_id, appointment_date, status) VALUES ($1, $2, $3, $4)",
      [clientId, vehicleId, "2026-04-20", "scheduled"]
    );

    await client.query(
      "INSERT INTO notifications (plate, message) VALUES ($1, $2)",
      ["CR1234", "Su vehiculo esta listo para retiro"]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return { seeded: true, message: "Datos demo de PostgreSQL cargados" };
}

async function initializeDatabase() {
  const pool = getPool();

  if (!pool) {
    return { initialized: false, message: "DATABASE_URL no configurado" };
  }

  const schemaPath = path.join(__dirname, "..", "db", "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");

  await pool.query(schemaSql);
  const seedStatus = await seedDemoData(pool);

  return {
    initialized: true,
    message: seedStatus.seeded ? `${seedStatus.message} y esquema PostgreSQL inicializado` : "Esquema PostgreSQL inicializado"
  };
}

module.exports = { initializeDatabase };