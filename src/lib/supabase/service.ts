import { createClient } from "@supabase/supabase-js";

// Service-role Supabase client — bypasses RLS for server-side operations.
// Falls back to anon key (with permissive RLS) if service role key is not set.
export function createServiceClient() {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key);
}
