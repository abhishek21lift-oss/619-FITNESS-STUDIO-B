-- ============================================================
-- Your Digital Lift — Complete Supabase Schema
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('admin', 'staff', 'trainer');
CREATE TYPE plan_type AS ENUM ('membership', 'pt', 'class');

-- ============================================================
-- 1. profiles
-- ============================================================
CREATE TABLE profiles (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  email        text NOT NULL UNIQUE,
  full_name    text NOT NULL,
  role         user_role NOT NULL DEFAULT 'staff',
  phone        text,
  avatar_url   text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_email ON profiles (email);
CREATE INDEX idx_profiles_role   ON profiles (role);

-- ============================================================
-- 2. members
-- ============================================================
CREATE TABLE members (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  member_code       text NOT NULL UNIQUE,
  gym_id            uuid,
  date_of_birth     date,
  gender            text,
  address           text,
  emergency_contact text,
  emergency_phone   text,
  join_date         date NOT NULL DEFAULT CURRENT_DATE,
  status            text NOT NULL DEFAULT 'active',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_members_profile_id  ON members (profile_id);
CREATE INDEX idx_members_member_code ON members (member_code);
CREATE INDEX idx_members_status      ON members (status);
CREATE INDEX idx_members_gym_id      ON members (gym_id);

-- ============================================================
-- 3. membership_plans
-- ============================================================
CREATE TABLE membership_plans (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          text NOT NULL,
  description   text,
  price         numeric(10,2) NOT NULL,
  duration_days int NOT NULL,
  features      jsonb DEFAULT '[]',
  plan_type     plan_type NOT NULL DEFAULT 'membership',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_membership_plans_type ON membership_plans (plan_type);

-- ============================================================
-- 4. member_subscriptions
-- ============================================================
CREATE TABLE member_subscriptions (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id       uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  plan_id         uuid NOT NULL REFERENCES membership_plans(id) ON DELETE RESTRICT,
  start_date      date NOT NULL,
  end_date        date NOT NULL,
  amount_paid     numeric(10,2) NOT NULL,
  payment_status  text NOT NULL DEFAULT 'pending',
  payment_method  text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_member_id ON member_subscriptions (member_id);
CREATE INDEX idx_subscriptions_plan_id   ON member_subscriptions (plan_id);
CREATE INDEX idx_subscriptions_end_date  ON member_subscriptions (end_date);
CREATE INDEX idx_subscriptions_status    ON member_subscriptions (payment_status);

-- ============================================================
-- 5. payments
-- ============================================================
CREATE TABLE payments (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id         uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  subscription_id   uuid REFERENCES member_subscriptions(id) ON DELETE SET NULL,
  amount            numeric(10,2) NOT NULL,
  payment_date      timestamptz NOT NULL DEFAULT now(),
  payment_method    text,
  transaction_id    text,
  status            text NOT NULL DEFAULT 'completed',
  invoice_no        text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_member_id        ON payments (member_id);
CREATE INDEX idx_payments_subscription_id  ON payments (subscription_id);
CREATE INDEX idx_payments_status           ON payments (status);
CREATE INDEX idx_payments_payment_date     ON payments (payment_date);

-- ============================================================
-- 6. attendance
-- ============================================================
CREATE TABLE attendance (
  id         uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id  uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  check_in   timestamptz NOT NULL DEFAULT now(),
  check_out  timestamptz,
  method     text NOT NULL DEFAULT 'qr',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_attendance_member_id ON attendance (member_id);
CREATE INDEX idx_attendance_check_in  ON attendance (check_in);
CREATE INDEX idx_attendance_date      ON attendance ((check_in::date));

-- ============================================================
-- 7. staff
-- ============================================================
CREATE TABLE staff (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id        uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  position          text,
  salary            numeric(10,2),
  commission_percent numeric(5,2),
  shift_start       time,
  shift_end         time,
  work_days         jsonb DEFAULT '[]',
  status            text NOT NULL DEFAULT 'active',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_staff_profile_id ON staff (profile_id);
CREATE INDEX idx_staff_status     ON staff (status);

-- ============================================================
-- 8. classes
-- ============================================================
CREATE TABLE classes (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             text NOT NULL,
  description      text,
  trainer_id       uuid REFERENCES staff(id) ON DELETE SET NULL,
  category         text,
  capacity         int NOT NULL DEFAULT 20,
  duration_minutes int NOT NULL,
  start_time       time NOT NULL,
  end_time         time NOT NULL,
  days_of_week     jsonb DEFAULT '[]',
  color            text DEFAULT '#3B82F6',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_classes_trainer_id ON classes (trainer_id);
CREATE INDEX idx_classes_category   ON classes (category);

-- ============================================================
-- 9. class_bookings
-- ============================================================
CREATE TABLE class_bookings (
  id           uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id     uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  member_id    uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  booking_date date NOT NULL,
  status       text NOT NULL DEFAULT 'confirmed',
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_class_bookings_class_id  ON class_bookings (class_id);
CREATE INDEX idx_class_bookings_member_id ON class_bookings (member_id);
CREATE INDEX idx_class_bookings_date      ON class_bookings (booking_date);
CREATE UNIQUE INDEX idx_class_bookings_unique
  ON class_bookings (class_id, member_id, booking_date);

-- ============================================================
-- 10. leads
-- ============================================================
CREATE TABLE leads (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           text NOT NULL,
  phone          text,
  email          text,
  gym_name       text,
  source         text,
  status         text NOT NULL DEFAULT 'new',
  notes          text,
  assigned_to    uuid REFERENCES profiles(id) ON DELETE SET NULL,
  follow_up_date date,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_leads_assigned_to  ON leads (assigned_to);
CREATE INDEX idx_leads_status       ON leads (status);
CREATE INDEX idx_leads_follow_up    ON leads (follow_up_date);

-- ============================================================
-- 11. workout_plans
-- ============================================================
CREATE TABLE workout_plans (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        text NOT NULL,
  description text,
  trainer_id  uuid REFERENCES staff(id) ON DELETE SET NULL,
  member_id   uuid REFERENCES members(id) ON DELETE CASCADE,
  exercises   jsonb DEFAULT '[]',
  start_date  date,
  end_date    date,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_workout_plans_trainer_id ON workout_plans (trainer_id);
CREATE INDEX idx_workout_plans_member_id  ON workout_plans (member_id);

-- ============================================================
-- 12. diet_plans
-- ============================================================
CREATE TABLE diet_plans (
  id             uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           text NOT NULL,
  description    text,
  trainer_id     uuid REFERENCES staff(id) ON DELETE SET NULL,
  member_id      uuid REFERENCES members(id) ON DELETE CASCADE,
  meals          jsonb DEFAULT '[]',
  daily_calories int,
  start_date     date,
  end_date       date,
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_diet_plans_trainer_id ON diet_plans (trainer_id);
CREATE INDEX idx_diet_plans_member_id  ON diet_plans (member_id);

-- ============================================================
-- 13. gym_settings
-- ============================================================
CREATE TABLE gym_settings (
  id               uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  gym_name         text NOT NULL DEFAULT 'Your Digital Lift',
  address          text,
  phone            text,
  email            text,
  logo_url         text,
  timezone         text DEFAULT 'Asia/Kolkata',
  currency         text DEFAULT 'INR',
  whatsapp_enabled boolean NOT NULL DEFAULT false,
  sms_enabled      boolean NOT NULL DEFAULT false,
  email_notifications boolean NOT NULL DEFAULT true,
  payment_gateway  text,
  gateway_api_key  text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Helper: enable RLS on all tables
ALTER TABLE profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE members              ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans     ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_subscriptions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance            ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff                ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_bookings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads                ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans        ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plans           ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_settings         ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read own profile; admins read all
CREATE POLICY profiles_select_own ON profiles
  FOR SELECT USING (auth.uid() = id OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Members: staff & admins can read/write
CREATE POLICY members_select_all ON members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff','trainer')));

CREATE POLICY members_insert_all ON members
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff')));

CREATE POLICY members_update_all ON members
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff')));

-- Membership plans: all authenticated users can read; admins write
CREATE POLICY membership_plans_select_all ON membership_plans
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY membership_plans_insert_all ON membership_plans
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY membership_plans_update_all ON membership_plans
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Subscriptions: staff/admins read/write
CREATE POLICY subscriptions_select_all ON member_subscriptions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff','trainer')));

CREATE POLICY subscriptions_insert_all ON member_subscriptions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff')));

CREATE POLICY subscriptions_update_all ON member_subscriptions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff')));

-- Payments: staff/admins read/write
CREATE POLICY payments_select_all ON payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff')));

CREATE POLICY payments_insert_all ON payments
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff')));

-- Attendance: staff/admins read; staff write
CREATE POLICY attendance_select_all ON attendance
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff','trainer')));

CREATE POLICY attendance_insert_all ON attendance
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff')));

-- Staff: admins only
CREATE POLICY staff_select_all ON staff
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff','trainer')));

CREATE POLICY staff_insert_all ON staff
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY staff_update_all ON staff
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Classes: all authenticated read; admins/staff write
CREATE POLICY classes_select_all ON classes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY classes_insert_all ON classes
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff')));

CREATE POLICY classes_update_all ON classes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff')));

-- Class bookings: staff/admins read; admins/staff/trainers write
CREATE POLICY class_bookings_select_all ON class_bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff','trainer')));

CREATE POLICY class_bookings_insert_all ON class_bookings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff','trainer')));

-- Leads: staff/admins read/write
CREATE POLICY leads_select_all ON leads
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff')));

CREATE POLICY leads_insert_all ON leads
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff')));

CREATE POLICY leads_update_all ON leads
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff')));

-- Workout plans: staff/admins/trainers read; staff/trainers write
CREATE POLICY workout_plans_select_all ON workout_plans
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff','trainer')));

CREATE POLICY workout_plans_insert_all ON workout_plans
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff','trainer')));

-- Diet plans: staff/admins/trainers read; staff/trainers write
CREATE POLICY diet_plans_select_all ON diet_plans
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff','trainer')));

CREATE POLICY diet_plans_insert_all ON diet_plans
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff','trainer')));

-- Gym settings: all authenticated read; admins write
CREATE POLICY gym_settings_select_all ON gym_settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY gym_settings_update_all ON gym_settings
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================================
-- TRIGGER: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_members_updated_at
  BEFORE UPDATE ON members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_membership_plans_updated_at
  BEFORE UPDATE ON membership_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_staff_updated_at
  BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_classes_updated_at
  BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_leads_updated_at
  BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_gym_settings_updated_at
  BEFORE UPDATE ON gym_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
