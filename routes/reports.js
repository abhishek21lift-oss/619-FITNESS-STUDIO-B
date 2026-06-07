import { Router } from 'express';
import { supabaseAdmin } from '../db.js';

const router = Router();

router.get('/overview', async (_req, res) => {
  const { data: stats, error } = await supabaseAdmin.rpc('get_dashboard_stats');
  if (error || !stats) {
    const { count: totalMembers } = await supabaseAdmin.from('members').select('*', { count: 'exact', head: true });
    const { count: activeMembers } = await supabaseAdmin.from('members').select('*', { count: 'exact', head: true }).eq('status', 'active');
    const { count: totalStaff } = await supabaseAdmin.from('staff').select('*', { count: 'exact', head: true });
    const { count: activeStaff } = await supabaseAdmin.from('staff').select('*', { count: 'exact', head: true }).eq('status', 'active');
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { data: monthPayments } = await supabaseAdmin.from('payments').select('amount').gte('payment_date', monthStart).eq('status', 'completed');
    const revenueThisMonth = (monthPayments || []).reduce((s, p) => s + Number(p.amount), 0);
    return res.json({
      totalMembers: totalMembers || 0, activeMembers: activeMembers || 0, newMembersThisMonth: 0,
      totalRevenue: 0, revenueThisMonth, pendingDues: 0, attendanceToday: 0,
      totalStaff: totalStaff || 0, activeStaff: activeStaff || 0,
    });
  }
  res.json({
    totalMembers: Number(stats.total_members),
    activeMembers: Number(stats.active_members),
    newMembersThisMonth: 0,
    totalRevenue: 0,
    revenueThisMonth: Number(stats.revenue_this_month),
    pendingDues: Number(stats.pending_dues),
    attendanceToday: 0,
    totalStaff: 0, activeStaff: 0,
  });
});

router.get('/revenue', async (_req, res) => {
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString();
  const { data: payments } = await supabaseAdmin.from('payments')
    .select('amount, payment_date').gte('payment_date', sixMonthsAgo).eq('status', 'completed');
  const monthlyMap = {};
  for (const p of payments || []) {
    const d = new Date(p.payment_date);
    const key = `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
    monthlyMap[key] = (monthlyMap[key] || 0) + Number(p.amount);
  }
  const monthly = Object.entries(monthlyMap).map(([month, amount]) => ({ month, amount }));
  const { data: byPlan } = await supabaseAdmin.from('member_subscriptions')
    .select('plan:plan_id ( name ), amount_paid');
  const planMap = {};
  for (const s of byPlan || []) {
    const pn = s.plan?.name || 'Unknown';
    planMap[pn] = planMap[pn] || { plan: pn, count: 0, revenue: 0 };
    planMap[pn].count++;
    planMap[pn].revenue += Number(s.amount_paid);
  }
  const total = (payments || []).reduce((s, p) => s + Number(p.amount), 0);
  res.json({ monthly, byPlan: Object.values(planMap), total });
});

router.get('/membership', async (_req, res) => {
  const { data: members } = await supabaseAdmin.from('members').select('status, gender, created_at, subscriptions:member_subscriptions(plan:plan_id(name))');
  const growthMap = {};
  let byPlanMap = {};
  const genderCount = { Male: 0, Female: 0 };
  for (const m of members || []) {
    const d = new Date(m.created_at);
    const key = `${d.toLocaleString('default', { month: 'short' })} ${d.getFullYear()}`;
    growthMap[key] = (growthMap[key] || 0) + 1;
    const planName = m.subscriptions?.[0]?.plan?.name || 'No Plan';
    byPlanMap[planName] = byPlanMap[planName] || { plan: planName, count: 0 };
    byPlanMap[planName].count++;
    if (m.gender === 'Male' || m.gender === 'Female') genderCount[m.gender]++;
  }
  const keys = Object.keys(growthMap).sort((a, b) => {
    const da = new Date(a), db = new Date(b);
    return da - db;
  });
  let cumulative = 0;
  const growth = keys.map(k => { cumulative += growthMap[k]; return { month: k, count: cumulative }; });
  res.json({ growth, byPlan: Object.values(byPlanMap), byGender: Object.entries(genderCount).map(([gender, count]) => ({ gender, count })) });
});

router.get('/attendance', async (_req, res) => {
  const { data: weekData } = await supabaseAdmin.from('attendance')
    .select('check_in').gte('check_in', new Date(Date.now() - 7 * 86400000).toISOString());
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekly = days.map(day => ({ day, present: 0, absent: 0 }));
  for (const a of weekData || []) {
    const d = new Date(a.check_in);
    const idx = d.getDay();
    if (idx >= 0 && idx < 7) weekly[idx].present++;
  }
  res.json({ weekly, averageAttendance: '0%', peakHour: '7-8 AM' });
});

export default router;
