import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "@/src/stores/themeStore";
import { radius, font, layout } from "@/src/constants/tokens";
import { OrderStatus, getStatusMap } from "./home-types";
import { StatusPill } from "./status-pill";

export function OrderCard({
  id,
  item,
  customer,
  area,
  status,
  time,
}: {
  id: string;
  item: string;
  customer: string;
  area: string;
  status: OrderStatus;
  time: string;
}) {
  const { colors, isDark } = useTheme();
  const cfg = getStatusMap(colors)[status];
  const cardShadow = isDark
    ? {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 4,
      }
    : {
        shadowColor: "rgba(48,41,80,1)",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      };
      
  return (
    <Pressable
      style={[
        styles.orderCard,
        { backgroundColor: colors.surfaceCard },
        cardShadow,
      ]}
      onPress={() =>
        router.push({ pathname: "/(screens)/order-detail", params: { id } })
      }
      android_ripple={{ color: colors.surfaceContainer, borderless: false }}
    >
      <View style={[styles.orderIcon, { backgroundColor: cfg.bg }]}>
        <Feather name={cfg.icon} size={16} color={cfg.fg} />
      </View>
      <View style={styles.orderInfo}>
        <Text
          style={[styles.orderName, { color: colors.textPrimary }]}
          numberOfLines={1}
        >
          {item}
        </Text>
        <Text style={[styles.orderMeta, { color: colors.textMuted }]}>
          {customer} · {area}
        </Text>
      </View>
      <View style={styles.orderRight}>
        <StatusPill status={status} />
        <Text style={[styles.orderTime, { color: colors.textMuted }]}>
          {time}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  orderCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.xl,
    padding: layout.cardPadding,
    gap: 12,
    marginBottom: layout.listGap,
  },
  orderIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  orderInfo: { flex: 1, minWidth: 0 },
  orderName: {
    fontSize: 13,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.13,
    marginBottom: 2,
  },
  orderMeta: {
    fontSize: 11,
    fontFamily: font.sans.regular,
  },
  orderRight: {
    alignItems: "flex-end",
    gap: 4,
    flexShrink: 0,
  },
  orderTime: {
    fontSize: 10,
    fontFamily: font.mono.regular,
  },
});
