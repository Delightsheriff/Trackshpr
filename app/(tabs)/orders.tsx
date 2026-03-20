/**
 * Orders tab — searchable, filterable order list (DS §8.1, §8.4).
 * TODO: replace DUMMY_ORDERS_FULL with real Supabase query.
 */
import { colors, font, layout, radius } from "@/src/constants/tokens";
import { Feather } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Dummy data — TODO: replace with real Supabase query ──────────────────────
const DUMMY_ORDERS_FULL = [
  { id: "1", item: "Adire Maxi Dress × 2", customer: "Amara Obi",
    area: "Lekki",    status: "in_transit" as const, time: "12m" },
  { id: "2", item: "Ankara Tote Bag",       customer: "Tunde Bello",
    area: "Yaba",     status: "pending"    as const, time: "34m" },
  { id: "3", item: "Beaded Necklace Set",   customer: "Chisom Eze",
    area: "Surulere", status: "delivered"  as const, time: "1h" },
  { id: "4", item: "Silk Scarf (Red)",      customer: "Bisi Adeyemi",
    area: "Ikeja",    status: "failed"     as const, time: "3h" },
  { id: "5", item: "Kente Wrap Skirt",      customer: "Ngozi Obi",
    area: "VI",       status: "delivered"  as const, time: "4h" },
];

// ── Status config ─────────────────────────────────────────────────────────────
type OrderStatus = "in_transit" | "pending" | "delivered" | "failed";

const STATUS_MAP: Record<OrderStatus, { label: string; fg: string; bg: string; emoji: string }> = {
  in_transit: { label: "Transit",   fg: colors.info,    bg: colors.infoBg,    emoji: "📦" },
  pending:    { label: "Pending",   fg: colors.warning, bg: colors.warningBg, emoji: "🛍️" },
  delivered:  { label: "Done",      fg: colors.success, bg: colors.successBg, emoji: "✅" },
  failed:     { label: "Failed",    fg: colors.error,   bg: colors.errorBg,   emoji: "❌" },
};

type FilterKey = "all" | OrderStatus;

const FILTER_TABS: { key: FilterKey; label: string }[] = [
  { key: "all",        label: "All" },
  { key: "pending",    label: "Pending" },
  { key: "in_transit", label: "In Transit" },
  { key: "delivered",  label: "Delivered" },
  { key: "failed",     label: "Failed" },
];

// ── Sub-components ─────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: OrderStatus }) {
  const cfg = STATUS_MAP[status];
  return (
    <View style={[styles.pill, { backgroundColor: cfg.bg }]}>
      <View style={[styles.pillDot, { backgroundColor: cfg.fg }]} />
      <Text style={[styles.pillText, { color: cfg.fg }]}>{cfg.label}</Text>
    </View>
  );
}

function OrderCard({ item, customer, area, status, time }: {
  item: string; customer: string; area: string; status: OrderStatus; time: string;
}) {
  const cfg = STATUS_MAP[status];
  return (
    <View style={styles.orderCard}>
      <View style={[styles.orderIcon, { backgroundColor: cfg.bg }]}>
        <Text style={styles.orderIconEmoji}>{cfg.emoji}</Text>
      </View>
      <View style={styles.orderInfo}>
        <Text style={styles.orderName} numberOfLines={1}>{item}</Text>
        <Text style={styles.orderMeta}>{customer} · {area}</Text>
      </View>
      <View style={styles.orderRight}>
        <StatusPill status={status} />
        <Text style={styles.orderTime}>{time}</Text>
      </View>
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery]       = useState("");
  const [filter, setFilter]     = useState<FilterKey>("all");

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
    <View style={styles.root}>
      <StatusBar style="dark" />
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
          <Text style={styles.pageTitle}>Orders</Text>
          <Text style={styles.pageSubtitle}>147 total · 18 today</Text>
        </View>

        {/* ── Search bar ────────────────────────────────────────────────── */}
        <View style={styles.searchBar}>
          <Feather name="search" size={15} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search orders, customers..."
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Feather name="x" size={14} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* ── Filter tabs ───────────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTER_TABS.map(({ key, label }) => {
            const active = filter === key;
            return (
              <Pressable
                key={key}
                onPress={() => setFilter(key)}
                style={[styles.filterTab, active && styles.filterTabActive]}
              >
                <Text style={[styles.filterTabText, active && styles.filterTabTextActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Order list ────────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No {filter === "all" ? "" : filter.replace("_", " ")} orders</Text>
            <Text style={styles.emptySub}>Switch filters to see other orders.</Text>
          </View>
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
  root: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: layout.screenPaddingH },

  titleBlock: { paddingTop: 8, marginBottom: 14 },
  pageTitle: {
    fontSize: 20,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.6,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  pageSubtitle: {
    fontSize: 12,
    fontFamily: font.sans.regular,
    color: colors.textMuted,
  },

  // Search
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.surfaceCard,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: 14,
    shadowColor: "rgba(48,41,80,1)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: font.sans.regular,
    color: colors.textPrimary,
    padding: 0,
    margin: 0,
  },

  // Filter tabs
  filterRow: {
    flexDirection: "row",
    gap: 6,
    paddingBottom: 2,
    marginBottom: 14,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceCard,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    color: colors.textMuted,
  },
  filterTabTextActive: {
    color: colors.white,
  },

  // Order card (shared pattern with Dashboard)
  orderCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.xl,
    padding: layout.cardPadding,
    gap: 12,
    marginBottom: layout.listGap,
    shadowColor: "rgba(48,41,80,1)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  orderIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  orderIconEmoji: { fontSize: 17 },
  orderInfo: { flex: 1, minWidth: 0 },
  orderName: {
    fontSize: 13,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.13,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  orderMeta: {
    fontSize: 11,
    fontFamily: font.sans.regular,
    color: colors.textMuted,
  },
  orderRight: {
    alignItems: "flex-end",
    gap: 4,
    flexShrink: 0,
  },
  orderTime: {
    fontSize: 10,
    fontFamily: font.mono.regular,
    color: colors.textMuted,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: radius.full,
    gap: 4,
  },
  pillDot: { width: 5, height: 5, borderRadius: radius.full },
  pillText: {
    fontSize: 10,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },

  // Empty state (DS §11.2)
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 8,
  },
  emptyIcon: { fontSize: 40, marginBottom: 4 },
  emptyTitle: {
    fontSize: 17,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.34,
    textTransform: "capitalize",
  },
  emptySub: {
    fontSize: 13,
    fontFamily: font.sans.regular,
    color: colors.textMuted,
    textAlign: "center",
  },
});
