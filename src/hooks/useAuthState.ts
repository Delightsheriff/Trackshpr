import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

    async function resolve() {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          const seen = await AsyncStorage.getItem("onboarding_seen");

          if (!mounted) return;

          setStatus(seen === "true" ? "unauthenticated" : "onboarding");
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_complete")
          .eq("id", session.user.id)
          .maybeSingle();

        if (!mounted) return;

        if (!profile || !profile.onboarding_complete) {
          setStatus("profile_incomplete");
        } else {
          setStatus("authenticated");
        }
      } catch {
        if (mounted) setStatus("unauthenticated");
      }
    }

    resolve();

    return () => {
      mounted = false;
    };
  }, []);

  return status;
}
