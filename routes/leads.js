import { Router } from 'express';
import { supabaseAdmin } from '../db.js';

const router = Router();

const statuses = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'];

router.get('/', async (_req, res) => {
  const { data, error } = await supabaseAdmin.from('leads').select('*').order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  const leads = (data || []).map(l => ({
    id: l.id, name: l.name, phone: l.phone || '', email: l.email || '',
    source: l.source || 'Walk-in', status: l.status || 'New',
    followUp: l.follow_up_date || '', notes: l.notes || '',
    createdAt: l.created_at?.split('T')[0] || '',
  }));
  res.json(leads);
});

router.get('/statuses', (_req, res) => {
  res.json(statuses);
});

router.post('/', async (req, res) => {
  const { name, phone, email, source, notes } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Name and phone required' });
  const { data, error } = await supabaseAdmin.from('leads').insert({
    name, phone, email: email || '', source: source || 'Walk-in', status: 'New',
    follow_up_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    notes: notes || '',
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({
    id: data.id, name: data.name, phone: data.phone || '', email: data.email || '',
    source: data.source || 'Walk-in', status: data.status || 'New',
    followUp: data.follow_up_date || '', notes: data.notes || '',
    createdAt: data.created_at?.split('T')[0] || '',
  });
});

router.put('/:id', async (req, res) => {
  const updates = {};
  if (req.body.name !== undefined) updates.name = req.body.name;
  if (req.body.phone !== undefined) updates.phone = req.body.phone;
  if (req.body.email !== undefined) updates.email = req.body.email;
  if (req.body.source !== undefined) updates.source = req.body.source;
  if (req.body.status !== undefined) updates.status = req.body.status;
  if (req.body.notes !== undefined) updates.notes = req.body.notes;
  if (req.body.followUp !== undefined) updates.follow_up_date = req.body.followUp;
  const { data, error } = await supabaseAdmin.from('leads').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(404).json({ error: 'Lead not found' });
  res.json({
    id: data.id, name: data.name, phone: data.phone || '', email: data.email || '',
    source: data.source || 'Walk-in', status: data.status || 'New',
    followUp: data.follow_up_date || '', notes: data.notes || '',
    createdAt: data.created_at?.split('T')[0] || '',
  });
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabaseAdmin.from('leads').delete().eq('id', req.params.id);
  if (error) return res.status(404).json({ error: 'Lead not found' });
  res.json({ message: 'Lead deleted' });
});

export default router;
