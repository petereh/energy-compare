import { createClient } from '@supabase/supabase-js';

// Server-side client — uses service_role key, bypasses RLS.
// NEVER import this file in client components.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_PROJECT_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);
