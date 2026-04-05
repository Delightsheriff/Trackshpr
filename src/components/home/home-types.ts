import React from "react";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/src/stores/themeStore";

export type OrderStatus = "in_transit" | "picked_up" | "pending" | "delivered" | "failed";

export function getStatusMap(colors: ReturnType<typeof useTheme>["colors"]) {
  return {
    in_transit: {
      label: "In Transit",
      fg: colors.info,
      bg: colors.infoBg,
      icon: "truck" as const,
    },
    picked_up: {
      label: "Picked Up",
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
