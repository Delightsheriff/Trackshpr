// deno-lint-ignore-file no-explicit-any
//
// public-order-lookup
//
// Rate-limited, unauthenticated lookup for public tracking links. The
// existing client hits get_public_order_snapshot() directly; this function
// wraps that call with:
//   - per-token + per-IP throttling via public.record_tracking_link_hit()
//   - opaque 404 for unknown tokens
//
// Deploy this for the web (static) build and point the public routes at it
// so we don't leak row counts and so abuse has a ceiling.
//
// Request: GET /public-order-lookup?token=...&kind=customer|rider
// Response:
//   200 { order: {...} }
//   404 { error: "Not found" }
//   429 { error: "Slow down" }

import { corsHeaders, preflight, json } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/auth.ts";

const MAX_HITS_PER_MINUTE = 60;

async function hashIp(ip: string, token: string): Promise<string> {
  const salt = Deno.env.get("TRACKING_LINK_SALT") ?? "trackshpr-fallback-salt";
  const bytes = new TextEncoder().encode(`${salt}:${token}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  if (req.method !== "GET") {
    return json({ error: "Method not allowed" }, 405);
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token")?.trim() ?? "";
  const kind = url.searchParams.get("kind") ?? "customer";

  if (!token || token.length < 12 || token.length > 128) {
    return json({ error: "Not found" }, 404);
  }
  if (kind !== "customer" && kind !== "rider") {
    return json({ error: "Not found" }, 404);
  }

  const admin = createServiceClient();

  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown";
  const ipHash = await hashIp(ip, token);

  const { data: allowed, error: throttleError } = await admin.rpc(
    "record_tracking_link_hit",
    {
      p_token: token,
      p_ip_hash: ipHash,
      p_window_seconds: 60,
      p_max_hits: MAX_HITS_PER_MINUTE,
    },
  );

  if (throttleError) {
    console.error("[public-order-lookup] throttle error", throttleError);
    // Fail closed if the throttle itself errors.
    return json({ error: "Service unavailable" }, 503);
  }

  if (allowed === false) {
    return new Response(
      JSON.stringify({ error: "Slow down" }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Retry-After": "60",
        },
      },
    );
  }

  const rpcName =
    kind === "rider" ? "get_rider_link_order" : "get_customer_tracking_order";

  const { data, error } = await admin.rpc(rpcName, { p_token: token });

  if (error) {
    console.error(`[public-order-lookup] ${rpcName} error`, error);
    return json({ error: "Not found" }, 404);
  }

  if (!data) {
    return json({ error: "Not found" }, 404);
  }

  return json({ order: data });
});
