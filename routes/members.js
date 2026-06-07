import { Router } from 'express';

const router = Router();

const members = [
  { id: '1', name: 'Arjun Singh', phone: '9876543210', email: 'arjun@email.com', gender: 'Male', age: 28, plan: 'Monthly Premium', planId: '1', status: 'Active', joinDate: '2025-12-01', endDate: '2026-01-01', fee: 1999, address: '12, MG Road, Lucknow', emergency: '9912345678', photo: '' },
  { id: '2', name: 'Priya Sharma', phone: '9876543211', email: 'priya@email.com', gender: 'Female', age: 24, plan: 'Quarterly Pro', planId: '2', status: 'Active', joinDate: '2025-10-15', endDate: '2026-01-15', fee: 4999, address: '45, Hazratganj, Lucknow', emergency: '9912345679', photo: '' },
  { id: '3', name: 'Rahul Verma', phone: '9876543212', email: 'rahul@email.com', gender: 'Male', age: 32, plan: 'Yearly Elite', planId: '3', status: 'Active', joinDate: '2025-06-01', endDate: '2026-06-01', fee: 14999, address: '78, Gomti Nagar, Lucknow', emergency: '9912345680', photo: '' },
  { id: '4', name: 'Neha Kapoor', phone: '9876543213', email: 'neha@email.com', gender: 'Female', age: 26, plan: 'Monthly Premium', planId: '1', status: 'Inactive', joinDate: '2025-08-20', endDate: '2025-09-20', fee: 1999, address: '34, Aliganj, Lucknow', emergency: '9912345681', photo: '' },
  { id: '5', name: 'Vikram Yadav', phone: '9876543214', email: 'vikram@email.com', gender: 'Male', age: 35, plan: 'Quarterly Pro', planId: '2', status: 'Active', joinDate: '2025-11-10', endDate: '2026-02-10', fee: 4999, address: '56, Indira Nagar, Lucknow', emergency: '9912345682', photo: '' },
  { id: '6', name: 'Sneha Patel', phone: '9876543215', email: 'sneha@email.com', gender: 'Female', age: 22, plan: 'Monthly Basic', planId: '4', status: 'Active', joinDate: '2026-01-05', endDate: '2026-02-05', fee: 999, address: '89, Faizabad Road, Lucknow', emergency: '9912345683', photo: '' },
  { id: '7', name: 'Amit Gupta', phone: '9876543216', email: 'amit@email.com', gender: 'Male', age: 30, plan: 'Yearly Elite', planId: '3', status: 'Active', joinDate: '2025-03-01', endDate: '2026-03-01', fee: 14999, address: '21, Jankipuram, Lucknow', emergency: '9912345684', photo: '' },
  { id: '8', name: 'Kavita Joshi', phone: '9876543217', email: 'kavita@email.com', gender: 'Female', age: 27, plan: 'Monthly Premium', planId: '1', status: 'Pending', joinDate: '2026-01-20', endDate: '2026-02-20', fee: 1999, address: '67, Mahanagar, Lucknow', emergency: '9912345685', photo: '' },
  { id: '9', name: 'Deepak Mishra', phone: '9876543218', email: 'deepak@email.com', gender: 'Male', age: 29, plan: 'Quarterly Pro', planId: '2', status: 'Active', joinDate: '2025-09-05', endDate: '2025-12-05', fee: 4999, address: '90, Vikas Nagar, Lucknow', emergency: '9912345686', photo: '' },
  { id: '10', name: 'Anjali Tiwari', phone: '9876543219', email: 'anjali@email.com', gender: 'Female', age: 25, plan: 'Monthly Basic', planId: '4', status: 'Inactive', joinDate: '2025-07-12', endDate: '2025-08-12', fee: 999, address: '43, Rajajipuram, Lucknow', emergency: '9912345687', photo: '' },
  { id: '11', name: 'Rohit Pandey', phone: '9876543220', email: 'rohit@email.com', gender: 'Male', age: 31, plan: 'Yearly Elite', planId: '3', status: 'Active', joinDate: '2025-01-15', endDate: '2026-01-15', fee: 14999, address: '15, Alambagh, Lucknow', emergency: '9912345688', photo: '' },
  { id: '12', name: 'Pooja Chauhan', phone: '9876543221', email: 'pooja@email.com', gender: 'Female', age: 23, plan: 'Monthly Basic', planId: '4', status: 'Active', joinDate: '2026-02-01', endDate: '2026-03-01', fee: 999, address: '72, Sarojini Nagar, Lucknow', emergency: '9912345689', photo: '' },
];

router.get('/', (_req, res) => {
  res.json(members);
});

router.get('/:id', (req, res) => {
  const member = members.find((m) => m.id === req.params.id);
  if (!member) return res.status(404).json({ error: 'Member not found' });
  res.json(member);
});

router.post('/', (req, res) => {
  const { name, phone, email, gender, age, plan, fee, address, emergency } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }
  const newMember = {
    id: String(members.length + 1),
    name,
    phone,
    email: email || '',
    gender: gender || 'Male',
    age: age || 25,
    plan: plan || 'Monthly Basic',
    planId: '4',
    status: 'Active',
    joinDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    fee: fee || 999,
    address: address || '',
    emergency: emergency || '',
    photo: '',
  };
  members.push(newMember);
  res.status(201).json(newMember);
});

router.put('/:id', (req, res) => {
  const idx = members.findIndex((m) => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Member not found' });
  members[idx] = { ...members[idx], ...req.body, id: members[idx].id };
  res.json(members[idx]);
});

router.delete('/:id', (req, res) => {
  const idx = members.findIndex((m) => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Member not found' });
  const removed = members.splice(idx, 1)[0];
  res.json({ message: 'Member deleted', member: removed });
});

export default router;
