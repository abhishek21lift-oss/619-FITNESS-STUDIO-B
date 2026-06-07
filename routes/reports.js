import { Router } from 'express';

const router = Router();

router.get('/overview', (_req, res) => {
  res.json({
    totalMembers: 12,
    activeMembers: 9,
    newMembersThisMonth: 3,
    totalRevenue: 72980,
    revenueThisMonth: 15992,
    pendingDues: 6998,
    attendanceToday: 8,
    totalStaff: 7,
    activeStaff: 6,
  });
});

router.get('/revenue', (req, res) => {
  const monthlyRevenue = [
    { month: 'Aug 2025', amount: 42000 },
    { month: 'Sep 2025', amount: 48000 },
    { month: 'Oct 2025', amount: 51000 },
    { month: 'Nov 2025', amount: 53500 },
    { month: 'Dec 2025', amount: 62000 },
    { month: 'Jan 2026', amount: 68000 },
  ];

  const revenueByPlan = [
    { plan: 'Monthly Basic', count: 3, revenue: 2997 },
    { plan: 'Monthly Premium', count: 3, revenue: 5997 },
    { plan: 'Quarterly Pro', count: 3, revenue: 14997 },
    { plan: 'Yearly Elite', count: 3, revenue: 44997 },
  ];

  res.json({ monthly: monthlyRevenue, byPlan: revenueByPlan, total: 72980 });
});

router.get('/membership', (_req, res) => {
  res.json({
    growth: [
      { month: 'Aug 2025', count: 6 },
      { month: 'Sep 2025', count: 7 },
      { month: 'Oct 2025', count: 8 },
      { month: 'Nov 2025', count: 9 },
      { month: 'Dec 2025', count: 10 },
      { month: 'Jan 2026', count: 12 },
    ],
    byPlan: [
      { plan: 'Monthly Basic', count: 3 },
      { plan: 'Monthly Premium', count: 3 },
      { plan: 'Quarterly Pro', count: 3 },
      { plan: 'Yearly Elite', count: 3 },
    ],
    byGender: [
      { gender: 'Male', count: 7 },
      { gender: 'Female', count: 5 },
    ],
  });
});

router.get('/attendance', (req, res) => {
  res.json({
    weekly: [
      { day: 'Mon', present: 7, absent: 3 },
      { day: 'Tue', present: 8, absent: 2 },
      { day: 'Wed', present: 6, absent: 4 },
      { day: 'Thu', present: 8, absent: 2 },
      { day: 'Fri', present: 9, absent: 1 },
      { day: 'Sat', present: 5, absent: 5 },
      { day: 'Sun', present: 3, absent: 2 },
    ],
    averageAttendance: '66%',
    peakHour: '7-8 AM',
  });
});

export default router;
