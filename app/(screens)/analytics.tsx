/**
 * Analytics screen — period-based delivery stats, bar chart, leaderboard (DS §8.1).
 */
import { font, layout, radius } from "@/src/constants/tokens";
import { useSession } from "@/src/hooks/useSession";
import { supabase } from "@/src/lib/supabase";
import { queryKeys } from "@/src/lib/queryKeys";
import { useTheme } from "@/src/stores/themeStore";
import { useToastStore } from "@/src/stores/toastStore";
import { Feather } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Period = "7" | "30" | "90";

const PERIOD_TABS: { key: Period; label: string }[] = [
  { key: "7", label: "7 days" },
  { key: "30", label: "30 days" },
  { key: "90", label: "90 days" },
];

// ── Rank badge config ─────────────────────────────────────────────────────────
function rankBadgeColors(
  rank: number,
  colors: ReturnType<typeof useTheme>["colors"],
): { bg: string; fg: string } {
  if (rank === 1) return { bg: colors.warningBg, fg: colors.warning };
  if (rank === 2)
    return { bg: colors.surfaceContainer, fg: colors.textSecondary };
  return { bg: colors.errorBg, fg: colors.error };
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────
const BAR_MAX_H = 72;

type ChartEntry = { day: number; total: number; delivered: number };

function BarChart({ data }: { data: ChartEntry[] }) {
  const { colors, isDark } = useTheme();
  const cardShadow = isDark
    ? {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 4,
      }
    : {
        shadowColor: "rgba(48,41,80,1)",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      };
  const maxVal = Math.max(...data.map((d) => d.total), 1);

  return (
    <View
      style={[
        styles.chartCard,
        { backgroundColor: colors.surfaceCard },
        cardShadow,
      ]}
    >
      {/* Header */}
      <View style={styles.chartHeader}>
        <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>
          Daily deliveries
        </Text>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: colors.surfaceContainer },
              ]}
            />
            <Text style={[styles.legendLabel, { color: colors.textMuted }]}>
              Total
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: colors.primary, opacity: 0.85 },
              ]}
            />
            <Text style={[styles.legendLabel, { color: colors.textMuted }]}>
              Done
            </Text>
          </View>
        </View>
      </View>

      {/* Bars */}
      <View style={styles.chartArea}>
        {data.map((d, i) => {
          const totalH =
            maxVal > 0 ? Math.max(4, (d.total / maxVal) * BAR_MAX_H) : 4;
          const doneH =
            maxVal > 0
              ? Math.max(4, (d.delivered / maxVal) * BAR_MAX_H)
              : 4;
          return (
            <View key={i} style={styles.barGroup}>
              <View
                style={[
                  styles.bar,
                  { height: totalH, backgroundColor: colors.surfaceContainer },
                ]}
              />
              <View
                style={[
                  styles.bar,
                  {
                    height: doneH,
                    backgroundColor: colors.primary,
                    opacity: 0.85,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>

      {/* Labels */}
      <View style={styles.chartLabelsRow}>
        {data.map((d, i) => (
          <Text
            key={i}
            style={[styles.chartLabel, { color: colors.textMuted }]}
          >
            {d.day}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ── Leaderboard item ──────────────────────────────────────────────────────────
type LeaderboardRider = {
  id: string;
  name: string;
  initials: string;
  successRate: string;
  count: number;
  rank: number;
};

function LeaderboardItem({
  rider,
  isLast,
}: {
  rider: LeaderboardRider;
  isLast: boolean;
}) {
  const { colors } = useTheme();
  const badge = rankBadgeColors(rider.rank, colors);

  const AVATAR_COLORS: Record<string, { bg: string; fg: string }> = {
    "1": { bg: colors.primarySoft, fg: colors.primary },
    "2": { bg: colors.successBg, fg: colors.success },
    "3": { bg: colors.warningBg, fg: colors.warning },
  };
  const avatarCfg = AVATAR_COLORS[String(rider.rank)] ?? {
    bg: colors.surfaceContainer,
    fg: colors.textMuted,
  };

  return (
    <>
      <View style={styles.lbRow}>
        {/* Rank badge */}
        <View style={[styles.lbRank, { backgroundColor: badge.bg }]}>
          <Text style={[styles.lbRankText, { color: badge.fg }]}>
            {rider.rank}
          </Text>
        </View>

        {/* Avatar */}
        <View style={[styles.lbAvatar, { backgroundColor: avatarCfg.bg }]}>
          <Text style={[styles.lbAvatarText, { color: avatarCfg.fg }]}>
            {rider.initials}
          </Text>
        </View>

        {/* Body */}
        <View style={styles.lbBody}>
          <Text style={[styles.lbName, { color: colors.textPrimary }]}>
            {rider.name}
          </Text>
          <Text style={[styles.lbMeta, { color: colors.textMuted }]}>
            {rider.successRate} success rate
          </Text>
        </View>

        {/* Count */}
        <Text style={[styles.lbCount, { color: colors.textPrimary }]}>
          {rider.count}
        </Text>
      </View>

      {/* Separator */}
      {!isLast && (
        <View
          style={[
            styles.lbSeparator,
            { backgroundColor: colors.surfaceContainer },
          ]}
        />
      )}
    </>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function AnalyticsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>("7");
  const { userId } = useSession();
  const showToast = useToastStore((s) => s.show);

  // ── Fetch orders ─────────────────────────────────────────────────────────
  const { data: orders, isLoading } = useQuery({
    queryKey: queryKeys.orders(userId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, item_description, status, created_at, rider_id, customer_name, delivery_address",
        )
        .eq("seller_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });

  // ── Fetch riders ─────────────────────────────────────────────────────────
  const { data: riders } = useQuery({
    queryKey: queryKeys.riders(userId ?? ""),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("riders")
        .select("id, name")
        .eq("seller_id", userId!);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
  });

  // ── Period-filtered orders ────────────────────────────────────────────────
  const periodOrders = useMemo(() => {
    if (!orders) return [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(period));
    return orders.filter((o) => new Date(o.created_at ?? "") >= cutoff);
  }, [orders, period]);

  const stats = useMemo(() => {
    const total = periodOrders.length;
    const delivered = periodOrders.filter(
      (o) => o.status === "delivered",
    ).length;
    const failed = periodOrders.filter((o) => o.status === "failed").length;
    const rate = total > 0 ? Math.round((delivered / total) * 100) : 0;
    return { total, delivered, failed, rate };
  }, [periodOrders]);

  // ── Chart data (last 14 days) ─────────────────────────────────────────────
  const chartData = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (13 - i));
      const dayOrders = (orders ?? []).filter((o) => {
        if (!o.created_at) return false;
        return (
          new Date(o.created_at).toDateString() === date.toDateString()
        );
      });
      return {
        day: date.getDate(),
        total: dayOrders.length,
        delivered: dayOrders.filter((o) => o.status === "delivered").length,
      };
    });
  }, [orders]);

  // ── Leaderboard ───────────────────────────────────────────────────────────
  const leaderboard = useMemo<LeaderboardRider[]>(() => {
    if (!riders || !orders) return [];
    return riders
      .map((r) => {
        const riderOrders = orders.filter((o) => o.rider_id === r.id);
        const delivered = riderOrders.filter(
          (o) => o.status === "delivered",
        ).length;
        const total = riderOrders.length;
        const rate =
          total > 0 ? Math.round((delivered / total) * 100) : 0;
        const nameParts = (r.name ?? "").trim().split(/\s+/);
        const initials =
          nameParts.length >= 2
            ? (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase()
            : (r.name ?? "").slice(0, 2).toUpperCase();
        return { id: r.id, name: r.name ?? "", initials, delivered, total, rate };
      })
      .sort((a, b) => b.delivered - a.delivered)
      .slice(0, 5)
      .map((r, i) => ({
        id: r.id,
        name: r.name,
        initials: r.initials,
        successRate: r.total > 0 ? `${r.rate}%` : "0%",
        count: r.delivered,
        rank: i + 1,
      }));
  }, [riders, orders]);

  // ── CSV export ────────────────────────────────────────────────────────────
  const exportCSV = async () => {
    if (!orders?.length) {
      showToast("No orders to export", "info");
      return;
    }
    const header = "ID,Item,Customer,Status,Date\n";
    const rows = orders
      .map((o) =>
        [
          o.id,
          (o.item_description ?? "").replace(/,/g, ";"),
          (o.customer_name ?? "").replace(/,/g, ";"),
          o.status ?? "",
          o.created_at ? new Date(o.created_at).toLocaleDateString() : "",
        ].join(","),
      )
      .join("\n");
    const path =
      (FileSystem.documentDirectory ?? "") + "trackshpr-orders.csv";
    await FileSystem.writeAsStringAsync(path, header + rows);
    await Sharing.shareAsync(path, {
      mimeType: "text/csv",
      dialogTitle: "Export Orders",
    });
  };

  const cardShadow = isDark
    ? {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 4,
      }
    : {
        shadowColor: "rgba(48,41,80,1)",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
      };

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable
          style={[
            styles.iconBtn,
            { backgroundColor: colors.surfaceCard },
            cardShadow,
          ]}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <Feather name="arrow-left" size={18} color={colors.textPrimary} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Analytics
        </Text>

        <Pressable
          style={[
            styles.iconBtn,
            { backgroundColor: colors.surfaceCard },
            cardShadow,
          ]}
          onPress={exportCSV}
          hitSlop={8}
        >
          <Feather name="download" size={16} color={colors.textPrimary} />
        </Pressable>
      </View>

      {/* ── Scrollable body ─────────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Period selector ───────────────────────────────────────────────── */}
        <View
          style={[
            styles.periodContainer,
            { backgroundColor: colors.surfaceContainer },
          ]}
        >
          {PERIOD_TABS.map(({ key, label }) => {
            const active = period === key;
            return (
              <Pressable
                key={key}
                style={[
                  styles.periodTab,
                  active && [
                    styles.periodTabActive,
                    { backgroundColor: colors.surfaceCard },
                    isDark
                      ? {
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.3,
                          shadowRadius: 4,
                          elevation: 1,
                        }
                      : {
                          shadowColor: "rgba(48,41,80,1)",
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.08,
                          shadowRadius: 4,
                          elevation: 1,
                        },
                  ],
                ]}
                onPress={() => setPeriod(key)}
              >
                <Text
                  style={[
                    styles.periodTabText,
                    { color: colors.textMuted },
                    active && { color: colors.textPrimary },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── 2x2 Stat cards (or skeletons) ───────────────────────────────── */}
        {isLoading ? (
          <View style={styles.statsGrid}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.statCard,
                  styles.skeleton,
                  { backgroundColor: colors.surfaceContainer },
                ]}
              />
            ))}
          </View>
        ) : (
          <View style={styles.statsGrid}>
            {/* Total Orders */}
            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.surfaceCard },
                cardShadow,
              ]}
            >
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                TOTAL ORDERS
              </Text>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {stats.total}
              </Text>
              <Text style={[styles.statTrend, { color: colors.textMuted }]}>
                Last {period} days
              </Text>
            </View>

            {/* Success Rate */}
            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.surfaceCard },
                cardShadow,
              ]}
            >
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                SUCCESS RATE
              </Text>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {stats.rate}%
              </Text>
              <Text style={[styles.statTrend, { color: colors.success }]}>
                Delivered
              </Text>
            </View>

            {/* Delivered */}
            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.surfaceCard },
                cardShadow,
              ]}
            >
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                DELIVERED
              </Text>
              <Text style={[styles.statValue, { color: colors.info }]}>
                {stats.delivered}
              </Text>
              <Text style={[styles.statTrend, { color: colors.textMuted }]}>
                Completed
              </Text>
            </View>

            {/* Failed Orders */}
            <View
              style={[
                styles.statCard,
                { backgroundColor: colors.surfaceCard },
                cardShadow,
              ]}
            >
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                FAILED
              </Text>
              <Text style={[styles.statValue, { color: colors.error }]}>
                {stats.failed}
              </Text>
              <Text style={[styles.statTrend, { color: colors.error }]}>
                Not delivered
              </Text>
            </View>
          </View>
        )}

        {/* ── Bar chart ────────────────────────────────────────────────────── */}
        <BarChart data={chartData} />

        {/* ── Leaderboard ──────────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
          TOP RIDERS
        </Text>
        <View
          style={[
            styles.lbCard,
            { backgroundColor: colors.surfaceCard },
            cardShadow,
          ]}
        >
          {leaderboard.length === 0 ? (
            <Text
              style={[
                styles.lbMeta,
                { color: colors.textMuted, paddingVertical: 12 },
              ]}
            >
              No rider data yet.
            </Text>
          ) : (
            leaderboard.map((rider, i) => (
              <LeaderboardItem
                key={rider.id}
                rider={rider}
                isLast={i === leaderboard.length - 1}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: 14,
  },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.34,
  },

  // Scroll
  scroll: {
    paddingHorizontal: layout.screenPaddingH,
  },

  // Period selector
  periodContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 4,
    alignItems: "center",
    borderRadius: 9,
  },
  periodTabActive: {},
  periodTabText: {
    fontSize: 11,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
  },

  // Stats grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  statCard: {
    width: "48%",
    borderRadius: radius.xl,
    padding: layout.cardPadding,
  },
  skeleton: {
    height: 90,
    borderRadius: radius.xl,
  },
  statLabel: {
    fontSize: 9,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.07,
    textTransform: "uppercase",
    marginBottom: 5,
  },
  statValue: {
    fontSize: 26,
    fontFamily: font.mono.medium,
    fontWeight: "700",
    letterSpacing: -0.78,
    lineHeight: 26,
  },
  statTrend: {
    fontSize: 11,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    marginTop: 4,
  },

  // Bar chart card
  chartCard: {
    borderRadius: radius.xl,
    padding: layout.cardPadding,
    marginBottom: 10,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 13,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.13,
  },
  legendRow: {
    flexDirection: "row",
    gap: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendLabel: {
    fontSize: 9,
    fontFamily: font.sans.regular,
  },
  chartArea: {
    height: 80,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
    paddingHorizontal: 4,
  },
  barGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
  },
  bar: {
    flex: 1,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  chartLabelsRow: {
    flexDirection: "row",
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  chartLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 8,
    fontFamily: font.mono.regular,
  },

  // Leaderboard
  sectionLabel: {
    fontSize: 10,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.1,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  lbCard: {
    borderRadius: radius.xl,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  lbRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
  },
  lbSeparator: {
    height: 1,
  },
  lbRank: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  lbRankText: {
    fontSize: 11,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
  lbAvatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  lbAvatarText: {
    fontSize: 13,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
  lbBody: { flex: 1, minWidth: 0 },
  lbName: {
    fontSize: 13,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.13,
  },
  lbMeta: {
    fontSize: 11,
    fontFamily: font.sans.regular,
    marginTop: 1,
  },
  lbCount: {
    fontSize: 16,
    fontFamily: font.mono.medium,
    fontWeight: "700",
    flexShrink: 0,
  },
});
