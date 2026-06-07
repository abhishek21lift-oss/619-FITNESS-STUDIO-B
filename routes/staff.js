import { Router } from 'express';
import { supabaseAdmin } from '../db.js';

const router = Router();

const STAFF_SELECT = `
  id, position, salary, commission_percent, shift_start, shift_end, work_days, status, created_at,
  profile:profile_id ( id, full_name, email, phone, avatar_url )
`;

function shapeStaff(s) {
  return {
    id: s.id,
    name: s.profile?.full_name || '',
    role: s.position || 'Staff',
    email: s.profile?.email || '',
    phone: s.profile?.phone || '',
    status: s.status,
    salary: Number(s.salary) || 0,
    joinDate: s.created_at?.split('T')[0] || '',
    shift: s.shift_start ? `${s.shift_start.slice(0,5)}-${(s.shift_end || '').slice(0,5)}` : 'Morning',
  };
}

router.get('/', async (_req, res) => {
  const { data, error } = await supabaseAdmin.from('staff').select(STAFF_SELECT).order('created_at');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map(shapeStaff));
});

router.post('/', async (req, res) => {
  const { name, role, email, phone, salary, shift } = req.body;
  if (!name || !role) return res.status(400).json({ error: 'Name and role required' });
  const { data: profile, error: pe } = await supabaseAdmin.from('profiles').insert({ full_name: name, email: email || '', phone: phone || '', role: 'staff' }).select().single();
  if (pe) return res.status(500).json({ error: pe.message });
  const { data: staff, error: se } = await supabaseAdmin.from('staff').insert({
    profile_id: profile.id, position: role, salary: salary || 0, status: 'active',
  }).select(STAFF_SELECT).single();
  if (se) return res.status(500).json({ error: se.message });
  res.status(201).json(shapeStaff(staff));
});

router.put('/:id', async (req, res) => {
  const { name, role, email, phone, salary, status, ...rest } = req.body;
  const { data: existing } = await supabaseAdmin.from('staff').select('profile_id').eq('id', req.params.id).single();
  if (!existing) return res.status(404).json({ error: 'Staff not found' });
  if (name || email || phone) {
    const pu = {};
    if (name) pu.full_name = name;
    if (email) pu.email = email;
    if (phone) pu.phone = phone;
    if (Object.keys(pu).length) await supabaseAdmin.from('profiles').update(pu).eq('id', existing.profile_id);
  }
  const su = {};
  if (role !== undefined) su.position = role;
  if (salary !== undefined) su.salary = salary;
  if (status !== undefined) su.status = status;
  if (Object.keys(su).length) await supabaseAdmin.from('staff').update(su).eq('id', req.params.id);
  const { data: full } = await supabaseAdmin.from('staff').select(STAFF_SELECT).eq('id', req.params.id).single();
  res.json(shapeStaff(full));
});

router.delete('/:id', async (req, res) => {
  const { data: existing } = await supabaseAdmin.from('staff').select('profile_id').eq('id', req.params.id).single();
  if (!existing) return res.status(404).json({ error: 'Staff not found' });
  await supabaseAdmin.from('staff').delete().eq('id', req.params.id);
  await supabaseAdmin.from('profiles').delete().eq('id', existing.profile_id);
  res.json({ message: 'Staff removed' });
});

export default router;
