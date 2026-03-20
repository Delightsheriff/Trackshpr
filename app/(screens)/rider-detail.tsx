/**
 * Rider Detail screen — gradient hero, stats grid, notes, recent deliveries.
 * DS §8.1, §8.4 — Feather icons, DM Sans / DM Mono fonts.
 * TODO: replace DUMMY_RIDERS with real Supabase query by id.
 */
import { font, layout, radius } from "@/src/constants/tokens";
import { useTheme } from "@/src/stores/themeStore";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Types ─────────────────────────────────────────────────────────────────────
type DeliveryStatus = "delivered" | "failed" | "in_transit";

type DeliveryItem = {
  id: string;
  item: string;
  customer: string;
  area: string;
  status: DeliveryStatus;
  time: string;
};

type Rider = {
  id: string;
  name: string;
  phone: string;
  delivered: number;
  failed: number;
  notes: string;
  deliveries: DeliveryItem[];
};

// ── Dummy data — TODO: replace with real Supabase query ──────────────────────
const DUMMY_RIDERS: Rider[] = [
  {
    id: "1",
    name: "Kunle Adeyemi",
    phone: "0803 456 7890",
    delivered: 42,
    failed: 2,
    notes: "Available Mon–Sat. Covers Island and Mainland. Fast and reliable.",
    deliveries: [
      { id: "d1", item: "Adire Maxi Dress × 2", customer: "Amara Obi", area: "Lekki", status: "delivered", time: "Today" },
      { id: "d2", item: "Kente Wrap Skirt", customer: "Ngozi Obi", area: "VI", status: "delivered", time: "Yesterday" },
      { id: "d3", item: "Beaded Necklace Set", customer: "Chisom Eze", area: "Surulere", status: "failed", time: "Mon" },
      { id: "d4", item: "Ankara Tote Bag", customer: "Tunde Bello", area: "Yaba", status: "delivered", time: "Mon" },
      { id: "d5", item: "Silk Scarf (Red)", customer: "Bisi Adeyemi", area: "Ikeja", status: "delivered", time: "Sun" },
    ],
  },
  {
    id: "2",
    name: "Emeka Musa",
    phone: "0812 345 6789",
    delivered: 28,
    failed: 1,
    notes: "",
    deliveries: [
      { id: "d6", item: "Beaded Necklace Set", customer: "Chisom Eze", area: "Surulere", status: "delivered", time: "Today" },
      { id: "d7", item: "Silver Bangles", customer: "Amara Obi", area: "Lekki", status: "delivered", time: "Yesterday" },
      { id: "d8", item: "Tie-Dye Set", customer: "Tunde Bello", area: "Yaba", status: "failed", time: "Fri" },
    ],
  },
  {
    id: "3",
    name: "Taiwo James",
    phone: "0701 234 5678",
    delivered: 15,
    failed: 3,
    notes: "Covers Mainland only. May be slow during peak hours.",
    deliveries: [
      { id: "d9", item: "Ankara Tote Bag", customer: "Tunde Bello", area: "Yaba", status: "in_transit", time: "Now" },
      { id: "d10", item: "Dashiki Set", customer: "Ngozi Obi", area: "Surulere", status: "delivered", time: "Yesterday" },
      { id: "d11", item: "Cord Bracelet", customer: "Chisom Eze", area: "Surulere", status: "failed", time: "Thu" },
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getSuccessRate(delivered: number, failed: number): number {
  const total = delivered + failed;
  if (total === 0) return 0;
  return Math.round((delivered / total) * 100);
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  value,
  label,
  valueColor,
}: {
  value: string;
  label: string;
  valueColor: string;
}) {
  const { colors, isDark } = useTheme();
  const cardShadow = isDark
    ? { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 4 }
    : { shadowColor: "rgba(48,41,80,1)", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 };
  return (
    <View style={[styles.statCard, { backgroundColor: colors.surfaceCard }, cardShadow]}>
      <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

// ── Delivery History Card ─────────────────────────────────────────────────────
function DeliveryCard({ delivery }: { delivery: DeliveryItem }) {
  const { colors, isDark } = useTheme();
  const cardShadow = isDark
    ? { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 4 }
    : { shadowColor: "rgba(48,41,80,1)", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 };

  const DELIVERY_STATUS_MAP: Record<
    DeliveryStatus,
    { label: string; fg: string; bg: string; emoji: string }
  > = {
    delivered: { label: "Done", fg: colors.success, bg: colors.successBg, emoji: "✅" },
    failed: { label: "Failed", fg: colors.error, bg: colors.errorBg, emoji: "❌" },
    in_transit: { label: "Transit", fg: colors.info, bg: colors.infoBg, emoji: "📦" },
  };

  const cfg = DELIVERY_STATUS_MAP[delivery.status];
  return (
    <View style={[styles.deliveryCard, { backgroundColor: colors.surfaceCard }, cardShadow]}>
      {/* Icon */}
      <View style={[styles.deliveryIcon, { backgroundColor: cfg.bg }]}>
        <Text style={styles.deliveryEmoji}>{cfg.emoji}</Text>
      </View>

      {/* Body */}
      <View style={styles.deliveryBody}>
        <Text style={[styles.deliveryItem, { color: colors.textPrimary }]} numberOfLines={1}>
          {delivery.item}
        </Text>
        <Text style={[styles.deliveryMeta, { color: colors.textMuted }]}>
          {delivery.customer} · {delivery.area}
        </Text>
      </View>

      {/* Right */}
      <View style={styles.deliveryRight}>
        <View style={[styles.deliveryPill, { backgroundColor: cfg.bg }]}>
          <View style={[styles.pillDot, { backgroundColor: cfg.fg }]} />
          <Text style={[styles.pillText, { color: cfg.fg }]}>{cfg.label}</Text>
        </View>
        <Text style={[styles.deliveryTime, { color: colors.textMuted }]}>{delivery.time}</Text>
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function RiderDetailScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const rider: Rider = DUMMY_RIDERS.find((r) => r.id === id) ?? DUMMY_RIDERS[0];

  const AVATAR_COLORS = [
    { bg: colors.primarySoft, fg: colors.primary },
    { bg: colors.successBg, fg: colors.success },
    { bg: colors.warningBg, fg: colors.warning },
  ];

  const avatarColor = AVATAR_COLORS[parseInt(rider.id) % AVATAR_COLORS.length];
  const successRate = getSuccessRate(rider.delivered, rider.failed);
  const initials = getInitials(rider.name);

  const cardShadow = isDark
    ? { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 4 }
    : { shadowColor: "rgba(48,41,80,1)", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 };

  function handleCall() {
    Linking.openURL("tel:" + rider.phone.replace(/\s/g, ""));
  }

  function handleWhatsApp() {
    Linking.openURL(
      "https://wa.me/234" + rider.phone.replace(/\s/g, "").replace(/^0/, "")
    );
  }

  function handleRemove() {
    router.push({
      pathname: "/(modals)/delete-rider",
      params: { id: rider.id, name: rider.name },
    });
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Gradient Hero ────────────────────────────────────────────── */}
        <LinearGradient
          colors={["#4647D3", "#5354E8", "#6366F1"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 16 }]}
        >
          {/* Decorative orbs */}
          <View style={styles.orb1} />
          <View style={styles.orb2} />

          {/* Back row */}
          <View style={styles.heroBackRow}>
            <Pressable
              style={styles.heroBackBtn}
              onPress={() => router.back()}
              hitSlop={8}
            >
              <Feather name="arrow-left" size={18} color={colors.white} />
            </Pressable>
            <Text style={styles.heroBackLabel}>Rider Profile</Text>
          </View>

          {/* Avatar */}
          <View style={styles.heroAvatar}>
            <Text style={[styles.heroAvatarText, { color: colors.white }]}>{initials}</Text>
          </View>

          {/* Name + phone */}
          <Text style={[styles.heroName, { color: colors.white }]}>{rider.name}</Text>
          <Text style={styles.heroPhone}>{rider.phone}</Text>

          {/* Action buttons */}
          <View style={styles.heroActions}>
            <Pressable style={styles.heroActionBtn} onPress={handleCall}>
              <Text style={[styles.heroActionText, { color: colors.white }]}>📞 Call</Text>
            </Pressable>
            <Pressable style={styles.heroActionBtn} onPress={handleWhatsApp}>
              <Text style={[styles.heroActionText, { color: colors.white }]}>💬 WhatsApp</Text>
            </Pressable>
            <Pressable
              style={[styles.heroActionBtn, styles.heroActionDanger]}
              onPress={handleRemove}
            >
              <Text style={styles.heroActionDangerText}>🗑️ Remove</Text>
            </Pressable>
          </View>
        </LinearGradient>

        {/* ── Stats Grid ──────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <StatCard
            value={String(rider.delivered)}
            label="DELIVERED"
            valueColor={colors.success}
          />
          <StatCard
            value={String(rider.failed)}
            label="FAILED"
            valueColor={colors.error}
          />
          <StatCard
            value={`${successRate}%`}
            label="SUCCESS"
            valueColor={colors.primary}
          />
        </View>

        {/* ── Notes Card ──────────────────────────────────────────────── */}
        {!!rider.notes && (
          <View style={[styles.notesCard, { backgroundColor: colors.surfaceCard }, cardShadow]}>
            <Text style={[styles.notesLabel, { color: colors.textMuted }]}>NOTES</Text>
            <Text style={[styles.notesText, { color: colors.textPrimary }]}>{rider.notes}</Text>
          </View>
        )}

        {/* ── Recent Deliveries ────────────────────────────────────────── */}
        <View style={styles.deliveriesSection}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Recent Deliveries</Text>
          <View style={styles.deliveriesList}>
            {rider.deliveries.map((d) => (
              <DeliveryCard key={d.id} delivery={d} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  // Hero
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    overflow: "hidden",
    position: "relative",
  },
  orb1: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -40,
    right: -20,
  },
  orb2: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.04)",
    bottom: -20,
    left: 30,
  },

  // Hero back row
  heroBackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
    zIndex: 2,
  },
  heroBackBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroBackLabel: {
    fontSize: 15,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    color: "rgba(255,255,255,0.8)",
  },

  // Hero avatar
  heroAvatar: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    zIndex: 2,
    alignSelf: "flex-start",
  },
  heroAvatarText: {
    fontSize: 22,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },

  // Hero name / phone
  heroName: {
    fontSize: 20,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.4,
    zIndex: 2,
    marginBottom: 3,
  },
  heroPhone: {
    fontSize: 13,
    fontFamily: font.mono.regular,
    color: "rgba(255,255,255,0.6)",
    zIndex: 2,
  },

  // Hero action buttons
  heroActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
    zIndex: 2,
  },
  heroActionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroActionText: {
    fontSize: 12,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
  heroActionDanger: {
    backgroundColor: "rgba(220,38,38,0.2)",
  },
  heroActionDangerText: {
    fontSize: 12,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    color: "#FCA5A5",
  },

  // Stats row
  statsRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  statValue: {
    fontSize: 22,
    fontFamily: font.mono.medium,
    fontWeight: "500",
    letterSpacing: -0.44,
  },
  statLabel: {
    fontSize: 9,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.05,
    textTransform: "uppercase",
    marginTop: 3,
  },

  // Notes card
  notesCard: {
    marginTop: 14,
    marginHorizontal: layout.screenPaddingH,
    borderRadius: radius.xl,
    padding: 14,
    paddingHorizontal: 16,
  },
  notesLabel: {
    fontSize: 10,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.1,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  notesText: {
    fontSize: 13,
    fontFamily: font.sans.regular,
    lineHeight: 19.5,
  },

  // Recent deliveries
  deliveriesSection: {
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: 14,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.1,
    textTransform: "uppercase",
  },
  deliveriesList: {
    gap: layout.listGap,
    marginTop: 10,
    marginBottom: 20,
  },

  // Delivery card
  deliveryCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.xl,
    padding: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  deliveryIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  deliveryEmoji: { fontSize: 16 },
  deliveryBody: { flex: 1, minWidth: 0 },
  deliveryItem: {
    fontSize: 13,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    marginBottom: 2,
  },
  deliveryMeta: {
    fontSize: 11,
    fontFamily: font.sans.regular,
  },
  deliveryRight: {
    alignItems: "flex-end",
    gap: 4,
    flexShrink: 0,
  },
  deliveryPill: {
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
  deliveryTime: {
    fontSize: 10,
    fontFamily: font.mono.regular,
  },
});
