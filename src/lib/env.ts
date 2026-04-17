/**
 * Runtime env validation.
 * Fails loudly at module load if required vars are missing, so bugs show up
 * immediately instead of as silent nulls at call sites.
 *
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
  // ── Supabase ──────────────────────────────────────────────────────────────
  supabaseUrl: required(
    "EXPO_PUBLIC_SUPABASE_URL",
    process.env.EXPO_PUBLIC_SUPABASE_URL,
  ),
  supabaseKey: required(
    "EXPO_PUBLIC_SUPABASE_KEY",
    process.env.EXPO_PUBLIC_SUPABASE_KEY,
  ),

  // ── Google OAuth ──────────────────────────────────────────────────────────
  googleWebClientId: optional(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID),
  googleIosClientId: optional(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID),
  googleAndroidClientId: optional(
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  ),

  // ── Public web (tracking / rider pages) ───────────────────────────────────
  webUrl: (
    process.env.EXPO_PUBLIC_TRACKSHPR_WEB_URL ?? "https://trackshpr.app"
  ).replace(/\/$/, ""),

  // ── Termii (Nigeria SMS + WhatsApp) ───────────────────────────────────────
  termii: {
    apiKey: optional(process.env.EXPO_PUBLIC_TERMII_API_KEY),
    baseUrl:
      process.env.EXPO_PUBLIC_TERMII_BASE_URL ?? "https://api.ng.termii.com",
    senderId: process.env.EXPO_PUBLIC_TERMII_SENDER_ID ?? "Trackshpr",
    // Default transport channel. "whatsapp" | "dnd" | "generic"
    smsChannel: (process.env.EXPO_PUBLIC_TERMII_SMS_CHANNEL ?? "generic") as
      | "generic"
      | "dnd",
    // If true, send via WhatsApp first, fall back to SMS on failure.
    // If false, send via SMS only.
    whatsappEnabled: optionalBool(
      process.env.EXPO_PUBLIC_TERMII_WHATSAPP_ENABLED,
      true,
    ),
  },

  // ── Payments (Paystack, Nigeria) ──────────────────────────────────────────
  payments: {
    // Master flag — flips whether the app shows purchase CTAs or the
    // "coming soon / waitlist" flow. Default is disabled.
    enabled: optionalBool(process.env.EXPO_PUBLIC_PAYMENTS_ENABLED, false),
    // Paystack publishable key. Public by design — keep secret key server-side.
    paystackPublicKey: optional(process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY),
    // "test" or "live" — used to label the UI and pick the right key.
    paystackEnv: (process.env.EXPO_PUBLIC_PAYSTACK_ENV ?? "test") as
      | "test"
      | "live",
    // Monthly Pro price in kobo (₦5,000.00 = 500000 kobo).
    proMonthlyKobo: Number(
      process.env.EXPO_PUBLIC_PRO_MONTHLY_KOBO ?? "500000",
    ),
    // Supabase Edge Function that initializes + verifies Paystack transactions.
    initEndpoint:
      process.env.EXPO_PUBLIC_PAYSTACK_INIT_ENDPOINT ??
      "paystack-initialize",
    verifyEndpoint:
      process.env.EXPO_PUBLIC_PAYSTACK_VERIFY_ENDPOINT ??
      "paystack-verify",
  },
} as const;

/** True if Termii is configured and we can send messages. */
export function canSendNotifications(): boolean {
  return env.termii.apiKey !== null;
}

/**
 * True if Paystack purchase flow should be shown.
 *
 * iOS is excluded: Apple requires StoreKit / in-app purchases for digital
 * subscriptions unlocked inside the app. Shipping a Paystack button on iOS
 * is an almost-certain App Store rejection. Until IAP is implemented,
 * iOS falls through to the Pro waitlist flow.
 */
export function canShowPaymentUpgrade(): boolean {
  if (Platform.OS === "ios") return false;
  return env.payments.enabled && env.payments.paystackPublicKey !== null;
}
