import { Router } from 'express';

const router = Router();

const leads = [
  { id: '1', name: 'Aakash Gupta', phone: '9876000011', email: 'aakash@email.com', source: 'Instagram', status: 'New', followUp: '2026-01-18', notes: 'Interested in monthly premium', createdAt: '2026-01-14' },
  { id: '2', name: 'Ritu Agarwal', phone: '9876000012', email: 'ritu@email.com', source: 'Google Ads', status: 'Contacted', followUp: '2026-01-17', notes: 'Called, will visit tomorrow', createdAt: '2026-01-13' },
  { id: '3', name: 'Manish Tiwari', phone: '9876000013', email: 'manish@email.com', source: 'Referral', status: 'Qualified', followUp: '2026-01-16', notes: 'Friend of Arjun, wants yearly plan', createdAt: '2026-01-12' },
  { id: '4', name: 'Swati Pandey', phone: '9876000014', email: 'swati@email.com', source: 'Facebook', status: 'Proposal', followUp: '2026-01-15', notes: 'Sent proposal for corporate plan', createdAt: '2026-01-10' },
  { id: '5', name: 'Harsh Vardhan', phone: '9876000015', email: 'harsh@email.com', source: 'Walk-in', status: 'Won', followUp: '2026-01-14', notes: 'Signed up for quarterly pro', createdAt: '2026-01-08' },
  { id: '6', name: 'Divya Mishra', phone: '9876000016', email: 'divya@email.com', source: 'Instagram', status: 'Lost', followUp: '2026-01-12', notes: 'Chose another gym', createdAt: '2026-01-05' },
  { id: '7', name: 'Karan Singh', phone: '9876000017', email: 'karan@email.com', source: 'Website', status: 'New', followUp: '2026-01-19', notes: 'Filled contact form', createdAt: '2026-01-15' },
  { id: '8', name: 'Nidhi Sharma', phone: '9876000018', email: 'nidhi@email.com', source: 'Referral', status: 'Contacted', followUp: '2026-01-18', notes: 'Priya referred her', createdAt: '2026-01-14' },
];

const statuses = ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost'];

router.get('/', (_req, res) => {
  res.json(leads);
});

router.get('/statuses', (_req, res) => {
  res.json(statuses);
});

router.post('/', (req, res) => {
  const { name, phone, email, source, notes } = req.body;
  if (!name || !phone) return res.status(400).json({ error: 'Name and phone required' });
  const newLead = {
    id: String(leads.length + 1),
    name,
    phone,
    email: email || '',
    source: source || 'Walk-in',
    status: 'New',
    followUp: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    notes: notes || '',
    createdAt: new Date().toISOString().split('T')[0],
  };
  leads.push(newLead);
  res.status(201).json(newLead);
});

router.put('/:id', (req, res) => {
  const idx = leads.findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Lead not found' });
  leads[idx] = { ...leads[idx], ...req.body, id: leads[idx].id };
  res.json(leads[idx]);
});

router.delete('/:id', (req, res) => {
  const idx = leads.findIndex(l => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Lead not found' });
  const removed = leads.splice(idx, 1)[0];
  res.json({ message: 'Lead deleted', lead: removed });
});

export default router;
