/**
 * Runtime env validation.
 * All vars here are EXPO_PUBLIC_* — they're bundled into the client bundle.
 * Never put secrets in this file.
 */
import { Platform } from "react-native";

function required(name: string, value: string | undefined): string {
  if (!value || !value.trim()) {
    throw new Error(
      `[env] Missing required env var: ${name}. Check your .env / EAS secrets.`,
    );
  }
  return value;
}

function optional(value: string | undefined): string | null {
  if (!value || !value.trim()) return null;
  return value;
}

function optionalBool(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === "1" || value.toLowerCase() === "true";
}

export const env = {
  // ── Supabase (required) ─────────────────────────────────────────────────────────
  supabaseUrl: required(
    "EXPO_PUBLIC_SUPABASE_URL",
    process.env.EXPO_PUBLIC_SUPABASE_URL,
  ),
  supabaseKey: required(
    "EXPO_PUBLIC_SUPABASE_KEY",
    process.env.EXPO_PUBLIC_SUPABASE_KEY,
  ),

  // ── Public web origin (tracking / rider pages) ─────────────────────────────
  webUrl: (
    process.env.EXPO_PUBLIC_TRACKSHPR_WEB_URL ?? "https://trackshpr.app"
  ).replace(/\/$/, ""),

  // ── Payments (Paystack, Nigeria) — optional ────────────────────────────────
  payments: {
    enabled: optionalBool(process.env.EXPO_PUBLIC_PAYMENTS_ENABLED, false),
    paystackPublicKey: optional(process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY),
    paystackEnv: (process.env.EXPO_PUBLIC_PAYSTACK_ENV ?? "test") as
      | "test"
      | "live",
    proMonthlyKobo: Number(
      process.env.EXPO_PUBLIC_PRO_MONTHLY_KOBO ?? "500000",
    ),
    initEndpoint: "paystack-initialize",
    verifyEndpoint: "paystack-verify",
  },
} as const;

export function canShowPaymentUpgrade(): boolean {
  if (Platform.OS === "ios") return false;
  return env.payments.enabled && env.payments.paystackPublicKey !== null;
}
