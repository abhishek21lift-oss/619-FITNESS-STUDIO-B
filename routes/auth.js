import { Router } from 'express';

const router = Router();

const users = [
  { id: '1', email: 'admin@ydl.com', password: 'admin123', name: 'Admin', role: 'admin' },
  { id: '2', email: 'staff@ydl.com', password: 'staff123', name: 'Staff User', role: 'staff' },
];

function createToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    iat: Date.now(),
    exp: Date.now() + 24 * 60 * 60 * 1000,
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = createToken(user);
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

router.post('/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email, and password required' });
  }
  if (users.find((u) => u.email === email)) {
    return res.status(409).json({ error: 'User already exists' });
  }
  const newUser = {
    id: String(users.length + 1),
    email,
    password,
    name,
    role: 'staff',
  };
  users.push(newUser);
  const token = createToken(newUser);
  res.status(201).json({ token, user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role } });
});

router.post('/logout', (_req, res) => {
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token' });
  }
  try {
    const payload = JSON.parse(Buffer.from(header.split(' ')[1], 'base64').toString('utf-8'));
    const user = users.find((u) => u.id === payload.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
