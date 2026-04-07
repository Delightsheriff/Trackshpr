/**
 * Home / Dashboard tab (DS §8.1, §8.4).
 */
import React from "react";
import { View, StyleSheet, Text, Pressable } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSession } from "@/src/hooks/useSession";
import { useProfile } from "@/src/hooks/useProfile";
import {
  useActiveOrders,
  useTodayStats,
  useOrdersRealtime,
} from "@/src/hooks/useOrders";
import { useTheme } from "@/src/stores/themeStore";
import { layout, font, radius } from "@/src/constants/tokens";
import type { Order } from "@/src/lib/supabaseQueries";

// Extracted Components
import { HomeHeader } from "@/src/components/home/home-header";
import { HeroStatCard } from "@/src/components/home/hero-stat-card";
import { MiniStatRow } from "@/src/components/home/mini-stat-row";
import { QuickActionsRow } from "@/src/components/home/quick-actions-row";
import { OrderCard } from "@/src/components/home/order-card";
import { IncompleteProfileBanner } from "@/src/components/home/incomplete-profile-banner";
import { formatRelativeTime } from "@/src/utils/helpers";
import type { OrderStatus } from "@/src/components/home/home-types";

// ── Skeletons ──────────────────────────────────────────────────────────────────
function HeroSkeleton({ colors }: { colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <View style={[sk.heroCard, { backgroundColor: colors.surfaceContainer }]}>
      <View style={sk.heroLeft}>
        <View style={[sk.heroLabel, { backgroundColor: colors.surfaceHighlight }]} />
        <View style={[sk.heroNum, { backgroundColor: colors.surfaceHighlight }]} />
        <View style={[sk.heroSub, { backgroundColor: colors.surfaceHighlight }]} />
      </View>
      <View style={[sk.heroIcon, { backgroundColor: colors.surfaceHighlight }]} />
    </View>
  );
}

function MiniStatSkeleton({ colors }: { colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <View style={sk.miniRow}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[sk.miniCard, { backgroundColor: colors.surfaceCard }]}>
          <View style={[sk.miniLabel, { backgroundColor: colors.surfaceContainer }]} />
          <View style={[sk.miniNum, { backgroundColor: colors.surfaceContainer }]} />
        </View>
      ))}
    </View>
  );
}

function OrderCardSkeleton({ colors }: { colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <View style={[sk.orderCard, { backgroundColor: colors.surfaceCard }]}>
      <View style={[sk.orderIcon, { backgroundColor: colors.surfaceContainer }]} />
      <View style={sk.orderBody}>
        <View style={[sk.orderLine, { backgroundColor: colors.surfaceContainer, width: "60%" }]} />
        <View style={[sk.orderLine, { backgroundColor: colors.surfaceContainer, width: "38%", marginTop: 6 }]} />
      </View>
      <View style={sk.orderRight}>
        <View style={[sk.orderPill, { backgroundColor: colors.surfaceContainer }]} />
        <View style={[sk.orderTime, { backgroundColor: colors.surfaceContainer }]} />
      </View>
    </View>
  );
}

const sk = StyleSheet.create({
  // Hero
  heroCard: { borderRadius: radius.card, padding: 18, paddingBottom: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  heroLeft: { gap: 8 },
  heroLabel: { height: 10, width: 110, borderRadius: 5 },
  heroNum: { height: 38, width: 56, borderRadius: 8 },
  heroSub: { height: 9, width: 72, borderRadius: 4 },
  heroIcon: { width: 52, height: 52, borderRadius: radius.full },
  // Mini stats
  miniRow: { flexDirection: "row", gap: 8, marginBottom: layout.sectionGap },
  miniCard: { flex: 1, borderRadius: 16, padding: 12, paddingHorizontal: 10 },
  miniLabel: { height: 9, width: 28, borderRadius: 4, marginBottom: 10 },
  miniNum: { height: 24, width: 24, borderRadius: 6 },
  // Order card
  orderCard: { flexDirection: "row", alignItems: "center", borderRadius: radius.xl, padding: layout.cardPadding, gap: 12, marginBottom: layout.listGap },
  orderIcon: { width: 42, height: 42, borderRadius: radius.lg, flexShrink: 0 },
  orderBody: { flex: 1 },
  orderLine: { height: 12, borderRadius: 6 },
  orderRight: { alignItems: "flex-end", gap: 5, flexShrink: 0 },
  orderPill: { height: 20, width: 64, borderRadius: radius.full },
  orderTime: { height: 9, width: 30, borderRadius: 4 },
});

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const { userId } = useSession();
  const { data: profile } = useProfile(userId);
  const {
    data: activeOrders = [],
    isLoading: ordersLoading,
    isError: ordersError,
  } = useActiveOrders(userId);
  const { data: stats, isLoading: statsLoading } = useTodayStats(userId);

  // Subscribe to live order changes
  useOrdersRealtime(userId);

  const businessName = profile?.business_name ?? "";
  const initial = businessName.charAt(0).toUpperCase() || "?";

  // Show at most 3 active orders on the dashboard
  const dashboardOrders = activeOrders.slice(0, 3);

  // ── List header ────────────────────────────────────────────────────────────
  const ListHeader = (
    <View>
      {/* Profile incomplete banner */}
      {profile && profile.onboarding_complete === false && (
        <IncompleteProfileBanner onPress={() => router.push("/(auth)/profile-setup")} />
      )}

      {/* Header */}
      <HomeHeader
        businessName={businessName}
        initial={initial}
        logoUrl={profile?.logo_url}
        updatedAt={profile?.updated_at}
      />

      {/* Hero stat card */}
      {statsLoading ? (
        <HeroSkeleton colors={colors} />
      ) : (
        <HeroStatCard total={stats?.total ?? 0} />
      )}

      {/* Mini stat row */}
      {statsLoading ? (
        <MiniStatSkeleton colors={colors} />
      ) : (
        <MiniStatRow
          delivered={stats?.delivered ?? 0}
          inTransit={stats?.inTransit ?? 0}
          failed={stats?.failed ?? 0}
        />
      )}

      {/* Quick actions */}
      <QuickActionsRow />

      {/* Active orders section header */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Active Orders
        </Text>
        <Pressable onPress={() => router.navigate("/(tabs)/orders")} hitSlop={8}>
          <Text style={[styles.sectionLink, { color: colors.primary }]}>
            See all
          </Text>
        </Pressable>
      </View>

      {/* Loading skeletons */}
      {ordersLoading && (
        <>
          <OrderCardSkeleton colors={colors} />
          <OrderCardSkeleton colors={colors} />
          <OrderCardSkeleton colors={colors} />
        </>
      )}

      {/* Error state */}
      {ordersError && !ordersLoading && (
        <View style={styles.emptyWrap}>
          <Feather name="alert-circle" size={28} color={colors.error} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            Could not load orders
          </Text>
          <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
            Check your connection and pull down to refresh.
          </Text>
        </View>
      )}
    </View>
  );

  // ── Empty state (no active orders, not loading, no error) ──────────────────
  const EmptyComponent = !ordersLoading && !ordersError ? (
    <View style={styles.emptyWrap}>
      <Feather name="package" size={28} color={colors.textMuted} />
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
        No active orders
      </Text>
      <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
        Tap "New Delivery" to create your first order.
      </Text>
    </View>
  ) : null;

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <FlashList
        data={ordersLoading || ordersError ? [] : dashboardOrders}
        keyExtractor={(item: Order) => item.id}
        renderItem={({ item: o }: { item: Order }) => (
          <OrderCard
            key={o.id}
            id={o.id}
            item={o.item}
            customer={o.customer_name ?? "Unknown"}
            area={o.delivery_address?.split(",").pop()?.trim() ?? "—"}
            status={(o.status ?? "pending") as OrderStatus}
            time={formatRelativeTime(o.created_at ?? "")}
          />
        )}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={EmptyComponent}
        ListFooterComponent={<View style={{ height: 16 }} />}
        contentContainerStyle={{
          paddingHorizontal: layout.screenPaddingH,
          paddingTop: insets.top + layout.screenPaddingTop,
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.15,
  },
  sectionLink: {
    fontSize: 12,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
  },

  // Empty / error state
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    letterSpacing: -0.14,
  },
  emptyBody: {
    fontSize: 12,
    fontFamily: font.sans.regular,
    textAlign: "center",
    maxWidth: 240,
  },
});
