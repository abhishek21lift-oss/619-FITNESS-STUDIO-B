import { Router } from 'express';

const router = Router();

const staff = [
  { id: '1', name: 'Rajesh Kumar', role: 'Manager', email: 'rajesh@ydl.com', phone: '9988776655', status: 'Active', salary: 45000, joinDate: '2024-01-15', shift: 'Morning' },
  { id: '2', name: 'Suman Yadav', role: 'Trainer', email: 'suman@ydl.com', phone: '9988776656', status: 'Active', salary: 35000, joinDate: '2024-03-01', shift: 'Morning' },
  { id: '3', name: 'Mohit Singh', role: 'Trainer', email: 'mohit@ydl.com', phone: '9988776657', status: 'Active', salary: 32000, joinDate: '2024-06-10', shift: 'Evening' },
  { id: '4', name: 'Pooja Agarwal', role: 'Receptionist', email: 'pooja@ydl.com', phone: '9988776658', status: 'Active', salary: 22000, joinDate: '2024-02-20', shift: 'Morning' },
  { id: '5', name: 'Ankit Verma', role: 'Cleaner', email: 'ankit@ydl.com', phone: '9988776659', status: 'Active', salary: 15000, joinDate: '2024-04-05', shift: 'Evening' },
  { id: '6', name: 'Neelam Sharma', role: 'Dietitian', email: 'neelam@ydl.com', phone: '9988776660', status: 'Inactive', salary: 30000, joinDate: '2024-05-12', shift: 'Morning' },
  { id: '7', name: 'Vivek Patel', role: 'Trainer', email: 'vivek@ydl.com', phone: '9988776661', status: 'Active', salary: 35000, joinDate: '2024-08-01', shift: 'Evening' },
];

router.get('/', (_req, res) => {
  res.json(staff);
});

router.post('/', (req, res) => {
  const { name, role, email, phone, salary, shift } = req.body;
  if (!name || !role) return res.status(400).json({ error: 'Name and role required' });
  const newStaff = {
    id: String(staff.length + 1),
    name,
    role: role || 'Staff',
    email: email || '',
    phone: phone || '',
    status: 'Active',
    salary: salary || 0,
    joinDate: new Date().toISOString().split('T')[0],
    shift: shift || 'Morning',
  };
  staff.push(newStaff);
  res.status(201).json(newStaff);
});

router.put('/:id', (req, res) => {
  const idx = staff.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Staff not found' });
  staff[idx] = { ...staff[idx], ...req.body, id: staff[idx].id };
  res.json(staff[idx]);
});

router.delete('/:id', (req, res) => {
  const idx = staff.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Staff not found' });
  const removed = staff.splice(idx, 1)[0];
  res.json({ message: 'Staff removed', staff: removed });
});

export default router;
