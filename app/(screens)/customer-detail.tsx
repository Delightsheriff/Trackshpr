/**
 * Customer Detail screen — order history, addresses, stats, edit/delete actions.
 * DS §8.1, §8.4 — Feather icons, DM Sans / DM Mono fonts.
 */
import { font, layout, radius } from "@/src/constants/tokens";
import { useCustomer, useCustomerAddresses, useSession } from "@/src/hooks";
import { supabase } from "@/src/lib/supabase";
import { useTheme } from "@/src/stores/themeStore";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function hashIdx(id: string, length: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(h) % length;
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  value, label, valueColor, colors, isDark,
}: {
  value: string; label: string; valueColor: string;
  colors: ReturnType<typeof useTheme>["colors"]; isDark: boolean;
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
export default function CustomerDetailScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useSession();

  const { data: customer, isLoading, isError } = useCustomer(id ?? null);
  const { data: addresses = [], isLoading: addressesLoading } = useCustomerAddresses(id ?? null);

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["customer-orders", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, item, status, created_at, delivery_address")
        .eq("customer_id", id!)
        .eq("seller_id", userId!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!id && !!userId,
  });

  const AVATAR_COLORS = [
    { bg: colors.primarySoft, fg: colors.primary },
    { bg: colors.successBg, fg: colors.success },
    { bg: colors.warningBg, fg: colors.warning },
  ];

  const cardShadow = isDark
    ? { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 4 }
    : { shadowColor: "rgba(48,41,80,1)", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: colors.surface }]}>
        <StatusBar style="light" />
        <View style={[styles.loadingAvatar, { backgroundColor: colors.surfaceContainer }]} />
      </View>
    );
  }

  // ── Error / not found ──────────────────────────────────────────────────────
  if (isError || !customer) {
    return (
      <View style={[styles.root, styles.center, { backgroundColor: colors.surface }]}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Feather name="user-x" size={36} color={colors.textMuted} />
        <Text style={[styles.errorText, { color: colors.textMuted }]}>Customer not found</Text>
        <Pressable onPress={() => router.back()} style={styles.backBtnText}>
          <Text style={[styles.goBackText, { color: colors.primary }]}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const avatarColor = AVATAR_COLORS[hashIdx(customer.id, AVATAR_COLORS.length)];
  const initials = getInitials(customer.name);
  const delivered = orders.filter((o) => o.status === "delivered").length;
  const failed = orders.filter((o) => o.status === "failed").length;

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Gradient Hero ──────────────────────────────────────── */}
        <LinearGradient
          colors={["#4647D3", "#5354E8", "#6366F1"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, { paddingTop: insets.top + 16 }]}
        >
          <View style={styles.orb1} />
          <View style={styles.orb2} />

          <View style={styles.heroBackRow}>
            <Pressable style={styles.heroBackBtn} onPress={() => router.back()} hitSlop={8}>
              <Feather name="arrow-left" size={18} color={colors.white} />
            </Pressable>
            <Text style={styles.heroBackLabel}>Customer Profile</Text>
          </View>

          <View style={[styles.heroAvatar, { backgroundColor: avatarColor.bg }]}>
            <Text style={[styles.heroAvatarText, { color: avatarColor.fg }]}>{initials}</Text>
          </View>

          <Text style={[styles.heroName, { color: colors.white }]}>{customer.name}</Text>
          <Text style={styles.heroPhone}>{customer.phone}</Text>

          <View style={styles.heroActions}>
            <View style={styles.heroActionsRow}>
              <Pressable
                style={styles.heroActionBtn}
                onPress={() => Linking.openURL("tel:" + customer.phone.replace(/\s/g, ""))}
              >
                <View style={styles.heroActionContent}>
                  <Feather name="phone" size={12} color={colors.white} />
                  <Text style={[styles.heroActionText, { color: colors.white }]}>Call</Text>
                </View>
              </Pressable>
              <Pressable
                style={styles.heroActionBtn}
                onPress={() =>
                  Linking.openURL("https://wa.me/" + customer.phone.replace(/\D/g, ""))
                }
              >
                <View style={styles.heroActionContent}>
                  <Feather name="message-circle" size={12} color={colors.white} />
                  <Text style={[styles.heroActionText, { color: colors.white }]}>WhatsApp</Text>
                </View>
              </Pressable>
            </View>
            <View style={styles.heroActionsRow}>
              <Pressable
                style={styles.heroActionBtn}
                onPress={() =>
                  router.push({ pathname: "/(modals)/edit-customer", params: { id: customer.id } })
                }
              >
                <View style={styles.heroActionContent}>
                  <Feather name="edit-2" size={12} color={colors.white} />
                  <Text style={[styles.heroActionText, { color: colors.white }]}>Edit</Text>
                </View>
              </Pressable>
              <Pressable
                style={[styles.heroActionBtn, styles.heroActionDanger]}
                onPress={() =>
                  router.push({
                    pathname: "/(modals)/delete-customer",
                    params: { id: customer.id, name: customer.name },
                  })
                }
              >
                <View style={styles.heroActionContent}>
                  <Feather name="trash-2" size={12} color="#FCA5A5" />
                  <Text style={styles.heroActionDangerText}>Remove</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </LinearGradient>

        {/* ── Stats Grid ────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <StatCard
            value={String(customer.order_count)}
            label="TOTAL"
            valueColor={colors.primary}
            colors={colors}
            isDark={isDark}
          />
          <StatCard
            value={String(delivered)}
            label="DELIVERED"
            valueColor={colors.success}
            colors={colors}
            isDark={isDark}
          />
          <StatCard
            value={String(failed)}
            label="FAILED"
            valueColor={failed > 0 ? colors.error : colors.textMuted}
            colors={colors}
            isDark={isDark}
          />
        </View>

        {/* ── Notes ─────────────────────────────────────────────── */}
        {!!customer.notes && (
          <View style={[styles.notesCard, { backgroundColor: colors.surfaceCard }, cardShadow]}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>NOTES</Text>
            <Text style={[styles.notesText, { color: colors.textPrimary }]}>{customer.notes}</Text>
          </View>
        )}

        {/* ── Addresses ─────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>DELIVERY ADDRESSES</Text>

          {addressesLoading && (
            <View style={{ gap: 8 }}>
              {[0, 1].map((i) => (
                <View key={i} style={{ backgroundColor: colors.surfaceContainer, borderRadius: radius.xl, height: 56 }} />
              ))}
            </View>
          )}

          {!addressesLoading && addresses.length === 0 && (
            <Text style={[styles.emptyNote, { color: colors.textMuted }]}>No addresses saved</Text>
          )}

          {!addressesLoading && addresses.map((addr) => (
            <View
              key={addr.id}
              style={[styles.addressCard, { backgroundColor: colors.surfaceCard }, cardShadow]}
            >
              <View style={[styles.addressIcon, { backgroundColor: addr.is_default ? colors.primarySoft : colors.surfaceContainer }]}>
                <Feather name="map-pin" size={14} color={addr.is_default ? colors.primary : colors.textMuted} />
              </View>
              <View style={styles.addressBody}>
                <Text style={[styles.addressText, { color: colors.textPrimary }]} numberOfLines={2}>
                  {addr.address}{addr.city ? `, ${addr.city}` : ""}
                </Text>
                {addr.label && (
                  <Text style={[styles.addressLabel, { color: colors.textMuted }]}>{addr.label}</Text>
                )}
              </View>
              {addr.is_default && (
                <View style={[styles.defaultBadge, { backgroundColor: colors.primarySoft }]}>
                  <Text style={[styles.defaultBadgeText, { color: colors.primary }]}>Default</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* ── Order History ──────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>ORDER HISTORY</Text>

          {ordersLoading && (
            <View style={{ gap: 8 }}>
              {[0, 1, 2].map((i) => (
                <View key={i} style={{ backgroundColor: colors.surfaceContainer, borderRadius: radius.xl, height: 72 }} />
              ))}
            </View>
          )}

          {!ordersLoading && orders.length === 0 && (
            <Text style={[styles.emptyNote, { color: colors.textMuted }]}>No orders yet for this customer</Text>
          )}

          {!ordersLoading && orders.map((order) => {
            const statusColor =
              order.status === "delivered"
                ? colors.success
                : order.status === "failed"
                ? colors.error
                : order.status === "in_transit" || order.status === "picked_up"
                ? colors.info
                : colors.warning;

            const formattedDate = new Date(order.created_at).toLocaleDateString("en-NG", {
              day: "numeric",
              month: "short",
            });

            return (
              <Pressable
                key={order.id}
                onPress={() => router.push({ pathname: "/(screens)/order-detail", params: { id: order.id } })}
                style={[styles.orderCard, { backgroundColor: colors.surfaceCard }, cardShadow]}
              >
                <View style={[styles.orderDot, { backgroundColor: statusColor }]} />
                <View style={styles.orderMiddle}>
                  <Text style={[styles.orderTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                    {order.item}
                  </Text>
                  <Text style={[styles.orderAddress, { color: colors.textMuted }]} numberOfLines={1}>
                    {order.delivery_address ?? "—"}
                  </Text>
                </View>
                <Text style={[styles.orderDate, { color: colors.textMuted }]}>{formattedDate}</Text>
              </Pressable>
            );
          })}
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
  loadingAvatar: { width: 64, height: 64, borderRadius: radius.full },
  errorText: { fontSize: 15, fontFamily: font.sans.semiBold },
  backBtnText: { paddingVertical: 8, paddingHorizontal: 16 },
  goBackText: { fontSize: 14, fontFamily: font.sans.semiBold },

  hero: { paddingHorizontal: 20, paddingBottom: 32, overflow: "hidden", position: "relative" },
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
  notesText: { fontSize: 13, fontFamily: font.sans.regular, lineHeight: 19.5 },

  section: { paddingHorizontal: layout.screenPaddingH, paddingTop: 14, gap: 8 },
  sectionLabel: { fontSize: 10, fontFamily: font.sans.bold, fontWeight: "700", letterSpacing: 0.1, textTransform: "uppercase", marginBottom: 2 },
  emptyNote: { fontSize: 13, fontFamily: font.sans.regular, textAlign: "center", paddingVertical: 16 },

  addressCard: { flexDirection: "row", alignItems: "center", borderRadius: radius.xl, padding: 12, gap: 10 },
  addressIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  addressBody: { flex: 1, minWidth: 0 },
  addressText: { fontSize: 13, fontFamily: font.sans.semiBold, fontWeight: "600" },
  addressLabel: { fontSize: 11, fontFamily: font.sans.regular, marginTop: 2 },
  defaultBadge: { borderRadius: radius.full, paddingVertical: 2, paddingHorizontal: 8, flexShrink: 0 },
  defaultBadgeText: { fontSize: 10, fontFamily: font.sans.bold, fontWeight: "700" },

  orderCard: { flexDirection: "row", alignItems: "center", borderRadius: radius.xl, padding: layout.cardPadding, paddingHorizontal: 14, gap: 10 },
  orderDot: { width: 6, height: 6, borderRadius: 3, flexShrink: 0 },
  orderMiddle: { flex: 1, gap: 2 },
  orderTitle: { fontSize: 13, fontFamily: font.sans.semiBold, fontWeight: "600", letterSpacing: -0.13 },
  orderAddress: { fontSize: 12, fontFamily: font.sans.regular },
  orderDate: { fontSize: 11, fontFamily: font.mono.regular, flexShrink: 0 },
});
