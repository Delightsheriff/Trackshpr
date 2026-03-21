/**
 * Home / Dashboard tab (DS §8.1, §8.4).
 */
import { font, gradients, layout, radius } from "@/src/constants/tokens";
import { useTheme } from "@/src/stores/themeStore";
import { supabase } from "@/src/lib/supabase";
import { fetchProfile } from "@/src/lib/profiles";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

// ── Dummy data — TODO: replace with real Supabase query ──────────────────────
const DUMMY_STATS = { total: 18, delivered: 11, inTransit: 5, failed: 2 };

const DUMMY_ORDERS = [
  { id: "1", item: "Adire Maxi Dress × 2", customer: "Amara Obi",
    area: "Lekki Phase 1", status: "in_transit" as const, time: "12m ago" },
  { id: "2", item: "Ankara Tote Bag",       customer: "Tunde Bello",
    area: "Yaba",          status: "pending"    as const, time: "34m ago" },
  { id: "3", item: "Beaded Necklace Set",   customer: "Chisom Eze",
    area: "Surulere",      status: "delivered"  as const, time: "1h ago" },
];

const QUICK_ACTIONS: { icon: string; label: string; route?: string }[] = [
  { icon: "🗺️", label: "Fleet map",  route: "/(screens)/fleet-map" },
  { icon: "📊", label: "Analytics",  route: "/(screens)/analytics" },
  { icon: "📋", label: "Export CSV" },
  { icon: "🔗", label: "Copy link" },
];

// ── Status config ─────────────────────────────────────────────────────────────
type OrderStatus = "in_transit" | "pending" | "delivered" | "failed";

// STATUS_MAP is resolved at render time from live colors — built inline per component
function getStatusMap(colors: ReturnType<typeof useTheme>["colors"]) {
  return {
    in_transit: { label: "In Transit", fg: colors.info,    bg: colors.infoBg,    emoji: "📦" },
    pending:    { label: "Pending",    fg: colors.warning, bg: colors.warningBg, emoji: "🛍️" },
    delivered:  { label: "Delivered",  fg: colors.success, bg: colors.successBg, emoji: "✅" },
    failed:     { label: "Failed",     fg: colors.error,   bg: colors.errorBg,   emoji: "❌" },
  } as const;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning 👋";
  if (h < 17) return "Good afternoon 👋";
  return "Good evening 👋";
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: OrderStatus }) {
  const { colors } = useTheme();
  const cfg = getStatusMap(colors)[status];
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
  const { colors, isDark } = useTheme();
  const cfg = getStatusMap(colors)[status];
  const cardShadow = isDark
    ? { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 4 }
    : { shadowColor: "rgba(48,41,80,1)", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 };
  return (
    <View style={[styles.orderCard, { backgroundColor: colors.surfaceCard }, cardShadow]}>
      <View style={[styles.orderIcon, { backgroundColor: cfg.bg }]}>
        <Text style={styles.orderIconEmoji}>{cfg.emoji}</Text>
      </View>
      <View style={styles.orderInfo}>
        <Text style={[styles.orderName, { color: colors.textPrimary }]} numberOfLines={1}>{item}</Text>
        <Text style={[styles.orderMeta, { color: colors.textMuted }]}>{customer} · {area}</Text>
      </View>
      <View style={styles.orderRight}>
        <StatusPill status={status} />
        <Text style={[styles.orderTime, { color: colors.textMuted }]}>{time}</Text>
      </View>
    </View>
  );
}

// ── Profile incomplete banner ──────────────────────────────────────────────────
function IncompleteProfileBanner() {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => router.push("/(auth)/profile-setup")}
      style={[styles.profileBanner, { backgroundColor: colors.warningBg }]}
    >
      <View style={[styles.bannerIcon, { backgroundColor: "rgba(245,166,35,0.2)" }]}>
        <Text style={{ fontSize: 16 }}>🏪</Text>
      </View>
      <View style={styles.bannerText}>
        <Text style={[styles.bannerTitle, { color: colors.warning }]}>
          Complete your profile
        </Text>
        <Text style={[styles.bannerSub, { color: colors.textSecondary }]}>
          Add your business name so customers{'\n'}recognise you on tracking pages
        </Text>
      </View>
      <Feather name="chevron-right" size={18} color={colors.warning} />
    </Pressable>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [profileIncomplete, setProfileIncomplete] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) return;

    async function checkProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        const profile = await fetchProfile(user.id);
        setProfileIncomplete(!profile?.onboarding_complete);
      } catch {
        setProfileIncomplete(false);
      }
    }
    checkProfile();
  }, [isFocused]);

  const statCardShadow = isDark
    ? { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 4 }
    : { shadowColor: "rgba(48,41,80,1)", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 };

  const chipShadow = isDark
    ? { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 4 }
    : { shadowColor: "rgba(48,41,80,1)", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 };

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + layout.screenPaddingTop },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile incomplete banner ─────────────────────────────── */}
        {profileIncomplete && (
          <IncompleteProfileBanner />
        )}

        {/* ── Header ───────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textMuted }]}>{greeting()}</Text>
            <Text style={[styles.businessName, { color: colors.textPrimary }]}>Zara&apos;s Closet</Text>
          </View>
          <View style={styles.avatarWrap}>
            <LinearGradient
              colors={gradients.avatar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarInitial}>Z</Text>
            </LinearGradient>
            <View style={[styles.notifDot, { borderColor: colors.surface }]} />
          </View>
        </View>

        {/* ── Hero stat card ────────────────────────────────────────────── */}
        <View style={styles.heroCardShadow}>
          <LinearGradient
            colors={["#4647D3", "#5354e8", "#6366f1"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroOrb1} />
            <View style={styles.heroOrb2} />
            <View style={styles.heroLeft}>
              <Text style={styles.heroLabel}>Today&apos;s Deliveries</Text>
              <Text style={styles.heroNum}>{DUMMY_STATS.total}</Text>
              <Text style={styles.heroSub}>↑ 3 more than yesterday</Text>
            </View>
            <View style={styles.heroIconWrap}>
              <Text style={styles.heroIconEmoji}>🚴</Text>
            </View>
          </LinearGradient>
        </View>

        {/* ── Mini stat row ─────────────────────────────────────────────── */}
        <View style={styles.statRow}>
          <View style={[styles.statMini, { backgroundColor: colors.surfaceCard }, statCardShadow]}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Done</Text>
            <Text style={[styles.statNum, { color: colors.success }]}>
              {DUMMY_STATS.delivered}
            </Text>
          </View>
          <View style={[styles.statMini, { backgroundColor: colors.surfaceCard }, statCardShadow]}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Moving</Text>
            <Text style={[styles.statNum, { color: colors.warning }]}>
              {DUMMY_STATS.inTransit}
            </Text>
          </View>
          <View style={[styles.statMini, { backgroundColor: colors.surfaceCard }, statCardShadow]}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Failed</Text>
            <Text style={[styles.statNum, { color: colors.error }]}>
              {DUMMY_STATS.failed}
            </Text>
          </View>
        </View>

        {/* ── Quick actions ─────────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickRow}
        >
          {QUICK_ACTIONS.map(({ icon, label, route }) => (
            <Pressable
              key={label}
              style={[styles.quickChip, { backgroundColor: colors.surfaceCard }, chipShadow]}
              onPress={route ? () => router.push(route as any) : undefined}
            >
              <Text style={styles.quickChipIcon}>{icon}</Text>
              <Text style={[styles.quickChipLabel, { color: colors.textPrimary }]}>{label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Active orders ─────────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Active Orders</Text>
          <Text style={[styles.sectionLink, { color: colors.primary }]}>See all</Text>
        </View>

        {DUMMY_ORDERS.map((o) => (
          <OrderCard key={o.id} {...o} />
        ))}

        <View style={{ height: 16 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: layout.screenPaddingH },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: layout.sectionGap,
    paddingTop: 6,
  },
  greeting: {
    fontSize: 12,
    fontFamily: font.sans.regular,
    marginBottom: 2,
  },
  businessName: {
    fontSize: 20,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitial: {
    fontSize: 16,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  notifDot: {
    position: "absolute",
    top: -3,
    right: -3,
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: "#DC2626",
    borderWidth: 2,
  },

  // Hero card
  heroCardShadow: {
    borderRadius: radius.card,
    marginBottom: 10,
    shadowColor: "#4647D3",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
    backgroundColor: "#4647D3",
  },
  heroCard: {
    borderRadius: radius.card,
    padding: 18,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    overflow: "hidden",
  },
  heroOrb1: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.06)",
    top: -30,
    right: -20,
  },
  heroOrb2: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.04)",
    bottom: -20,
    right: 40,
  },
  heroLeft: { zIndex: 1 },
  heroLabel: {
    fontSize: 10,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.60)",
    marginBottom: 4,
  },
  heroNum: {
    fontSize: 40,
    fontFamily: font.mono.medium,
    fontWeight: "700",
    letterSpacing: -1.6,
    color: "#FFFFFF",
    lineHeight: 44,
  },
  heroSub: {
    fontSize: 11,
    fontFamily: font.sans.regular,
    color: "rgba(255,255,255,0.50)",
    marginTop: 4,
  },
  heroIconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  heroIconEmoji: { fontSize: 22 },

  // Mini stats
  statRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: layout.sectionGap,
  },
  statMini: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    paddingHorizontal: 10,
  },
  statLabel: {
    fontSize: 9,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    letterSpacing: 0.45,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  statNum: {
    fontSize: 22,
    fontFamily: font.mono.medium,
    fontWeight: "700",
    letterSpacing: -0.44,
  },

  // Quick actions
  quickRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 2,
    marginBottom: layout.sectionGap,
  },
  quickChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
  quickChipIcon: { fontSize: 14 },
  quickChipLabel: {
    fontSize: 12,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
  },

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

  // Order card
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
  orderIconEmoji: { fontSize: 17 },
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

  // Status pill (DS §8.4)
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

  // Profile incomplete banner (DS §11.4)
  profileBanner: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.xl,
    padding: 12,
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: layout.listGap,
  },
  bannerIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  bannerText: {
    flex: 1,
    minWidth: 0,
  },
  bannerTitle: {
    fontSize: 13,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.13,
    marginBottom: 2,
  },
  bannerSub: {
    fontSize: 11,
    fontFamily: font.sans.regular,
    lineHeight: 15,
  },

  emptyText: {
    fontSize: 13,
    fontFamily: font.sans.regular,
    textAlign: "center",
    paddingVertical: 24,
  },
});
