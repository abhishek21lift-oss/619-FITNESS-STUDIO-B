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
    member_code TEXT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    gender TEXT,
    dob DATE,
    date_of_birth DATE,
    address TEXT,
    plan_id UUID,
    branch TEXT DEFAULT 'Lucknow',
    status TEXT DEFAULT 'active',
    join_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    photo TEXT,
    emergency_contact TEXT,
    emergency_phone TEXT,
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
    description TEXT,
    duration_days INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    discounted_price DECIMAL(10,2),
    type TEXT DEFAULT 'regular',
    plan_type TEXT DEFAULT 'membership',
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
    description TEXT,
    trainer_id UUID,
    start_time TIME,
    end_time TIME,
    days TEXT[],
    days_of_week JSONB,
    capacity INT DEFAULT 20,
    enrolled INT DEFAULT 0,
    branch TEXT DEFAULT 'Lucknow',
    active BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
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
  )`,
  `CREATE TABLE IF NOT EXISTS staff_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES staff(id),
    date DATE DEFAULT CURRENT_DATE,
    check_in TIMESTAMPTZ DEFAULT now(),
    check_out TIMESTAMPTZ,
    status TEXT DEFAULT 'present',
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS trainer_commission (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID REFERENCES trainers(id),
    amount DECIMAL(10,2) NOT NULL,
    type TEXT DEFAULT 'referral',
    description TEXT,
    date DATE DEFAULT CURRENT_DATE,
    paid BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    trainer_id UUID REFERENCES trainers(id),
    duration_days INT,
    price DECIMAL(10,2),
    max_capacity INT DEFAULT 20,
    enrolled INT DEFAULT 0,
    branch TEXT DEFAULT 'Lucknow',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS program_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES programs(id),
    member_id UUID REFERENCES members(id),
    enrolled_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS program_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES programs(id),
    member_id UUID REFERENCES members(id),
    date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'present',
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS batch_waiting (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES batches(id),
    member_id UUID REFERENCES members(id),
    requested_date DATE DEFAULT CURRENT_DATE,
    status TEXT DEFAULT 'waiting',
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS daily_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES batches(id),
    member_id UUID REFERENCES members(id),
    date DATE NOT NULL,
    status TEXT DEFAULT 'booked',
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    description TEXT,
    image_url TEXT,
    category TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS action_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    link TEXT,
    type TEXT DEFAULT 'action',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS quick_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    icon TEXT,
    link TEXT,
    color TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    subtitle TEXT,
    image_url TEXT,
    link TEXT,
    active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS diet_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    goal TEXT,
    duration_days INT,
    calories_per_day INT,
    member_id UUID REFERENCES members(id),
    trainer_id UUID REFERENCES trainers(id),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS diet_foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT,
    calories INT,
    protein DECIMAL(6,2),
    carbs DECIMAL(6,2),
    fats DECIMAL(6,2),
    unit TEXT DEFAULT 'g',
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS diet_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    ingredients JSONB,
    instructions TEXT,
    calories INT,
    protein DECIMAL(6,2),
    carbs DECIMAL(6,2),
    fats DECIMAL(6,2),
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT,
    muscle_group TEXT,
    equipment TEXT,
    difficulty TEXT DEFAULT 'beginner',
    instructions TEXT,
    video_url TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    type TEXT DEFAULT 'individual',
    goal TEXT,
    reward TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS challenge_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID REFERENCES challenges(id),
    name TEXT NOT NULL,
    members UUID[] DEFAULT '{}',
    score INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS wallet_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT DEFAULT 'income',
    icon TEXT,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS wallet_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID,
    category_id UUID REFERENCES wallet_categories(id),
    amount DECIMAL(10,2) NOT NULL,
    type TEXT DEFAULT 'credit',
    description TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS wallet_register (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id),
    balance DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    address TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS store_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id),
    member_id UUID REFERENCES members(id),
    items JSONB,
    total DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    order_date TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS store_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0,
    image_url TEXT,
    category TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    category TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS course_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id),
    course_name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_mode TEXT,
    status TEXT DEFAULT 'pending',
    order_date TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS invoice_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fitness_center_id UUID REFERENCES fitness_centers(id),
    prefix TEXT DEFAULT 'INV-',
    next_number INT DEFAULT 1,
    footer TEXT,
    terms TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS biometric_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fitness_center_id UUID REFERENCES fitness_centers(id),
    provider TEXT,
    api_key TEXT,
    api_url TEXT,
    active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS dlt_otp_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fitness_center_id UUID REFERENCES fitness_centers(id),
    principal_entity_id TEXT,
    content_template_id TEXT,
    telemarketer_id TEXT,
    active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS email_manager (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fitness_center_id UUID REFERENCES fitness_centers(id),
    smtp_host TEXT,
    smtp_port INT DEFAULT 587,
    smtp_user TEXT,
    smtp_pass TEXT,
    from_email TEXT,
    from_name TEXT,
    active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fitness_center_id UUID REFERENCES fitness_centers(id),
    name TEXT NOT NULL,
    description TEXT,
    rule_type TEXT,
    value JSONB,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS currency (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL,
    symbol TEXT,
    name TEXT,
    exchange_rate DECIMAL(10,4) DEFAULT 1,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS sms_balance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    balance INT DEFAULT 0,
    provider TEXT,
    last_updated TIMESTAMPTZ DEFAULT now()
  )`,
  `CREATE TABLE IF NOT EXISTS sms_recharge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    amount DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL,
    provider TEXT,
    transaction_id TEXT,
    recharge_date TIMESTAMPTZ DEFAULT now(),
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
