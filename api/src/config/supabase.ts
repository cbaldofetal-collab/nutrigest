import { createClient } from '@supabase/supabase-js';
import { ENV } from './constants';

if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase configuration');
}

// Client for public operations
export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY);

// Client for admin operations (if service role key is available)
export const supabaseAdmin = ENV.SUPABASE_SERVICE_ROLE_KEY 
  ? createClient(ENV.SUPABASE_URL, ENV.SUPABASE_SERVICE_ROLE_KEY)
  : supabase;

// Database connection configuration
export const dbConfig = {
  host: ENV.DB_HOST,
  port: ENV.DB_PORT,
  database: ENV.DB_NAME,
  user: ENV.DB_USER,
  password: ENV.DB_PASSWORD,
  ssl: ENV.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
};

export default supabase;