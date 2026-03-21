/**
 * useAuthGuard — determines where to redirect the user on app mount.
 *
 * Checks three pieces of state in order:
 *  1. AsyncStorage key 'onboarding_seen'
 *  2. Supabase session (supabase.auth.getSession())
 *  3. profiles.onboarding_complete from Supabase
 *
 * Returns the destination path, or null if the user should land on (tabs).
 *
 * Caller handles the actual redirect using expo-router's redirect().
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";

const ONBOARDING_SEEN_KEY = "onboarding_seen";

export type AuthDestination =
  | { loading: true }
  | { loading: false; destination: "onboarding" | "sign-in" | "profile-setup" | "app" };

export function useAuthGuard() {
  const [state, setState] = useState<AuthDestination>({ loading: true });

  useEffect(() => {
    let cancelled = false;

    async function resolveDestination() {
      // 1. Check if onboarding has been seen
      let seenOnboarding = false;
      try {
        const val = await AsyncStorage.getItem(ONBOARDING_SEEN_KEY);
        seenOnboarding = val === "true";
      } catch {
        // Treat as not seen — stay on onboarding
      }

      // 2. Check Supabase session
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        // No session
        if (!seenOnboarding) {
          if (!cancelled) setState({ loading: false, destination: "onboarding" });
        } else {
          if (!cancelled) setState({ loading: false, destination: "sign-in" });
        }
        return;
      }

      // 3. Session exists — check onboarding_complete
      const userId = sessionData.session.user.id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", userId)
        .maybeSingle();

      if (!cancelled) {
        if (!profile?.onboarding_complete) {
          setState({ loading: false, destination: "profile-setup" });
        } else {
          setState({ loading: false, destination: "app" });
        }
      }
    }

    resolveDestination();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
