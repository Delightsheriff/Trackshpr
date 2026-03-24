import React from "react";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/src/stores/themeStore";

export type OrderStatus = "in_transit" | "pending" | "delivered" | "failed";

export function getStatusMap(colors: ReturnType<typeof useTheme>["colors"]) {
  return {
    in_transit: {
      label: "Transit",
      fg: colors.info,
      bg: colors.infoBg,
      icon: "truck" as const,
    },
    pending: {
      label: "Pending",
      fg: colors.warning,
      bg: colors.warningBg,
      icon: "shopping-bag" as const,
    },
    delivered: {
      label: "Done",
      fg: colors.success,
      bg: colors.successBg,
      icon: "check-circle" as const,
    },
    failed: {
      label: "Failed",
      fg: colors.error,
      bg: colors.errorBg,
      icon: "x-circle" as const,
    },
  } as const;
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export const DUMMY_STATS = { total: 18, delivered: 11, inTransit: 5, failed: 2 };

export const DUMMY_ORDERS: {
  id: string;
  item: string;
  customer: string;
  area: string;
  status: OrderStatus;
  time: string;
}[] = [
  {
    id: "1",
    item: "Adire Maxi Dress × 2",
    customer: "Amara Obi",
    area: "Lekki Phase 1",
    status: "in_transit",
    time: "12m ago",
  },
  {
    id: "2",
    item: "Ankara Tote Bag",
    customer: "Tunde Bello",
    area: "Yaba",
    status: "pending",
    time: "34m ago",
  },
  {
    id: "3",
    item: "Beaded Necklace Set",
    customer: "Chisom Eze",
    area: "Surulere",
    status: "delivered",
    time: "1h ago",
  },
];

export const QUICK_ACTIONS: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  route?: string;
}[] = [
  { icon: "map", label: "Fleet map", route: "/(screens)/fleet-map" },
  { icon: "bar-chart-2", label: "Analytics", route: "/(screens)/analytics" },
  { icon: "clipboard", label: "Export CSV" },
  { icon: "link-2", label: "Copy link" },
];
