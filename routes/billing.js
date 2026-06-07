import { Router } from 'express';

const router = Router();

const transactions = [
  { id: '1', memberId: '1', memberName: 'Arjun Singh', plan: 'Monthly Premium', amount: 1999, status: 'Paid', date: '2026-01-01', method: 'UPI', invoice: 'INV-2026-001' },
  { id: '2', memberId: '2', memberName: 'Priya Sharma', plan: 'Quarterly Pro', amount: 4999, status: 'Paid', date: '2026-01-05', method: 'Cash', invoice: 'INV-2026-002' },
  { id: '3', memberId: '3', memberName: 'Rahul Verma', plan: 'Yearly Elite', amount: 14999, status: 'Paid', date: '2025-12-01', method: 'Card', invoice: 'INV-2025-003' },
  { id: '4', memberId: '5', memberName: 'Vikram Yadav', plan: 'Quarterly Pro', amount: 4999, status: 'Pending', date: '2026-01-10', method: '', invoice: '' },
  { id: '5', memberId: '6', memberName: 'Sneha Patel', plan: 'Monthly Basic', amount: 999, status: 'Paid', date: '2026-01-05', method: 'UPI', invoice: 'INV-2026-004' },
  { id: '6', memberId: '7', memberName: 'Amit Gupta', plan: 'Yearly Elite', amount: 14999, status: 'Paid', date: '2025-11-15', method: 'Bank Transfer', invoice: 'INV-2025-005' },
  { id: '7', memberId: '9', memberName: 'Deepak Mishra', plan: 'Quarterly Pro', amount: 4999, status: 'Overdue', date: '2025-12-05', method: '', invoice: '' },
  { id: '8', memberId: '11', memberName: 'Rohit Pandey', plan: 'Yearly Elite', amount: 14999, status: 'Paid', date: '2025-10-20', method: 'UPI', invoice: 'INV-2025-006' },
  { id: '9', memberId: '8', memberName: 'Kavita Joshi', plan: 'Monthly Premium', amount: 1999, status: 'Pending', date: '2026-01-20', method: '', invoice: '' },
  { id: '10', memberId: '12', memberName: 'Pooja Chauhan', plan: 'Monthly Basic', amount: 999, status: 'Paid', date: '2026-02-01', method: 'Cash', invoice: 'INV-2026-007' },
];

const plans = [
  { id: '1', name: 'Monthly Premium', price: 1999 },
  { id: '2', name: 'Quarterly Pro', price: 4999 },
  { id: '3', name: 'Yearly Elite', price: 14999 },
  { id: '4', name: 'Monthly Basic', price: 999 },
];

router.get('/', (_req, res) => {
  res.json(transactions);
});

router.get('/stats', (_req, res) => {
  const totalRevenue = transactions.filter(t => t.status === 'Paid').reduce((s, t) => s + t.amount, 0);
  const pendingAmount = transactions.filter(t => t.status === 'Pending' || t.status === 'Overdue').reduce((s, t) => s + t.amount, 0);
  const thisMonth = transactions.filter(t => t.date.startsWith('2026-01') && t.status === 'Paid').reduce((s, t) => s + t.amount, 0);
  const overdueAmount = transactions.filter(t => t.status === 'Overdue').reduce((s, t) => s + t.amount, 0);
  res.json({ totalRevenue, pendingAmount, collectedThisMonth: thisMonth, overdueAmount, totalTransactions: transactions.length });
});

router.post('/', (req, res) => {
  const { memberId, memberName, plan, amount, method } = req.body;
  if (!memberId || !amount) {
    return res.status(400).json({ error: 'Member and amount required' });
  }
  const newTx = {
    id: String(transactions.length + 1),
    memberId,
    memberName: memberName || 'Unknown',
    plan: plan || 'Custom',
    amount,
    status: 'Paid',
    date: new Date().toISOString().split('T')[0],
    method: method || 'Cash',
    invoice: `INV-2026-${String(transactions.length + 1).padStart(3, '0')}`,
  };
  transactions.push(newTx);
  res.status(201).json(newTx);
});

router.put('/:id', (req, res) => {
  const idx = transactions.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Transaction not found' });
  transactions[idx] = { ...transactions[idx], ...req.body, id: transactions[idx].id };
  res.json(transactions[idx]);
});

export default router;
