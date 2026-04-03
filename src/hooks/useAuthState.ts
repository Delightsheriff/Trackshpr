import { registerAuthRecheck } from "@/src/lib/authRecheck";
import { ONBOARDING_SEEN_KEY } from "@/src/lib/storageKeys";
import { supabase } from "@/src/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

export type AuthStatus =
  | "loading"
  | "unauthenticated"
  | "onboarding"
  | "profile_incomplete"
  | "authenticated";

export function useAuthState() {
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let mounted = true;

    function setStatusIfMounted(nextStatus: AuthStatus) {
      if (!mounted) return;

      setStatus((prevStatus) =>
        prevStatus === nextStatus ? prevStatus : nextStatus,
      );
    }

    async function resolveFromSession(session: Session | null) {
      if (!session) {
        const seen = await AsyncStorage.getItem(ONBOARDING_SEEN_KEY);
        setStatusIfMounted(seen === "true" ? "unauthenticated" : "onboarding");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!profile || !profile.onboarding_complete) {
        setStatusIfMounted("profile_incomplete");
      } else {
        setStatusIfMounted("authenticated");
      }
    }

    async function resolve() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        await resolveFromSession(session);
      } catch {
        setStatusIfMounted("unauthenticated");
      }
    }

    resolve();

    // Register so profile-setup can trigger a re-resolve after saving.
    // This is needed because updating the profiles table does not trigger
    // onAuthStateChange — only auth events (sign-in, token refresh) do.
    const unregisterRecheck = registerAuthRecheck(resolve);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Skip INITIAL_SESSION — it fires synchronously on subscription and
      // would race with the resolve() call above, causing a double DB query.
      // The initial resolve() already handles this case.
      if (event === "INITIAL_SESSION") return;

      void resolveFromSession(session).catch(() => {
        setStatusIfMounted("unauthenticated");
      });
    });

    return () => {
      mounted = false;
      unregisterRecheck();
      subscription.unsubscribe();
    };
  }, []);

  return status;
}
