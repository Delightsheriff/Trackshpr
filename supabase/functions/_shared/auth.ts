import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

/**
 * Returns the authenticated user id from the incoming request's
 * Authorization: Bearer <jwt> header. Throws if missing / invalid.
 *
 * Uses the anon key + the user's JWT so Row Level Security is still enforced
 * when the function does follow-up reads.
 */
export async function getUserFromRequest(req: Request): Promise<{
  userId: string;
  email: string | null;
  client: SupabaseClient;
}> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing bearer token");
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new Error("Invalid session");
  }

  return {
    userId: data.user.id,
    email: data.user.email ?? null,
    client: supabase,
  };
}

/**
 * Service-role client for privileged operations inside Edge Functions.
 * Bypasses RLS — use only when you've already authorized the caller.
 */
export function createServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}
