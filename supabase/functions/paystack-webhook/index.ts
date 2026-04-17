// deno-lint-ignore-file no-explicit-any
//
// paystack-webhook
//
// Paystack POSTs events here for every transaction. The webhook is the
// authoritative signal — we can't rely on the client completing the redirect.
// We verify the HMAC-SHA512 signature with PAYSTACK_SECRET_KEY, then flip
// the profile state for supported events.
//
// Configure the URL at https://dashboard.paystack.com/#/settings/developers:
//   https://<project>.functions.supabase.co/paystack-webhook
//
// Supported events:
//   charge.success        → is_pro = true (covers the case where the client
//                            never hits paystack-verify)
//   subscription.disable  → is_pro = false

import { json } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/auth.ts";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY")!;

async function verifySignature(raw: string, signature: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(PAYSTACK_SECRET_KEY),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  // Constant-time compare
  if (hex.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < hex.length; i++) {
    mismatch |= hex.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const signature = req.headers.get("x-paystack-signature") ?? "";
  const raw = await req.text();

  if (!signature || !(await verifySignature(raw, signature))) {
    return json({ error: "Invalid signature" }, 401);
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const admin = createServiceClient();

  try {
    switch (event.event) {
      case "charge.success": {
        const userId = event.data?.metadata?.user_id;
        if (!userId) break;
        const customerCode = event.data?.customer?.customer_code ?? null;
        await admin
          .from("profiles")
          .update({
            is_pro: true,
            pro_since: new Date().toISOString(),
            pro_cancelled_at: null,
            paystack_customer_code: customerCode,
          })
          .eq("id", userId);
        break;
      }
      case "subscription.create": {
        const customerCode = event.data?.customer?.customer_code;
        const subscriptionCode = event.data?.subscription_code;
        if (customerCode) {
          await admin
            .from("profiles")
            .update({ paystack_subscription_code: subscriptionCode })
            .eq("paystack_customer_code", customerCode);
        }
        break;
      }
      case "subscription.disable":
      case "subscription.not_renew": {
        const customerCode = event.data?.customer?.customer_code;
        if (customerCode) {
          await admin
            .from("profiles")
            .update({
              is_pro: false,
              pro_cancelled_at: new Date().toISOString(),
            })
            .eq("paystack_customer_code", customerCode);
        }
        break;
      }
      default:
        // Unhandled event — acknowledge so Paystack doesn't retry.
        break;
    }

    return json({ ok: true });
  } catch (err) {
    console.error("[paystack-webhook] handler error", err);
    return json({ error: "handler failed" }, 500);
  }
});
