import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import jwt from 'jsonwebtoken'
import { supabase } from './supabase.js'
import { authenticate } from './middleware/auth.js'
import { runMigrations } from './migrate.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 10000

// Health check (before rate limiter — Render's health checker must not be blocked)
app.get('/', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/',
})

app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({ origin: true, credentials: true }))
app.use(express.json({ limit: '10mb' }))
app.use(limiter)

// ──────────────────────────────────────────────
// AUTH ROUTES
// ──────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' })

    let query = supabase.from('profiles').select('*')
    if (username.includes('@')) query = query.eq('email', username)
    else query = query.or(`phone.eq.${username},email.eq.${username}`)

    const { data: users, error: fetchError } = await query
    if (fetchError || !users || users.length === 0) return res.status(401).json({ error: 'Invalid credentials' })

    const user = users[0]

    // Check credentials: profiles.password first, then _credentials table fallback
    let valid = false
    if (user.password && user.password === password) {
      valid = true
    } else {
      const { data: cred } = await supabase.from('_credentials').select('*').eq('profile_id', user.id).eq('password', password).maybeSingle()
      if (cred) valid = true
    }

    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.full_name || user.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({ token, user: { id: user.id, email: user.email, name: user.full_name || user.name, mobile: user.phone, branch: user.branch || 'Lucknow', role: user.role } })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/auth/logout', authenticate, (req, res) => {
  res.json({ message: 'Logged out successfully' })
})

// ──────────────────────────────────────────────
// ENQUIRY ROUTES
// ──────────────────────────────────────────────
app.get('/api/enquiries', authenticate, async (req, res) => {
  try {
    let query = supabase.from('enquiries').select('*').eq('deleted', false)
    const { status, source, dateFrom, dateTo, rep, search } = req.query
    if (status) query = query.eq('status', status)
    if (source) query = query.eq('source', source)
    if (rep) query = query.eq('rep', rep)
    if (dateFrom) query = query.gte('created_at', dateFrom)
    if (dateTo) query = query.lte('created_at', dateTo)
    if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
    query = query.order('created_at', { ascending: false })

    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    res.json({ enquiries: data })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/enquiries', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('enquiries').insert(req.body).select().single()
    if (error) return res.status(500).json({ error: error.message })
    res.status(201).json(data)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/enquiries/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('enquiries').select('*').eq('id', req.params.id).single()
    if (error) return res.status(404).json({ error: 'Not found' })
    res.json(data)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/enquiries/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('enquiries').update(req.body).eq('id', req.params.id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/enquiries/:id', authenticate, async (req, res) => {
  try {
    const { error } = await supabase.from('enquiries').update({ deleted: true }).eq('id', req.params.id)
    if (error) return res.status(500).json({ error: error.message })
    res.json({ message: 'Deleted' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/enquiries/bulk-delete', authenticate, async (req, res) => {
  try {
    const { ids } = req.body
    const { error } = await supabase.from('enquiries').update({ deleted: true }).in('id', ids)
    if (error) return res.status(500).json({ error: error.message })
    res.json({ message: `${ids.length} enquiries deleted` })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/enquiries/tap', authenticate, async (req, res) => {
  try {
    const { id } = req.body
    const { data, error } = await supabase.from('enquiries').update({ tapped: true, tapped_at: new Date() }).eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ──────────────────────────────────────────────
// FOLLOW UP ROUTES
// ──────────────────────────────────────────────
app.get('/api/followups', authenticate, async (req, res) => {
  try {
    let query = supabase.from('followups').select('*, enquiries(name,phone), members(name,phone)')
    const { status, assigned_to, dateFrom, dateTo } = req.query
    if (status) query = query.eq('status', status)
    if (assigned_to) query = query.eq('assigned_to', assigned_to)
    if (dateFrom) query = query.gte('followup_date', dateFrom)
    if (dateTo) query = query.lte('followup_date', dateTo)
    query = query.order('followup_date', { ascending: true })

    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/followups', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('followups').insert(req.body).select().single()
    if (error) return res.status(500).json({ error: error.message })
    res.status(201).json(data)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/followups/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('followups').update(req.body).eq('id', req.params.id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/followups/:id', authenticate, async (req, res) => {
  try {
    const { error } = await supabase.from('followups').delete().eq('id', req.params.id)
    if (error) return res.status(500).json({ error: error.message })
    res.json({ message: 'Deleted' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/followups/bulk-transfer', authenticate, async (req, res) => {
  try {
    const { ids, assigned_to } = req.body
    const { error } = await supabase.from('followups').update({ assigned_to }).in('id', ids)
    if (error) return res.status(500).json({ error: error.message })
    res.json({ message: `Transferred ${ids.length} follow-ups` })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/followups/mark-done', authenticate, async (req, res) => {
  try {
    const { ids } = req.body
    const { error } = await supabase.from('followups').update({ done: true, status: 'completed' }).in('id', ids)
    if (error) return res.status(500).json({ error: error.message })
    res.json({ message: `${ids.length} marked done` })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ──────────────────────────────────────────────
// MEMBER ROUTES
// ──────────────────────────────────────────────
app.get('/api/members', authenticate, async (req, res) => {
  try {
    let query = supabase.from('members').select('*')
    const { status, branch, gender, plan, search } = req.query
    if (status) query = query.eq('status', status)
    if (branch) query = query.eq('branch', branch)
    if (gender) query = query.eq('gender', gender)
    if (plan) query = query.eq('plan_id', plan)
    if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
    query = query.order('created_at', { ascending: false })

    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    res.json({ members: data })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/members', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('members').insert(req.body).select().single()
    if (error) return res.status(500).json({ error: error.message })
    res.status(201).json(data)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/members/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('members').select('*').eq('id', req.params.id).single()
    if (error) return res.status(404).json({ error: 'Not found' })
    res.json(data)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/members/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('members').update(req.body).eq('id', req.params.id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/members/:id', authenticate, async (req, res) => {
  try {
    const { error } = await supabase.from('members').update({ status: 'inactive' }).eq('id', req.params.id)
    if (error) return res.status(500).json({ error: error.message })
    res.json({ message: 'Member deactivated' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/members/birthdays', authenticate, async (req, res) => {
  try {
    const today = new Date()
    const month = today.getMonth() + 1
    const day = today.getDate()
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .filter('dob', 'not.eq', null)
    if (error) return res.status(500).json({ error: error.message })

    const birthdays = data.filter(m => {
      if (!m.dob) return false
      const d = new Date(m.dob)
      return d.getMonth() + 1 === month && d.getDate() === day
    })
    res.json(birthdays)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/members/referrals', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('members').select('*').not('referred_by', 'is', null)
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ──────────────────────────────────────────────
// ANALYSIS ROUTES
// ──────────────────────────────────────────────
app.get('/api/analysis/traffic', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('attendance').select('*')
    if (error) return res.status(500).json({ error: error.message })
    const today = data.filter(a => new Date(a.date).toDateString() === new Date().toDateString())
    res.json({ total: data.length, today: today.length, records: data })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/analysis/members', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('members').select('*')
    if (error) return res.status(500).json({ error: error.message })
    const active = data.filter(m => m.status === 'active')
    const inactive = data.filter(m => m.status === 'inactive')
    res.json({ total: data.length, active: active.length, inactive: inactive.length, records: data })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/analysis/collection', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('accounts_entries').select('*')
    if (error) return res.status(500).json({ error: error.message })
    const total = data.reduce((sum, e) => sum + Number(e.amount), 0)
    res.json({ total, count: data.length, records: data })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/analysis/subscriptions', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('subscriptions').select('*, members(name), membership_plans(name)')
    if (error) return res.status(500).json({ error: error.message })
    const breakdown = {}
    data.forEach(s => {
      const name = s.membership_plans?.name || 'Unknown'
      breakdown[name] = (breakdown[name] || 0) + 1
    })
    res.json({ total: data.length, breakdown, records: data })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/analysis/renewal', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('members').select('*').eq('status', 'active')
    if (error) return res.status(500).json({ error: error.message })
    const expiringSoon = data.filter(m => {
      if (!m.expiry_date) return false
      const daysLeft = (new Date(m.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)
      return daysLeft <= 30 && daysLeft > 0
    })
    const expired = data.filter(m => m.expiry_date && new Date(m.expiry_date) < new Date())
    res.json({ total: data.length, expiringSoon: expiringSoon.length, expired: expired.length, records: data })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/analysis/followup', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('followups').select('*')
    if (error) return res.status(500).json({ error: error.message })
    const pending = data.filter(f => f.status === 'pending')
    const done = data.filter(f => f.done)
    res.json({ total: data.length, pending: pending.length, completed: done.length, records: data })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/analysis/conversion', authenticate, async (req, res) => {
  try {
    const { data: enquiries } = await supabase.from('enquiries').select('*').eq('deleted', false)
    const { data: members } = await supabase.from('members').select('*')
    const converted = enquiries.filter(e => members.some(m => m.phone === e.phone))
    const rate = enquiries.length > 0 ? ((converted.length / enquiries.length) * 100).toFixed(1) : 0
    res.json({ total_enquiries: enquiries.length, converted: converted.length, rate: `${rate}%` })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/analysis/enquiry', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('enquiries').select('*').eq('deleted', false)
    if (error) return res.status(500).json({ error: error.message })
    const funnel = { new: 0, contacted: 0, visited: 0, converted: 0, lost: 0 }
    data.forEach(e => { if (funnel[e.status] !== undefined) funnel[e.status]++ })
    res.json({ total: data.length, funnel, records: data })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/analysis/expense', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('expenses').select('*')
    if (error) return res.status(500).json({ error: error.message })
    const breakdown = {}
    data.forEach(e => {
      breakdown[e.category] = (breakdown[e.category] || 0) + Number(e.amount)
    })
    const total = data.reduce((s, e) => s + Number(e.amount), 0)
    res.json({ total, breakdown, records: data })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/analysis/profit-loss', authenticate, async (req, res) => {
  try {
    const { data: income } = await supabase.from('accounts_entries').select('*')
    const { data: expenses } = await supabase.from('expenses').select('*')
    const totalIncome = income.reduce((s, e) => s + Number(e.amount), 0)
    const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0)
    res.json({ income: totalIncome, expenses: totalExpenses, profit: totalIncome - totalExpenses })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/analysis/billing', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('accounts_entries').select('*')
    if (error) return res.status(500).json({ error: error.message })
    const byMonth = {}
    data.forEach(e => {
      const key = e.date ? e.date.substring(0, 7) : 'unknown'
      byMonth[key] = (byMonth[key] || 0) + Number(e.amount)
    })
    res.json({ total: data.length, byMonth, records: data })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/analysis/sales-leaderboard', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('members').select('*')
    if (error) return res.status(500).json({ error: error.message })
    const byBranch = {}
    data.forEach(m => {
      byBranch[m.branch] = (byBranch[m.branch] || 0) + 1
    })
    const sorted = Object.entries(byBranch).sort((a, b) => b[1] - a[1])
    res.json({ leaderboard: sorted.map(([branch, count]) => ({ branch, count })) })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/analysis/revenue-forecast', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('subscriptions').select('*')
    if (error) return res.status(500).json({ error: error.message })
    const monthly = {}
    data.forEach(s => {
      const key = s.start_date ? s.start_date.substring(0, 7) : 'unknown'
      monthly[key] = (monthly[key] || 0) + Number(s.amount)
    })
    res.json({ forecast: monthly, total: data.reduce((s, e) => s + Number(e.amount), 0) })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/analysis/lead-source', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('enquiries').select('*').eq('deleted', false)
    if (error) return res.status(500).json({ error: error.message })
    const sources = {}
    data.forEach(e => {
      const src = e.source || 'Unknown'
      sources[src] = (sources[src] || 0) + 1
    })
    res.json({ sources, total: data.length })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ──────────────────────────────────────────────
// MEMBERSHIP ROUTES
// ──────────────────────────────────────────────
const crud = (app, basePath, table) => {
  app.get(`${basePath}`, authenticate, async (req, res) => {
    try {
      const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false })
      if (error) return res.status(500).json({ error: error.message })
      res.json(data)
    } catch (err) { res.status(500).json({ error: err.message }) }
  })
  app.post(`${basePath}`, authenticate, async (req, res) => {
    try {
      const { data, error } = await supabase.from(table).insert(req.body).select().single()
      if (error) return res.status(500).json({ error: error.message })
      res.status(201).json(data)
    } catch (err) { res.status(500).json({ error: err.message }) }
  })
  app.get(`${basePath}/:id`, authenticate, async (req, res) => {
    try {
      const { data, error } = await supabase.from(table).select('*').eq('id', req.params.id).single()
      if (error) return res.status(404).json({ error: 'Not found' })
      res.json(data)
    } catch (err) { res.status(500).json({ error: err.message }) }
  })
  app.put(`${basePath}/:id`, authenticate, async (req, res) => {
    try {
      const { data, error } = await supabase.from(table).update(req.body).eq('id', req.params.id).select().single()
      if (error) return res.status(500).json({ error: error.message })
      res.json(data)
    } catch (err) { res.status(500).json({ error: err.message }) }
  })
  app.delete(`${basePath}/:id`, authenticate, async (req, res) => {
    try {
      const { error } = await supabase.from(table).delete().eq('id', req.params.id)
      if (error) return res.status(500).json({ error: error.message })
      res.json({ message: 'Deleted' })
    } catch (err) { res.status(500).json({ error: err.message }) }
  })
}

crud(app, '/api/memberships/plans', 'membership_plans')
crud(app, '/api/memberships/subscriptions', 'subscriptions')
crud(app, '/api/memberships/coupons', 'coupons')
crud(app, '/api/memberships/combos', 'combo_offers')

// ──────────────────────────────────────────────
// BATCH ROUTES
// ──────────────────────────────────────────────
crud(app, '/api/batches', 'batches')

app.get('/api/batches/:id/bookings', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('batch_bookings').select('*, members(name,phone)').eq('batch_id', req.params.id)
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/batches/:id/bookings', authenticate, async (req, res) => {
  try {
    const booking = { batch_id: req.params.id, ...req.body }
    const { data, error } = await supabase.from('batch_bookings').insert(booking).select().single()
    if (error) return res.status(500).json({ error: error.message })
    res.status(201).json(data)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/batches/calendar', authenticate, async (req, res) => {
  try {
    const { data: batches, error } = await supabase.from('batches').select('*').eq('active', true)
    if (error) return res.status(500).json({ error: error.message })
    const { data: bookings } = await supabase.from('batch_bookings').select('*')
    res.json({ batches, bookings: bookings || [] })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ──────────────────────────────────────────────
// ACCOUNT ROUTES
// ──────────────────────────────────────────────
crud(app, '/api/accounts/entries', 'accounts_entries')
crud(app, '/api/accounts/expenses', 'expenses')

app.get('/api/accounts/payroll', authenticate, async (req, res) => {
  try {
    const { month, year } = req.query
    let query = supabase.from('payroll').select('*, staff(name,role)')
    if (month) query = query.eq('month', parseInt(month))
    if (year) query = query.eq('year', parseInt(year))
    query = query.order('created_at', { ascending: false })
    const { data, error } = await query
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/accounts/payroll', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('payroll').insert(req.body).select().single()
    if (error) return res.status(500).json({ error: error.message })
    res.status(201).json(data)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ──────────────────────────────────────────────
// NOTIFICATION ROUTES
// ──────────────────────────────────────────────
app.post('/api/notifications/send', authenticate, async (req, res) => {
  try {
    const notification = { ...req.body, status: 'sent', sent_at: new Date() }
    const { data, error } = await supabase.from('notifications').insert(notification).select().single()
    if (error) return res.status(500).json({ error: error.message })
    res.status(201).json(data)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/notifications/history', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('notifications').select('*').order('sent_at', { ascending: false }).limit(100)
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/notifications/whatsapp', authenticate, async (req, res) => {
  try {
    const { to, message } = req.body
    const notification = { type: 'whatsapp', recipient: to, message, subject: 'WhatsApp Message', status: 'sent', sent_at: new Date() }
    const { data, error } = await supabase.from('notifications').insert(notification).select().single()
    if (error) return res.status(500).json({ error: error.message })
    res.json({ message: 'WhatsApp sent', data })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/notifications/sms', authenticate, async (req, res) => {
  try {
    const { to, message } = req.body
    const notification = { type: 'sms', recipient: to, message, subject: 'SMS', status: 'sent', sent_at: new Date() }
    const { data, error } = await supabase.from('notifications').insert(notification).select().single()
    if (error) return res.status(500).json({ error: error.message })
    res.json({ message: 'SMS sent', data })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/notifications/email', authenticate, async (req, res) => {
  try {
    const { to, subject, message } = req.body
    const notification = { type: 'email', recipient: to, subject, message, status: 'sent', sent_at: new Date() }
    const { data, error } = await supabase.from('notifications').insert(notification).select().single()
    if (error) return res.status(500).json({ error: error.message })
    res.json({ message: 'Email sent', data })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ──────────────────────────────────────────────
// STAFF / TRAINER ROUTES
// ──────────────────────────────────────────────
crud(app, '/api/staff', 'staff')
crud(app, '/api/trainers', 'trainers')

// Trainer leave routes (register before crud catches /:id)
app.get('/api/trainers/leave', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('trainer_leave').select('*, trainers(name)').order('from_date', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/trainers/leave', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('trainer_leave').insert(req.body).select().single()
    if (error) return res.status(500).json({ error: error.message })
    res.status(201).json(data)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/trainers/leave/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('trainer_leave').update(req.body).eq('id', req.params.id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/trainers/leave/:id', authenticate, async (req, res) => {
  try {
    const { error } = await supabase.from('trainer_leave').delete().eq('id', req.params.id)
    if (error) return res.status(500).json({ error: error.message })
    res.json({ message: 'Deleted' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/trainers/:id/checkin', authenticate, async (req, res) => {
  try {
    const checkin = { trainer_id: req.params.id, ...req.body, check_in: new Date() }
    const { data, error } = await supabase.from('checkins').insert(checkin).select().single()
    if (error) return res.status(500).json({ error: error.message })
    res.status(201).json(data)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/trainers/bulk-checkin', authenticate, async (req, res) => {
  try {
    const { ids } = req.body
    const checkins = ids.map(id => ({ trainer_id: id, check_in: new Date(), date: new Date().toISOString().split('T')[0] }))
    const { data, error } = await supabase.from('checkins').insert(checkins).select()
    if (error) return res.status(500).json({ error: error.message })
    res.status(201).json(data)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/trainers/transformations', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('members').select('*')
    if (error) return res.status(500).json({ error: error.message })
    const withPhotos = data.filter(m => m.photo && m.join_date)
    res.json(withPhotos)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ──────────────────────────────────────────────
// SETTINGS ROUTES
// ──────────────────────────────────────────────
app.get('/api/settings/fitness-centers', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('fitness_centers').select('*').order('name')
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.put('/api/settings/fitness-centers/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('fitness_centers').update(req.body).eq('id', req.params.id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    res.json(data)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/settings/fitness-centers', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase.from('fitness_centers').insert(req.body).select().single()
    if (error) return res.status(500).json({ error: error.message })
    res.status(201).json(data)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

crud(app, '/api/settings/equipment', 'equipment')
crud(app, '/api/settings/notices', 'notices')
crud(app, '/api/settings/holidays', 'holidays')
crud(app, '/api/settings/feedback', 'feedback')

// ──────────────────────────────────────────────
// ANNOUNCEMENTS, STORE, CHECKIN — re-register via crud for YDL API client
// (These tables may need to be created; if table names differ, adjust)
// ──────────────────────────────────────────────
crud(app, '/api/announcements', 'announcements')
crud(app, '/api/store', 'store_items')
crud(app, '/api/checkin', 'checkins')

// ──────────────────────────────────────────────
// DASHBOARD SUMMARY
// ──────────────────────────────────────────────
app.get('/api/dashboard', authenticate, async (req, res) => {
  try {
    const { count: totalMembers } = await supabase.from('members').select('*', { count: 'exact', head: true })
    const { count: totalEnquiries } = await supabase.from('enquiries').select('*', { count: 'exact', head: true }).eq('deleted', false)
    const { count: totalFollowups } = await supabase.from('followups').select('*', { count: 'exact', head: true }).eq('status', 'pending')
    const { count: totalStaff } = await supabase.from('staff').select('*', { count: 'exact', head: true }).eq('active', true)
    const { data: recentMembers } = await supabase.from('members').select('*').order('created_at', { ascending: false }).limit(5)
    const { data: recentEnquiries } = await supabase.from('enquiries').select('*').eq('deleted', false).order('created_at', { ascending: false }).limit(5)

    res.json({
      stats: {
        totalMembers: totalMembers || 0,
        totalEnquiries: totalEnquiries || 0,
        totalFollowups: totalFollowups || 0,
        totalStaff: totalStaff || 0
      },
      recentMembers: recentMembers || [],
      recentEnquiries: recentEnquiries || []
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ──────────────────────────────────────────────
// ERROR HANDLING
// ──────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// ──────────────────────────────────────────────
// START
// ──────────────────────────────────────────────
async function start() {
  try {
    await runMigrations()
  } catch (e) {
    console.log('Migration note:', e.message)
  }
  app.listen(PORT, () => {
    console.log(`YDL Backend running on port ${PORT}`)
  })
}

start()

export default app
