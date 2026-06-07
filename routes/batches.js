import { Router } from 'express';
import { supabaseAdmin } from '../db.js';

const router = Router();

router.get('/', async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('batches')
    .select('*, trainer:trainer_id(id, profile_id, profile:profile_id(full_name, phone))')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  const result = await Promise.all(data.map(async (b) => {
    const { count } = await supabaseAdmin.from('batch_members').select('*', { count: 'exact', head: true }).eq('batch_id', b.id);
    return {
      id: b.id,
      name: b.name,
      description: b.description,
      trainer: b.trainer?.profile?.full_name || '',
      capacity: b.capacity,
      memberCount: count || 0,
      startTime: b.start_time,
      endTime: b.end_time,
      daysOfWeek: b.days_of_week || [],
      isActive: b.is_active,
      createdAt: b.created_at,
    };
  }));
  res.json(result);
});

router.get('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('batches')
    .select('*, trainer:trainer_id(id, profile_id, profile:profile_id(full_name, phone))')
    .eq('id', req.params.id)
    .single();
  if (error) return res.status(404).json({ error: 'Batch not found' });
  const { data: members } = await supabaseAdmin
    .from('batch_members')
    .select('*, member:member_id(id, profile_id, member_code, profile:profile_id(full_name, phone))')
    .eq('batch_id', data.id);
  res.json({
    id: data.id,
    name: data.name,
    description: data.description,
    trainer: data.trainer?.profile?.full_name || '',
    capacity: data.capacity,
    memberCount: members?.length || 0,
    startTime: data.start_time,
    endTime: data.end_time,
    daysOfWeek: data.days_of_week || [],
    isActive: data.is_active,
    members: (members || []).map(m => ({
      id: m.member?.id,
      name: m.member?.profile?.full_name || '',
      code: m.member?.member_code || '',
      joinedAt: m.joined_at,
    })),
  });
});

router.post('/', async (req, res) => {
  const { name, description, capacity, startTime, endTime, daysOfWeek, trainerId } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const { data, error } = await supabaseAdmin.from('batches').insert({
    name, description: description || '',
    capacity: capacity || 20,
    start_time: startTime || null,
    end_time: endTime || null,
    days_of_week: daysOfWeek || [],
    trainer_id: trainerId || null,
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/:id', async (req, res) => {
  const updates = {};
  ['name', 'description', 'capacity', 'startTime', 'endTime', 'daysOfWeek', 'trainerId', 'isActive']
    .forEach(k => {
      if (req.body[k] !== undefined) {
        const dbKey = k === 'startTime' ? 'start_time' : k === 'endTime' ? 'end_time' : k === 'daysOfWeek' ? 'days_of_week' : k === 'trainerId' ? 'trainer_id' : k === 'isActive' ? 'is_active' : k;
        updates[dbKey] = req.body[k];
      }
    });
  const { data, error } = await supabaseAdmin.from('batches').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/:id/members', async (req, res) => {
  const { memberId } = req.body;
  if (!memberId) return res.status(400).json({ error: 'Member ID is required' });
  const { data, error } = await supabaseAdmin.from('batch_members').insert({
    batch_id: req.params.id, member_id: memberId,
  }).select().single();
  if (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Member already in batch' });
    return res.status(500).json({ error: error.message });
  }
  res.status(201).json(data);
});

router.delete('/:batchId/members/:memberId', async (req, res) => {
  const { error } = await supabaseAdmin.from('batch_members')
    .delete().eq('batch_id', req.params.batchId).eq('member_id', req.params.memberId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Member removed from batch' });
});

export default router;
