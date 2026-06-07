import { Router } from 'express';
import { supabaseAdmin } from '../db.js';

const router = Router();

router.get('/', async (_req, res) => {
  const { data, error } = await supabaseAdmin
    .from('store_items')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data.map(i => ({
    id: i.id,
    name: i.name,
    description: i.description || '',
    price: Number(i.price),
    quantity: i.quantity,
    category: i.category || '',
    imageUrl: i.image_url || '',
    isActive: i.is_active,
    createdAt: i.created_at,
  })));
});

router.post('/', async (req, res) => {
  const { name, description, price, quantity, category, imageUrl } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const { data, error } = await supabaseAdmin.from('store_items').insert({
    name, description: description || '',
    price: price || 0, quantity: quantity || 0,
    category: category || '', image_url: imageUrl || '',
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/:id', async (req, res) => {
  const updates = {};
  ['name', 'description', 'price', 'quantity', 'category', 'imageUrl', 'isActive']
    .forEach(k => {
      if (req.body[k] !== undefined) {
        const dbKey = k === 'imageUrl' ? 'image_url' : k === 'isActive' ? 'is_active' : k;
        updates[dbKey] = req.body[k];
      }
    });
  const { data, error } = await supabaseAdmin.from('store_items').update(updates).eq('id', req.params.id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabaseAdmin.from('store_items').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Item deleted' });
});

export default router;
