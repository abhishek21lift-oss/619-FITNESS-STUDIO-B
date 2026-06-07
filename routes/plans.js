import { Router } from 'express';

const router = Router();

const plans = [
  { id: '1', name: 'Monthly Basic', price: 999, duration: '1 Month', durationDays: 30, description: 'Access to gym equipment during standard hours', features: ['Gym equipment access', 'Standard hours', 'Locker facility'], popular: false },
  { id: '2', name: 'Monthly Premium', price: 1999, duration: '1 Month', durationDays: 30, description: 'Full access including classes and steam', features: ['Everything in Basic', 'Group classes', 'Steam room', 'Personal trainer (2 sessions)'], popular: true },
  { id: '3', name: 'Quarterly Pro', price: 4999, duration: '3 Months', durationDays: 90, description: 'Best value quarterly plan with all access', features: ['Everything in Premium', '12 PT sessions', 'Diet consultation', 'Priority booking'], popular: false },
  { id: '4', name: 'Yearly Elite', price: 14999, duration: '12 Months', durationDays: 365, description: 'Ultimate membership with maximum savings', features: ['Everything in Pro', 'Unlimited PT', 'Free merchandise', 'Guest passes (4/month)', 'Nutrition plan'], popular: false },
  { id: '5', name: 'Corporate Plan', price: 7999, duration: '3 Months', durationDays: 90, description: 'Special pricing for corporate groups of 5+', features: ['All Pro features', 'Group discount', 'Corporate events', 'Flexible timing'], popular: false },
];

router.get('/', (_req, res) => {
  res.json(plans);
});

router.post('/', (req, res) => {
  const { name, price, duration, durationDays, description, features } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Name and price required' });
  const newPlan = {
    id: String(plans.length + 1),
    name,
    price: Number(price),
    duration: duration || '1 Month',
    durationDays: durationDays || 30,
    description: description || '',
    features: features || [],
    popular: false,
  };
  plans.push(newPlan);
  res.status(201).json(newPlan);
});

router.put('/:id', (req, res) => {
  const idx = plans.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Plan not found' });
  plans[idx] = { ...plans[idx], ...req.body, id: plans[idx].id };
  res.json(plans[idx]);
});

router.delete('/:id', (req, res) => {
  const idx = plans.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Plan not found' });
  const removed = plans.splice(idx, 1)[0];
  res.json({ message: 'Plan deleted', plan: removed });
});

export default router;
