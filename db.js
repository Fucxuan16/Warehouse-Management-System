"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  throw new Error("Thiếu biến môi trường DATABASE_URL.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

async function ensureSchema() {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await pool.query(schema);
}

module.exports = { pool, ensureSchema };
