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

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY announcements_select_all ON announcements
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY announcements_insert_all ON announcements
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff')));
CREATE POLICY announcements_update_all ON announcements
  FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff')));
CREATE POLICY announcements_delete_all ON announcements
  FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY store_items_select_all ON store_items
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY store_items_insert_all ON store_items
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff')));
CREATE POLICY store_items_update_all ON store_items
  FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff')));
CREATE POLICY store_items_delete_all ON store_items
  FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY follow_ups_select_all ON follow_ups
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff','trainer')));
CREATE POLICY follow_ups_insert_all ON follow_ups
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff','trainer')));
CREATE POLICY follow_ups_update_all ON follow_ups
  FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff','trainer')));

CREATE POLICY batches_select_all ON batches
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY batches_insert_all ON batches
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff')));
CREATE POLICY batches_update_all ON batches
  FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff')));

CREATE POLICY batch_members_select_all ON batch_members
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY batch_members_insert_all ON batch_members
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff')));
CREATE POLICY batch_members_delete_all ON batch_members
  FOR DELETE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','staff')));
