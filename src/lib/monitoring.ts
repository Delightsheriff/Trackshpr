/**
 * Sentry initialization + helpers.
 *
 * Behaviour:
 *   - Only initializes when EXPO_PUBLIC_SENTRY_DSN is set. Missing DSN is a
 *     no-op, so dev/Expo Go runs without sending events.
 *   - Tracing is off by default. Flip EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
 *     to a small number (e.g. "0.05") to enable.
 *   - Helpers are always callable. If Sentry isn't initialized, they're
 *     silent no-ops instead of throwing.
 */
import * as Sentry from "@sentry/react-native";

const DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

let initialized = false;

export function initMonitoring(): void {
  if (initialized) return;
  if (!DSN) return;

  const tracesSampleRate = Number(
    process.env.EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? "0",
  );

  Sentry.init({
    dsn: DSN,
    environment: process.env.EXPO_PUBLIC_SENTRY_ENV ?? "production",
    tracesSampleRate: Number.isFinite(tracesSampleRate) ? tracesSampleRate : 0,
    // Don't send events during local dev unless the DSN explicitly allows it.
    enabled: !__DEV__ || process.env.EXPO_PUBLIC_SENTRY_ENABLE_DEV === "true",
    debug: false,
  });

  initialized = true;
}

export function reportError(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  if (!initialized) {
    if (__DEV__) console.warn("[monitoring] error (dev)", error, context);
    return;
  }
  Sentry.withScope((scope) => {
    if (context) {
      for (const [key, value] of Object.entries(context)) {
        scope.setExtra(key, value);
      }
    }
    if (error instanceof Error) {
      Sentry.captureException(error);
    } else {
      Sentry.captureException(new Error(String(error)));
    }
  });
}

export function identifyUser(userId: string | null, email?: string | null): void {
  if (!initialized) return;
  if (!userId) {
    Sentry.setUser(null);
    return;
  }
  Sentry.setUser({ id: userId, email: email ?? undefined });
}

export const ErrorBoundary = Sentry.ErrorBoundary;
