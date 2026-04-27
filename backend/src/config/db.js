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
    refresh_token TEXT,
    token_version INTEGER NOT NULL DEFAULT 0,
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

  // Migration: Add refresh_token and token_version to users
  try {
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS refresh_token TEXT,
      ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 0;
    `);
  } catch (error) {
    console.warn("Could not add refresh columns to users table:", error.message);
  }

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

  // Migration: Correct Trigram Indexes (Individual instead of Composite)
  try {
    await db.query("CREATE EXTENSION IF NOT EXISTS pg_trgm;");

    // 1. Cleanup incorrect composite indexes
    await db.query(`
      DROP INDEX IF EXISTS idx_leads_user_name_trgm;
      DROP INDEX IF EXISTS idx_leads_user_company_trgm;
      DROP INDEX IF EXISTS idx_leads_user_email_trgm;
    `);

    // 2. Create individual GIN Trigram Indexes
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_leads_name_trgm ON leads USING gin (name gin_trgm_ops);
      CREATE INDEX IF NOT EXISTS idx_leads_company_trgm ON leads USING gin (company gin_trgm_ops);
      CREATE INDEX IF NOT EXISTS idx_leads_email_trgm ON leads USING gin (email gin_trgm_ops);
    `);
    
    console.info("Database performance indexes (Corrected Trigram) verified.");
  } catch (error) {
    console.warn("Could not correct GIN Trigram indexes:", error.message);
  }

  // Migration: Add activity tracking columns to leads
  try {
    await db.query(`
      ALTER TABLE leads 
      ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS last_activity_type VARCHAR(20);
    `);
  } catch (error) {
    console.warn("Could not add activity columns to leads table:", error.message);
  }

  // Migration: Create activities table
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
        activity_type VARCHAR(20) NOT NULL CHECK (activity_type IN ('field', 'call')),
        notes TEXT,
        call_outcome VARCHAR(50),
        duration_seconds INTEGER,
        follow_up_required BOOLEAN DEFAULT false,
        created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON activities(lead_id);
    `);
  } catch (error) {
    console.warn("Could not create activities table:", error.message);
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
