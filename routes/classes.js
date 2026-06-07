import { Router } from 'express';
import { supabaseAdmin } from '../db.js';

const router = Router();

const CLASS_SELECT = `
  id, name, description, category, capacity, duration_minutes, start_time, end_time, days_of_week, color, created_at,
  trainer:trainer_id ( id, profile:profile_id ( full_name ) )
`;

function shapeClass(c) {
  return {
    id: c.id,
    name: c.name,
    trainer: c.trainer?.profile?.full_name || 'Unassigned',
    time: c.start_time ? c.start_time.slice(0, 5) + ' AM' : '08:00 AM',
    duration: c.duration_minutes || 60,
    days: c.days_of_week || [],
    capacity: c.capacity || 20,
    enrolled: 0,
    category: c.category || 'General',
    description: c.description || '',
  };
}

router.get('/', async (_req, res) => {
  const { data, error } = await supabaseAdmin.from('classes').select(CLASS_SELECT).order('start_time');
  if (error) return res.status(500).json({ error: error.message });
  const classes = data.map(shapeClass);
  for (const c of classes) {
    const { count } = await supabaseAdmin.from('class_bookings').select('*', { count: 'exact', head: true }).eq('class_id', c.id);
    c.enrolled = count || 0;
  }
  res.json(classes);
});

router.post('/', async (req, res) => {
  const { name, trainer, time, duration, days, capacity, category, description } = req.body;
  if (!name || !trainer) return res.status(400).json({ error: 'Name and trainer required' });
  const { data, error } = await supabaseAdmin.from('classes').insert({
    name, description: description || '', category: category || 'General',
    capacity: capacity || 20, duration_minutes: duration || 60,
    start_time: time || '08:00', end_time: '09:00', days_of_week: days || [],
  }).select(CLASS_SELECT).single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(shapeClass(data));
});

router.put('/:id', async (req, res) => {
  const { name, trainer, time, duration, days, capacity, category, description } = req.body;
  const updates = {};
  if (name) updates.name = name;
  if (category) updates.category = category;
  if (capacity) updates.capacity = capacity;
  if (duration) updates.duration_minutes = duration;
  if (time) updates.start_time = time;
  if (days) updates.days_of_week = days;
  if (description !== undefined) updates.description = description;
  const { data, error } = await supabaseAdmin.from('classes').update(updates).eq('id', req.params.id).select(CLASS_SELECT).single();
  if (error) return res.status(404).json({ error: 'Class not found' });
  res.json(shapeClass(data));
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabaseAdmin.from('classes').delete().eq('id', req.params.id);
  if (error) return res.status(404).json({ error: 'Class not found' });
  res.json({ message: 'Class deleted' });
});

export default router;
