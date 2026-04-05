/**
 * StatusPill — order status badge with dot prefix.
 * Design system: DS §8.4, §2.4
 *
 * Usage:
 *   <StatusPill status="in_transit" />
 *   <StatusPill status="delivered" />
 */
import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "@/src/stores/themeStore";
import { font, radius } from "@/src/constants/tokens";

export type OrderStatus =
  | "pending"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "failed";

function useStatusConfig(status: OrderStatus) {
  const { colors } = useTheme();
  switch (status) {
    case "pending":
      return { label: "Pending", fg: colors.warning, bg: colors.warningBg };
    case "picked_up":
      return { label: "Picked Up", fg: colors.info, bg: colors.infoBg };
    case "in_transit":
      return { label: "In Transit", fg: colors.info, bg: colors.infoBg };
    case "delivered":
      return { label: "Delivered", fg: colors.success, bg: colors.successBg };
    case "failed":
      return { label: "Failed", fg: colors.error, bg: colors.errorBg };
  }
}

interface StatusPillProps {
  status: OrderStatus;
  style?: ViewStyle;
}

export const StatusPill = React.memo(function StatusPill({
  status,
  style,
}: StatusPillProps) {
  const { fg, bg, label } = useStatusConfig(status);

  return (
    <View style={[styles.pill, { backgroundColor: bg }, style]}>
      <View style={[styles.dot, { backgroundColor: fg }]} />
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: radius.full,
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: radius.full,
  },
  label: {
    fontSize: 10,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
});
