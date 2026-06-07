import { Router } from 'express';

const router = Router();

let settings = {
  gymName: 'Your Digital Lift',
  tagline: 'Transform Your Body, Transform Your Life',
  address: '123, Fitness Street, Gomti Nagar, Lucknow - 226010',
  phone: '+91 9876543210',
  email: 'info@yourdigitallift.com',
  logo: '',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  notifications: {
    whatsapp: true,
    sms: false,
    email: true,
    push: true,
  },
  payment: {
    razorpayKey: '',
    razorpaySecret: '',
    upiId: 'yourdigitallift@upi',
    upiQr: '',
    cashEnabled: true,
    cardEnabled: true,
  },
  staffRoles: [
    { id: '1', name: 'Admin', permissions: ['all'] },
    { id: '2', name: 'Manager', permissions: ['members', 'billing', 'staff', 'reports'] },
    { id: '3', name: 'Trainer', permissions: ['members_read', 'attendance', 'classes'] },
    { id: '4', name: 'Receptionist', permissions: ['members_read', 'attendance', 'billing_read'] },
  ],
  businessHours: {
    monday: { open: '05:00', close: '22:00' },
    tuesday: { open: '05:00', close: '22:00' },
    wednesday: { open: '05:00', close: '22:00' },
    thursday: { open: '05:00', close: '22:00' },
    friday: { open: '05:00', close: '22:00' },
    saturday: { open: '06:00', close: '21:00' },
    sunday: { open: '08:00', close: '18:00' },
  },
};

router.get('/', (_req, res) => {
  res.json(settings);
});

router.put('/', (req, res) => {
  settings = { ...settings, ...req.body };
  res.json(settings);
});

export default router;
