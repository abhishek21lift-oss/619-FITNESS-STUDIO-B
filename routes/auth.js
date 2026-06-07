import { Router } from 'express';
import { supabase, supabaseAdmin } from '../db.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
  if (authErr) return res.status(401).json({ error: 'Invalid credentials' });
  const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', authData.user.id).single();
  const user = { id: authData.user.id, email: authData.user.email, name: profile?.full_name || '', role: profile?.role || 'staff' };
  res.json({ token: authData.session.access_token, user });
});

router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: 'Name, email, and password required' });
  const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password });
  if (authErr) return res.status(409).json({ error: authErr.message });
  const { error: profileErr } = await supabaseAdmin.from('profiles').insert({ id: authData.user.id, email, full_name: name, role: 'staff' });
  if (profileErr) return res.status(500).json({ error: profileErr.message });
  const user = { id: authData.user.id, email, name, role: 'staff' };
  res.status(201).json({ token: authData.session?.access_token || '', user });
});

router.post('/logout', (_req, res) => {
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', async (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  const { data: { user }, error } = await supabase.auth.getUser(header.split(' ')[1]);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });
  const { data: profile } = await supabaseAdmin.from('profiles').select('*').eq('id', user.id).single();
  res.json({ id: user.id, email: user.email, name: profile?.full_name || '', role: profile?.role || 'staff' });
});

export default router;
