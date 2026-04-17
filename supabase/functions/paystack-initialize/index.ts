// deno-lint-ignore-file no-explicit-any
//
// paystack-initialize
//
// Starts a Paystack transaction. Called by the mobile/web client at the
// beginning of the Pro purchase flow. We keep PAYSTACK_SECRET_KEY server-side
// so it never ends up in the bundle.
//
// Request body: { user_id, email, amount, plan, callback_url }
// Response:     { authorization_url, reference }

import { preflight, json } from "../_shared/cors.ts";
import { getUserFromRequest } from "../_shared/auth.ts";

const PAYSTACK_SECRET_KEY = Deno.env.get("PAYSTACK_SECRET_KEY")!;
const PAYSTACK_API = "https://api.paystack.co";

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const { userId, email: authEmail } = await getUserFromRequest(req);
    const body = await req.json();

    // The client sends user_id so we can double-check; authoritative identity
    // is always the JWT.
    if (body.user_id && body.user_id !== userId) {
      return json({ error: "user_id mismatch" }, 403);
    }

    const email = (body.email ?? authEmail ?? "").trim();
    const amount = Number(body.amount);
    const plan = String(body.plan ?? "pro_monthly");
    const callbackUrl = String(body.callback_url ?? "");

    if (!email || !amount || !callbackUrl) {
      return json({ error: "Missing email, amount, or callback_url" }, 400);
    }
    if (!Number.isFinite(amount) || amount < 100) {
      return json({ error: "Invalid amount" }, 400);
    }

    const paystackRes = await fetch(`${PAYSTACK_API}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount, // kobo
        callback_url: callbackUrl,
        metadata: {
          user_id: userId,
          plan,
          custom_fields: [
            { display_name: "Plan", variable_name: "plan", value: plan },
          ],
        },
      }),
    });

    const data: any = await paystackRes.json();

    if (!paystackRes.ok || !data.status) {
      return json(
        { error: data.message ?? "Paystack rejected the request" },
        paystackRes.status === 200 ? 400 : paystackRes.status,
      );
    }

    return json({
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
      access_code: data.data.access_code,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message === "Missing bearer token" || message === "Invalid session" ? 401 : 500;
    return json({ error: message }, status);
  }
});
