import {
  colors,
  layout,
  radius,
  type as typography,
} from "@/src/constants/tokens";
import {
  fetchPublicCustomerOrder,
  getPrimaryContactNumber,
  type OrderEvent,
  type PublicTrackingOrder,
} from "@/src/lib/supabaseQueries";
import { supabase } from "@/src/lib/supabase";
import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TrackPageStatus =
  | "pending"
  | "picked_up"
  | "in_transit"
  | "delivered"
  | "failed";

type MapModule = {
  MapView: any;
  Marker: any;
  providerDefault: any;
};

const PUBLIC_APP_URL =
  process.env.EXPO_PUBLIC_TRACKSHPR_WEB_URL?.replace(/\/$/, "") ??
  "https://trackshpr.app";

const COMPLETED_COLOR = "#16A34A";
const STEP_LABELS = ["Confirmed", "Picked Up", "In Transit", "Delivered"];

function formatAmount(value: number | null | undefined): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Just now";

  return new Intl.DateTimeFormat("en-NG", {
    hour: "numeric",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

function getBusinessName(order: PublicTrackingOrder): string {
  return (
    order.profile.brand_name?.trim() ||
    order.profile.business_name?.trim() ||
    "Trackshpr seller"
  );
}

function getBrandColor(order: PublicTrackingOrder | null | undefined): string {
  return order?.profile.brand_color?.trim() || "#16A34A";
}

function getStatusMessage(status: TrackPageStatus): string {
  switch (status) {
    case "pending":
      return "Your order is being prepared";
    case "picked_up":
      return "Your rider has picked up your order";
    case "in_transit":
      return "Your order is on the way";
    case "delivered":
      return "Your order has been delivered";
    case "failed":
      return "There was an issue with your delivery";
  }
}

function getStatusTone(status: TrackPageStatus) {
  switch (status) {
    case "pending":
      return {
        icon: "shopping-bag" as const,
        color: colors.warning,
        bg: colors.warningBg,
      };
    case "picked_up":
      return {
        icon: "package" as const,
        color: colors.info,
        bg: colors.infoBg,
      };
    case "in_transit":
      return {
        icon: "truck" as const,
        color: colors.warning,
        bg: colors.warningBg,
      };
    case "delivered":
      return {
        icon: "check-circle" as const,
        color: colors.success,
        bg: colors.successBg,
      };
    case "failed":
      return {
        icon: "x-circle" as const,
        color: colors.error,
        bg: colors.errorBg,
      };
  }
}

function mapTimelineLabel(status: string): string {
  switch (status) {
    case "pending":
    case "created":
      return "Order confirmed";
    case "picked_up":
      return "Item picked up";
    case "in_transit":
      return "In transit";
    case "delivered":
      return "Delivered";
    case "failed":
      return "Delivery failed";
    default:
      return status;
  }
}

function getTimeline(events: OrderEvent[]) {
  return events.map((event) => ({
    id: event.id,
    label: mapTimelineLabel(event.status),
    note: event.note,
    time: formatDateTime(event.created_at),
  }));
}

function getStepState(stepIndex: number, status: TrackPageStatus) {
  if (status === "pending") {
    return stepIndex === 0 ? "active" : "upcoming";
  }

  if (status === "picked_up") {
    if (stepIndex === 0) return "complete";
    if (stepIndex === 1) return "active";
    return "upcoming";
  }

  if (status === "in_transit") {
    if (stepIndex <= 1) return "complete";
    if (stepIndex === 2) return "active";
    return "upcoming";
  }

  if (status === "delivered") {
    return "complete";
  }

  if (status === "failed") {
    if (stepIndex <= 1) return "complete";
    return "upcoming";
  }

  return "upcoming";
}

function ProgressSteps({
  status,
  brandColor,
}: {
  status: TrackPageStatus;
  brandColor: string;
}) {
  return (
    <View style={ss.progressWrap}>
      <View style={ss.progressTrack} />
      <View style={ss.progressRow}>
        {STEP_LABELS.map((label, index) => {
          const state = getStepState(index, status);
          const dotStyle =
            state === "complete"
              ? { backgroundColor: COMPLETED_COLOR }
              : state === "active"
                ? { backgroundColor: brandColor }
                : { backgroundColor: colors.surfaceContainer };

          const textColor =
            state === "complete"
              ? COMPLETED_COLOR
              : state === "active"
                ? brandColor
                : colors.textMuted;

          return (
            <View key={label} style={ss.progressStep}>
              <View style={[ss.progressDot, dotStyle]} />
              <Text style={[ss.progressLabel, { color: textColor }]}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function Timeline({
  events,
}: {
  events: ReturnType<typeof getTimeline>;
}) {
  return (
    <View style={ss.section}>
      <Text style={ss.sectionTitle}>Delivery timeline</Text>
      <View style={ss.timelineCard}>
        {events.length === 0 ? (
          <Text style={ss.helperText}>No delivery updates yet.</Text>
        ) : null}
        {events.map((event, index) => {
          const last = index === events.length - 1;

          return (
            <View key={event.id || `${event.label}-${index}`} style={ss.eventRow}>
              <View style={ss.eventRail}>
                <View style={ss.eventDot} />
                {!last ? <View style={ss.eventConnector} /> : null}
              </View>
              <View style={ss.eventBody}>
                <Text style={ss.eventLabel}>{event.label}</Text>
                {event.note ? (
                  <Text style={ss.eventNote}>{event.note}</Text>
                ) : null}
                <Text style={ss.eventTime}>{event.time}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function TrackLinkScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const queryClient = useQueryClient();
  const [mapModule, setMapModule] = useState<MapModule | null>(null);

  const {
    data: order,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["public-customer-order", token],
    queryFn: () => fetchPublicCustomerOrder(token!),
    enabled: !!token,
    retry: 1,
    refetchInterval: 15000,
  });

  useEffect(() => {
    if (!token) {
      return;
    }

    const channel = supabase
      .channel(`public:customer:${token}`)
      .on("broadcast", { event: "order_update" }, () => {
        queryClient.invalidateQueries({
          queryKey: ["public-customer-order", token],
        });
      })
      .subscribe();

    const cleanup = () => {
      supabase.removeChannel(channel);
    };

    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.addEventListener("beforeunload", cleanup);
    }

    return () => {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.removeEventListener("beforeunload", cleanup);
      }
      cleanup();
    };
  }, [queryClient, token]);

  const status = (order?.status ?? "pending") as TrackPageStatus;
  const showLiveMap = status === "picked_up" || status === "in_transit";

  useEffect(() => {
    let active = true;

    if (!showLiveMap || !order?.latest_ping) {
      setMapModule(null);
      return () => {
        active = false;
      };
    }

    import("react-native-maps")
      .then((module) => {
        if (!active) {
          return;
        }

        setMapModule({
          MapView: module.default,
          Marker: module.Marker,
          providerDefault: module.PROVIDER_DEFAULT,
        });
      })
      .catch(() => {
        if (active) {
          setMapModule(null);
        }
      });

    return () => {
      active = false;
    };
  }, [order?.latest_ping, showLiveMap]);

  const businessName = order ? getBusinessName(order) : "Trackshpr seller";
  const brandColor = getBrandColor(order);
  const sellerPhone = order ? getPrimaryContactNumber(order.profile) : null;
  const tone = getStatusTone(status);
  const events = useMemo(() => getTimeline(order?.events ?? []), [order?.events]);

  if (isLoading) {
    return (
      <View style={[ss.root, ss.centered, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={ss.loadingText}>Loading your tracking page...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={[ss.root, ss.centered, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <View style={ss.errorIcon}>
          <Feather name="link-2" size={32} color={colors.info} />
        </View>
        <Text style={ss.errorTitle}>This link isn&apos;t valid</Text>
        <Text style={ss.errorBody}>
          This tracking page may have expired or already been closed.
        </Text>
        <Pressable style={ss.secondaryButton} onPress={() => refetch()}>
          <Text style={ss.secondaryButtonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  const MapViewComponent = mapModule?.MapView ?? null;
  const MarkerComponent = mapModule?.Marker ?? null;
  const providerDefault = mapModule?.providerDefault;

  return (
    <View style={[ss.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      <View style={ss.header}>
        {order.profile.logo_url ? (
          <Image
            source={{ uri: order.profile.logo_url }}
            style={ss.logo}
            resizeMode="cover"
          />
        ) : null}
        <View style={ss.headerCopy}>
          <Text style={ss.brandName}>{businessName}</Text>
          <Text style={ss.brandSub}>Customer tracking</Text>
        </View>
      </View>

      <ScrollView
        style={ss.scroll}
        contentContainerStyle={[
          ss.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={ss.heroCard}>
          <View style={[ss.heroIcon, { backgroundColor: tone.bg }]}>
            <Feather name={tone.icon} size={24} color={tone.color} />
          </View>
          <Text style={ss.heroTitle}>{getStatusMessage(status)}</Text>
          <Text style={ss.heroBody}>
            Order #{order.order_number ?? order.id.slice(0, 6).toUpperCase()}
          </Text>
          <ProgressSteps status={status} brandColor={brandColor} />
        </View>

        <View style={ss.card}>
          <View style={ss.detailRow}>
            <Text style={ss.detailLabel}>Item</Text>
            <Text style={ss.detailValue}>{order.item || "No item added"}</Text>
          </View>
          <View style={[ss.detailRow, ss.detailAlt]}>
            <Text style={ss.detailLabel}>Delivery address</Text>
            <Text style={ss.detailValue}>
              {order.delivery_address || "No address added"}
              {order.city ? `, ${order.city}` : ""}
            </Text>
          </View>
          <View style={ss.detailRow}>
            <Text style={ss.detailLabel}>Amount to pay</Text>
            <Text style={ss.amountValue}>{formatAmount(order.delivery_fee)}</Text>
          </View>
        </View>

        {showLiveMap ? (
          order.latest_ping ? (
            <View style={ss.section}>
              <Text style={ss.sectionTitle}>Live location</Text>
              <View style={ss.mapCard}>
                {MapViewComponent && MarkerComponent ? (
                  <MapViewComponent
                    provider={providerDefault}
                    style={ss.map}
                    initialRegion={{
                      latitude: order.latest_ping.latitude,
                      longitude: order.latest_ping.longitude,
                      latitudeDelta: 0.015,
                      longitudeDelta: 0.015,
                    }}
                    region={{
                      latitude: order.latest_ping.latitude,
                      longitude: order.latest_ping.longitude,
                      latitudeDelta: 0.015,
                      longitudeDelta: 0.015,
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                    rotateEnabled={false}
                    pitchEnabled={false}
                  >
                    <MarkerComponent
                      coordinate={{
                        latitude: order.latest_ping.latitude,
                        longitude: order.latest_ping.longitude,
                      }}
                      title="Rider location"
                    />
                  </MapViewComponent>
                ) : (
                  <View style={ss.mapLoading}>
                    <ActivityIndicator size="small" color={brandColor} />
                    <Text style={ss.helperText}>Loading map...</Text>
                  </View>
                )}
                <View style={ss.mapBadge}>
                  <Text style={ss.mapBadgeText}>
                    Updated {formatDateTime(order.latest_ping.created_at)}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={ss.mapPlaceholder}>
              <Feather name="map-pin" size={18} color={brandColor} />
              <Text style={ss.mapPlaceholderText}>Locating your rider...</Text>
            </View>
          )
        ) : null}

        <Pressable
          style={ss.callCard}
          disabled={!sellerPhone}
          onPress={() => {
            if (sellerPhone) {
              Linking.openURL(`tel:${sellerPhone}`);
            }
          }}
        >
          <View style={ss.callCopy}>
            <Text style={ss.callLabel}>
              {status === "failed" ? "Need help?" : "Call seller"}
            </Text>
            <Text style={ss.callValue}>{businessName}</Text>
          </View>
          <View style={ss.callButton}>
            <Feather
              name="phone-call"
              size={18}
              color={sellerPhone ? colors.success : colors.textMuted}
            />
          </View>
        </Pressable>

        {(status === "delivered" || status === "failed") && (
          <View style={ss.stateCard}>
            <Text style={ss.stateTitle}>
              {status === "delivered"
                ? "Delivery complete"
                : "Delivery issue reported"}
            </Text>
            <Text style={ss.stateBody}>
              {status === "delivered"
                ? `Delivered ${formatDateTime(order.delivered_at)}.`
                : "Please contact the seller for the next update."}
            </Text>
            {status === "delivered" ? (
              <Pressable style={ss.secondaryButton}>
                <Text style={ss.secondaryButtonText}>Rate your experience</Text>
              </Pressable>
            ) : null}
          </View>
        )}

        <Timeline events={events} />

        <Pressable
          style={ss.viralCard}
          onPress={() => Linking.openURL(PUBLIC_APP_URL)}
        >
          <Text style={ss.viralLabel}>Powered by Trackshpr</Text>
          <View style={ss.viralActionRow}>
            <Text style={ss.viralAction}>Track yours →</Text>
            <Feather name="package" size={14} color={colors.primary} />
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const ss = StyleSheet.create<any>({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: layout.screenPaddingH,
  },
  loadingText: {
    ...typography.bodySm,
    color: colors.textMuted,
    marginTop: 12,
  },
  errorIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.infoBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  errorTitle: {
    ...typography.headingSm,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
  },
  errorBody: {
    ...typography.bodySm,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: layout.screenPaddingH,
    paddingVertical: 14,
    backgroundColor: colors.surfaceCard,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
  },
  headerCopy: {
    flex: 1,
  },
  brandName: {
    ...typography.labelLg,
    color: colors.textPrimary,
  },
  brandSub: {
    ...typography.bodySm,
    color: colors.textMuted,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: layout.screenPaddingH,
    gap: 16,
  },
  heroCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.card,
    padding: 18,
    alignItems: "center",
    gap: 12,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  heroTitle: {
    ...typography.headingSm,
    color: colors.textPrimary,
    textAlign: "center",
  },
  heroBody: {
    ...typography.bodySm,
    color: colors.textSecondary,
    textAlign: "center",
  },
  progressWrap: {
    width: "100%",
    gap: 8,
    marginTop: 4,
  },
  progressTrack: {
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainer,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 6,
  },
  progressStep: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  progressLabel: {
    ...typography.labelXs,
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  detailRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
    backgroundColor: colors.surfaceCard,
  },
  detailAlt: {
    backgroundColor: colors.surface,
  },
  detailLabel: {
    ...typography.labelXs,
    color: colors.textMuted,
  },
  detailValue: {
    ...typography.bodyLg,
    color: colors.textPrimary,
  },
  amountValue: {
    ...typography.monoSm,
    color: colors.success,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    ...typography.labelMd,
    color: colors.textPrimary,
  },
  mapCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.xl,
    padding: 8,
    gap: 8,
  },
  map: {
    height: 200,
    borderRadius: radius.lg,
  },
  mapLoading: {
    height: 200,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  mapBadge: {
    alignSelf: "flex-end",
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mapBadgeText: {
    ...typography.monoXs,
    color: colors.textMuted,
  },
  mapPlaceholder: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.xl,
    paddingHorizontal: 16,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  mapPlaceholderText: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  callCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.xl,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  callCopy: {
    flex: 1,
  },
  callLabel: {
    ...typography.bodySm,
    color: colors.textMuted,
    marginBottom: 2,
  },
  callValue: {
    ...typography.labelMd,
    color: colors.textPrimary,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.successBg,
    alignItems: "center",
    justifyContent: "center",
  },
  stateCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.xl,
    padding: 16,
    gap: 10,
  },
  stateTitle: {
    ...typography.headingSm,
    color: colors.textPrimary,
  },
  stateBody: {
    ...typography.bodySm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  secondaryButton: {
    minHeight: 48,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceContainer,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    ...typography.labelMd,
    color: colors.textSecondary,
  },
  timelineCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.xl,
    padding: 16,
    gap: 14,
  },
  helperText: {
    ...typography.bodySm,
    color: colors.textMuted,
  },
  eventRow: {
    flexDirection: "row",
    gap: 12,
  },
  eventRail: {
    width: 18,
    alignItems: "center",
  },
  eventDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  eventConnector: {
    width: 2,
    flex: 1,
    backgroundColor: colors.surfaceContainer,
    marginTop: 4,
    minHeight: 24,
  },
  eventBody: {
    flex: 1,
    gap: 3,
    paddingBottom: 4,
  },
  eventLabel: {
    ...typography.labelSm,
    color: colors.textPrimary,
  },
  eventNote: {
    ...typography.bodySm,
    color: colors.textSecondary,
  },
  eventTime: {
    ...typography.monoXs,
    color: colors.textMuted,
  },
  viralCard: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 6,
  },
  viralLabel: {
    ...typography.bodySm,
    color: colors.textMuted,
  },
  viralActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viralAction: {
    ...typography.labelSm,
    color: colors.primary,
  },
});
