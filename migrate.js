import pkg from 'pg';

const { Pool } = pkg;

const TABLES_SQL = `
CREATE TABLE IF NOT EXISTS announcements (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       text NOT NULL,
  content     text NOT NULL,
  priority    text NOT NULL DEFAULT 'normal',
  is_active   boolean NOT NULL DEFAULT true,
  created_by  uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS store_items (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        text NOT NULL,
  description text,
  price       numeric(10,2) NOT NULL DEFAULT 0,
  quantity    int NOT NULL DEFAULT 0,
  category    text,
  image_url   text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS follow_ups (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id     uuid REFERENCES leads(id) ON DELETE CASCADE,
  member_id   uuid REFERENCES members(id) ON DELETE CASCADE,
  notes       text,
  status      text NOT NULL DEFAULT 'pending',
  follow_up_date date NOT NULL,
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS batches (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            text NOT NULL,
  description     text,
  trainer_id      uuid REFERENCES staff(id) ON DELETE SET NULL,
  capacity        int NOT NULL DEFAULT 20,
  start_time      time,
  end_time        time,
  days_of_week    jsonb DEFAULT '[]',
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS batch_members (
  id        uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id  uuid NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now()
);
`;

export async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.log('DATABASE_URL not set — skipping auto-migration.');
    console.log('Run supabase-migration.sql manually in Supabase Dashboard SQL Editor.');
    return false;
  }

  try {
    const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false }, max: 1 });
    await pool.query(TABLES_SQL);
    console.log('Migration: tables created/verified successfully.');
    await pool.end();
    return true;
  } catch (e) {
    console.log('Migration error (non-fatal):', e.message);
    return false;
  }
}
