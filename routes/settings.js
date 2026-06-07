import { Router } from 'express';
import { supabaseAdmin } from '../db.js';

const router = Router();

function shapeSettings(s) {
  return {
    gymName: s.gym_name || 'Your Digital Lift',
    tagline: 'Transform Your Body, Transform Your Life',
    address: s.address || '',
    phone: s.phone || '',
    email: s.email || '',
    logo: s.logo_url || '',
    currency: s.currency || 'INR',
    timezone: s.timezone || 'Asia/Kolkata',
    notifications: {
      whatsapp: s.whatsapp_enabled || false,
      sms: s.sms_enabled || false,
      email: s.email_notifications ?? true,
      push: true,
    },
    payment: {
      razorpayKey: s.gateway_api_key || '',
      razorpaySecret: '',
      upiId: '',
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
}

router.get('/', async (_req, res) => {
  const { data, error } = await supabaseAdmin.from('gym_settings').select('*').limit(1).maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) {
    const { data: inserted } = await supabaseAdmin.from('gym_settings').insert({ gym_name: 'Your Digital Lift' }).select().single();
    return res.json(shapeSettings(inserted));
  }
  res.json(shapeSettings(data));
});

router.put('/', async (req, res) => {
  const { data: existing } = await supabaseAdmin.from('gym_settings').select('id').limit(1).maybeSingle();
  const updates = {};
  if (req.body.gymName) updates.gym_name = req.body.gymName;
  if (req.body.address) updates.address = req.body.address;
  if (req.body.phone) updates.phone = req.body.phone;
  if (req.body.email) updates.email = req.body.email;
  if (req.body.currency) updates.currency = req.body.currency;
  if (req.body.timezone) updates.timezone = req.body.timezone;
  if (req.body.notifications?.whatsapp !== undefined) updates.whatsapp_enabled = req.body.notifications.whatsapp;
  if (req.body.notifications?.sms !== undefined) updates.sms_enabled = req.body.notifications.sms;
  if (req.body.notifications?.email !== undefined) updates.email_notifications = req.body.notifications.email;
  if (req.body.payment?.razorpayKey) updates.gateway_api_key = req.body.payment.razorpayKey;
  if (req.body.logo) updates.logo_url = req.body.logo;
  if (existing) {
    const { data } = await supabaseAdmin.from('gym_settings').update(updates).eq('id', existing.id).select().single();
    return res.json(shapeSettings(data));
  }
  const { data } = await supabaseAdmin.from('gym_settings').insert({ gym_name: 'Your Digital Lift', ...updates }).select().single();
  res.json(shapeSettings(data));
});

export default router;
