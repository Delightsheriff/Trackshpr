/**
 * useSession — lightweight hook exposing the current auth userId.
 * Reads from local cache (getSession) then stays in sync via onAuthStateChange.
 * Never makes a network request.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";

export function useSession() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { userId };
}
