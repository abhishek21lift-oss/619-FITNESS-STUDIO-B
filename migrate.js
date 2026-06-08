import { supabase } from './supabase.js'
import pkg from 'pg'
const { Pool: PgPool } = pkg

const migrations = [
  `CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    full_name TEXT,
    name TEXT,
    role TEXT DEFAULT 'staff',
    phone TEXT,
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    gender TEXT,
    age INT,
    source TEXT,
    status TEXT DEFAULT 'new',
    notes TEXT,
    assigned_to TEXT,
    rep TEXT,
    tapped BOOLEAN DEFAULT false,
    tapped_at TIMESTAMPTZ,
    deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    gender TEXT,
    dob DATE,
    address TEXT,
    plan_id UUID,
    branch TEXT DEFAULT 'Lucknow',
    status TEXT DEFAULT 'active',
    join_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    photo TEXT,
    emergency_contact TEXT,
    medical_notes TEXT,
    referred_by UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS followups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enquiry_id UUID,
    member_id UUID,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    assigned_to TEXT,
    followup_date TIMESTAMPTZ,
    done BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS membership_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    duration_days INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    discounted_price DECIMAL(10,2),
    type TEXT DEFAULT 'regular',
    features JSONB,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id),
    plan_id UUID REFERENCES membership_plans(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_mode TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    discount_percent DECIMAL(5,2),
    discount_amount DECIMAL(10,2),
    max_uses INT,
    used_count INT DEFAULT 0,
    valid_from DATE,
    valid_until DATE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS combo_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    plans UUID[],
    price DECIMAL(10,2) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    trainer_id UUID,
    start_time TIME,
    end_time TIME,
    days TEXT[],
    capacity INT DEFAULT 20,
    enrolled INT DEFAULT 0,
    branch TEXT DEFAULT 'Lucknow',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS batch_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES batches(id),
    member_id UUID REFERENCES members(id),
    date DATE NOT NULL,
    status TEXT DEFAULT 'booked',
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS accounts_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    category TEXT,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    payment_mode TEXT,
    reference TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    payment_mode TEXT,
    date DATE DEFAULT CURRENT_DATE,
    receipt_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS payroll (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID,
    amount DECIMAL(10,2) NOT NULL,
    month INT,
    year INT,
    paid BOOLEAN DEFAULT false,
    paid_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    recipient TEXT,
    subject TEXT,
    message TEXT,
    status TEXT DEFAULT 'sent',
    sent_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    role TEXT,
    salary DECIMAL(10,2),
    branch TEXT DEFAULT 'Lucknow',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS trainers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    short_code TEXT,
    initials TEXT,
    specialty TEXT,
    commission DECIMAL(5,2) DEFAULT 0,
    phone TEXT,
    email TEXT,
    branch TEXT DEFAULT 'Lucknow',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS trainer_leave (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID REFERENCES trainers(id),
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    reason TEXT,
    approved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT,
    purchase_date DATE,
    cost DECIMAL(10,2),
    condition TEXT DEFAULT 'good',
    last_service DATE,
    next_service DATE,
    branch TEXT DEFAULT 'Lucknow',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS notices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT,
    priority TEXT DEFAULT 'normal',
    active BOOLEAN DEFAULT true,
    expires_at DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS holidays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    date DATE NOT NULL,
    type TEXT DEFAULT 'public',
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id),
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id),
    date DATE DEFAULT CURRENT_DATE,
    check_in TIMESTAMPTZ DEFAULT now(),
    check_out TIMESTAMPTZ,
    batch_id UUID REFERENCES batches(id),
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS fitness_centers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT,
    phone TEXT,
    email TEXT,
    timings TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id),
    trainer_id UUID REFERENCES trainers(id),
    date DATE DEFAULT CURRENT_DATE,
    check_in TIMESTAMPTZ DEFAULT now(),
    check_out TIMESTAMPTZ,
    batch_id UUID REFERENCES batches(id),
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS _credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id),
    password TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
  )`
]

let pool = null
function getPool() {
  if (!pool && process.env.DATABASE_URL) {
    pool = new PgPool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
  }
  return pool
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)) }

async function exec(sql) {
  const p = getPool()
  if (!p) return { error: { message: 'No DATABASE_URL configured' } }
  try {
    await p.query(sql)
    return { error: null }
  } catch (e) {
    return { error: { message: e.message } }
  }
}

async function seedAdmin() {
  const { data: existing } = await supabase.from('profiles').select('id,email').eq('email', 'admin@ydl.com').maybeSingle()
  if (!existing) {
    const { error: insErr } = await supabase.from('profiles').insert({
      email: 'admin@ydl.com',
      full_name: 'Admin',
      role: 'admin',
      phone: '919651924262'
    })
    if (insErr) console.log('  Admin profile error:', insErr.message.slice(0, 60))
    else console.log('  ✓ Admin profile created')
  }
  const { data: profile } = await supabase.from('profiles').select('id').eq('email', 'admin@ydl.com').single()
  if (profile) {
    const { data: cred } = await supabase.from('_credentials').select('id').eq('profile_id', profile.id).maybeSingle()
    if (!cred) {
      const { error: credErr } = await supabase.from('_credentials').insert({ profile_id: profile.id, password: 'admin@123' })
      if (credErr) console.log('  _credentials insert error:', credErr.message.slice(0, 60))
      else console.log('  ✓ Admin credentials seeded')
    }
  }
}

export async function runMigrations() {
  console.log('Running database migrations...')
  for (const sql of migrations) {
    await exec(sql)
    await sleep(100)
  }
  await seedAdmin()
  console.log('Migrations completed')
}
