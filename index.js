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
import followupRoutes from './routes/followups.js';
import announcementRoutes from './routes/announcements.js';
import batchRoutes from './routes/batches.js';
import storeRoutes from './routes/store.js';
import checkinRoutes from './routes/checkin.js';

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
app.use(cors({ origin: true, credentials: true }));
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
app.use('/api/followups', followupRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/batches', batchRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/checkin', checkinRoutes);

const clientDist = path.resolve(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

import { runMigrations } from './migrate.js';

app.listen(PORT, async () => {
  console.log(`YDL Server running on port ${PORT}`);
  await runMigrations();
});

export default app;
