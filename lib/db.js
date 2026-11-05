import pg from "pg";

const { Pool } = pg;
let pool;

export function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }
  if (!pool) {
    const useSsl = process.env.PGSSL === "true" ||
      process.env.DATABASE_URL.includes("sslmode=require");
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });
  }
  return pool;
}
