/**
 * Analytics screen - server-driven delivery stats, chart, and leaderboard.
 */
import ProGate from "@/src/components/shared/ProGate";
import { font, layout, radius } from "@/src/constants/tokens";
import {
  useAnalyticsDailyChart,
  useAnalyticsOverview,
  useAnalyticsTopRiders,
  useSession,
} from "@/src/hooks";
import { supabase } from "@/src/lib/supabase";
import type {
  AnalyticsDailyChartPoint,
  AnalyticsTopRider,
} from "@/src/lib/supabaseQueries";
import { useTheme } from "@/src/stores/themeStore";
import { useToastStore } from "@/src/stores/toastStore";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const CHART_DELIVERED_COLOR = "#16A34A";
const BAR_MAX_H = 72;

function formatAverageMinutes(value: number) {
  if (!value || value <= 0) return "0m";

  const hours = Math.floor(value / 60);
  const minutes = Math.round(value % 60);

  if (hours <= 0) return `${minutes}m`;
  if (minutes <= 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function formatChartDay(day: string) {
  return new Date(day).getDate().toString();
}

function rankBadgeColors(
  rank: number,
  colors: ReturnType<typeof useTheme>["colors"],
): { bg: string; fg: string } {
  if (rank === 1) return { bg: colors.warningBg, fg: colors.warning };
  if (rank === 2) {
    return { bg: colors.surfaceContainer, fg: colors.textSecondary };
  }

  return { bg: colors.errorBg, fg: colors.error };
}

function EmptyChartState() {
  const { colors } = useTheme();

  return (
    <View style={styles.emptyChartState}>
      <Text style={[styles.lbMeta, { color: colors.textMuted }]}>
        No delivery activity yet.
      </Text>
    </View>
  );
}

function BarChart({ data }: { data: AnalyticsDailyChartPoint[] }) {
  const { colors } = useTheme();
  const maxVal = Math.max(...data.map((entry) => entry.total), 1);
  const hasActivity = data.some((entry) => entry.total > 0);

  return (
    <View style={[styles.chartCard, { backgroundColor: colors.surfaceCard }]}>
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
                { backgroundColor: CHART_DELIVERED_COLOR },
              ]}
            />
            <Text style={[styles.legendLabel, { color: colors.textMuted }]}>
              Delivered
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.chartArea}>
        {data.map((entry) => {
          const totalHeight =
            entry.total > 0 ? Math.max(8, (entry.total / maxVal) * BAR_MAX_H) : 6;
          const deliveredHeight =
            entry.delivered > 0
              ? Math.max(8, (entry.delivered / maxVal) * BAR_MAX_H)
              : 0;

          return (
            <View key={entry.day} style={styles.barGroup}>
              <View
                style={[
                  styles.barTrack,
                  { backgroundColor: colors.surfaceContainer },
                ]}
              >
                <View
                  style={[
                    styles.bar,
                    {
                      height: totalHeight,
                      backgroundColor: colors.textMuted,
                      opacity: 0.28,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.bar,
                    {
                      height: deliveredHeight,
                      backgroundColor: CHART_DELIVERED_COLOR,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.chartLabelsRow}>
        {data.map((entry) => (
          <Text
            key={entry.day}
            style={[styles.chartLabel, { color: colors.textMuted }]}
          >
            {formatChartDay(entry.day)}
          </Text>
        ))}
      </View>

      {!hasActivity ? <EmptyChartState /> : null}
    </View>
  );
}

function LeaderboardItem({
  rider,
  rank,
  isLast,
}: {
  rider: AnalyticsTopRider;
  rank: number;
  isLast: boolean;
}) {
  const { colors } = useTheme();
  const badge = rankBadgeColors(rank, colors);
  const initials = rider.rider_name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <>
      <View style={styles.lbRow}>
        <View style={[styles.lbRank, { backgroundColor: badge.bg }]}>
          <Text style={[styles.lbRankText, { color: badge.fg }]}>{rank}</Text>
        </View>

        <View style={[styles.lbAvatar, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.lbAvatarText, { color: colors.primary }]}>
            {initials}
          </Text>
        </View>

        <View style={styles.lbBody}>
          <Text style={[styles.lbName, { color: colors.textPrimary }]}>
            {rider.rider_name}
          </Text>
          <Text style={[styles.lbMeta, { color: colors.textMuted }]}>
            {rider.success_rate}% success rate
          </Text>
        </View>

        <Text style={[styles.lbCount, { color: colors.textPrimary }]}>
          {rider.delivered_count}
        </Text>
      </View>

      {!isLast ? (
        <View
          style={[
            styles.lbSeparator,
            { backgroundColor: colors.surfaceContainer },
          ]}
        />
      ) : null}
    </>
  );
}

function LoadingSkeleton() {
  const { colors } = useTheme();

  return (
    <>
      <View style={styles.statsGrid}>
        {[0, 1, 2, 3].map((item) => (
          <View
            key={item}
            style={[
              styles.statCard,
              styles.skeletonCard,
              { backgroundColor: colors.surfaceCard },
            ]}
          >
            <View
              style={[styles.skeletonLineSm, { backgroundColor: colors.surfaceContainer }]}
            />
            <View
              style={[styles.skeletonLineLg, { backgroundColor: colors.surfaceContainer }]}
            />
            <View
              style={[styles.skeletonLineMd, { backgroundColor: colors.surfaceContainer }]}
            />
          </View>
        ))}
      </View>

      <View style={[styles.highlightCard, { backgroundColor: colors.surfaceCard }]}>
        <View
          style={[styles.skeletonLineSm, { backgroundColor: colors.surfaceContainer }]}
        />
        <View
          style={[styles.skeletonLineLg, { backgroundColor: colors.surfaceContainer }]}
        />
      </View>

      <View style={[styles.chartCard, { backgroundColor: colors.surfaceCard }]}>
        <View
          style={[styles.skeletonLineSm, { backgroundColor: colors.surfaceContainer }]}
        />
        <View style={styles.chartSkeletonBars}>
          {Array.from({ length: 14 }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.chartSkeletonBar,
                { backgroundColor: colors.surfaceContainer },
              ]}
            />
          ))}
        </View>
      </View>
    </>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.errorCard, { backgroundColor: colors.errorBg }]}>
      <View style={[styles.errorIcon, { backgroundColor: colors.surfaceCard }]}>
        <Feather name="wifi-off" size={18} color={colors.error} />
      </View>
      <View style={styles.errorBody}>
        <Text style={[styles.errorTitle, { color: colors.error }]}>
          Couldn&apos;t load analytics
        </Text>
        <Text style={[styles.errorSub, { color: colors.textSecondary }]}>
          Check your connection and try again.
        </Text>
      </View>
      <Pressable onPress={onRetry}>
        <Text style={[styles.retryText, { color: colors.error }]}>Retry</Text>
      </Pressable>
    </View>
  );
}

function InventoryAnalyticsPlaceholder() {
  const { colors } = useTheme();

  return (
    <View style={[styles.inventoryCard, { backgroundColor: colors.surfaceCard }]}>
      <Text style={[styles.inventoryTitle, { color: colors.textPrimary }]}>
        Inventory analytics
      </Text>
      <Text style={[styles.inventorySub, { color: colors.textMuted }]}>
        Top-selling products, product-linked revenue, and low-stock pressure will
        appear here.
      </Text>
      {/* TODO: Replace this placeholder with real inventory analytics built from order_items, stock_movements, and delivered product revenue. */}
      <View style={styles.inventoryStatsRow}>
        <View
          style={[
            styles.inventoryStat,
            { backgroundColor: colors.surfaceContainer },
          ]}
        >
          <Text style={[styles.inventoryStatLabel, { color: colors.textMuted }]}>
            Top product
          </Text>
          <Text style={[styles.inventoryStatValue, { color: colors.textPrimary }]}>
            Coming soon
          </Text>
        </View>
        <View
          style={[
            styles.inventoryStat,
            { backgroundColor: colors.surfaceContainer },
          ]}
        >
          <Text style={[styles.inventoryStatLabel, { color: colors.textMuted }]}>
            Revenue
          </Text>
          <Text style={[styles.inventoryStatValue, { color: colors.textPrimary }]}>
            Coming soon
          </Text>
        </View>
      </View>
      <View
        style={[
          styles.inventoryFooter,
          { backgroundColor: colors.surfaceContainer },
        ]}
      >
        <Feather name="alert-circle" size={14} color={colors.textMuted} />
        <Text style={[styles.inventoryFooterText, { color: colors.textMuted }]}>
          Low stock alerts will be shown here once inventory analytics is enabled.
        </Text>
      </View>
    </View>
  );
}

export default function AnalyticsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { userId } = useSession();
  const showToast = useToastStore((state) => state.show);
  const [exporting, setExporting] = useState(false);

  const overviewQuery = useAnalyticsOverview(userId);
  const chartQuery = useAnalyticsDailyChart(userId);
  const topRidersQuery = useAnalyticsTopRiders(userId);

  const monthLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-NG", {
        month: "long",
      }).format(new Date()),
    [],
  );

  const isLoading =
    overviewQuery.isLoading || chartQuery.isLoading || topRidersQuery.isLoading;
  const isError =
    overviewQuery.isError || chartQuery.isError || topRidersQuery.isError;

  const exportCSV = async () => {
    if (!userId) return;

    try {
      setExporting(true);
      const { data, error } = await supabase
        .from("orders")
        .select("id, item, customer_name, status, created_at")
        .eq("seller_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message ?? "Couldn't export analytics orders.");
      }

      if (!data?.length) {
        showToast("No orders to export yet.", "info");
        return;
      }

      const header = "ID,Item,Customer,Status,Date\n";
      const rows = data
        .map((order) =>
          [
            order.id,
            (order.item ?? "").replace(/,/g, ";"),
            (order.customer_name ?? "").replace(/,/g, ";"),
            order.status ?? "",
            order.created_at
              ? new Date(order.created_at).toLocaleDateString("en-NG")
              : "",
          ].join(","),
        )
        .join("\n");

      const path = `${FileSystem.documentDirectory ?? ""}trackshpr-analytics.csv`;
      await FileSystem.writeAsStringAsync(path, header + rows);
      await Sharing.shareAsync(path, {
        mimeType: "text/csv",
        dialogTitle: "Export Analytics",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Couldn't export analytics right now.";
      showToast(message, "error");
    } finally {
      setExporting(false);
    }
  };

  const retryAll = () => {
    void overviewQuery.refetch();
    void chartQuery.refetch();
    void topRidersQuery.refetch();
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

  const overview = overviewQuery.data;
  const chartData = chartQuery.data ?? [];
  const topRiders = topRidersQuery.data ?? [];

  const noOrders = (overview?.last_30_total ?? 0) === 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable
          style={[styles.iconBtn, { backgroundColor: colors.surfaceCard }, cardShadow]}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <Feather name="arrow-left" size={18} color={colors.textPrimary} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Analytics
        </Text>

        <Pressable
          style={[styles.iconBtn, { backgroundColor: colors.surfaceCard }, cardShadow]}
          onPress={exportCSV}
          disabled={exporting}
          hitSlop={8}
        >
          {exporting ? (
            <Feather name="loader" size={16} color={colors.textPrimary} />
          ) : (
            <Feather name="download" size={16} color={colors.textPrimary} />
          )}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isError ? <ErrorState onRetry={retryAll} /> : null}

        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            <View style={styles.statsGrid}>
              <View
                style={[
                  styles.statCard,
                  { backgroundColor: colors.surfaceCard },
                  cardShadow,
                ]}
              >
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                  TOTAL DELIVERIES
                </Text>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                  {overview?.last_30_total ?? 0}
                </Text>
                <Text style={[styles.statTrend, { color: colors.textMuted }]}>
                  Last 30 days
                </Text>
              </View>

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
                  {overview?.success_rate ?? 0}%
                </Text>
                <Text style={[styles.statTrend, { color: colors.success }]}>
                  Delivered
                </Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  { backgroundColor: colors.surfaceCard },
                  cardShadow,
                ]}
              >
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                  AVG DELIVERY TIME
                </Text>
                <Text style={[styles.statValue, { color: colors.info }]}>
                  {formatAverageMinutes(overview?.avg_delivery_minutes ?? 0)}
                </Text>
                <Text style={[styles.statTrend, { color: colors.textMuted }]}>
                  Delivered orders
                </Text>
              </View>

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
                  {overview?.last_30_failed ?? 0}
                </Text>
                <Text style={[styles.statTrend, { color: colors.error }]}>
                  Last 30 days
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.highlightCard,
                { backgroundColor: colors.surfaceCard },
                cardShadow,
              ]}
            >
              <Text style={[styles.highlightEyebrow, { color: colors.textMuted }]}>
                THIS MONTH
              </Text>
              <Text style={[styles.highlightTitle, { color: colors.textPrimary }]}>
                {monthLabel}
              </Text>
              <Text style={[styles.highlightValue, { color: colors.primary }]}>
                {overview?.month_total ?? 0}
              </Text>
              <Text style={[styles.highlightSub, { color: colors.textMuted }]}>
                Deliveries created this calendar month
              </Text>
            </View>

            <BarChart data={chartData} />

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
              {topRiders.length === 0 ? (
                <Text style={[styles.lbMeta, { color: colors.textMuted }]}>
                  {noOrders
                    ? "No rider delivery history yet."
                    : "No delivered rider activity in the last 30 days."}
                </Text>
              ) : (
                topRiders.map((rider, index) => (
                  <LeaderboardItem
                    key={rider.rider_id}
                    rider={rider}
                    rank={index + 1}
                    isLast={index === topRiders.length - 1}
                  />
                ))
              )}
            </View>

            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
              INVENTORY ANALYTICS
            </Text>
            <ProGate feature="inventory_analytics">
              <InventoryAnalyticsPlaceholder />
            </ProGate>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
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
  scroll: {
    paddingHorizontal: layout.screenPaddingH,
    gap: 10,
  },
  errorCard: {
    borderRadius: radius.xl,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  errorIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  errorBody: {
    flex: 1,
    gap: 2,
  },
  errorTitle: {
    fontSize: 12,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
  errorSub: {
    fontSize: 11,
    fontFamily: font.sans.regular,
  },
  retryText: {
    fontSize: 12,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statCard: {
    width: "48%",
    borderRadius: radius.xl,
    padding: layout.cardPadding,
    gap: 6,
  },
  statLabel: {
    fontSize: 9,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.07,
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 24,
    fontFamily: font.mono.medium,
    fontWeight: "700",
    letterSpacing: -0.72,
    lineHeight: 26,
  },
  statTrend: {
    fontSize: 11,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
  },
  skeletonCard: {
    minHeight: 96,
  },
  skeletonLineSm: {
    width: 72,
    height: 10,
    borderRadius: radius.full,
  },
  skeletonLineLg: {
    width: "82%",
    height: 24,
    borderRadius: radius.md,
  },
  skeletonLineMd: {
    width: "64%",
    height: 12,
    borderRadius: radius.md,
  },
  highlightCard: {
    borderRadius: radius.xl,
    padding: 16,
    gap: 4,
  },
  highlightEyebrow: {
    fontSize: 10,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.08,
    textTransform: "uppercase",
  },
  highlightTitle: {
    fontSize: 17,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.34,
  },
  highlightValue: {
    fontSize: 30,
    fontFamily: font.mono.medium,
    fontWeight: "700",
    letterSpacing: -0.9,
  },
  highlightSub: {
    fontSize: 12,
    fontFamily: font.sans.regular,
    lineHeight: 18,
  },
  chartCard: {
    borderRadius: radius.xl,
    padding: layout.cardPadding,
    gap: 12,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chartTitle: {
    fontSize: 13,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.13,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
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
  },
  barGroup: {
    flex: 1,
    justifyContent: "flex-end",
  },
  barTrack: {
    height: BAR_MAX_H,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  bar: {
    width: "100%",
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    position: "absolute",
    bottom: 0,
  },
  chartLabelsRow: {
    flexDirection: "row",
    gap: 4,
  },
  chartLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 8,
    fontFamily: font.mono.regular,
  },
  emptyChartState: {
    paddingTop: 4,
  },
  chartSkeletonBars: {
    height: 80,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 4,
  },
  chartSkeletonBar: {
    flex: 1,
    height: 40,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.1,
    textTransform: "uppercase",
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
  lbBody: {
    flex: 1,
    minWidth: 0,
  },
  lbName: {
    fontSize: 13,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.13,
  },
  lbMeta: {
    fontSize: 11,
    fontFamily: font.sans.regular,
    lineHeight: 16,
  },
  lbCount: {
    fontSize: 16,
    fontFamily: font.mono.medium,
    fontWeight: "700",
    flexShrink: 0,
  },
  inventoryCard: {
    borderRadius: radius.xl,
    padding: 16,
    gap: 10,
  },
  inventoryTitle: {
    fontSize: 15,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.15,
  },
  inventorySub: {
    fontSize: 12,
    fontFamily: font.sans.regular,
    lineHeight: 18,
  },
  inventoryStatsRow: {
    flexDirection: "row",
    gap: 8,
  },
  inventoryStat: {
    flex: 1,
    borderRadius: radius.lg,
    padding: 12,
    gap: 4,
  },
  inventoryStatLabel: {
    fontSize: 10,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.08,
    textTransform: "uppercase",
  },
  inventoryStatValue: {
    fontSize: 12,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
  },
  inventoryFooter: {
    borderRadius: radius.lg,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  inventoryFooterText: {
    flex: 1,
    fontSize: 11,
    fontFamily: font.sans.regular,
    lineHeight: 16,
  },
});
