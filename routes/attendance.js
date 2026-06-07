import { Router } from 'express';

const router = Router();

const attendanceLog = [
  { id: '1', memberId: '1', memberName: 'Arjun Singh', checkIn: '2026-01-15T06:30:00', date: '2026-01-15', status: 'Present' },
  { id: '2', memberId: '2', memberName: 'Priya Sharma', checkIn: '2026-01-15T07:00:00', date: '2026-01-15', status: 'Present' },
  { id: '3', memberId: '3', memberName: 'Rahul Verma', checkIn: '2026-01-15T08:15:00', date: '2026-01-15', status: 'Present' },
  { id: '4', memberId: '5', memberName: 'Vikram Yadav', checkIn: '2026-01-15T06:45:00', date: '2026-01-15', status: 'Present' },
  { id: '5', memberId: '7', memberName: 'Amit Gupta', checkIn: '2026-01-15T07:30:00', date: '2026-01-15', status: 'Present' },
  { id: '6', memberId: '11', memberName: 'Rohit Pandey', checkIn: '2026-01-15T09:00:00', date: '2026-01-15', status: 'Present' },
  { id: '7', memberId: '6', memberName: 'Sneha Patel', checkIn: '2026-01-15T10:15:00', date: '2026-01-15', status: 'Present' },
  { id: '8', memberId: '4', memberName: 'Neha Kapoor', checkIn: '', date: '2026-01-15', status: 'Absent' },
  { id: '9', memberId: '8', memberName: 'Kavita Joshi', checkIn: '', date: '2026-01-15', status: 'Absent' },
  { id: '10', memberId: '12', memberName: 'Pooja Chauhan', checkIn: '2026-01-15T16:00:00', date: '2026-01-15', status: 'Present' },
  { id: '11', memberId: '1', memberName: 'Arjun Singh', checkIn: '2026-01-14T06:35:00', date: '2026-01-14', status: 'Present' },
  { id: '12', memberId: '2', memberName: 'Priya Sharma', checkIn: '2026-01-14T07:05:00', date: '2026-01-14', status: 'Present' },
  { id: '13', memberId: '3', memberName: 'Rahul Verma', checkIn: '2026-01-14T08:20:00', date: '2026-01-14', status: 'Present' },
  { id: '14', memberId: '5', memberName: 'Vikram Yadav', checkIn: '', date: '2026-01-14', status: 'Absent' },
  { id: '15', memberId: '7', memberName: 'Amit Gupta', checkIn: '2026-01-14T07:25:00', date: '2026-01-14', status: 'Present' },
];

router.get('/', (req, res) => {
  const { date, memberId } = req.query;
  let result = [...attendanceLog];
  if (date) result = result.filter(a => a.date === date);
  if (memberId) result = result.filter(a => a.memberId === memberId);
  res.json(result);
});

router.get('/today', (_req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const todayLog = attendanceLog.filter(a => a.date === today);
  const present = todayLog.filter(a => a.status === 'Present').length;
  const absent = todayLog.filter(a => a.status === 'Absent').length;
  const total = todayLog.length;
  res.json({ date: today, total, present, absent, records: todayLog.length > 0 ? todayLog : attendanceLog.filter(a => a.date === '2026-01-15') });
});

router.post('/', (req, res) => {
  const { memberId, memberName } = req.body;
  if (!memberId) return res.status(400).json({ error: 'Member ID required' });
  const today = new Date().toISOString().split('T')[0];
  const existing = attendanceLog.find(a => a.memberId === memberId && a.date === today);
  if (existing) {
    return res.status(409).json({ error: 'Already checked in today', record: existing });
  }
  const now = new Date().toISOString();
  const newRecord = {
    id: String(attendanceLog.length + 1),
    memberId,
    memberName: memberName || 'Unknown',
    checkIn: now,
    date: today,
    status: 'Present',
  };
  attendanceLog.push(newRecord);
  res.status(201).json(newRecord);
});

export default router;
