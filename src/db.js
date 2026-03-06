// src/db.js
require("dotenv").config();        // ✅ asegura env aquí también
const { Pool } = require("pg");

const password = String(process.env.DB_PASSWORD ?? process.env.PGPASSWORD ?? "");

console.log("✅ db.js cargado desde:", __filename);
console.log("✅ DB_USER:", process.env.DB_USER);
console.log("✅ password typeof:", typeof password, "| len:", password.length);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password,                        // ✅ aquí ya va bien
  database: process.env.DB_DATABASE,
});

module.exports = pool;
