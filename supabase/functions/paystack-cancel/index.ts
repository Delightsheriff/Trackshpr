// deno-lint-ignore-file no-explicit-any
//
// paystack-cancel
//
// Called from Settings → Account → Cancel Pro. Disables the user's Paystack
// subscription (if any) and flips profiles.is_pro = false.
//
// Request body: {}
// Response:     { status: "cancelled" }

import { preflight, json } from "../_shared/cors.ts";
import { getUserFromRequest, createServiceClient } from "../_shared/auth.ts";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const PAYSTACK_API = "https://api.paystack.co";

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const { userId } = await getUserFromRequest(req);
    const admin = createServiceClient();

    const { data: profile, error } = await admin
      .from("profiles")
      .select("paystack_customer_code, paystack_subscription_code")
      .eq("id", userId)
      .single();

    if (error) {
      return json({ error: "Could not load profile" }, 500);
    }

    // If we have a subscription code, ask Paystack to disable it. This fires
    // a subscription.disable webhook which the webhook function handles, but
    // we also flip locally so the UI updates immediately.
    if (profile?.paystack_subscription_code) {
      try {
        // Fetch the email_token required by Paystack's disable endpoint.
        const subRes = await fetch(
          `${PAYSTACK_API}/subscription/${profile.paystack_subscription_code}`,
          { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } },
        );
        const sub: any = await subRes.json();
        const emailToken = sub?.data?.email_token;

        if (emailToken) {
          await fetch(`${PAYSTACK_API}/subscription/disable`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code: profile.paystack_subscription_code,
              token: emailToken,
            }),
          });
        }
      } catch (paystackErr) {
        // If Paystack is down we still flip locally; the webhook + manual
        // reconciliation will eventually align state.
        console.error("[paystack-cancel] Paystack disable failed", paystackErr);
      }
    }

    const { error: updateError } = await admin
      .from("profiles")
      .update({
        is_pro: false,
        pro_cancelled_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      return json({ error: "Could not cancel" }, 500);
    }

    return json({ status: "cancelled" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message === "Missing bearer token" || message === "Invalid session" ? 401 : 500;
    return json({ error: message }, status);
  }
});
