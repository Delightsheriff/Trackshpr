import {
  colors,
  layout,
  radius,
} from "@/src/constants/tokens";
import {
  fetchPublicCustomerOrder,
  getPrimaryContactNumber,
  type OrderStatus,
  type OrderEvent,
  type PublicTrackingOrder,
} from "@/src/lib/supabaseQueries";
import { supabase } from "@/src/lib/supabase";
import { Feather } from "@expo/vector-icons";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import { useEffect, useMemo } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TrackPageStatus = OrderStatus;

const COMPLETED_COLOR = "#16A34A";
const STEP_LABELS: TrackPageStatus[] = [
  "pending",
  "picked_up",
  "in_transit",
  "delivered",
];

function formatAmount(value: number | null | undefined): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return "Just now";

  return new DateTimeFormat("en-NG", {
    hour: "numeric",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  }).format(new Date(value));
}

const DateTimeFormat = Intl.DateTimeFormat;

function getBusinessName(order: PublicTrackingOrder): string {
  return (
    order.profile.brand_name?.trim() ||
    order.profile.business_name?.trim() ||
    "Trackshpr seller"
  );
}

function getBrandColor(order: PublicTrackingOrder | null | undefined): string {
  return order?.profile.brand_color ?? "#4647D3";
}

function getStatusTone(
  status: TrackPageStatus,
): "success" | "warning" | "error" | "neutral" {
  switch (status) {
    case "delivered":
      return "success";
    case "failed":
      return "error";
    case "pending":
      return "neutral";
    default:
      return "warning";
  }
}

function getStatusLabel(status: TrackPageStatus): string {
  switch (status) {
    case "pending":
      return "Order Confirmed";
    case "picked_up":
      return "Picked Up";
    case "in_transit":
      return "In Transit";
    case "delivered":
      return "Delivered";
    case "failed":
      return "Failed";
  }
}

function getTimeline(events: OrderEvent[]) {
  const sorted = [...events].sort(
    (a, b) =>
      new Date(a.created_at ?? 0).getTime() -
      new Date(b.created_at ?? 0).getTime(),
  );
  return sorted.map((e) => ({
    ...e,
    label: getStatusLabel(e.status),
  }));
}

const ss = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#666666",
  },
  errorRoot: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 8,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 15,
    color: "#666666",
    textAlign: "center",
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: 16,
    paddingBottom: 24,
  },
  businessLogo: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    marginBottom: 16,
  },
  brandName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111111",
    letterSpacing: -0.5,
  },
  orderNumber: {
    fontSize: 14,
    color: "#666666",
    marginTop: 4,
  },
  statusCard: {
    marginHorizontal: layout.screenPaddingH,
    borderRadius: radius.xl,
    padding: 20,
    marginBottom: 24,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: "#666666",
  },
  timelineSection: {
    paddingHorizontal: layout.screenPaddingH,
    marginBottom: 24,
  },
  timelineTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: "row",
    paddingBottom: 24,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginLeft: 5,
  },
  timelineContent: {
    flex: 1,
    marginLeft: 16,
  },
  timelineLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111111",
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 13,
    color: "#666666",
  },
  timelineNote: {
    fontSize: 13,
    color: "#666666",
    marginTop: 4,
  },
  detailsSection: {
    paddingHorizontal: layout.screenPaddingH,
    marginBottom: 32,
  },
  detailsTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  detailLabel: {
    fontSize: 15,
    color: "#666666",
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "500",
    color: "#111111",
  },
  detailValueMono: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  actionRow: {
    paddingHorizontal: layout.screenPaddingH,
    marginBottom: 32,
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  footer: {
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: 24,
    alignItems: "center",
  },
  poweredBy: {
    fontSize: 12,
    color: "#666666",
  },
});

export default function TrackLinkScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const queryClient = useQueryClient();

  const {
    data: order,
    error,
    isLoading,
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

  const businessName = order ? getBusinessName(order) : "Trackshpr seller";
  const brandColor = getBrandColor(order);
  const sellerPhone = order ? getPrimaryContactNumber(order.profile) : null;
  const status = (order?.status ?? "pending") as TrackPageStatus;
  const tone = getStatusTone(status);
  const events = useMemo(() => getTimeline(order?.events ?? []), [order?.events]);

  if (isLoading) {
    return (
      <View style={[ss.root, ss.centered, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#4647D3" />
        <Text style={ss.loadingText}>Loading your tracking page...</Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={[ss.root, ss.centered, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <Feather name="alert-circle" size={48} color="#DC2626" style={ss.errorIcon} />
        <Text style={ss.errorTitle}>Unable to load tracking</Text>
        <Text style={ss.errorMessage}>
          This link may be invalid or expired. Please check with the seller.
        </Text>
      </View>
    );
  }

  return (
    <View style={ss.root}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={ss.scrollContent}>
        <View style={[ss.header, { paddingTop: insets.top + 16 }]}>
          {order.profile.logo_url ? (
            <Image
              source={{ uri: order.profile.logo_url }}
              style={ss.businessLogo}
              resizeMode="cover"
            />
          ) : (
            <View style={[ss.businessLogo, { backgroundColor: brandColor }]} />
          )}
          <Text style={ss.brandName}>{businessName}</Text>
          <Text style={ss.orderNumber}>Order #{order.order_number ?? order.id.slice(0, 6)}</Text>
        </View>

        <View style={[ss.statusCard, { backgroundColor: colors[`${tone}Bg` as keyof typeof colors] }]}>
          <View style={[ss.statusIcon, { backgroundColor: colors[tone as keyof typeof colors] }]}>
            <Feather
              name={
                status === "delivered"
                  ? "check"
                  : status === "failed"
                    ? "x"
                    : "truck"
              }
              size={24}
              color="#FFFFFF"
            />
          </View>
          <Text style={ss.statusLabel}>{getStatusLabel(status)}</Text>
          {order.delivered_at && status === "delivered" && (
            <Text style={ss.statusSubtitle}>
              Delivered: {formatDateTime(order.delivered_at)}
            </Text>
          )}
        </View>

        {events.length > 0 && (
          <View style={ss.timelineSection}>
            <Text style={ss.timelineTitle}>Timeline</Text>
            {events.map((event, index) => {
              const isLast = index === events.length - 1;
              const stepIndex = STEP_LABELS.indexOf(event.status);
              const stepComplete = stepIndex >= 0;
              const isCompleted =
                stepComplete && index === events.length - 1
                  ? false
                  : stepComplete;

              return (
                <View key={event.id} style={ss.timelineItem}>
                  <View
                    style={[
                      ss.timelineDot,
                      { backgroundColor: isCompleted ? COMPLETED_COLOR : "#D1D5DB" },
                    ]}
                  />
                  {!isLast && (
                    <View
                      style={[
                        ss.timelineLine,
                        { backgroundColor: isCompleted ? COMPLETED_COLOR : "#D1D5DB" },
                      ]}
                    />
                  )}
                  <View style={ss.timelineContent}>
                    <Text style={ss.timelineLabel}>{event.label}</Text>
                    <Text style={ss.timelineDate}>
                      {formatDateTime(event.created_at ?? null)}
                    </Text>
                    {event.note && (
                      <Text style={ss.timelineNote}>{event.note}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={ss.detailsSection}>
          <Text style={ss.detailsTitle}>Order Details</Text>
          <View style={ss.detailRow}>
            <Text style={ss.detailLabel}>Item</Text>
            <Text style={ss.detailValue}>{order.item}</Text>
          </View>
          {order.delivery_fee != null && (
            <View style={ss.detailRow}>
              <Text style={ss.detailLabel}>Delivery Fee</Text>
              <Text style={[ss.detailValue, ss.detailValueMono]}>
                {formatAmount(order.delivery_fee)}
              </Text>
            </View>
          )}
          {order.delivery_address && (
            <View style={ss.detailRow}>
              <Text style={ss.detailLabel}>Delivery Address</Text>
              <Text style={[ss.detailValue, { flex: 1, textAlign: "right" }]}>
                {order.delivery_address}
              </Text>
            </View>
          )}
        </View>

        {sellerPhone && (
          <View style={ss.actionRow}>
            <Pressable
              style={[ss.ctaBtn, { backgroundColor: brandColor }]}
              onPress={() => void Linking.openURL(`tel:${sellerPhone}`)}
            >
              <Feather name="phone" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={ss.ctaText}>Contact Seller</Text>
            </Pressable>
          </View>
        )}

        <View style={ss.footer}>
          <Text style={ss.poweredBy}>Powered by Trackshpr</Text>
        </View>
      </ScrollView>
    </View>
  );
}
