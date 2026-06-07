import { Router } from 'express';
import { supabaseAdmin } from '../db.js';

const router = Router();

const TX_SELECT = `
  id, amount, payment_date, payment_method, transaction_id, status, invoice_no, created_at,
  member:member_id ( id, member_code, profile_id ),
  subscription:subscription_id ( id, plan_id, amount_paid, payment_status,
    plan:plan_id ( name )
  )
`;

function shapeTx(t) {
  return {
    id: t.id,
    memberId: t.member?.id || '',
    memberName: '', // populated below
    plan: t.subscription?.plan?.name || 'Custom',
    amount: Number(t.amount),
    status: t.status === 'completed' ? 'Paid' : t.status === 'pending' ? 'Pending' : 'Overdue',
    date: t.payment_date?.split('T')[0] || '',
    method: t.payment_method || '',
    invoice: t.invoice_no || '',
  };
}

router.get('/', async (_req, res) => {
  const { data, error } = await supabaseAdmin.from('payments').select(TX_SELECT).order('payment_date', { ascending: false }).limit(50);
  if (error) return res.status(500).json({ error: error.message });
  const enriched = await Promise.all(data.map(async (t) => {
    const tx = shapeTx(t);
    if (t.member?.profile_id) {
      const { data: p } = await supabaseAdmin.from('profiles').select('full_name').eq('id', t.member.profile_id).single();
      if (p) tx.memberName = p.full_name;
    }
    return tx;
  }));
  res.json(enriched);
});

router.get('/stats', async (_req, res) => {
  const { data: allPayments } = await supabaseAdmin.from('payments').select('amount, status, payment_date');
  if (!allPayments) return res.json({ totalRevenue: 0, pendingAmount: 0, collectedThisMonth: 0, overdueAmount: 0, totalTransactions: 0 });
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  let totalRevenue = 0, pendingAmount = 0, collectedThisMonth = 0, overdueAmount = 0;
  for (const p of allPayments) {
    const amt = Number(p.amount);
    if (p.status === 'completed') {
      totalRevenue += amt;
      if (p.payment_date >= monthStart) collectedThisMonth += amt;
    } else if (p.status === 'pending') {
      pendingAmount += amt;
    } else if (p.status === 'overdue') {
      overdueAmount += amt;
    }
  }
  res.json({ totalRevenue, pendingAmount, collectedThisMonth, overdueAmount, totalTransactions: allPayments.length });
});

router.post('/', async (req, res) => {
  const { memberId, memberName, plan, amount, method } = req.body;
  if (!memberId || !amount) return res.status(400).json({ error: 'Member and amount required' });
  const { data, error } = await supabaseAdmin.from('payments').insert({
    member_id: memberId, amount, payment_method: method || 'Cash',
    status: 'completed', invoice_no: `INV-${Date.now().toString(36).toUpperCase()}`,
  }).select().single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({
    id: data.id, memberId, memberName: memberName || '', plan: plan || 'Custom',
    amount: Number(data.amount), status: 'Paid', date: data.payment_date?.split('T')[0] || '',
    method: data.payment_method || '', invoice: data.invoice_no || '',
  });
});

router.put('/:id', async (req, res) => {
  const { data, error } = await supabaseAdmin.from('payments').update(req.body).eq('id', req.params.id).select().single();
  if (error) return res.status(404).json({ error: 'Transaction not found' });
  res.json(data);
});

export default router;
