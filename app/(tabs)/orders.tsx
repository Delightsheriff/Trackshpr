/**
 * Orders tab — paginated, server-side filtered + debounced-search order list.
 * DS §8.1, §10.2, §11.2, §11.3 — FlashList, error state, empty state, skeletons.
 */
import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useInfiniteOrders } from "@/src/hooks/useOrders";
import { useSession } from "@/src/hooks/useSession";
import { useTheme } from "@/src/stores/themeStore";
import { font, layout, radius } from "@/src/constants/tokens";
import { formatRelativeTime } from "@/src/utils/helpers";
import { Feather } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";

// Shared Components
import { OrderCard } from "@/src/components/home/order-card";
import type { Order } from "@/src/lib/supabaseQueries";

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

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");

  // Debounce search input — 300ms
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedQuery(query), 300);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [query]);

  const statusFilter = filter === "all" ? null : filter;

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteOrders(userId, statusFilter, debouncedQuery);

  const orders = data?.pages.flatMap((p) => p) ?? [];

  const renderItem = ({ item: o }: { item: Order }) => (
    <OrderCard
      id={o.id}
      orderId={o.order_number ? `#${o.order_number}` : `TRK-${o.id.slice(0, 6).toUpperCase()}`}
      item={o.item}
      customer={o.customer_name ?? "Unknown"}
      rider={o.rider_name ?? "—"}
      area={o.city ?? o.delivery_address?.split(",").pop()?.trim() ?? "—"}
      status={(o.status ?? "pending") as any}
      time={formatRelativeTime(o.created_at ?? '')}
    />
  );

  const handleTabChange = (key: FilterKey) => {
    setFilter(key);
    setQuery("");
    setDebouncedQuery("");
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* ── Fixed header (title + search + tabs) ─────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + layout.screenPaddingTop }]}>
        <View style={styles.titleBlock}>
          <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Orders</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
            {isLoading ? "Loading…" : `${orders.length} loaded`}
          </Text>
        </View>
        <OrderSearchBar query={query} setQuery={setQuery} />
        <OrderFilterTabs filter={filter} setFilter={handleTabChange} />
      </View>

      {/* ── Content ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <View style={styles.listContent}>
          <OrderCardSkeleton colors={colors} />
          <OrderCardSkeleton colors={colors} />
          <OrderCardSkeleton colors={colors} />
          <OrderCardSkeleton colors={colors} />
        </View>
      ) : isError ? (
        <View style={styles.errorState}>
          <View style={[styles.errorIconWrap, { backgroundColor: colors.errorBg }]}>
            <Feather name="wifi-off" size={28} color={colors.error} />
          </View>
          <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>
            Couldn't load orders
          </Text>
          <Text style={[styles.errorSub, { color: colors.textMuted }]}>
            Check your connection and try again.
          </Text>
          <Pressable
            onPress={() => refetch()}
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.retryBtnText}>Try Again</Text>
          </Pressable>
        </View>
      ) : (
        <FlashList
          data={orders}
          keyExtractor={(o) => o.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerSkeletons}>
                <OrderCardSkeleton colors={colors} />
                <OrderCardSkeleton colors={colors} />
              </View>
            ) : null
          }
          ListEmptyComponent={<OrderEmptyState filter={filter} />}
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  header: { paddingHorizontal: layout.screenPaddingH },

  listContent: {
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: 24,
    paddingTop: 4,
  },

  titleBlock: { paddingTop: 8, marginBottom: 14 },
  pageTitle: {
    fontSize: 20,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.6,
    marginBottom: 2,
  },
  pageSubtitle: { fontSize: 12, fontFamily: font.sans.regular },

  // Error state
  errorState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: 64,
  },
  errorIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  errorTitle: { fontSize: 17, fontFamily: font.sans.bold, fontWeight: "700", letterSpacing: -0.34 },
  errorSub: { fontSize: 13, fontFamily: font.sans.regular, textAlign: "center", marginBottom: 4 },
  retryBtn: { borderRadius: radius.full, paddingVertical: 12, paddingHorizontal: 28, marginTop: 4 },
  retryBtnText: { fontSize: 14, fontFamily: font.sans.bold, fontWeight: "700", color: "#fff" },

  footerSkeletons: { paddingTop: 4 },
});
