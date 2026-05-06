// deno-lint-ignore-file no-explicit-any
//
// send-notification
//
// Sends a WhatsApp or SMS message through Termii. This function exists so
// the Termii API key never ships in the client bundle — the client invokes
// this function with a structured payload, we add the secret, and we log
// the result to public.notification_log.
//
// Request body:
//   {
//     order_id?: string,
//     recipient_kind: "customer" | "rider",
//     recipient_phone: string,  // E.164
//     event: "order_created" | "order_picked_up" | "order_delivered" | "order_failed",
//     message: string,
//     channel?: "auto" | "whatsapp" | "sms"   // auto tries WA then falls back
//   }
// Response:
//   { status: "sent" | "failed", channel: "whatsapp" | "sms", message_id?: string }

import { preflight, json } from "../_shared/cors.ts";
import { getUserFromRequest, createServiceClient } from "../_shared/auth.ts";

const TERMII_API_KEY = Deno.env.get("TERMII_API_KEY")!;
const TERMII_BASE_URL = Deno.env.get("TERMII_BASE_URL") ?? "https://api.ng.termii.com";
const TERMII_SENDER_ID = Deno.env.get("TERMII_SENDER_ID") ?? "Trackshpr";
const TERMII_SMS_CHANNEL = (Deno.env.get("TERMII_SMS_CHANNEL") ?? "generic") as
  | "generic"
  | "dnd";

interface TermiiResponse {
  message_id?: string;
  code?: string;
  message?: string;
}

async function sendViaTermii(
  to: string,
  body: string,
  channel: "whatsapp" | "sms",
): Promise<{ ok: boolean; messageId?: string; errorMessage?: string }> {
  try {
    const res = await fetch(`${TERMII_BASE_URL}/api/sms/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to,
        from: TERMII_SENDER_ID,
        sms: body,
        type: "plain",
        channel: channel === "whatsapp" ? "whatsapp" : TERMII_SMS_CHANNEL,
        api_key: TERMII_API_KEY,
      }),
    });

    const data: TermiiResponse = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        ok: false,
        errorMessage: data.message ?? `Termii HTTP ${res.status}`,
      };
    }

    return { ok: true, messageId: data.message_id };
  } catch (err) {
    return {
      ok: false,
      errorMessage: err instanceof Error ? err.message : "network error",
    };
  }
}

Deno.serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const { userId } = await getUserFromRequest(req);
    const body = await req.json();

    const recipientPhone = String(body.recipient_phone ?? "").trim();
    const message = String(body.message ?? "").trim();
    const recipientKind = body.recipient_kind;
    const event = body.event;
    const channel = (body.channel ?? "auto") as "auto" | "whatsapp" | "sms";
    const orderId = body.order_id ?? null;

    if (!recipientPhone || !message) {
      return json({ error: "Missing recipient_phone or message" }, 400);
    }
    if (recipientKind !== "customer" && recipientKind !== "rider") {
      return json({ error: "Invalid recipient_kind" }, 400);
    }
    const validEvents = [
      "order_created",
      "order_picked_up",
      "order_delivered",
      "order_failed",
    ];
    if (!validEvents.includes(event)) {
      return json({ error: "Invalid event" }, 400);
    }

    const admin = createServiceClient();

    // Try WhatsApp first if channel is "auto" or "whatsapp".
    let result: { ok: boolean; messageId?: string; errorMessage?: string };
    let usedChannel: "whatsapp" | "sms" = "sms";

    if (channel === "whatsapp" || channel === "auto") {
      usedChannel = "whatsapp";
      result = await sendViaTermii(recipientPhone, message, "whatsapp");
      if (!result.ok && channel === "auto") {
        // Fall back to SMS.
        usedChannel = "sms";
        result = await sendViaTermii(recipientPhone, message, "sms");
      }
    } else {
      usedChannel = "sms";
      result = await sendViaTermii(recipientPhone, message, "sms");
    }

    await admin.from("notification_log").insert({
      seller_id: userId,
      order_id: orderId,
      recipient_phone: recipientPhone,
      recipient_kind: recipientKind,
      event,
      channel: usedChannel,
      status: result.ok ? "sent" : "failed",
      provider_message_id: result.messageId ?? null,
      error_message: result.errorMessage ?? null,
    });

    if (!result.ok) {
      return json(
        {
          status: "failed",
          channel: usedChannel,
          error: result.errorMessage ?? "Send failed",
        },
        200,
      );
    }

    return json({
      status: "sent",
      channel: usedChannel,
      message_id: result.messageId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message === "Missing bearer token" || message === "Invalid session" ? 401 : 500;
    return json({ error: message }, status);
  }
});
