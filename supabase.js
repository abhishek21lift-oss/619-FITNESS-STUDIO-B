import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const serviceKey = process.env.SUPABASE_SERVICE_KEY
const anonKey = process.env.SUPABASE_ANON_KEY || serviceKey

export const supabase = createClient(process.env.SUPABASE_URL, serviceKey)
export const supabaseAnon = createClient(process.env.SUPABASE_URL, anonKey)
