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

function isRootIndex(segments: readonly string[]): boolean {
  return segments.length === 0 || (segments.length === 1 && segments[0] === "index");
}

function isAuthRoute(segments: readonly string[]): boolean {
  return segments[0] === "(auth)";
}

function isOnboardingRoute(segments: readonly string[]): boolean {
  return segments[0] === "onboarding";
}

function isProfileSetupRoute(segments: readonly string[]): boolean {
  return segments[0] === "(auth)" && segments[1] === "profile-setup";
}

function isPublicTrackingRoute(segments: readonly string[]): boolean {
  return (
    segments[0] === "(screens)" &&
    (segments[1] === "track-link" || segments[1] === "rider-link")
  );
}

function isPublicRoute(segments: readonly string[]): boolean {
  return (
    isRootIndex(segments) ||
    isAuthRoute(segments) ||
    isOnboardingRoute(segments) ||
    isPublicTrackingRoute(segments)
  );
}

export function getRedirectForSegments(
  status: AuthStatus,
  segments: readonly string[],
): string | null {
  if (status === "loading") {
    return null;
  }

  if (isPublicTrackingRoute(segments)) {
    return null;
  }

  const targetRoute = getRoute(status);

  if (isRootIndex(segments)) {
    return targetRoute;
  }

  switch (status) {
    case "onboarding":
      return isOnboardingRoute(segments) ? null : targetRoute;
    case "unauthenticated":
      return isAuthRoute(segments) ? null : targetRoute;
    case "profile_incomplete":
      return isProfileSetupRoute(segments) ? null : targetRoute;
    case "authenticated":
      return isPublicRoute(segments) ? targetRoute : null;
  }
}
