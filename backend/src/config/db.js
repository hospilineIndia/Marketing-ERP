import { Pool } from "pg";
import { env } from "./env.js";

export const db = new Pool({
  connectionString: env.databaseUrl,
});

const schemaSql = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'field')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    company TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_leads_created_by ON leads(created_by);
`;

let schemaReady = false;

export const initializeDatabase = async () => {
  if (schemaReady) {
    return;
  }

  await db.query(schemaSql);

  // Migration: Ensure updated_at exists in leads
  try {
    await db.query(`
      ALTER TABLE leads 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    `);
  } catch (error) {
    console.warn("Could not ensure updated_at in leads table:", error.message);
  }

  // Migration: Ensure company is nullable in leads
  try {
    await db.query(`
      ALTER TABLE leads 
      ALTER COLUMN company DROP NOT NULL;
    `);
  } catch (error) {
    console.warn("Could not ensure company is nullable in leads table:", error.message);
  }

  schemaReady = true;
};

export const checkDatabaseConnection = async () => {
  try {
    const start = Date.now();
    await initializeDatabase();
    // Simple ping to verify connection
    await db.query("SELECT 1");
    const duration = Date.now() - start;
    return { ok: true, message: `PostgreSQL connection ready (${duration}ms).` };
  } catch (error) {
    console.error("CRITICAL: Database connection failed!", error);
    return {
      ok: false,
      message: "PostgreSQL connection is configured but unavailable.",
      error: error.message,
    };
  }
};
