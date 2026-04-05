import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "@/src/stores/themeStore";
import { font, radius } from "@/src/constants/tokens";
import { FilterKey } from "./order-types";

const EMPTY_CONFIG: Record<
  FilterKey,
  { title: string; sub: string; showCta: boolean }
> = {
  all: {
    title: "No deliveries yet",
    sub: "Create your first delivery and send a tracking link to your customer.",
    showCta: true,
  },
  pending: {
    title: "No pending orders",
    sub: "All your orders are out for delivery.",
    showCta: false,
  },
  picked_up: {
    title: "No picked-up orders",
    sub: "Orders riders have collected will appear here.",
    showCta: false,
  },
  in_transit: {
    title: "No orders in transit",
    sub: "Active deliveries will appear here once a rider is on the way.",
    showCta: false,
  },
  delivered: {
    title: "No delivered orders yet",
    sub: "Completed deliveries will appear here.",
    showCta: false,
  },
  failed: {
    title: "No failed orders",
    sub: "Orders that couldn't be delivered will appear here.",
    showCta: false,
  },
};

export function OrderEmptyState({ filter }: { filter: FilterKey }) {
  const { colors } = useTheme();
  const cfg = EMPTY_CONFIG[filter] ?? EMPTY_CONFIG.all;

  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIconWrap, { backgroundColor: colors.primarySoft }]}>
        <Feather name="clipboard" size={32} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        {cfg.title}
      </Text>
      <Text style={[styles.emptySub, { color: colors.textMuted }]}>
        {cfg.sub}
      </Text>
      {cfg.showCta && (
        <Pressable
          onPress={() => router.push("/(modals)/new-delivery")}
          style={[styles.emptyCta, { backgroundColor: colors.primarySoft }]}
        >
          <Feather name="plus" size={14} color={colors.primary} />
          <Text style={[styles.emptyCtaText, { color: colors.primary }]}>
            New Delivery
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 8,
  },
  emptyIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.34,
    textAlign: "center",
  },
  emptySub: {
    fontSize: 13,
    fontFamily: font.sans.regular,
    textAlign: "center",
    maxWidth: 260,
  },
  emptyCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radius.full,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 4,
  },
  emptyCtaText: {
    fontSize: 14,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
});
