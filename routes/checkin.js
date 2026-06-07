import { Router } from 'express';
import { supabaseAdmin } from '../db.js';

const router = Router();

router.post('/verify', async (req, res) => {
  const { code, method } = req.body;
  if (!code) return res.status(400).json({ error: 'Code is required' });

  const { data: member, error } = await supabaseAdmin
    .from('members')
    .select('id, member_code, status, profile:profile_id(id, full_name, phone)')
    .eq('member_code', code)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!member) return res.status(404).json({ error: 'Member not found with this code' });
  if (member.status !== 'active') return res.status(400).json({ error: 'Member is not active' });

  const { data: attendance, error: ae } = await supabaseAdmin.from('attendance').insert({
    member_id: member.id,
    method: method || 'qr',
  }).select().single();

  if (ae) return res.status(500).json({ error: ae.message });

  res.json({
    id: attendance.id,
    memberName: member.profile?.full_name || '',
    memberCode: member.member_code,
    checkIn: attendance.check_in,
    memberId: member.id,
  });
});

router.get('/recent', async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('attendance')
    .select('*, member:member_id(id, member_code, profile:profile_id(full_name, phone))')
    .order('check_in', { ascending: false })
    .limit(50);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map(a => ({
    id: a.id,
    memberName: a.member?.profile?.full_name || '',
    memberCode: a.member?.member_code || '',
    memberId: a.member_id,
    checkIn: a.check_in,
    checkOut: a.check_out,
    method: a.method,
  })));
});

export default router;
