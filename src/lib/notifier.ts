/**
 * Outbound notifications for order lifecycle events.
 *
 * Sends via Termii — Nigeria-focused SMS + WhatsApp provider.
 * WhatsApp is attempted first (richer, no DND blocks). If it fails,
 * we fall back to SMS so the recipient still receives the link.
 *
 * All sends are best-effort: failures are logged, never thrown, so order
 * creation is not blocked by transient provider outages.
 */

import { parsePhoneNumberFromString } from "libphonenumber-js";
import { env, canSendNotifications } from "./env";

export type NotifyChannel = "whatsapp" | "sms";

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
}

type TermiiSendRequest = {
  to: string;
  from: string;
  sms: string;
  type: "plain";
  channel: "whatsapp" | "generic" | "dnd";
  api_key: string;
};

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

// ─── Low-level Termii send ──────────────────────────────────────────────────

async function termiiSend(
  channel: "whatsapp" | "generic" | "dnd",
  to: string,
  message: string,
): Promise<boolean> {
  if (!env.termii.apiKey) return false;

  const body: TermiiSendRequest = {
    api_key: env.termii.apiKey,
    to,
    from: env.termii.senderId,
    sms: message,
    type: "plain",
    channel,
  };

  try {
    const response = await fetch(`${env.termii.baseUrl}/api/sms/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.warn(
        `[notifier] Termii send failed (${channel}, HTTP ${response.status})`,
      );
      return false;
    }

    const json = (await response.json().catch(() => null)) as
      | { code?: string }
      | null;
    if (json?.code && json.code !== "ok") {
      console.warn(`[notifier] Termii rejected send (${json.code})`);
      return false;
    }

    return true;
  } catch (error) {
    console.warn("[notifier] Termii network error", error);
    return false;
  }
}

/**
 * Send with WhatsApp-first, SMS-fallback strategy.
 * Returns the channel that actually delivered, or null if both failed.
 */
export async function sendNotification(
  phoneRaw: string | null | undefined,
  message: string,
): Promise<NotifyChannel | null> {
  if (!canSendNotifications()) return null;

  const to = toE164(phoneRaw);
  if (!to) {
    console.warn("[notifier] Skipping send — invalid phone:", phoneRaw);
    return null;
  }

  // WhatsApp first if enabled
  if (env.termii.whatsappEnabled) {
    const ok = await termiiSend("whatsapp", to, message);
    if (ok) return "whatsapp";
    console.warn("[notifier] WhatsApp failed, falling back to SMS");
  }

  const ok = await termiiSend(env.termii.smsChannel, to, message);
  if (ok) return "sms";

  return null;
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
      ? sendNotification(ctx.riderPhone, buildRiderCreatedMessage(ctx))
      : Promise.resolve(null),
    ctx.customerPhone
      ? sendNotification(ctx.customerPhone, buildCustomerCreatedMessage(ctx))
      : Promise.resolve(null),
  ]);
}

export async function notifyOrderPickedUp(ctx: OrderNotifyContext): Promise<void> {
  if (!ctx.customerPhone) return;
  await sendNotification(ctx.customerPhone, buildCustomerPickedUpMessage(ctx));
}

export async function notifyOrderDelivered(ctx: OrderNotifyContext): Promise<void> {
  if (!ctx.customerPhone) return;
  await sendNotification(ctx.customerPhone, buildCustomerDeliveredMessage(ctx));
}

export async function notifyOrderFailed(ctx: OrderNotifyContext): Promise<void> {
  if (!ctx.customerPhone) return;
  await sendNotification(ctx.customerPhone, buildCustomerFailedMessage(ctx));
}
