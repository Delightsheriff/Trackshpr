import { useEffect, useState } from "react";
import { supabase } from "@/src/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";

export type AuthStatus =
  | "loading"
  | "unauthenticated"
  | "onboarding"
  | "profile_incomplete"
  | "authenticated";

async function resolveAuthStatus(): Promise<AuthStatus> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    const seen = await AsyncStorage.getItem("onboarding_seen");
    return seen === "true" ? "unauthenticated" : "onboarding";
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_complete")
    .eq("id", session.user.id)
    .maybeSingle();

  if (!profile || !profile.onboarding_complete) {
    return "profile_incomplete";
  }

  return "authenticated";
}

export function useAuthState() {
  const [initialStatus, setInitialStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let mounted = true;

    resolveAuthStatus().then((status) => {
      if (mounted) setInitialStatus(status);
    });

    return () => {
      mounted = false;
    };
  }, []);

  const { data: status = initialStatus } = useQuery({
    queryKey: ["auth-status"],
    queryFn: resolveAuthStatus,
    staleTime: Infinity,
    gcTime: 0,
    enabled: initialStatus !== "loading",
    refetchOnMount: false,
  });

  return initialStatus === "loading" ? "loading" : status;
}
