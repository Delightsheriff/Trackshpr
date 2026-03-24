import type { AuthStatus } from "@/src/hooks/useAuthState";

export function getRoute(status: AuthStatus): string {
  switch (status) {
    case "loading":
      return "/(auth)/sign-in";
    case "onboarding":
      return "/onboarding";
    case "unauthenticated":
      return "/(auth)/sign-in";
    case "profile_incomplete":
      return "/(auth)/profile-setup";
    case "authenticated":
      return "/(tabs)";
  }
}
