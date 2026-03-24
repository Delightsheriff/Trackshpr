/**
 * Rider Detail screen — real data via TanStack Query.
 * DS §8.1, §8.4 — Feather icons, DM Sans / DM Mono fonts.
 */
import { font, layout, radius } from "@/src/constants/tokens";
import { useRider } from "@/src/hooks";
import { useTheme } from "@/src/stores/themeStore";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Helpers ───────────────────────────────────────────────────────────────────
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// UUID-safe color hash
function hashIdx(id: string, length: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % length;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  value,
  label,
  valueColor,
  colors,
  isDark,
}: {
  value: string;
  label: string;
  valueColor: string;
  colors: ReturnType<typeof useTheme>["colors"];
  isDark: boolean;
}) {
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

// ── Screen ────────────────────────────────────────────────────────────────────
export default function RiderDetailScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: rider, isLoading, isError } = useRider(id);

  const AVATAR_COLORS = [
    { bg: colors.primarySoft, fg: colors.primary },
    { bg: colors.successBg, fg: colors.success },
    { bg: colors.warningBg, fg: colors.warning },
  ];

  function handleCall() {
    if (!rider) return;
    Linking.openURL("tel:" + rider.phone.replace(/\s/g, ""));
  }

  function handleWhatsApp() {
    if (!rider) return;
    Linking.openURL(
      "https://wa.me/234" + rider.phone.replace(/\s/g, "").replace(/^0/, ""),
    );
  }

  function handleEdit() {
    if (!rider) return;
    router.push({
      pathname: "/(modals)/edit-rider",
      params: { id: rider.id },
    });
  }

  function handleRemove() {
    if (!rider) return;
    router.push({
      pathname: "/(modals)/delete-rider",
      params: { id: rider.id, name: rider.name },
    });
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: colors.surface }]}>
        <StatusBar style="light" />
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  // ── Error / not found ────────────────────────────────────────────────────────
  if (isError || !rider) {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: colors.surface }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Feather name="user-x" size={36} color={colors.textMuted} />
        <Text style={[styles.errorText, { color: colors.textMuted }]}>
          Rider not found
        </Text>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backBtnText, { color: colors.primary }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const avatarColor = AVATAR_COLORS[hashIdx(rider.id, AVATAR_COLORS.length)];
  const initials = getInitials(rider.name);

  const cardShadow = isDark
    ? { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 4 }
    : { shadowColor: "rgba(48,41,80,1)", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 };

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
          <View style={[styles.heroAvatar, { backgroundColor: avatarColor.bg }]}>
            <Text style={[styles.heroAvatarText, { color: avatarColor.fg }]}>
              {initials}
            </Text>
          </View>

          {/* Name + phone */}
          <Text style={[styles.heroName, { color: colors.white }]}>
            {rider.name}
          </Text>
          <Text style={styles.heroPhone}>{rider.phone}</Text>

          {/* Action buttons */}
          <View style={styles.heroActions}>
            <View style={styles.heroActionsRow}>
              <Pressable style={styles.heroActionBtn} onPress={handleCall}>
                <View style={styles.heroActionContent}>
                  <Feather name="phone" size={12} color={colors.white} />
                  <Text style={[styles.heroActionText, { color: colors.white }]}>Call</Text>
                </View>
              </Pressable>
              <Pressable style={styles.heroActionBtn} onPress={handleWhatsApp}>
                <View style={styles.heroActionContent}>
                  <Feather name="message-circle" size={12} color={colors.white} />
                  <Text style={[styles.heroActionText, { color: colors.white }]}>WhatsApp</Text>
                </View>
              </Pressable>
            </View>
            <View style={styles.heroActionsRow}>
              <Pressable style={styles.heroActionBtn} onPress={handleEdit}>
                <View style={styles.heroActionContent}>
                  <Feather name="edit-2" size={12} color={colors.white} />
                  <Text style={[styles.heroActionText, { color: colors.white }]}>Edit</Text>
                </View>
              </Pressable>
              <Pressable
                style={[styles.heroActionBtn, styles.heroActionDanger]}
                onPress={handleRemove}
              >
                <View style={styles.heroActionContent}>
                  <Feather name="trash-2" size={12} color="#FCA5A5" />
                  <Text style={styles.heroActionDangerText}>Remove</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </LinearGradient>

        {/* ── Stats Grid ──────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <StatCard
            value={String(rider.total_deliveries)}
            label="DELIVERED"
            valueColor={colors.success}
            colors={colors}
            isDark={isDark}
          />
          <StatCard
            value="—"
            label="FAILED"
            valueColor={colors.textMuted}
            colors={colors}
            isDark={isDark}
          />
          <StatCard
            value={rider.total_deliveries > 0 ? "100%" : "—"}
            label="SUCCESS"
            valueColor={colors.primary}
            colors={colors}
            isDark={isDark}
          />
        </View>

        {/* ── Notes Card ──────────────────────────────────────────────── */}
        {!!rider.notes && (
          <View style={[styles.notesCard, { backgroundColor: colors.surfaceCard }, cardShadow]}>
            <Text style={[styles.notesLabel, { color: colors.textMuted }]}>NOTES</Text>
            <Text style={[styles.notesText, { color: colors.textPrimary }]}>
              {rider.notes}
            </Text>
          </View>
        )}

        {/* ── Recent Deliveries — placeholder until orders are live ───── */}
        <View style={styles.deliveriesSection}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
            Recent Deliveries
          </Text>
          <View style={[styles.emptyDeliveries, { backgroundColor: colors.surfaceCard }, cardShadow]}>
            <Feather name="package" size={24} color={colors.textMuted} style={{ marginBottom: 8 }} />
            <Text style={[styles.emptyDeliveriesText, { color: colors.textMuted }]}>
              Delivery history coming soon
            </Text>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center", gap: 12 },
  errorText: { fontSize: 15, fontFamily: font.sans.semiBold },
  backBtn: { paddingVertical: 8, paddingHorizontal: 16 },
  backBtnText: { fontSize: 14, fontFamily: font.sans.semiBold },

  hero: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    overflow: "hidden",
    position: "relative",
  },
  orb1: { position: "absolute", width: 140, height: 140, borderRadius: 70, backgroundColor: "rgba(255,255,255,0.07)", top: -40, right: -20 },
  orb2: { position: "absolute", width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.04)", bottom: -20, left: 30 },

  heroBackRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20, zIndex: 2 },
  heroBackBtn: { width: 34, height: 34, borderRadius: 11, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  heroBackLabel: { fontSize: 15, fontFamily: font.sans.semiBold, fontWeight: "600", color: "rgba(255,255,255,0.8)" },

  heroAvatar: { width: 64, height: 64, borderRadius: radius.full, borderWidth: 2, borderColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center", marginBottom: 12, zIndex: 2, alignSelf: "flex-start" },
  heroAvatarText: { fontSize: 22, fontFamily: font.sans.bold, fontWeight: "700" },

  heroName: { fontSize: 20, fontFamily: font.sans.bold, fontWeight: "700", letterSpacing: -0.4, zIndex: 2, marginBottom: 3 },
  heroPhone: { fontSize: 13, fontFamily: font.mono.regular, color: "rgba(255,255,255,0.6)", zIndex: 2 },

  heroActions: { flexDirection: "column", gap: 8, marginTop: 16, zIndex: 2 },
  heroActionsRow: { flexDirection: "row", gap: 8 },
  heroActionBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.full, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  heroActionContent: { flexDirection: "row", alignItems: "center", gap: 6 },
  heroActionText: { fontSize: 12, fontFamily: font.sans.bold, fontWeight: "700" },
  heroActionDanger: { backgroundColor: "rgba(220,38,38,0.2)" },
  heroActionDangerText: { fontSize: 12, fontFamily: font.sans.bold, fontWeight: "700", color: "#FCA5A5" },

  statsRow: { flexDirection: "row", gap: 8, paddingHorizontal: layout.screenPaddingH, paddingTop: 16 },
  statCard: { flex: 1, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 10, alignItems: "center" },
  statValue: { fontSize: 22, fontFamily: font.mono.medium, fontWeight: "500", letterSpacing: -0.44 },
  statLabel: { fontSize: 9, fontFamily: font.sans.bold, fontWeight: "700", letterSpacing: 0.05, textTransform: "uppercase", marginTop: 3 },

  notesCard: { marginTop: 14, marginHorizontal: layout.screenPaddingH, borderRadius: radius.xl, padding: 14, paddingHorizontal: 16 },
  notesLabel: { fontSize: 10, fontFamily: font.sans.bold, fontWeight: "700", letterSpacing: 0.1, textTransform: "uppercase", marginBottom: 8 },
  notesText: { fontSize: 13, fontFamily: font.sans.regular, lineHeight: 19.5 },

  deliveriesSection: { paddingHorizontal: layout.screenPaddingH, paddingTop: 14 },
  sectionLabel: { fontSize: 10, fontFamily: font.sans.bold, fontWeight: "700", letterSpacing: 0.1, textTransform: "uppercase", marginBottom: 10 },
  emptyDeliveries: { borderRadius: radius.xl, padding: 24, alignItems: "center", justifyContent: "center" },
  emptyDeliveriesText: { fontSize: 13, fontFamily: font.sans.regular },
});
