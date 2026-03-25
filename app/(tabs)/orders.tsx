/**
 * Orders tab — searchable, filterable order list (DS §8.1, §8.4).
 */
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOrders } from "@/src/hooks/useOrders";
import { useSession } from "@/src/hooks/useSession";
import { useTheme } from "@/src/stores/themeStore";
import { font, layout, radius } from "@/src/constants/tokens";
import { formatRelativeTime } from "@/src/utils/helpers";

// Shared Components
import { OrderCard } from "@/src/components/home/order-card";

// Orders Features
import { FilterKey } from "@/src/components/orders/order-types";
import { OrderSearchBar } from "@/src/components/orders/order-search-bar";
import { OrderFilterTabs } from "@/src/components/orders/order-filter-tabs";
import { OrderEmptyState } from "@/src/components/orders/order-empty-state";

// ── Skeleton ───────────────────────────────────────────────────────────────────
function OrderCardSkeleton({ colors }: { colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <View style={[sk.card, { backgroundColor: colors.surfaceCard }]}>
      <View style={[sk.icon, { backgroundColor: colors.surfaceContainer }]} />
      <View style={sk.body}>
        <View style={[sk.line, { backgroundColor: colors.surfaceContainer, width: "60%" }]} />
        <View style={[sk.line, { backgroundColor: colors.surfaceContainer, width: "38%", marginTop: 6 }]} />
      </View>
      <View style={sk.right}>
        <View style={[sk.pill, { backgroundColor: colors.surfaceContainer }]} />
        <View style={[sk.time, { backgroundColor: colors.surfaceContainer }]} />
      </View>
    </View>
  );
}
const sk = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", borderRadius: radius.xl, padding: layout.cardPadding, gap: 12, marginBottom: layout.listGap },
  icon: { width: 42, height: 42, borderRadius: radius.lg, flexShrink: 0 },
  body: { flex: 1 },
  line: { height: 12, borderRadius: 6 },
  right: { alignItems: "flex-end", gap: 5, flexShrink: 0 },
  pill: { height: 20, width: 64, borderRadius: radius.full },
  time: { height: 9, width: 30, borderRadius: 4 },
});

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { userId } = useSession();
  const { data: orders = [], isLoading } = useOrders(userId);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = orders.filter((o) => {
    const matchesFilter = filter === "all" || o.status === filter;
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      o.item.toLowerCase().includes(q) ||
      (o.customer_name ?? "").toLowerCase().includes(q) ||
      (o.city ?? "").toLowerCase().includes(q);
    return matchesFilter && matchesQuery;
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + layout.screenPaddingTop },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Page title ────────────────────────────────────────────────── */}
        <View style={styles.titleBlock}>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>
            Orders
          </Text>
          <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
            {isLoading ? "Loading…" : `${orders.length} total`}
          </Text>
        </View>

        {/* ── Search bar ────────────────────────────────────────────────── */}
        <OrderSearchBar query={query} setQuery={setQuery} />

        {/* ── Filter tabs ───────────────────────────────────────────────── */}
        <OrderFilterTabs filter={filter} setFilter={setFilter} />

        {/* ── Order list ────────────────────────────────────────────────── */}
        {isLoading ? (
          <>
            <OrderCardSkeleton colors={colors} />
            <OrderCardSkeleton colors={colors} />
            <OrderCardSkeleton colors={colors} />
            <OrderCardSkeleton colors={colors} />
          </>
        ) : filtered.length === 0 ? (
          <OrderEmptyState filter={filter} />
        ) : (
          filtered.map((o) => (
            <OrderCard
              key={o.id}
              id={o.id}
              item={o.item}
              customer={o.customer_name ?? "Unknown"}
              area={o.city ?? o.delivery_address?.split(",").pop()?.trim() ?? "—"}
              status={o.status}
              time={formatRelativeTime(o.created_at)}
            />
          ))
        )}

        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: layout.screenPaddingH },

  titleBlock: { paddingTop: 8, marginBottom: 14 },
  pageTitle: {
    fontSize: 20,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.6,
    marginBottom: 2,
  },
  pageSubtitle: {
    fontSize: 12,
    fontFamily: font.sans.regular,
  },
});
