import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Server-side client — uses service_role key, bypasses RLS.
// NEVER import this file in client components.
let supabaseAdminInstance: SupabaseClient | null = null;

export function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    const url = process.env.SUPABASE_PROJECT_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      throw new Error('Missing Supabase environment variables');
    }

    supabaseAdminInstance = createClient(url, key, {
      auth: { persistSession: false }
    });
  }
  return supabaseAdminInstance;
}

// For backwards compatibility
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    return getSupabaseAdmin()[prop as keyof SupabaseClient];
  }
});
