import { Router } from 'express';
import { supabaseAdmin } from '../db.js';

const router = Router();

const MEMBER_SELECT = `
  id, member_code, gender, address, emergency_contact, emergency_phone,
  join_date, status, date_of_birth, created_at,
  profile:profile_id ( id, full_name, email, phone, avatar_url ),
  subscriptions:member_subscriptions (
    id, end_date, amount_paid, start_date, payment_status,
    plan:plan_id ( id, name, price, duration_days )
  )
`;

function shapeMember(m) {
  const sub = m.subscriptions?.[0];
  const dob = m.date_of_birth;
  const age = dob ? Math.floor((new Date() - new Date(dob)) / 31557600000) : null;
  return {
    id: m.id,
    name: m.profile?.full_name || '',
    phone: m.profile?.phone || '',
    email: m.profile?.email || '',
    gender: m.gender || '',
    age,
    plan: sub?.plan?.name || 'No Plan',
    planId: sub?.plan?.id || '',
    status: m.status,
    joinDate: m.join_date,
    endDate: sub?.end_date || '',
    fee: Number(sub?.amount_paid) || 0,
    address: m.address || '',
    emergency: m.emergency_contact || '',
    photo: m.profile?.avatar_url || '',
  };
}

router.get('/', async (_req, res) => {
  const { data, error } = await supabaseAdmin.from('members').select(MEMBER_SELECT).order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map(shapeMember));
});

router.get('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('members').select(MEMBER_SELECT).eq('id', req.params.id).single();
  if (error) return res.status(404).json({ error: 'Member not found' });
  res.json(shapeMember(data));
});

router.post('/', async (req, res) => {
  const { name, phone, email, gender, age, plan, fee, address, emergency } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Name and phone are required' });
  const { data: profile, error: pe } = await supabaseAdmin.from('profiles').insert({ full_name: name, email: email || '', phone }).select().single();
  if (pe) return res.status(500).json({ error: pe.message });
  const code = `MEM-${Date.now().toString(36).toUpperCase()}`;
  const { data: member, error: me } = await supabaseAdmin.from('members').insert({
    profile_id: profile.id, member_code: code, gender: gender || 'Male',
    status: 'active', join_date: new Date().toISOString().split('T')[0], address: address || '',
    emergency_contact: emergency || '',
  }).select().single();
  if (me) return res.status(500).json({ error: me.message });
  if (plan) {
    const { data: planData } = await supabaseAdmin.from('membership_plans').select('id, duration_days').ilike('name', `%${plan}%`).limit(1).maybeSingle();
    if (planData) {
      await supabaseAdmin.from('member_subscriptions').insert({
        member_id: member.id, plan_id: planData.id, amount_paid: fee || 0,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + (planData.duration_days || 30) * 86400000).toISOString().split('T')[0],
        payment_status: fee ? 'completed' : 'pending',
      });
    }
  }
  const { data: full } = await supabaseAdmin.from('members').select(MEMBER_SELECT).eq('id', member.id).single();
  res.status(201).json(shapeMember(full));
});

router.put('/:id', async (req, res) => {
  const { name, phone, email, gender, address, emergency, status, age, ...rest } = req.body;
  const { data: member } = await supabaseAdmin.from('members').select('profile_id').eq('id', req.params.id).single();
  if (!member) return res.status(404).json({ error: 'Member not found' });
  if (name || email || phone) {
    const updates = {};
    if (name) updates.full_name = name;
    if (email) updates.email = email;
    if (phone) updates.phone = phone;
    await supabaseAdmin.from('profiles').update(updates).eq('id', member.profile_id);
  }
  const memberUpdates = {};
  if (gender !== undefined) memberUpdates.gender = gender;
  if (address !== undefined) memberUpdates.address = address;
  if (emergency !== undefined) memberUpdates.emergency_contact = emergency;
  if (status !== undefined) memberUpdates.status = status;
  if (Object.keys(memberUpdates).length > 0) {
    await supabaseAdmin.from('members').update(memberUpdates).eq('id', req.params.id);
  }
  const { data: full } = await supabaseAdmin.from('members').select(MEMBER_SELECT).eq('id', req.params.id).single();
  res.json(shapeMember(full));
});

router.delete('/:id', async (req, res) => {
  const { data: member } = await supabaseAdmin.from('members').select('profile_id').eq('id', req.params.id).single();
  if (!member) return res.status(404).json({ error: 'Member not found' });
  await supabaseAdmin.from('member_subscriptions').delete().eq('member_id', req.params.id);
  await supabaseAdmin.from('members').delete().eq('id', req.params.id);
  await supabaseAdmin.from('profiles').delete().eq('id', member.profile_id);
  res.json({ message: 'Member deleted' });
});

export default router;
