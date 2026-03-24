/**
 * Orders tab — searchable, filterable order list (DS §8.1, §8.4).
 * TODO: replace DUMMY_ORDERS_FULL with real Supabase query.
 */
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/src/stores/themeStore";
import { font, layout } from "@/src/constants/tokens";

// Shared Components
import { OrderCard } from "@/src/components/home/order-card";

// Orders Features
import { DUMMY_ORDERS_FULL, FilterKey } from "@/src/components/orders/order-types";
import { OrderSearchBar } from "@/src/components/orders/order-search-bar";
import { OrderFilterTabs } from "@/src/components/orders/order-filter-tabs";
import { OrderEmptyState } from "@/src/components/orders/order-empty-state";

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = DUMMY_ORDERS_FULL.filter((o) => {
    const matchesFilter = filter === "all" || o.status === filter;
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      o.item.toLowerCase().includes(q) ||
      o.customer.toLowerCase().includes(q) ||
      o.area.toLowerCase().includes(q);
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
            147 total · 18 today
          </Text>
        </View>

        {/* ── Search bar ────────────────────────────────────────────────── */}
        <OrderSearchBar query={query} setQuery={setQuery} />

        {/* ── Filter tabs ───────────────────────────────────────────────── */}
        <OrderFilterTabs filter={filter} setFilter={setFilter} />

        {/* ── Order list ────────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <OrderEmptyState filter={filter} />
        ) : (
          filtered.map((o) => <OrderCard key={o.id} {...o} />)
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
