import { Router } from 'express';
import { supabaseAdmin } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  const { date, memberId } = req.query;
  let query = supabaseAdmin.from('attendance').select(`
    id, check_in, check_out, method, created_at,
    member:member_id ( id, member_code, profile:profile_id ( full_name ) )
  `);
  if (date) query = query.eq('check_in::date', date);
  if (memberId) query = query.eq('member_id', memberId);
  query = query.order('check_in', { ascending: false }).limit(50);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  const records = data.map(a => ({
    id: a.id, memberId: a.member?.id || '', memberName: a.member?.profile?.full_name || '',
    checkIn: a.check_in || '', date: a.check_in?.split('T')[0] || '',
    status: a.check_in ? 'Present' : 'Absent',
  }));
  res.json(records);
});

router.get('/today', async (_req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabaseAdmin.rpc('get_attendance_today');
  if (error || !data) {
    const { data: fallback } = await supabaseAdmin.from('attendance')
      .select(`id, check_in, check_out, method, member:member_id ( id, member_code, profile:profile_id ( full_name ) )`)
      .gte('check_in', today)
      .order('check_in', { ascending: false });
    const records = (fallback || []).map(a => ({
      id: a.id, memberId: a.member?.id || '', memberName: a.member?.profile?.full_name || '',
      checkIn: a.check_in || '', checkOut: a.check_out || '', method: a.method || '',
    }));
    return res.json({ date: today, total: records.length, present: records.length, absent: 0, records });
  }
  const records = data.map(a => ({
    id: a.id, memberId: a.member_id, memberName: a.member_name,
    checkIn: a.check_in, checkOut: a.check_out, method: a.method,
  }));
  res.json({ date: today, total: records.length, present: records.length, absent: 0, records });
});

router.post('/', async (req, res) => {
  const { memberId } = req.body;
  if (!memberId) return res.status(400).json({ error: 'Member ID required' });
  const today = new Date().toISOString().split('T')[0];
  const { data: existing } = await supabaseAdmin.from('attendance')
    .select('id').gte('check_in', today).eq('member_id', memberId).limit(1);
  if (existing && existing.length > 0) {
    return res.status(409).json({ error: 'Already checked in today' });
  }
  const { data, error } = await supabaseAdmin.from('attendance').insert({
    member_id: memberId, method: 'qr',
  }).select(`id, check_in, member:member_id ( id, profile:profile_id ( full_name ) )`).single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({
    id: data.id, memberId: data.member?.id || '', memberName: data.member?.profile?.full_name || '',
    checkIn: data.check_in, date: data.check_in?.split('T')[0] || '', status: 'Present',
  });
});

export default router;
