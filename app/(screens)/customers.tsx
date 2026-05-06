/**
 * Customers list screen — accessible from Settings > Address Book.
 * DS §10.2, §11.2, §11.3 — FlashList, error state, empty state, skeletons.
 */
import { font, gradients, layout, radius } from "@/src/constants/tokens";
import { useCustomers, useSession } from "@/src/hooks";
import { useTheme } from "@/src/stores/themeStore";
import type { Customer } from "@/src/lib/supabaseQueries";
import { Feather } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
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

// ── Avatar colors ─────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  { bg: "#EDE9FE", fg: "#7C3AED" },
  { bg: "#FEF3C7", fg: "#B45309" },
  { bg: "#DCFCE7", fg: "#166534" },
  { bg: "#FEE2E2", fg: "#991B1B" },
  { bg: "#DBEAFE", fg: "#1E40AF" },
];

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function CustomerSkeleton({ colors }: { colors: ReturnType<typeof useTheme>["colors"] }) {
  return (
    <View style={[sk.card, { backgroundColor: colors.surfaceCard }]}>
      <View style={[sk.avatar, { backgroundColor: colors.surfaceContainer }]} />
      <View style={sk.body}>
        <View style={[sk.line, { backgroundColor: colors.surfaceContainer, width: "50%" }]} />
        <View style={[sk.line, { backgroundColor: colors.surfaceContainer, width: "35%", marginTop: 6 }]} />
        <View style={[sk.stats, { backgroundColor: colors.surfaceContainer, marginTop: 8 }]} />
      </View>
    </View>
  );
}

const sk = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", borderRadius: radius.xl, padding: layout.cardPadding, gap: 12, marginBottom: layout.listGap },
  avatar: { width: 44, height: 44, borderRadius: radius.full, flexShrink: 0 },
  body: { flex: 1 },
  line: { height: 12, borderRadius: 6 },
  stats: { height: 18, width: 120, borderRadius: radius.full },
});

// ── Customer card ─────────────────────────────────────────────────────────────
function CustomerCard({ customer, index }: { customer: Customer; index: number }) {
  const { colors, isDark } = useTheme();
  const ac = AVATAR_COLORS[index % AVATAR_COLORS.length];

  const cardShadow = isDark
    ? { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 4 }
    : { shadowColor: "rgba(48,41,80,1)", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 };

  return (
    <Pressable
      onPress={() => router.push({ pathname: "/(screens)/customer-detail", params: { id: customer.id } })}
      android_ripple={{ color: colors.surfaceContainer, borderless: false }}
      style={[styles.card, { backgroundColor: colors.surfaceCard }, cardShadow]}
    >
      <View style={[styles.avatar, { backgroundColor: ac.bg }]}>
        <Text style={[styles.avatarText, { color: ac.fg }]}>{initials(customer.name)}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.cardName, { color: colors.textPrimary }]} numberOfLines={1}>
          {customer.name}
        </Text>
        <Text style={[styles.cardMeta, { color: colors.textMuted }]} numberOfLines={1}>
          {customer.address ?? customer.phone}
        </Text>
        <View style={styles.statsRow}>
          <View style={[styles.statBadge, { backgroundColor: colors.primarySoft }]}>
            <Text style={[styles.statText, { color: colors.primary }]}>
              {customer.order_count} orders
            </Text>
          </View>
          {customer.failed_count > 0 && (
            <View style={[styles.statBadge, { backgroundColor: colors.errorBg }]}>
              <Text style={[styles.statText, { color: colors.error }]}>
                {customer.failed_count} failed
              </Text>
            </View>
          )}
        </View>
      </View>
      <Feather name="chevron-right" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function CustomersScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { userId } = useSession();
  const { data: customers = [], isLoading, isError, refetch } = useCustomers(userId);
  const [query, setQuery] = useState("");

  const searchBarShadow = isDark
    ? { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 4 }
    : { shadowColor: "rgba(48,41,80,1)", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 };

  const filtered = customers.filter(
    (c) =>
      !query ||
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      (c.phone ?? "").toLowerCase().includes(query.toLowerCase()) ||
      (c.address ?? "").toLowerCase().includes(query.toLowerCase()),
  );

  const renderItem = ({ item, index }: { item: Customer; index: number }) => (
    <CustomerCard customer={item} index={index} />
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      {/* ── Header ────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + layout.screenPaddingTop }]}>
        <View style={styles.headerTop}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.surfaceCard }]}
          >
            <Feather name="arrow-left" size={18} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.titleBlock}>
            <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Address Book</Text>
            <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>
              {isLoading ? "Loading…" : `${customers.length} customer${customers.length !== 1 ? "s" : ""}`}
            </Text>
          </View>
        </View>

        <View style={[styles.searchBar, { backgroundColor: colors.surfaceCard }, searchBarShadow]}>
          <Feather name="search" size={15} color={colors.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search customers..."
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Feather name="x" size={14} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Content ───────────────────────────────────────────────── */}
      {isLoading ? (
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          <CustomerSkeleton colors={colors} />
          <CustomerSkeleton colors={colors} />
          <CustomerSkeleton colors={colors} />
        </ScrollView>
      ) : isError ? (
        <View style={styles.errorState}>
          <View style={[styles.errorIconWrap, { backgroundColor: colors.errorBg }]}>
            <Feather name="wifi-off" size={28} color={colors.error} />
          </View>
          <Text style={[styles.errorTitle, { color: colors.textPrimary }]}>
            Couldn&apos;t load customers
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
          data={filtered}
          keyExtractor={(c) => c.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.primarySoft }]}>
                <Feather name="users" size={32} color={colors.primary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                {query ? "No customers found" : "No customers yet"}
              </Text>
              <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                {query
                  ? "Try a different name or address."
                  : "Add your first customer to keep track of deliveries."}
              </Text>
              {!query && (
                <Pressable
                  onPress={() => router.push("/(modals)/add-customer")}
                  style={[styles.emptyCtaBtn, { backgroundColor: colors.primarySoft }]}
                >
                  <Feather name="plus" size={14} color={colors.primary} />
                  <Text style={[styles.emptyCtaText, { color: colors.primary }]}>
                    Add Customer
                  </Text>
                </Pressable>
              )}
            </View>
          }
        />
      )}

      {/* ── FAB ───────────────────────────────────────────────────── */}
      {!isLoading && !isError && (
        <View style={[styles.fab, { shadowColor: colors.primary, bottom: insets.bottom + 16 }]}>
          <Pressable
            onPress={() => router.push("/(modals)/add-customer")}
            style={styles.fabPressable}
            android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: false }}
          >
            <LinearGradient
              colors={gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fabGradient}
            >
              <Feather name="plus" size={18} color="#fff" />
              <Text style={styles.fabText}>Add Customer</Text>
            </LinearGradient>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  header: { paddingHorizontal: layout.screenPaddingH },
  headerTop: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },

  backBtn: {
    width: 34, height: 34, borderRadius: 11,
    alignItems: "center", justifyContent: "center",
    shadowColor: "rgba(48,41,80,1)", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    flexShrink: 0,
  },

  titleBlock: { flex: 1 },
  pageTitle: { fontSize: 20, fontFamily: font.sans.bold, fontWeight: "700", letterSpacing: -0.6, marginBottom: 2 },
  pageSubtitle: { fontSize: 12, fontFamily: font.sans.regular },

  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 14, paddingVertical: 11, paddingHorizontal: 14,
    marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 13, fontFamily: font.sans.regular, padding: 0, margin: 0 },

  listContent: { paddingHorizontal: layout.screenPaddingH, paddingBottom: 96, paddingTop: 4 },

  // Customer card
  card: {
    flexDirection: "row", alignItems: "center", borderRadius: radius.xl,
    padding: layout.cardPadding, gap: 12, marginBottom: layout.listGap,
  },
  avatar: { width: 44, height: 44, borderRadius: radius.full, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  avatarText: { fontSize: 15, fontFamily: font.sans.bold, fontWeight: "700" },
  cardBody: { flex: 1, minWidth: 0 },
  cardName: { fontSize: 14, fontFamily: font.sans.bold, fontWeight: "700", letterSpacing: -0.14, marginBottom: 2 },
  cardMeta: { fontSize: 12, fontFamily: font.sans.regular, marginBottom: 6 },
  statsRow: { flexDirection: "row", gap: 6 },
  statBadge: { borderRadius: radius.full, paddingVertical: 2, paddingHorizontal: 8 },
  statText: { fontSize: 10, fontFamily: font.sans.bold, fontWeight: "700" },

  // Error state
  errorState: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: layout.screenPaddingH, paddingBottom: 64 },
  errorIconWrap: { width: 56, height: 56, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  errorTitle: { fontSize: 17, fontFamily: font.sans.bold, fontWeight: "700", letterSpacing: -0.34 },
  errorSub: { fontSize: 13, fontFamily: font.sans.regular, textAlign: "center", marginBottom: 4 },
  retryBtn: { borderRadius: radius.full, paddingVertical: 12, paddingHorizontal: 28, marginTop: 4 },
  retryBtnText: { fontSize: 14, fontFamily: font.sans.bold, fontWeight: "700", color: "#fff" },

  // Empty state
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 8 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 24, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle: { fontSize: 17, fontFamily: font.sans.bold, fontWeight: "700", letterSpacing: -0.34 },
  emptySub: { fontSize: 13, fontFamily: font.sans.regular, textAlign: "center", maxWidth: 240 },
  emptyCtaBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: radius.full, paddingVertical: 10, paddingHorizontal: 20, marginTop: 4 },
  emptyCtaText: { fontSize: 14, fontFamily: font.sans.bold, fontWeight: "700" },

  // FAB
  fab: { position: "absolute", left: layout.screenPaddingH, right: layout.screenPaddingH, borderRadius: radius.full, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 8 },
  fabPressable: { borderRadius: radius.full, overflow: "hidden" },
  fabGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: radius.full, paddingVertical: 14 },
  fabText: { fontSize: 15, fontFamily: font.sans.bold, fontWeight: "700", color: "#fff" },
});
