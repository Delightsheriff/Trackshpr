/**
 * Outbound notifications for order lifecycle events.
 *
 * Delivery is performed server-side by the `send-notification` Supabase Edge
 * Function (Termii: WhatsApp-first with SMS fallback). The Termii API key
 * stays on the server — this module only builds the message and asks the
 * Edge Function to send it.
 *
 * All sends are best-effort: failures are logged, never thrown, so order
 * creation is not blocked by transient provider outages.
 */

import { parsePhoneNumberFromString } from "libphonenumber-js";
import { supabase } from "./supabase";

export type NotifyChannel = "whatsapp" | "sms";
export type NotifyEvent =
  | "order_created"
  | "order_picked_up"
  | "order_delivered"
  | "order_failed";
export type NotifyRecipientKind = "customer" | "rider";

export interface OrderNotifyContext {
  sellerBrandName: string;
  sellerPhone: string | null;
  orderItem: string;
  orderNumber: number | null;
  customerName: string | null;
  customerPhone: string | null;
  riderName: string | null;
  riderPhone: string | null;
  deliveryAddress: string | null;
  trackLink: string;
  riderLink: string;
  orderId?: string | null;
}

interface SendNotificationParams {
  phoneRaw: string | null | undefined;
  message: string;
  event: NotifyEvent;
  recipientKind: NotifyRecipientKind;
  orderId?: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Normalize a phone number to E.164 (e.g. +2348012345678).
 * Returns null if parse fails. Termii requires E.164 for all channels.
 */
export function toE164(raw: string | null | undefined, defaultCountry: "NG" = "NG"): string | null {
  if (!raw) return null;
  try {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const parsed = parsePhoneNumberFromString(trimmed, defaultCountry);
    if (!parsed || !parsed.isValid()) return null;
    return parsed.number; // E.164 with leading +
  } catch {
    return null;
  }
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

// ─── Edge Function dispatch ──────────────────────────────────────────────────

/**
 * Send a single notification via the `send-notification` Edge Function.
 * Returns the channel that delivered, or null if delivery failed.
 */
async function sendNotification({
  phoneRaw,
  message,
  event,
  recipientKind,
  orderId,
}: SendNotificationParams): Promise<NotifyChannel | null> {
  const to = toE164(phoneRaw);
  if (!to) {
    console.warn("[notifier] Skipping send — invalid phone:", phoneRaw);
    return null;
  }

  try {
    const { data, error } = await supabase.functions.invoke<{
      status: "sent" | "failed";
      channel: NotifyChannel;
    }>("send-notification", {
      body: {
        order_id: orderId ?? null,
        recipient_kind: recipientKind,
        recipient_phone: to,
        event,
        message,
        channel: "auto",
      },
    });

    if (error) {
      console.warn("[notifier] send-notification invoke failed", error.message);
      return null;
    }

    if (!data || data.status !== "sent") {
      console.warn("[notifier] send-notification returned failure", data);
      return null;
    }

    return data.channel;
  } catch (err) {
    console.warn("[notifier] send-notification threw", err);
    return null;
  }
}

// ─── Templates ──────────────────────────────────────────────────────────────

function orderLabel(orderNumber: number | null): string {
  return orderNumber ? `#${orderNumber}` : "";
}

export function buildRiderCreatedMessage(ctx: OrderNotifyContext): string {
  const parts = [
    `New delivery ${orderLabel(ctx.orderNumber)} for ${ctx.sellerBrandName}`,
    `Item: ${truncate(ctx.orderItem, 80)}`,
    ctx.customerName ? `Customer: ${ctx.customerName}` : null,
    ctx.customerPhone ? `Phone: ${ctx.customerPhone}` : null,
    ctx.deliveryAddress
      ? `Address: ${truncate(ctx.deliveryAddress, 120)}`
      : null,
    ctx.sellerPhone ? `Seller: ${ctx.sellerPhone}` : null,
    `Open: ${ctx.riderLink}`,
  ];
  return parts.filter(Boolean).join("\n");
}

export function buildCustomerCreatedMessage(ctx: OrderNotifyContext): string {
  const parts = [
    `Hi ${ctx.customerName ?? "there"}, your order ${orderLabel(ctx.orderNumber)} from ${ctx.sellerBrandName} is confirmed.`,
    `Item: ${truncate(ctx.orderItem, 80)}`,
    ctx.riderName ? `Rider: ${ctx.riderName}` : null,
    `Track live: ${ctx.trackLink}`,
    ctx.sellerPhone ? `Seller contact: ${ctx.sellerPhone}` : null,
  ];
  return parts.filter(Boolean).join("\n");
}

export function buildCustomerPickedUpMessage(ctx: OrderNotifyContext): string {
  const parts = [
    `Your order ${orderLabel(ctx.orderNumber)} has been picked up by ${ctx.riderName ?? "the rider"}.`,
    `Track live: ${ctx.trackLink}`,
  ];
  return parts.filter(Boolean).join("\n");
}

export function buildCustomerDeliveredMessage(ctx: OrderNotifyContext): string {
  const parts = [
    `Your order ${orderLabel(ctx.orderNumber)} from ${ctx.sellerBrandName} has been delivered. Thanks for your purchase!`,
    `Details: ${ctx.trackLink}`,
  ];
  return parts.filter(Boolean).join("\n");
}

export function buildCustomerFailedMessage(ctx: OrderNotifyContext): string {
  const parts = [
    `There was an issue delivering your order ${orderLabel(ctx.orderNumber)} from ${ctx.sellerBrandName}.`,
    ctx.sellerPhone
      ? `Please contact the seller on ${ctx.sellerPhone} for next steps.`
      : "Please contact the seller for next steps.",
    `Order: ${ctx.trackLink}`,
  ];
  return parts.filter(Boolean).join("\n");
}

// ─── High-level dispatchers ─────────────────────────────────────────────────

export async function notifyOrderCreated(ctx: OrderNotifyContext): Promise<void> {
  await Promise.all([
    ctx.riderPhone
      ? sendNotification({
          phoneRaw: ctx.riderPhone,
          message: buildRiderCreatedMessage(ctx),
          event: "order_created",
          recipientKind: "rider",
          orderId: ctx.orderId ?? null,
        })
      : Promise.resolve(null),
    ctx.customerPhone
      ? sendNotification({
          phoneRaw: ctx.customerPhone,
          message: buildCustomerCreatedMessage(ctx),
          event: "order_created",
          recipientKind: "customer",
          orderId: ctx.orderId ?? null,
        })
      : Promise.resolve(null),
  ]);
}

export async function notifyOrderPickedUp(ctx: OrderNotifyContext): Promise<void> {
  if (!ctx.customerPhone) return;
  await sendNotification({
    phoneRaw: ctx.customerPhone,
    message: buildCustomerPickedUpMessage(ctx),
    event: "order_picked_up",
    recipientKind: "customer",
    orderId: ctx.orderId ?? null,
  });
}

export async function notifyOrderDelivered(ctx: OrderNotifyContext): Promise<void> {
  if (!ctx.customerPhone) return;
  await sendNotification({
    phoneRaw: ctx.customerPhone,
    message: buildCustomerDeliveredMessage(ctx),
    event: "order_delivered",
    recipientKind: "customer",
    orderId: ctx.orderId ?? null,
  });
}

export async function notifyOrderFailed(ctx: OrderNotifyContext): Promise<void> {
  if (!ctx.customerPhone) return;
  await sendNotification({
    phoneRaw: ctx.customerPhone,
    message: buildCustomerFailedMessage(ctx),
    event: "order_failed",
    recipientKind: "customer",
    orderId: ctx.orderId ?? null,
  });
}
