/**
 * Track Link screen — magic-link customer tracking page.
 * Always light mode (DS §8.1 — customer web pages are always light).
 * DS §8.4, §8.8 — DM Sans / DM Mono fonts, token colors only.
 */
import {
  colors,
  font,
  gradients,
  layout,
  radius,
} from "@/src/constants/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Types ─────────────────────────────────────────────────────────────────────
type Status = "pending" | "picked_up" | "in_transit" | "delivered";

interface LocationPing {
  lat: number;
  lng: number;
  time: string;
}

interface OrderEvent {
  label: string;
  time: string;
  done: boolean;
  gps?: string;
}

// ── Dummy data — TODO: fetch from Supabase using token ───────────────────────
const ORDER = {
  id: "TRK-2847",
  item: "Ankara Tote Bag × 2",
  address: "14 Admiralty Way, Lekki",
  amount: 35000,
  status: "in_transit" as Status,
  sellerName: "Zara's Closet",
  sellerPhone: "08034567890",
  pickedUpAt: "11:34 AM",
  locationPings: [
    { lat: 6.455, lng: 3.384, time: "11:52 AM" },
  ] as LocationPing[],
  events: [
    { label: "Order confirmed", time: "10:58 AM", done: true },
    {
      label: "Rider picked up",
      time: "11:34 AM",
      done: true,
      gps: "Yaba, Lagos",
    },
    { label: "In transit", time: "Now", done: false },
  ] as OrderEvent[],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatAmount(n: number): string {
  return "₦" + n.toLocaleString("en-NG");
}

function getProgressFill(status: Status): number {
  if (status === "pending") return 0;
  if (status === "picked_up") return 0.33;
  if (status === "in_transit") return 0.66;
  if (status === "delivered") return 1;
  return 0;
}

function getStatusHeadline(status: Status): string {
  if (status === "pending") return "Getting your order ready";
  if (status === "picked_up") return "Rider has your order";
  if (status === "in_transit") return "Your order is moving 🚴";
  return "";
}

function getStepState(
  stepIndex: number,
  status: Status,
): "done" | "active" | "pending" {
  // 0=Confirmed, 1=Picked Up, 2=Transit, 3=Delivered
  if (status === "pending") {
    if (stepIndex === 0) return "done";
    if (stepIndex === 1) return "active";
    return "pending";
  }
  if (status === "picked_up") {
    if (stepIndex <= 1) return "done";
    if (stepIndex === 2) return "active";
    return "pending";
  }
  if (status === "in_transit") {
    if (stepIndex <= 1) return "done";
    if (stepIndex === 2) return "active";
    return "pending";
  }
  if (status === "delivered") {
    return "done";
  }
  return "pending";
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

// Blinking dot for in_transit pill
function BlinkingDot() {
  const opacity = useSharedValue(1);
  opacity.value = withRepeat(
    withSequence(
      withTiming(0.3, { duration: 750 }),
      withTiming(1, { duration: 750 }),
    ),
    -1,
    false,
  );
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[ss.blinkDot, animStyle]} />;
}

// Status pill
function StatusPill({ status }: { status: Status }) {
  if (status === "pending") {
    return (
      <View style={[ss.pill, { backgroundColor: colors.warningBg }]}>
        <Text style={[ss.pillText, { color: colors.warning }]}>Pending</Text>
      </View>
    );
  }
  if (status === "picked_up" || status === "in_transit") {
    return (
      <View
        style={[
          ss.pill,
          {
            backgroundColor: colors.infoBg,
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
          },
        ]}
      >
        <BlinkingDot />
        <Text style={[ss.pillText, { color: colors.info }]}>In Transit</Text>
      </View>
    );
  }
  if (status === "delivered") {
    return (
      <View style={[ss.pill, { backgroundColor: colors.successBg }]}>
        <Text style={[ss.pillText, { color: colors.success }]}>Delivered</Text>
      </View>
    );
  }
  return null;
}

// Step dot
interface StepDotProps {
  state: "done" | "active" | "pending";
}
function StepDot({ state }: StepDotProps) {
  if (state === "done") {
    return (
      <View style={[ss.stepDot, { backgroundColor: colors.successBg }]}>
        <Text
          style={{
            fontSize: 11,
            color: colors.success,
            fontFamily: font.sans.bold,
          }}
        >
          ✓
        </Text>
      </View>
    );
  }
  if (state === "active") {
    return (
      <View
        style={[
          ss.stepDot,
          {
            backgroundColor: colors.primarySoft,
            borderWidth: 2,
            borderColor: colors.primary,
          },
        ]}
      >
        <View style={ss.stepDotInner} />
      </View>
    );
  }
  return (
    <View style={[ss.stepDot, { backgroundColor: colors.surfaceContainer }]} />
  );
}

const STEP_LABELS = ["Confirmed", "Picked Up", "Transit", "Delivered"];

// Progress Steps row
function ProgressSteps({ status }: { status: Status }) {
  const [containerWidth, setContainerWidth] = useState(0);
  const fill = getProgressFill(status);

  return (
    <View
      style={ss.stepsOuter}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {/* Progress line track */}
      <View
        style={[
          ss.progressTrack,
          { width: containerWidth > 0 ? containerWidth - 40 : "100%" },
        ]}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryContainer]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[ss.progressFill, { width: `${Math.round(fill * 100)}%` }]}
        />
      </View>

      {/* Step dots + labels */}
      <View style={ss.stepsRow}>
        {STEP_LABELS.map((label, i) => {
          const state = getStepState(i, status);
          return (
            <View key={label} style={ss.stepItem}>
              <StepDot state={state} />
              <Text
                style={[
                  ss.stepLabel,
                  state === "done" && { color: colors.success },
                  state === "active" && { color: colors.primary },
                  state === "pending" && { color: colors.textMuted },
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// Timeline event row
interface EventRowProps {
  event: OrderEvent;
  isLast: boolean;
  index: number;
  total: number;
}
function EventRow({ event, isLast, index, total }: EventRowProps) {
  const isActive = index === total - 1 && !event.done;

  let dotBg = event.done ? colors.successBg : colors.primarySoft;
  let dotContent: React.ReactNode = event.done ? (
    <Text
      style={{
        fontSize: 10,
        color: colors.success,
        fontFamily: font.sans.bold,
      }}
    >
      ✓
    </Text>
  ) : (
    <View
      style={{
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.primary,
      }}
    />
  );

  return (
    <View style={ss.eventRow}>
      <View style={ss.eventDotCol}>
        <View style={[ss.eventDot, { backgroundColor: dotBg }]}>
          {dotContent}
        </View>
        {!isLast && (
          <View
            style={[
              ss.eventConnector,
              {
                backgroundColor: event.done
                  ? colors.successBg
                  : colors.surfaceContainer,
              },
            ]}
          />
        )}
      </View>
      <View style={ss.eventBody}>
        <Text style={ss.eventLabel}>{event.label}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={ss.eventTime}>{event.time}</Text>
          {event.gps ? <Text style={ss.eventGps}>📍 {event.gps}</Text> : null}
        </View>
      </View>
    </View>
  );
}

// Detail row
interface DetailRowProps {
  label: string;
  value: string;
  mono?: boolean;
  valueColor?: string;
  valueFontSize?: number;
  valueBg?: string;
  last?: boolean;
}
function DetailRow({
  label,
  value,
  mono,
  valueColor,
  valueFontSize,
  valueBg,
  last,
}: DetailRowProps) {
  return (
    <View style={[ss.detailRow, !last && ss.detailRowBorder]}>
      <Text style={ss.detailLabel}>{label}</Text>
      <Text
        style={[
          ss.detailValue,
          mono && { fontFamily: font.mono.regular },
          valueColor ? { color: valueColor } : undefined,
          valueFontSize ? { fontSize: valueFontSize } : undefined,
          valueBg
            ? {
                backgroundColor: valueBg,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: radius.sm,
                overflow: "hidden",
              }
            : undefined,
        ]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function TrackLinkScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ token?: string }>();
  const order = ORDER;

  // Auto-refresh counter — TODO: replace with Supabase Realtime subscription
  const [refreshTick, setRefreshTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTick((t) => t + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const isDelivered = order.status === "delivered";
  const showMap = order.status === "picked_up" || order.status === "in_transit";
  const lastPing =
    order.locationPings.length > 0
      ? order.locationPings[order.locationPings.length - 1]
      : null;

  return (
    <View style={[ss.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <View style={ss.header}>
        {/* Left spacer for balance */}
        <View style={{ width: 32 }} />

        <View style={ss.headerCenter}>
          <LinearGradient
            colors={gradients.primary}
            style={ss.headerIcon}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={{ fontSize: 16 }}>📦</Text>
          </LinearGradient>
          <View>
            <Text style={ss.headerBrand}>Trackshpr</Text>
            <Text style={ss.headerSub}>Order tracking</Text>
          </View>
        </View>

        {/* Right spacer */}
        <View style={{ width: 32 }} />
      </View>

      {/* ── Scrollable content ────────────────────────────────────────────── */}
      <ScrollView
        style={ss.scroll}
        contentContainerStyle={[
          ss.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isDelivered ? (
          /* ── Delivered Celebration Layout ──────────────────────────────── */
          <View style={ss.celebrationWrap}>
            <View style={ss.celebrationIconCircle}>
              <Text style={{ fontSize: 28 }}>✅</Text>
            </View>
            <Text style={ss.celebrationTitle}>Order Delivered!</Text>
            <Text style={ss.celebrationSub}>
              Your {order.item} was delivered successfully.
            </Text>
            <View style={ss.celebrationBadge}>
              <Text style={ss.celebrationBadgeText}>
                Delivered · 1:22 PM · 1h 48m total
              </Text>
            </View>
          </View>
        ) : (
          /* ── Status Hero Card ───────────────────────────────────────────── */
          <View style={ss.heroCard}>
            {/* Top row: pill + order ID */}
            <View style={ss.heroTopRow}>
              <StatusPill status={order.status} />
              <Text style={ss.heroOrderId}>{order.id}</Text>
            </View>

            {/* Contextual headline */}
            <Text style={ss.heroHeadline}>
              {getStatusHeadline(order.status)}
            </Text>

            {/* Delivering to address */}
            <View style={ss.heroAddressRow}>
              <Text style={ss.pinEmoji}>📍</Text>
              <Text style={ss.heroAddress} numberOfLines={2}>
                Delivering to {order.address}
              </Text>
            </View>

            {/* Progress steps */}
            <View style={{ marginTop: 18 }}>
              <ProgressSteps status={order.status} />
            </View>
          </View>
        )}

        {/* ── Map Section (picked_up or in_transit) ─────────────────────── */}
        {showMap && lastPing ? (
          <View style={ss.mapWrapper}>
            <MapView
              provider={PROVIDER_DEFAULT}
              style={ss.map}
              initialRegion={{
                latitude: lastPing.lat,
                longitude: lastPing.lng,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              <Marker
                coordinate={{ latitude: lastPing.lat, longitude: lastPing.lng }}
                title="Rider location"
              />
            </MapView>
            {/* Last known location label */}
            <View style={ss.mapLabel}>
              <Text style={ss.mapLabelText}>Last known location</Text>
            </View>
          </View>
        ) : null}

        {/* ── Call Bar ──────────────────────────────────────────────────── */}
        <View style={ss.callBar}>
          <View style={{ flex: 1 }}>
            <Text style={ss.callBarMeta}>Questions? Call the seller</Text>
            <Text style={ss.callBarName}>{order.sellerName}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [ss.callBtn, pressed && { opacity: 0.75 }]}
            onPress={() => Linking.openURL(`tel:${order.sellerPhone}`)}
            accessibilityLabel={`Call ${order.sellerName}`}
          >
            <Text style={{ fontSize: 20 }}>📞</Text>
          </Pressable>
        </View>

        {/* ── Detail Card ───────────────────────────────────────────────── */}
        <View style={ss.detailCard}>
          <DetailRow label="Item" value={order.item} />
          <DetailRow label="Picked up at" value={order.pickedUpAt} mono />
          <DetailRow
            label="Amount to pay"
            value={formatAmount(order.amount)}
            mono
            valueFontSize={15}
            valueColor={colors.success}
            valueBg={colors.successBg}
            last
          />
        </View>

        {/* ── Timeline ──────────────────────────────────────────────────── */}
        <View style={ss.timelineSection}>
          <Text style={ss.timelineTitle}>Delivery timeline</Text>
          {order.events.map((evt, i) => (
            <EventRow
              key={`${evt.label}-${i}`}
              event={evt}
              isLast={i === order.events.length - 1}
              index={i}
              total={order.events.length}
            />
          ))}
        </View>

        {/* ── Viral Footer (always shown on free tier) ───────────────────── */}
        <View style={ss.viralFooter}>
          <Text style={ss.viralPowered}>Powered by Trackshpr</Text>
          <Pressable style={ss.viralCta} onPress={() => {}}>
            <Text style={ss.viralCtaText}>Track your own deliveries →</Text>
            <Text style={{ fontSize: 16, marginLeft: 4 }}>📦</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.surface,
  },

  // Header
  header: {
    backgroundColor: colors.surfaceCard,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: layout.screenPaddingH,
    paddingVertical: 12,
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBrand: {
    fontSize: 15,
    fontFamily: font.sans.bold,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 10,
    fontFamily: font.sans.regular,
    color: colors.textMuted,
    marginTop: 1,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    gap: layout.sectionGap,
  },

  // Status hero card
  heroCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.card,
    marginHorizontal: layout.screenPaddingH,
    padding: 16,
    boxShadow: "0 1px 8px rgba(48, 41, 80, 0.05)",
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  heroOrderId: {
    fontSize: 10,
    fontFamily: font.mono.regular,
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
  heroHeadline: {
    fontSize: 17,
    fontFamily: font.sans.bold,
    color: colors.textPrimary,
    letterSpacing: -0.34,
    marginBottom: 6,
  },
  heroAddressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
  },
  pinEmoji: {
    fontSize: 12,
    marginTop: 1,
  },
  heroAddress: {
    fontSize: 12,
    fontFamily: font.sans.regular,
    color: colors.textMuted,
    flex: 1,
    lineHeight: 17,
  },

  // Progress steps
  stepsOuter: {
    position: "relative",
  },
  progressTrack: {
    position: "absolute",
    height: 3,
    backgroundColor: colors.surfaceContainer,
    top: 14,
    left: 20,
    borderRadius: radius.full,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.full,
  },
  stepsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  stepItem: {
    alignItems: "center",
    width: 60,
    gap: 5,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  stepLabel: {
    fontSize: 9,
    fontFamily: font.sans.semiBold,
    textAlign: "center",
  },

  // Status pill
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  pillText: {
    fontSize: 11,
    fontFamily: font.sans.semiBold,
    letterSpacing: 0.1,
  },
  blinkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.info,
  },

  // Map
  mapWrapper: {
    marginHorizontal: layout.screenPaddingH,
    marginBottom: 14,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  map: {
    height: 130,
    borderRadius: 16,
  },
  mapLabel: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mapLabelText: {
    fontSize: 9,
    fontFamily: font.sans.regular,
    color: colors.textMuted,
  },

  // Call bar
  callBar: {
    backgroundColor: colors.surfaceCard,
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginHorizontal: layout.screenPaddingH,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    boxShadow: "0 1px 8px rgba(48, 41, 80, 0.05)",
  },
  callBarMeta: {
    fontSize: 11,
    fontFamily: font.sans.regular,
    color: colors.textMuted,
    marginBottom: 2,
  },
  callBarName: {
    fontSize: 14,
    fontFamily: font.sans.bold,
    color: colors.textPrimary,
    letterSpacing: -0.14,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.successBg,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  // Detail card
  detailCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.xl,
    marginHorizontal: layout.screenPaddingH,
    overflow: "hidden",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  detailRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.surfaceContainer,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: font.sans.regular,
    color: colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontFamily: font.sans.semiBold,
    color: colors.textPrimary,
    textAlign: "right",
    flex: 2,
  },

  // Timeline
  timelineSection: {
    paddingHorizontal: layout.screenPaddingH,
    gap: 6,
  },
  timelineTitle: {
    fontSize: 12,
    fontFamily: font.sans.bold,
    color: colors.textPrimary,
    marginBottom: 8,
    letterSpacing: -0.12,
  },
  eventRow: {
    flexDirection: "row",
    gap: 12,
  },
  eventDotCol: {
    alignItems: "center",
    width: 22,
  },
  eventDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  eventConnector: {
    width: 1.5,
    height: 14,
    marginTop: 2,
  },
  eventBody: {
    flex: 1,
    paddingBottom: 14,
    gap: 2,
  },
  eventLabel: {
    fontSize: 12,
    fontFamily: font.sans.bold,
    color: colors.textPrimary,
    letterSpacing: -0.12,
  },
  eventTime: {
    fontSize: 10,
    fontFamily: font.mono.regular,
    color: colors.textMuted,
  },
  eventGps: {
    fontSize: 10,
    fontFamily: font.sans.regular,
    color: colors.textMuted,
  },

  // Celebration (delivered) layout
  celebrationWrap: {
    alignItems: "center",
    paddingTop: 20,
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: 14,
  },
  celebrationIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.successBg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  celebrationTitle: {
    fontSize: 20,
    fontFamily: font.sans.bold,
    color: colors.textPrimary,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  celebrationSub: {
    fontSize: 13,
    fontFamily: font.sans.regular,
    color: colors.textMuted,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 12,
  },
  celebrationBadge: {
    backgroundColor: colors.successBg,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  celebrationBadgeText: {
    fontSize: 12,
    fontFamily: font.mono.medium,
    color: colors.success,
    fontVariant: ["tabular-nums"],
  },

  // Viral footer
  viralFooter: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 14,
    marginHorizontal: layout.screenPaddingH,
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  viralPowered: {
    fontSize: 10,
    fontFamily: font.sans.regular,
    color: colors.textMuted,
  },
  viralCta: {
    flexDirection: "row",
    alignItems: "center",
  },
  viralCtaText: {
    fontSize: 12,
    fontFamily: font.sans.bold,
    color: colors.primary,
    letterSpacing: -0.12,
  },
});
