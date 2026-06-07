import { Router } from 'express';
import { supabaseAdmin } from '../db.js';

const router = Router();

function shapePlan(p) {
  const duration = p.duration_days === 30 ? '1 Month' : p.duration_days === 90 ? '3 Months' : p.duration_days === 365 ? '12 Months' : `${p.duration_days} Days`;
  return {
    id: p.id, name: p.name, price: Number(p.price), duration,
    durationDays: p.duration_days || 30,
    description: p.description || '',
    features: p.features || [],
    popular: p.name?.toLowerCase().includes('premium') || false,
  };
}

router.get('/', async (_req, res) => {
  const { data, error } = await supabaseAdmin.from('membership_plans').select('*').order('price');
  if (error) return res.status(500).json({ error: error.message });
  res.json((data || []).map(shapePlan));
});

router.post('/', async (req, res) => {
  const { name, price, duration, durationDays, description, features } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Name and price required' });
  const { data, error } = await supabaseAdmin.from('membership_plans').insert({
    name, price: Number(price), duration_days: durationDays || 30,
    description: description || '', features: features || [],
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(shapePlan(data));
});

router.put('/:id', async (req, res) => {
  const updates = {};
  if (req.body.name !== undefined) updates.name = req.body.name;
  if (req.body.price !== undefined) updates.price = Number(req.body.price);
  if (req.body.durationDays !== undefined) updates.duration_days = req.body.durationDays;
  if (req.body.description !== undefined) updates.description = req.body.description;
  if (req.body.features !== undefined) updates.features = req.body.features;
  const { data, error } = await supabaseAdmin.from('membership_plans').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(404).json({ error: 'Plan not found' });
  res.json(shapePlan(data));
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabaseAdmin.from('membership_plans').delete().eq('id', req.params.id);
  if (error) return res.status(404).json({ error: 'Plan not found' });
  res.json({ message: 'Plan deleted' });
});

export default router;
