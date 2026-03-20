/**
 * Analytics screen — period-based delivery stats, bar chart, leaderboard (DS §8.1).
 * TODO: replace ANALYTICS and LEADERBOARD with real Supabase query.
 */
import { font, layout, radius } from "@/src/constants/tokens";
import { useTheme } from "@/src/stores/themeStore";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Dummy data — TODO: replace with real Supabase query ──────────────────────
const ANALYTICS = {
  "7": {
    totalOrders: 42,
    successRate: 88,
    avgTime: "1h 28m",
    failed: 5,
    totalTrend: "+4 from last week",
    rateTrend: "+2% improvement",
    failTrend: "↓ 1 from last week",
    chart: [
      { total: 5, done: 4 },
      { total: 8, done: 7 },
      { total: 4, done: 3 },
      { total: 7, done: 6 },
      { total: 9, done: 8 },
      { total: 6, done: 5 },
      { total: 3, done: 3 },
    ],
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },
  "30": {
    totalOrders: 147,
    successRate: 91,
    avgTime: "1h 42m",
    failed: 13,
    totalTrend: "+23 from last month",
    rateTrend: "+3% improvement",
    failTrend: "↓ 2 from last month",
    chart: [
      { total: 45, done: 38 },
      { total: 52, done: 48 },
      { total: 35, done: 30 },
      { total: 60, done: 55 },
      { total: 48, done: 42 },
      { total: 70, done: 65 },
      { total: 55, done: 50 },
      { total: 40, done: 35 },
      { total: 58, done: 54 },
      { total: 62, done: 58 },
      { total: 45, done: 40 },
      { total: 72, done: 68 },
      { total: 50, done: 44 },
      { total: 68, done: 62 },
    ],
    labels: [
      "1", "3", "5", "7", "9", "11", "13",
      "15", "17", "19", "21", "23", "25", "27",
    ],
  },
  "90": {
    totalOrders: 398,
    successRate: 89,
    avgTime: "1h 55m",
    failed: 42,
    totalTrend: "+67 from last quarter",
    rateTrend: "+1% improvement",
    failTrend: "↓ 8 from last quarter",
    chart: [
      { total: 120, done: 105 },
      { total: 95,  done: 80  },
      { total: 110, done: 100 },
      { total: 130, done: 118 },
      { total: 88,  done: 75  },
      { total: 145, done: 132 },
      { total: 105, done: 95  },
      { total: 115, done: 102 },
      { total: 98,  done: 88  },
      { total: 140, done: 128 },
      { total: 125, done: 112 },
      { total: 108, done: 96  },
      { total: 135, done: 122 },
      { total: 118, done: 105 },
    ],
    labels: [
      "W1", "W2", "W3", "W4", "W5", "W6", "W7",
      "W8", "W9", "W10", "W11", "W12", "W13", "W14",
    ],
  },
} as const;

type Period = "7" | "30" | "90";

const PERIOD_TABS: { key: Period; label: string }[] = [
  { key: "7",  label: "7 days"  },
  { key: "30", label: "30 days" },
  { key: "90", label: "90 days" },
];

// ── Rank badge config ─────────────────────────────────────────────────────────
function rankBadgeColors(
  rank: number,
  colors: ReturnType<typeof useTheme>["colors"]
): { bg: string; fg: string } {
  if (rank === 1) return { bg: colors.warningBg, fg: colors.warning };
  if (rank === 2) return { bg: colors.surfaceContainer, fg: colors.textSecondary };
  return { bg: colors.errorBg, fg: colors.error };
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────
const BAR_MAX_H = 72;

function BarChart({ data }: { data: typeof ANALYTICS["7"] }) {
  const { colors, isDark } = useTheme();
  const cardShadow = isDark
    ? { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 4 }
    : { shadowColor: "rgba(48,41,80,1)", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 };
  const maxVal = Math.max(...data.chart.map((d) => d.total));

  return (
    <View style={[styles.chartCard, { backgroundColor: colors.surfaceCard }, cardShadow]}>
      {/* Header */}
      <View style={styles.chartHeader}>
        <Text style={[styles.chartTitle, { color: colors.textPrimary }]}>Daily deliveries</Text>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.surfaceContainer }]} />
            <Text style={[styles.legendLabel, { color: colors.textMuted }]}>Total</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary, opacity: 0.85 }]} />
            <Text style={[styles.legendLabel, { color: colors.textMuted }]}>Done</Text>
          </View>
        </View>
      </View>

      {/* Bars */}
      <View style={styles.chartArea}>
        {data.chart.map((d, i) => {
          const totalH = maxVal > 0 ? Math.max(4, (d.total / maxVal) * BAR_MAX_H) : 4;
          const doneH  = maxVal > 0 ? Math.max(4, (d.done  / maxVal) * BAR_MAX_H) : 4;
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
                  { height: doneH, backgroundColor: colors.primary, opacity: 0.85 },
                ]}
              />
            </View>
          );
        })}
      </View>

      {/* Labels */}
      <View style={styles.chartLabelsRow}>
        {data.labels.map((lbl, i) => (
          <Text key={i} style={[styles.chartLabel, { color: colors.textMuted }]}>
            {lbl}
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
  const avatarCfg = AVATAR_COLORS[rider.id] ?? { bg: colors.surfaceContainer, fg: colors.textMuted };

  return (
    <>
      <View style={styles.lbRow}>
        {/* Rank badge */}
        <View style={[styles.lbRank, { backgroundColor: badge.bg }]}>
          <Text style={[styles.lbRankText, { color: badge.fg }]}>{rider.rank}</Text>
        </View>

        {/* Avatar */}
        <View style={[styles.lbAvatar, { backgroundColor: avatarCfg.bg }]}>
          <Text style={[styles.lbAvatarText, { color: avatarCfg.fg }]}>
            {rider.initials}
          </Text>
        </View>

        {/* Body */}
        <View style={styles.lbBody}>
          <Text style={[styles.lbName, { color: colors.textPrimary }]}>{rider.name}</Text>
          <Text style={[styles.lbMeta, { color: colors.textMuted }]}>{rider.successRate} success rate</Text>
        </View>

        {/* Count */}
        <Text style={[styles.lbCount, { color: colors.textPrimary }]}>{rider.count}</Text>
      </View>

      {/* Separator */}
      {!isLast && <View style={[styles.lbSeparator, { backgroundColor: colors.surfaceContainer }]} />}
    </>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────
export default function AnalyticsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>("7");

  const data = ANALYTICS[period];

  const cardShadow = isDark
    ? { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 4 }
    : { shadowColor: "rgba(48,41,80,1)", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 };

  const LEADERBOARD: LeaderboardRider[] = [
    { id: "1", name: "Kunle Adeyemi", initials: "KA", successRate: "95%", count: 42, rank: 1 },
    { id: "2", name: "Emeka Musa",    initials: "EM", successRate: "97%", count: 28, rank: 2 },
    { id: "3", name: "Taiwo James",   initials: "TJ", successRate: "83%", count: 15, rank: 3 },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 10 },
        ]}
      >
        <Pressable
          style={[styles.iconBtn, { backgroundColor: colors.surfaceCard }, cardShadow]}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <Feather name="arrow-left" size={18} color={colors.textPrimary} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Analytics</Text>

        {/* TODO: open share sheet */}
        <Pressable style={[styles.iconBtn, { backgroundColor: colors.surfaceCard }, cardShadow]} hitSlop={8}>
          <Text style={styles.exportEmoji}>📤</Text>
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
        <View style={[styles.periodContainer, { backgroundColor: colors.surfaceContainer }]}>
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
                      ? { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 1 }
                      : { shadowColor: "rgba(48,41,80,1)", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 1 },
                  ],
                ]}
                onPress={() => setPeriod(key)}
              >
                <Text style={[
                  styles.periodTabText,
                  { color: colors.textMuted },
                  active && { color: colors.textPrimary },
                ]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── 2×2 Stat cards ──────────────────────────────────────────────── */}
        <View style={styles.statsGrid}>
          {/* Total Orders */}
          <View style={[styles.statCard, { backgroundColor: colors.surfaceCard }, cardShadow]}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>TOTAL ORDERS</Text>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {data.totalOrders}
            </Text>
            <Text style={[styles.statTrend, { color: colors.success }]}>
              ↑ {data.totalTrend}
            </Text>
          </View>

          {/* Success Rate */}
          <View style={[styles.statCard, { backgroundColor: colors.surfaceCard }, cardShadow]}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>SUCCESS RATE</Text>
            <Text style={[styles.statValue, { color: colors.success }]}>
              {data.successRate}%
            </Text>
            <Text style={[styles.statTrend, { color: colors.success }]}>
              ↑ {data.rateTrend}
            </Text>
          </View>

          {/* Avg Delivery Time */}
          <View style={[styles.statCard, { backgroundColor: colors.surfaceCard }, cardShadow]}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>AVG TIME</Text>
            <Text style={[styles.statValue, { color: colors.info }]}>
              {data.avgTime}
            </Text>
            <Text style={[styles.statTrend, { color: colors.textMuted }]}>
              Per order
            </Text>
          </View>

          {/* Failed Orders */}
          <View style={[styles.statCard, { backgroundColor: colors.surfaceCard }, cardShadow]}>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>FAILED</Text>
            <Text style={[styles.statValue, { color: colors.error }]}>
              {data.failed}
            </Text>
            <Text style={[styles.statTrend, { color: colors.error }]}>
              {data.failTrend}
            </Text>
          </View>
        </View>

        {/* ── Bar chart ────────────────────────────────────────────────────── */}
        <BarChart data={data} />

        {/* ── Leaderboard ──────────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>TOP RIDERS</Text>
        <View style={[styles.lbCard, { backgroundColor: colors.surfaceCard }, cardShadow]}>
          {LEADERBOARD.map((rider, i) => (
            <LeaderboardItem
              key={rider.id}
              rider={rider}
              isLast={i === LEADERBOARD.length - 1}
            />
          ))}
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
  exportEmoji: { fontSize: 16 },

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
