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
        const seen = await AsyncStorage.getItem("onboarding_seen");
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void resolveFromSession(session).catch(() => {
        setStatusIfMounted("unauthenticated");
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return status;
}
