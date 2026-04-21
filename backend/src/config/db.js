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
    phone TEXT,
    email TEXT,
    gst TEXT,
    company TEXT,
    raw_data JSONB,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE INDEX IF NOT EXISTS idx_leads_created_by ON leads(created_by);
  CREATE UNIQUE INDEX IF NOT EXISTS leads_user_phone_uniq ON leads (created_by, phone) WHERE phone IS NOT NULL;
  CREATE UNIQUE INDEX IF NOT EXISTS leads_user_email_uniq ON leads (created_by, email) WHERE email IS NOT NULL;

  CREATE TABLE IF NOT EXISTS visiting_cards (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS notes (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
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

  // Migration: Ensure phone is nullable in leads
  try {
    await db.query(`
      ALTER TABLE leads 
      ALTER COLUMN phone DROP NOT NULL;
    `);
  } catch (error) {
    console.warn("Could not ensure phone is nullable in leads table:", error.message);
  }

  // Migration: Add email, gst, raw_data columns if they don't exist
  try {
    await db.query(`
      ALTER TABLE leads 
      ADD COLUMN IF NOT EXISTS email TEXT,
      ADD COLUMN IF NOT EXISTS gst TEXT,
      ADD COLUMN IF NOT EXISTS raw_data JSONB;
    `);
  } catch (error) {
    console.warn("Could not add new columns to leads table:", error.message);
  }

  // Migration: Add unique partial indexes
  try {
    await db.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS leads_user_phone_uniq ON leads (created_by, phone) WHERE phone IS NOT NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS leads_user_email_uniq ON leads (created_by, email) WHERE email IS NOT NULL;
    `);
  } catch (error) {
    console.warn("Could not create unique indexes on leads table:", error.message);
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
