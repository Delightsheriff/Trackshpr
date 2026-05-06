import { env } from "@/lib/env";
import type { PublicTrackingOrder, RiderActionPayload } from "@/lib/types";

type RpcArgs = Record<string, string | number | boolean | null | undefined>;

async function callRpc<T>(fn: string, args: RpcArgs): Promise<T | null> {
  const response = await fetch(`${env.supabaseUrl}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: env.supabaseAnonKey,
      Authorization: `Bearer ${env.supabaseAnonKey}`,
    },
    body: JSON.stringify(args),
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || `RPC ${fn} failed with ${response.status}`);
  }

  const body = (await response.json().catch(() => null)) as T | null;
  return body;
}

export async function getPublicOrder(
  kind: "customer" | "rider",
  token: string,
): Promise<PublicTrackingOrder | null> {
  const trimmed = token.trim();
  if (!trimmed) return null;

  if (kind === "customer") {
    return callRpc<PublicTrackingOrder>("get_customer_tracking_order", {
      p_customer_token: trimmed,
    });
  }

  return callRpc<PublicTrackingOrder>("get_rider_link_order", {
    p_rider_token: trimmed,
  });
}

export async function runRiderAction(
  payload: RiderActionPayload,
): Promise<PublicTrackingOrder | null> {
  const baseArgs = {
    p_rider_token: payload.token.trim(),
    p_latitude: payload.latitude ?? null,
    p_longitude: payload.longitude ?? null,
  };

  switch (payload.action) {
    case "pickup":
      return callRpc<PublicTrackingOrder>("rider_pickup_order", baseArgs);
    case "deliver":
      return callRpc<PublicTrackingOrder>("rider_complete_order", baseArgs);
    case "fail":
      return callRpc<PublicTrackingOrder>("rider_fail_order", {
        ...baseArgs,
        p_note: payload.note?.trim() || "Other",
      });
  }
}
