import { createClient } from '@supabase/supabase-js';

// This uses the PUBLIC anon key only — safe to expose in the browser.
// It is not the service role key, and every table has RLS enabled, so
// this client alone cannot read or write data directly; it only handles
// login/session. All actual data operations still go through the
// Express server, which uses the service role key server-side.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabaseAuth = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
