import { Router } from 'express';
import { supabaseAdmin } from '../db.js';

const router = Router();

router.get('/', async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('announcements')
    .select('*, creator:created_by(id, full_name)')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map(a => ({
    id: a.id,
    title: a.title,
    content: a.content,
    priority: a.priority,
    isActive: a.is_active,
    createdBy: a.creator?.full_name || '',
    createdAt: a.created_at,
  })));
});

router.post('/', async (req, res) => {
  const { title, content, priority } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  const { data, error } = await supabaseAdmin.from('announcements').insert({
    title, content: content || '', priority: priority || 'normal',
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/:id', async (req, res) => {
  const { title, content, priority, isActive } = req.body;
  const updates = {};
  if (title) updates.title = title;
  if (content !== undefined) updates.content = content;
  if (priority) updates.priority = priority;
  if (isActive !== undefined) updates.is_active = isActive;
  const { data, error } = await supabaseAdmin.from('announcements').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabaseAdmin.from('announcements').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Announcement deleted' });
});

export default router;
