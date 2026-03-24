import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/src/stores/themeStore";
import { radius, font } from "@/src/constants/tokens";
import { OrderStatus, getStatusMap } from "./home-types";

export function StatusPill({ status }: { status: OrderStatus }) {
  const { colors } = useTheme();
  const cfg = getStatusMap(colors)[status];
  return (
    <View style={[styles.pill, { backgroundColor: cfg.bg }]}>
      <View style={[styles.pillDot, { backgroundColor: cfg.fg }]} />
      <Text style={[styles.pillText, { color: cfg.fg }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: radius.full,
    gap: 4,
  },
  pillDot: {
    width: 5,
    height: 5,
    borderRadius: radius.full,
  },
  pillText: {
    fontSize: 10,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
});
