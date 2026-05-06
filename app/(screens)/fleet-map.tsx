/**
 * Fleet Map screen - live rider map with synced order cards.
 */
import { Platform } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { font, layout, radius } from "@/src/constants/tokens";
import { useFleetMapOrders, useSession } from "@/src/hooks";
import { queryKeys } from "@/src/lib/queryKeys";
import { supabase } from "@/src/lib/supabase";
import type {
  FleetLocationPing,
  FleetMapOrder,
} from "@/src/lib/supabaseQueries";
import { useTheme } from "@/src/stores/themeStore";
import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Database } from "@/src/types/database";

const isNative = Platform.OS !== "web";
const MapView = isNative ? require("react-native-maps").default : null;
const Marker = isNative ? require("react-native-maps").Marker : null;
const PROVIDER_DEFAULT = isNative ? require("react-native-maps").PROVIDER_DEFAULT : null;

const STALE_PING_MS = 15 * 60 * 1000;
const INITIAL_REGION = {
  latitude: 6.458,
  longitude: 3.375,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

function getStatusPalette(
  colors: ReturnType<typeof useTheme>["colors"],
  status: FleetMapOrder["status"],
) {
  switch (status) {
    case "picked_up":
      return {
        fg: colors.info,
        bg: colors.infoBg,
        marker: colors.info,
        label: "Picked Up",
      };
    case "in_transit":
      return {
        fg: colors.warning,
        bg: colors.warningBg,
        marker: colors.warning,
        label: "In Transit",
      };
    case "pending":
    default:
      return {
        fg: colors.warning,
        bg: colors.warningBg,
        marker: colors.warning,
        label: "Pending",
      };
  }
}

function isPingStale(ping: FleetLocationPing | null, now: number) {
  if (!ping?.created_at) return false;
  return now - new Date(ping.created_at).getTime() > STALE_PING_MS;
}

function formatOrderNumber(order: FleetMapOrder) {
  return order.order_number
    ? `#${order.order_number}`
    : `TRK-${order.id.slice(0, 6).toUpperCase()}`;
}

function ScreenHeader({
  activeCount,
  overlay,
}: {
  activeCount: number;
  overlay?: boolean;
}) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 750 }),
        withTiming(1, { duration: 750 }),
      ),
      -1,
      false,
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  const overlayBg = isDark ? "rgba(15,14,26,0.95)" : "rgba(250,244,255,0.95)";

  return (
    <View
      style={[
        styles.headerWrap,
        overlay && styles.headerOverlay,
        {
          paddingTop: insets.top,
          backgroundColor: overlay ? overlayBg : colors.surface,
        },
      ]}
    >
      <View style={styles.headerInner}>
        <Pressable
          style={[styles.iconBtn, { backgroundColor: colors.surfaceCard }]}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <Feather name="arrow-left" size={18} color={colors.textPrimary} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          Fleet Map
        </Text>

        <View style={[styles.activeBadge, { backgroundColor: colors.primarySoft }]}>
          <Animated.View
            style={[
              styles.activeDot,
              { backgroundColor: colors.primary },
              pulseStyle,
            ]}
          />
          <Text style={[styles.activeBadgeText, { color: colors.primary }]}>
            {activeCount} active
          </Text>
        </View>
      </View>
    </View>
  );
}

function StatusPill({ status }: { status: FleetMapOrder["status"] }) {
  const { colors } = useTheme();
  const palette = getStatusPalette(colors, status);

  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }]}>
      <View style={[styles.pillDot, { backgroundColor: palette.fg }]} />
      <Text style={[styles.pillText, { color: palette.fg }]}>{palette.label}</Text>
    </View>
  );
}

function StaleIndicator() {
  const { colors } = useTheme();

  return (
    <View style={[styles.staleBadge, { backgroundColor: colors.warningBg }]}>
      <Feather name="alert-triangle" size={10} color={colors.warning} />
      <Text style={[styles.staleBadgeText, { color: colors.warning }]}>Stale</Text>
    </View>
  );
}

const FleetMarker = memo(function FleetMarker({
  order,
  selected,
  stale,
  onPress,
}: {
  order: FleetMapOrder;
  selected: boolean;
  stale: boolean;
  onPress: (order: FleetMapOrder) => void;
}) {
  const { colors } = useTheme();
  const ping = order.latest_ping;

  if (!ping) return null;

  const palette = getStatusPalette(colors, order.status);

  return (
    <Marker
      coordinate={{ latitude: ping.latitude, longitude: ping.longitude }}
      anchor={{ x: 0.5, y: 1 }}
      onPress={() => onPress(order)}
    >
      <View
        style={[
          styles.pinBubble,
          {
            backgroundColor: palette.marker,
            borderColor: selected ? colors.textPrimary : "transparent",
          },
          stale && {
            borderColor: colors.warning,
            borderWidth: 2,
          },
        ]}
      >
        <Feather name="navigation" size={12} color={colors.white} />
        <Text style={[styles.pinText, { color: colors.white }]}>
          {order.rider_name ?? "Rider"}
        </Text>
        {stale ? (
          <View style={[styles.pinWarning, { backgroundColor: colors.warningBg }]}>
            <Feather name="alert-triangle" size={10} color={colors.warning} />
          </View>
        ) : null}
      </View>
      <View style={[styles.pinTail, { borderTopColor: palette.marker }]} />
    </Marker>
  );
});

const FleetOrderCard = memo(function FleetOrderCard({
  order,
  selected,
  stale,
  onPress,
}: {
  order: FleetMapOrder;
  selected: boolean;
  stale: boolean;
  onPress: (order: FleetMapOrder) => void;
}) {
  const { colors } = useTheme();

  return (
    <Pressable
      style={[
        styles.fleetCard,
        {
          backgroundColor: selected ? colors.primarySoft : colors.surfaceCard,
        },
      ]}
      onPress={() => onPress(order)}
    >
      <View style={styles.cardTopRow}>
        <Text style={[styles.cardOrderNumber, { color: colors.textSecondary }]}>
          {formatOrderNumber(order)}
        </Text>
        <StatusPill status={order.status} />
      </View>

      <Text style={[styles.cardItem, { color: colors.textPrimary }]} numberOfLines={1}>
        {order.item}
      </Text>

      <Text style={[styles.cardMeta, { color: colors.textSecondary }]} numberOfLines={1}>
        {order.customer_name}
      </Text>
      <Text style={[styles.cardMeta, { color: colors.textMuted }]} numberOfLines={1}>
        {order.rider_name ?? "Rider not assigned yet"}
      </Text>

      <View style={styles.cardBottomRow}>
        {stale ? <StaleIndicator /> : <View />}
        {!order.latest_ping ? (
          <View style={[styles.noPingBadge, { backgroundColor: colors.surfaceContainer }]}>
            <Feather name="map-pin" size={10} color={colors.textMuted} />
            <Text style={[styles.noPingText, { color: colors.textMuted }]}>
              Awaiting location
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});

function FleetSkeletonCard() {
  const { colors } = useTheme();
  const shimmer = useSharedValue(1);

  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(0.55, { duration: 800 }),
        withTiming(1, { duration: 800 }),
      ),
      -1,
      false,
    );
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value,
  }));

  return (
    <Animated.View
      style={[
        styles.fleetCard,
        {
          backgroundColor: colors.surfaceCard,
        },
        animatedStyle,
      ]}
    >
      <View style={[styles.skeletonLineSm, { backgroundColor: colors.surfaceContainer }]} />
      <View style={[styles.skeletonLineLg, { backgroundColor: colors.surfaceContainer }]} />
      <View style={[styles.skeletonLineMd, { backgroundColor: colors.surfaceContainer }]} />
      <View style={[styles.skeletonLineMd, { backgroundColor: colors.surfaceContainer }]} />
    </Animated.View>
  );
}

function LoadingState() {
  const { colors } = useTheme();

  return (
    <View style={[styles.stateBody, { backgroundColor: colors.surface }]}>
      <ScreenHeader activeCount={0} />
      <View style={styles.stateContent}>
        <View style={[styles.loadingHero, { backgroundColor: colors.surfaceCard }]}>
          <Text style={[styles.stateTitle, { color: colors.textPrimary }]}>
            Loading active deliveries
          </Text>
          <Text style={[styles.stateSub, { color: colors.textMuted }]}>
            We&apos;re pulling the latest rider positions for your map.
          </Text>
        </View>

        <FlashList
          data={["one", "two", "three"]}
          horizontal
          keyExtractor={(item) => item}
          renderItem={() => <FleetSkeletonCard />}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsScroll}
        />
      </View>
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { colors } = useTheme();

  return (
    <View style={[styles.stateBody, { backgroundColor: colors.surface }]}>
      <ScreenHeader activeCount={0} />
      <View style={styles.centerState}>
        <View style={[styles.stateIconWrap, { backgroundColor: colors.errorBg }]}>
          <Feather name="wifi-off" size={28} color={colors.error} />
        </View>
        <Text style={[styles.stateTitle, { color: colors.textPrimary }]}>
          Couldn&apos;t load the fleet map
        </Text>
        <Text style={[styles.stateSub, { color: colors.textMuted }]}>
          Check your connection and try again.
        </Text>
        <Pressable
          onPress={onRetry}
          style={[styles.primaryAction, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.primaryActionText, { color: colors.white }]}>Retry</Text>
        </Pressable>
      </View>
    </View>
  );
}

function EmptyState() {
  const { colors } = useTheme();

  return (
    <View style={[styles.stateBody, { backgroundColor: colors.surface }]}>
      <ScreenHeader activeCount={0} />
      <View style={styles.centerState}>
        <View style={[styles.stateIconWrap, { backgroundColor: colors.surfaceContainer }]}>
          <Feather name="map-pin" size={28} color={colors.textMuted} />
        </View>
        <Text style={[styles.stateTitle, { color: colors.textPrimary }]}>
          No active deliveries
        </Text>
        <Text style={[styles.stateSub, { color: colors.textMuted }]}>
          Pending, picked-up, and in-transit deliveries will appear here once they are live.
        </Text>
      </View>
    </View>
  );
}

export default function FleetMapScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<any>(null);
  const { userId } = useSession();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const activeOrderIdsRef = useRef<Set<string>>(new Set());

  const {
    data: orders = [],
    isLoading,
    isError,
    refetch,
  } = useFleetMapOrders(userId);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    activeOrderIdsRef.current = new Set(orders.map((order) => order.id));
  }, [orders]);

  useEffect(() => {
    if (!selectedId || orders.some((order) => order.id === selectedId)) return;
    const nextSelected = orders.find((order) => order.latest_ping) ?? orders[0] ?? null;
    setSelectedId(nextSelected?.id ?? null);
  }, [orders, selectedId]);

  useEffect(() => {
    if (!userId) return;

    const ordersChannel = supabase
      .channel(`fleet-orders-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `seller_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.fleetOrders(userId) });
        },
      )
      .subscribe();

    const pingsChannel = supabase
      .channel(`fleet-pings-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "location_pings",
        },
        (payload) => {
          const ping = payload.new as Database["public"]["Tables"]["location_pings"]["Row"];
          if (!activeOrderIdsRef.current.has(ping.order_id)) return;

          queryClient.setQueryData<FleetMapOrder[]>(
            queryKeys.fleetOrders(userId),
            (current) =>
              current?.map((order) =>
                order.id === ping.order_id
                  ? {
                      ...order,
                      latest_ping: {
                        id: ping.id,
                        order_id: ping.order_id,
                        latitude: ping.latitude,
                        longitude: ping.longitude,
                        created_at: ping.created_at,
                      },
                    }
                  : order,
              ) ?? current,
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(ordersChannel);
      void supabase.removeChannel(pingsChannel);
    };
  }, [queryClient, userId]);

  const ordersWithMeta = useMemo(
    () =>
      orders.map((order) => ({
        ...order,
        stale: isPingStale(order.latest_ping, now),
      })),
    [now, orders],
  );

  const markerOrders = useMemo(
    () => ordersWithMeta.filter((order) => order.latest_ping),
    [ordersWithMeta],
  );

  const overlayBg = isDark ? "rgba(15,14,26,0.95)" : "rgba(250,244,255,0.95)";
  const fadeBg = isDark ? "rgba(15,14,26,0.5)" : "rgba(250,244,255,0.5)";

  const handleSelectOrder = useCallback((order: FleetMapOrder) => {
    setSelectedId(order.id);

    if (!order.latest_ping) return;

    mapRef.current?.animateToRegion(
      {
        latitude: order.latest_ping.latitude,
        longitude: order.latest_ping.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      400,
    );
  }, []);

  const renderCard = useCallback(
    ({ item }: { item: (typeof ordersWithMeta)[number] }) => (
      <FleetOrderCard
        order={item}
        stale={item.stale}
        selected={selectedId === item.id}
        onPress={handleSelectOrder}
      />
    ),
    [handleSelectOrder, selectedId],
  );

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return <ErrorState onRetry={() => void refetch()} />;
  }

  if (orders.length === 0) {
    return <EmptyState />;
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {!MapView ? (
        <View style={[styles.emptyState, { backgroundColor: colors.surfaceCard }]}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            MapView is not available on web
          </Text>
        </View>
      ) : (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_DEFAULT}
          initialRegion={INITIAL_REGION}
          showsUserLocation={false}
          showsCompass={false}
        >
        {markerOrders.map((order) => (
          <FleetMarker
            key={order.id}
            order={order}
            stale={order.stale}
            selected={selectedId === order.id}
            onPress={handleSelectOrder}
          />
        ))}
      </MapView>
      )}

      <ScreenHeader activeCount={orders.length} overlay />

      <View style={styles.bottomOverlay}>
        <View style={[styles.fadeStrip, { backgroundColor: fadeBg }]} />
        <View
          style={[
            styles.cardsBackground,
            { paddingBottom: insets.bottom + 8, backgroundColor: overlayBg },
          ]}
        >
          <FlashList
            data={ordersWithMeta}
            horizontal
            keyExtractor={(item) => item.id}
            renderItem={renderCard}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsScroll}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
  },
  headerWrap: {
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: 10,
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  headerInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 4,
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
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: radius.full,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
  },
  activeBadgeText: {
    fontSize: 11,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
  stateBody: {
    flex: 1,
  },
  stateContent: {
    paddingTop: 28,
    gap: 18,
  },
  loadingHero: {
    marginHorizontal: layout.screenPaddingH,
    borderRadius: radius.xl,
    padding: 16,
    gap: 6,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  stateIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  stateTitle: {
    fontSize: 17,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.34,
    textAlign: "center",
  },
  stateSub: {
    fontSize: 13,
    fontFamily: font.sans.regular,
    lineHeight: 19,
    textAlign: "center",
  },
  primaryAction: {
    marginTop: 4,
    borderRadius: radius.full,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  primaryActionText: {
    fontSize: 14,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
  bottomOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  fadeStrip: {
    height: 24,
  },
  cardsBackground: {},
  cardsScroll: {
    paddingHorizontal: layout.screenPaddingH,
    paddingVertical: 14,
  },
  fleetCard: {
    width: 220,
    borderRadius: radius.xl,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginRight: 10,
    gap: 8,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  cardOrderNumber: {
    fontSize: 11,
    fontFamily: font.mono.regular,
    fontVariant: ["tabular-nums"],
  },
  cardItem: {
    fontSize: 14,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.14,
  },
  cardMeta: {
    fontSize: 12,
    fontFamily: font.sans.regular,
  },
  cardBottomRow: {
    minHeight: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  noPingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: radius.full,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  noPingText: {
    fontSize: 10,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.full,
    paddingVertical: 3,
    paddingHorizontal: 9,
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
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  staleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: radius.full,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  staleBadgeText: {
    fontSize: 10,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
  pinBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radius.full,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  pinText: {
    fontSize: 11,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    maxWidth: 100,
  },
  pinWarning: {
    width: 18,
    height: 18,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    alignSelf: "center",
  },
  skeletonLineSm: {
    width: 64,
    height: 10,
    borderRadius: radius.full,
  },
  skeletonLineLg: {
    width: "88%",
    height: 16,
    borderRadius: radius.md,
  },
  skeletonLineMd: {
    width: "72%",
    height: 12,
    borderRadius: radius.md,
  },
});
