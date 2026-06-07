import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/auth.js';
import memberRoutes from './routes/members.js';
import billingRoutes from './routes/billing.js';
import attendanceRoutes from './routes/attendance.js';
import staffRoutes from './routes/staff.js';
import reportRoutes from './routes/reports.js';
import classRoutes from './routes/classes.js';
import leadRoutes from './routes/leads.js';
import planRoutes from './routes/plans.js';
import settingRoutes from './routes/settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: [process.env.CLIENT_URL, 'https://yourdigitallift.vercel.app', 'http://localhost:5173'].filter(Boolean), credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(limiter);

app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/settings', settingRoutes);

const clientDist = path.resolve(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`YDL Server running on port ${PORT}`);
});

export default app;
