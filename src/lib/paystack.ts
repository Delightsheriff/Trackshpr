/**
 * Paystack client-side integration (Nigeria-first card / bank payments).
 *
 * Client flow:
 *   1. Call your Supabase Edge Function (`paystack-initialize`) with
 *      userId + amount. The function creates a transaction with the
 *      Paystack secret key (server-only) and returns an authorization_url.
 *   2. Open that URL in the browser with openAuthSessionAsync.
 *   3. Paystack redirects back to `trackshpr://paystack/callback?reference=...`.
 *   4. Call the Edge Function (`paystack-verify`) with the reference.
 *      On success the function flips `profiles.is_pro` to true.
 *
 * Why not do everything client-side? The Paystack secret key must never
 * ship in the bundle, and payment verification must be authoritative
 * (don't trust the client). The Edge Functions are documented in
 * DEPLOYMENT.md.
 */

import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { supabase } from "./supabase";
import { env, canShowPaymentUpgrade } from "./env";

export interface InitializePaymentParams {
  userId: string;
  email: string;
  amountKobo: number;
  plan: "pro_monthly";
}

export interface InitializePaymentResult {
  authorizationUrl: string;
  reference: string;
}

export class PaymentsDisabledError extends Error {
  constructor() {
    super("Payments are not enabled for this build.");
    this.name = "PaymentsDisabledError";
  }
}

export class PaymentCancelledError extends Error {
  readonly cancelled = true;
  constructor() {
    super("Payment was cancelled.");
    this.name = "PaymentCancelledError";
  }
}

function getPaystackCallbackUri(): string {
  return Linking.createURL("paystack/callback");
}

/**
 * Initialize a Paystack transaction by calling a Supabase Edge Function.
 * The function uses the secret key server-side and returns an
 * authorization_url for the client to open.
 */
async function initializeTransaction(
  params: InitializePaymentParams,
): Promise<InitializePaymentResult> {
  const { data, error } = await supabase.functions.invoke<{
    authorization_url: string;
    reference: string;
  }>(env.payments.initEndpoint, {
    body: {
      user_id: params.userId,
      email: params.email,
      amount: params.amountKobo,
      plan: params.plan,
      callback_url: getPaystackCallbackUri(),
    },
  });

  if (error) {
    throw new Error(error.message ?? "Could not start payment.");
  }

  if (!data?.authorization_url || !data?.reference) {
    throw new Error("Payment provider did not return a valid response.");
  }

  return {
    authorizationUrl: data.authorization_url,
    reference: data.reference,
  };
}

/**
 * Verify a transaction post-redirect via Edge Function.
 * On success the function updates profiles.is_pro on the server.
 */
async function verifyTransaction(reference: string): Promise<boolean> {
  const { data, error } = await supabase.functions.invoke<{
    status: "success" | "failed" | "pending";
  }>(env.payments.verifyEndpoint, {
    body: { reference },
  });

  if (error) {
    throw new Error(error.message ?? "Couldn't verify payment.");
  }

  return data?.status === "success";
}

/**
 * Full high-level flow: initialize, open browser, wait for redirect, verify.
 *
 * Returns true if payment was verified. Throws PaymentCancelledError if
 * the user backed out of the browser.
 */
export async function purchasePro(params: {
  userId: string;
  email: string;
}): Promise<boolean> {
  if (!canShowPaymentUpgrade()) {
    throw new PaymentsDisabledError();
  }

  const init = await initializeTransaction({
    userId: params.userId,
    email: params.email,
    amountKobo: env.payments.proMonthlyKobo,
    plan: "pro_monthly",
  });

  const callbackUri = getPaystackCallbackUri();
  const result = await WebBrowser.openAuthSessionAsync(
    init.authorizationUrl,
    callbackUri,
  );

  if (result.type === "cancel" || result.type === "dismiss") {
    throw new PaymentCancelledError();
  }

  if (result.type !== "success") {
    throw new Error("Payment did not complete. Try again.");
  }

  // The URL looks like: trackshpr://paystack/callback?reference=abc123
  let reference: string | null = null;
  try {
    const parsed = new URL(result.url);
    reference = parsed.searchParams.get("reference");
  } catch {
    // fall through
  }

  // Fall back to the reference we got from initialize
  const finalRef = reference ?? init.reference;
  return verifyTransaction(finalRef);
}

export function formatPriceFromKobo(kobo: number): string {
  const naira = kobo / 100;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(naira);
}
