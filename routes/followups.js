import { Router } from 'express';
import { supabaseAdmin } from '../db.js';

const router = Router();

const FOLLOWUP_SELECT = `
  id, lead_id, member_id, notes, status, follow_up_date, assigned_to, created_at, updated_at,
  lead:lead_id ( id, name, phone, email, source, status as lead_status ),
  member:member_id ( id, profile_id, member_code,
    profile:profile_id ( id, full_name, phone ) ),
  assignee:assigned_to ( id, full_name, email )
`;

router.get('/', async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('follow_ups')
    .select(FOLLOWUP_SELECT)
    .order('follow_up_date', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map(f => ({
    id: f.id,
    leadId: f.lead_id,
    memberId: f.member_id,
    leadName: f.lead?.name || f.member?.profile?.full_name || '',
    leadPhone: f.lead?.phone || f.member?.profile?.phone || '',
    notes: f.notes || '',
    status: f.status,
    followUpDate: f.follow_up_date,
    assignedTo: f.assignee?.full_name || '',
    createdAt: f.created_at,
  })));
});

router.post('/', async (req, res) => {
  const { leadId, memberId, notes, followUpDate, assignedTo } = req.body;
  if (!followUpDate) return res.status(400).json({ error: 'Follow-up date is required' });
  const { data, error } = await supabaseAdmin.from('follow_ups').insert({
    lead_id: leadId || null,
    member_id: memberId || null,
    notes: notes || '',
    follow_up_date: followUpDate,
    assigned_to: assignedTo || null,
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/:id', async (req, res) => {
  const { status, notes, followUpDate } = req.body;
  const updates = {};
  if (status) updates.status = status;
  if (notes !== undefined) updates.notes = notes;
  if (followUpDate) updates.follow_up_date = followUpDate;
  const { data, error } = await supabaseAdmin.from('follow_ups').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabaseAdmin.from('follow_ups').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Follow-up deleted' });
});

export default router;
