import { Router } from 'express';

const router = Router();

const classes = [
  { id: '1', name: 'Morning Yoga', trainer: 'Suman Yadav', time: '06:00 AM', duration: 60, days: ['Mon', 'Wed', 'Fri'], capacity: 20, enrolled: 15, category: 'Yoga', description: 'Start your day with refreshing yoga' },
  { id: '2', name: 'HIIT Blast', trainer: 'Mohit Singh', time: '07:00 AM', duration: 45, days: ['Mon', 'Tue', 'Thu', 'Sat'], capacity: 25, enrolled: 22, category: 'Cardio', description: 'High intensity interval training' },
  { id: '3', name: 'Power Lifting', trainer: 'Vivek Patel', time: '08:00 AM', duration: 60, days: ['Mon', 'Wed', 'Fri'], capacity: 15, enrolled: 12, category: 'Strength', description: 'Advanced powerlifting techniques' },
  { id: '4', name: 'Zumba Dance', trainer: 'Suman Yadav', time: '07:00 PM', duration: 45, days: ['Tue', 'Thu', 'Sat'], capacity: 30, enrolled: 28, category: 'Dance', description: 'Fun cardio dance workout' },
  { id: '5', name: 'Boxing Fitness', trainer: 'Mohit Singh', time: '06:00 PM', duration: 60, days: ['Mon', 'Wed', 'Fri'], capacity: 20, enrolled: 18, category: 'Boxing', description: 'Boxing and conditioning' },
  { id: '6', name: 'Pilates Core', trainer: 'Vivek Patel', time: '09:00 AM', duration: 50, days: ['Tue', 'Thu', 'Sat'], capacity: 18, enrolled: 14, category: 'Pilates', description: 'Core strength and flexibility' },
  { id: '7', name: 'Evening Meditation', trainer: 'Suman Yadav', time: '08:00 PM', duration: 30, days: ['Mon', 'Wed', 'Fri', 'Sun'], capacity: 25, enrolled: 20, category: 'Wellness', description: 'Guided meditation and breathing' },
];

router.get('/', (_req, res) => {
  res.json(classes);
});

router.post('/', (req, res) => {
  const { name, trainer, time, duration, days, capacity, category, description } = req.body;
  if (!name || !trainer) return res.status(400).json({ error: 'Name and trainer required' });
  const newClass = {
    id: String(classes.length + 1),
    name,
    trainer,
    time: time || '08:00 AM',
    duration: duration || 60,
    days: days || ['Mon'],
    capacity: capacity || 20,
    enrolled: 0,
    category: category || 'General',
    description: description || '',
  };
  classes.push(newClass);
  res.status(201).json(newClass);
});

router.put('/:id', (req, res) => {
  const idx = classes.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Class not found' });
  classes[idx] = { ...classes[idx], ...req.body, id: classes[idx].id };
  res.json(classes[idx]);
});

router.delete('/:id', (req, res) => {
  const idx = classes.findIndex(c => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Class not found' });
  const removed = classes.splice(idx, 1)[0];
  res.json({ message: 'Class deleted', class: removed });
});

export default router;
