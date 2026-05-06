// deno-lint-ignore-file no-explicit-any
//
// paystack-verify
//
// Called by the client after Paystack redirects back. We re-hit Paystack's
// /transaction/verify (never trust the redirect URL) and, if successful,
// flip profiles.is_pro using the service role so Row Level Security can't
// block the write.
//
// Request body: { reference }
// Response:     { status: "success" | "failed" | "pending" }

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
    const body = await req.json();
    const reference = String(body.reference ?? "").trim();
    if (!reference) return json({ error: "Missing reference" }, 400);

    const verifyRes = await fetch(
      `${PAYSTACK_API}/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` } },
    );
    const verify: any = await verifyRes.json();

    if (!verifyRes.ok || !verify.status) {
      return json({ status: "failed" });
    }

    const paystackStatus = verify.data?.status;
    if (paystackStatus !== "success") {
      return json({ status: paystackStatus === "pending" ? "pending" : "failed" });
    }

    // The transaction metadata must reference this user — otherwise a caller
    // could verify someone else's reference and gain Pro for free.
    const metaUserId = verify.data?.metadata?.user_id;
    if (metaUserId && metaUserId !== userId) {
      return json({ error: "Reference does not belong to this user" }, 403);
    }

    const admin = createServiceClient();
    const customerCode = verify.data?.customer?.customer_code ?? null;

    const { error: updateError } = await admin
      .from("profiles")
      .update({
        is_pro: true,
        pro_since: new Date().toISOString(),
        pro_cancelled_at: null,
        paystack_customer_code: customerCode,
      })
      .eq("id", userId);

    if (updateError) {
      console.error("[paystack-verify] profile update failed", updateError);
      return json({ error: "Verified but failed to activate Pro" }, 500);
    }

    return json({ status: "success" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message === "Missing bearer token" || message === "Invalid session" ? 401 : 500;
    return json({ error: message }, status);
  }
});
