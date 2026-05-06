import type { OrderStatus, PublicTrackingOrder, PublicTrackingProfile } from "@/lib/types";

export function formatAmount(value: number | null | undefined): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Just now";

  return new Intl.DateTimeFormat("en-NG", {
    hour: "numeric",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

export function getBusinessName(order: PublicTrackingOrder): string {
  return (
    order.profile.brand_name?.trim() ||
    order.profile.business_name?.trim() ||
    "Trackshpr seller"
  );
}

export function getBrandColor(
  profileOrOrder: PublicTrackingProfile | PublicTrackingOrder | null | undefined,
): string {
  if (!profileOrOrder) return "#3559e0";

  const profile = "profile" in profileOrOrder ? profileOrOrder.profile : profileOrOrder;
  return profile.brand_color?.trim() || "#3559e0";
}

export function getPrimaryContactNumber(
  profile: Pick<PublicTrackingProfile, "phone" | "contact_numbers"> | null,
): string | null {
  if (profile?.contact_numbers?.length) {
    const primary =
      profile.contact_numbers.find((entry) => entry.is_primary && entry.number) ??
      profile.contact_numbers.find((entry) => entry.number);

    if (primary?.number) {
      return primary.number;
    }
  }

  return profile?.phone ?? null;
}

export function getStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "pending":
      return "Order Confirmed";
    case "picked_up":
      return "Picked Up";
    case "in_transit":
      return "In Transit";
    case "delivered":
      return "Delivered";
    case "failed":
      return "Delivery Failed";
  }
}

export function mapTimelineLabel(status: OrderStatus): string {
  switch (status) {
    case "pending":
      return "Order confirmed";
    case "picked_up":
      return "Item picked up";
    case "in_transit":
      return "In transit";
    case "delivered":
      return "Delivered";
    case "failed":
      return "Delivery failed";
  }
}
