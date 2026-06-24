import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Legacy Supabase client - kept for backward compatibility
 * For new code, use createClient() from ./client.ts (browser) or ./server.ts (server)
 * @deprecated Use createClient from ./client.ts or ./server.ts instead
 */
const supabaseClient = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export default supabaseClient;