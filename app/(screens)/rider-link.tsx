/**
 * Rider Link screen — magic-link action page for riders.
 * Always light mode. DS tokens only — no theme store.
 * TODO: fetch from Supabase using token
 */
import {
  colors,
  font,
  gradients,
  layout,
  radius,
} from "@/src/constants/tokens";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Types ──────────────────────────────────────────────────────────────────────
type Status = "pending" | "in_transit" | "delivered" | "failed";

interface TimelineEvent {
  label: string;
  time: string;
  type: string;
}

// ── Dummy data — TODO: fetch from Supabase using token ────────────────────────
const ORDER = {
  id: "TRK-2847",
  item: "Ankara Tote Bag × 2",
  customerName: "Amara Obi",
  customerPhone: "0801 234 5678",
  address: "14 Admiralty Way, Lekki Phase 1",
  amount: 35000,
  status: "pending" as Status,
  sellerName: "Zara's Closet",
  events: [{ label: "Order created", time: "10:58 AM", type: "created" }],
};

// ── Progress step config ───────────────────────────────────────────────────────
const STEPS = ["Confirmed", "Picked Up", "Transit", "Delivered"];

// ── Report options ─────────────────────────────────────────────────────────────
const REPORT_OPTIONS = [
  {
    icon: "map-pin",
    title: "Wrong address",
    subtitle: "Address doesn't match or is incorrect",
    iconBg: colors.warningBg,
  },
  {
    icon: "phone-off",
    title: "Customer not available",
    subtitle: "Customer not picking up or not home",
    iconBg: colors.errorBg,
  },
  {
    icon: "alert-triangle",
    title: "Traffic delay",
    subtitle: "Will be late due to traffic",
    iconBg: colors.infoBg,
  },
  {
    icon: "message-circle",
    title: "Other issue",
    subtitle: "Something else is wrong",
    iconBg: colors.surfaceContainer,
  },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatAmount(n: number): string {
  return "₦" + n.toLocaleString("en-NG");
}

function getStepState(
  stepIndex: number,
  status: Status,
): "done" | "now" | "pending" {
  if (status === "pending") {
    if (stepIndex === 0) return "done";
    if (stepIndex === 1) return "now";
    return "pending";
  }
  if (status === "in_transit") {
    if (stepIndex <= 1) return "done";
    if (stepIndex === 2) return "now";
    return "pending";
  }
  if (status === "delivered") {
    return "done";
  }
  return "pending";
}

function getStatusLabel(status: Status): string {
  if (status === "pending") return "Pending";
  if (status === "in_transit") return "In Transit";
  if (status === "delivered") return "Delivered";
  return "Failed";
}

// ── Detail row ────────────────────────────────────────────────────────────────
function DetailRow({
  label,
  value,
  isAmount,
  isLast,
}: {
  label: string;
  value: string;
  isAmount?: boolean;
  isLast?: boolean;
}) {
  return (
    <View style={[ss.detailRow, !isLast && ss.detailRowBorder]}>
      <Text style={ss.detailLabel}>{label}</Text>
      <Text
        style={[ss.detailValue, isAmount && ss.detailValueAmount]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function RiderLinkScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useLocalSearchParams<{ token?: string }>();

  const [status, setStatus] = useState<Status>(ORDER.status);
  const [events, setEvents] = useState<TimelineEvent[]>(ORDER.events);
  const [ctaBusy, setCtaBusy] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  // GPS pings — no re-render needed
  const locationPings = useRef<{ lat: number; lng: number; time: string }[]>(
    [],
  );

  // Blinking dot for in_transit status pill
  const blinkOpacity = useSharedValue(1);
  const blinkStyle = useAnimatedStyle(() => ({
    opacity: blinkOpacity.value,
  }));

  useEffect(() => {
    if (status === "in_transit") {
      blinkOpacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: 750 }),
          withTiming(1, { duration: 750 }),
        ),
        -1,
        false,
      );
    } else {
      blinkOpacity.value = 1;
    }
  }, [status]);

  // Report sheet slide-up — start off-screen at 400
  const sheetY = useSharedValue(400);
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
  }));

  function openReport() {
    setReportOpen(true);
    sheetY.value = withSpring(0, { damping: 22, stiffness: 280 });
  }

  function closeReport() {
    sheetY.value = withSpring(400, { damping: 22, stiffness: 280 });
    setTimeout(() => setReportOpen(false), 320);
  }

  async function handleCta() {
    if (ctaBusy) return;
    setCtaBusy(true);
    try {
      // GPS ping
      const { status: locStatus } =
        await Location.requestForegroundPermissionsAsync();
      if (locStatus === "granted") {
        const loc = await Location.getCurrentPositionAsync({});
        locationPings.current.push({
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          time: new Date().toLocaleTimeString(),
        });
        // TODO: POST to Supabase
      }

      const now = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      if (status === "pending") {
        setStatus("in_transit");
        setEvents((prev) => [
          ...prev,
          { label: "Item picked up", time: now, type: "picked_up" },
        ]);
      } else if (status === "in_transit") {
        setStatus("delivered");
        setEvents((prev) => [
          ...prev,
          { label: "Delivered successfully", time: now, type: "delivered" },
        ]);
      }
    } finally {
      setCtaBusy(false);
    }
  }

  // Progress line fill: fraction 0–1 of the inner track width
  function getLineFillRatio(): number {
    if (status === "pending") return 1 / 3; // 1 step done
    if (status === "in_transit") return 2 / 3; // 2 steps done
    if (status === "delivered") return 1;
    return 0;
  }

  return (
    <View style={[ss.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* ── Header ── */}
      <View style={ss.header}>
        <LinearGradient
          colors={["#4647D3", "#6366F1"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={ss.headerIcon}
        >
          <Feather name="package" size={16} color={colors.white} />
        </LinearGradient>
        <View style={ss.headerTextCol}>
          <Text style={ss.headerBrand}>Trackshpr</Text>
          <Text style={ss.headerSub}>Delivery management</Text>
        </View>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        style={ss.scroll}
        contentContainerStyle={[
          ss.scrollContent,
          { paddingBottom: status !== "delivered" ? 120 : 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Status Hero Card ── */}
        <View style={ss.heroCard}>
          {/* Top row: status pill + order ID */}
          <View style={ss.heroTopRow}>
            {/* Status pill */}
            {status === "pending" && (
              <View
                style={[
                  ss.pill,
                  {
                    backgroundColor: colors.warningBg,
                    borderColor: colors.warning,
                  },
                ]}
              >
                <Text style={[ss.pillText, { color: colors.warning }]}>
                  {getStatusLabel(status)}
                </Text>
              </View>
            )}
            {status === "in_transit" && (
              <View
                style={[
                  ss.pill,
                  {
                    backgroundColor: colors.primarySoft,
                    borderColor: colors.primary,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                  },
                ]}
              >
                <Animated.View style={[ss.blinkDot, blinkStyle]} />
                <Text style={[ss.pillText, { color: colors.primary }]}>
                  {getStatusLabel(status)}
                </Text>
              </View>
            )}
            {status === "delivered" && (
              <View
                style={[
                  ss.pill,
                  {
                    backgroundColor: colors.successBg,
                    borderColor: colors.success,
                  },
                ]}
              >
                <Text style={[ss.pillText, { color: colors.success }]}>
                  {getStatusLabel(status)}
                </Text>
              </View>
            )}
            {status === "failed" && (
              <View
                style={[
                  ss.pill,
                  {
                    backgroundColor: colors.errorBg,
                    borderColor: colors.error,
                  },
                ]}
              >
                <Text style={[ss.pillText, { color: colors.error }]}>
                  {getStatusLabel(status)}
                </Text>
              </View>
            )}

            <Text style={ss.orderId}>{ORDER.id}</Text>
          </View>

          {/* Item name */}
          <Text style={ss.itemName}>{ORDER.item}</Text>

          {/* Address */}
          <View style={ss.addressRow}>
            <Feather
              name="map-pin"
              size={12}
              color={colors.textMuted}
              style={ss.pinIcon}
            />
            <Text style={ss.addressText} numberOfLines={2}>
              {ORDER.address}
            </Text>
          </View>

          {/* Progress steps */}
          <View
            style={ss.stepsOuter}
            onLayout={() => {
              // layout driven by flex, no measurement needed
            }}
          >
            {/* Track background */}
            <View style={ss.progressTrackBg} />
            {/* Active gradient fill */}
            <LinearGradient
              colors={[colors.primary, colors.primaryContainer]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                ss.progressTrackFill,
                { width: `${Math.round(getLineFillRatio() * 100)}%` },
              ]}
            />

            {/* Dots row */}
            <View style={ss.stepsRow}>
              {STEPS.map((label, i) => {
                const state = getStepState(i, status);
                return (
                  <View key={label} style={ss.stepItem}>
                    <View
                      style={[
                        ss.stepDot,
                        state === "done" && ss.stepDotDone,
                        state === "now" && ss.stepDotNow,
                        state === "pending" && ss.stepDotPending,
                      ]}
                    >
                      {state === "done" && (
                        <Text style={ss.stepCheckText}>✓</Text>
                      )}
                      {state === "now" && (
                        <Text
                          style={[ss.stepNumText, { color: colors.primary }]}
                        >
                          {i + 1}
                        </Text>
                      )}
                      {state === "pending" && (
                        <Text
                          style={[ss.stepNumText, { color: colors.textMuted }]}
                        >
                          {i + 1}
                        </Text>
                      )}
                    </View>
                    <Text
                      style={[
                        ss.stepLabel,
                        state === "done" && { color: colors.success },
                        state === "now" && { color: colors.primary },
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
        </View>

        {/* ── Detail Card ── */}
        <View style={ss.detailCard}>
          <DetailRow label="Customer" value={ORDER.customerName} />
          <DetailRow label="Phone" value={ORDER.customerPhone} />
          <DetailRow label="Address" value={ORDER.address} />
          <DetailRow
            label="Collect on delivery"
            value={formatAmount(ORDER.amount)}
            isAmount
            isLast
          />
        </View>

        {/* ── Timeline ── */}
        <View style={ss.timelineSection}>
          <Text style={ss.timelineTitle}>Delivery timeline</Text>
          {events.map((ev, i) => {
            const isLast = i === events.length - 1;
            const isDone =
              ev.type === "created" ||
              ev.type === "picked_up" ||
              ev.type === "delivered";
            const isActive = isLast && !isDone;

            return (
              <View key={`${ev.type}-${i}`} style={ss.eventRow}>
                {/* Spine */}
                <View style={ss.eventSpineCol}>
                  <View
                    style={[
                      ss.eventDot,
                      isDone && {
                        backgroundColor: colors.successBg,
                        borderColor: colors.success,
                      },
                      isActive && {
                        backgroundColor: colors.primarySoft,
                        borderColor: colors.primary,
                      },
                      !isDone &&
                        !isActive && {
                          backgroundColor: colors.surfaceContainer,
                          borderColor: colors.surfaceContainer,
                        },
                    ]}
                  >
                    {isDone && <Text style={ss.eventDotCheck}>✓</Text>}
                    {isActive && <View style={ss.eventDotInner} />}
                  </View>
                  {!isLast && <View style={ss.eventConnector} />}
                </View>
                {/* Content */}
                <View style={ss.eventBody}>
                  <Text style={ss.eventLabel}>{ev.label}</Text>
                  <Text style={ss.eventTime}>{ev.time}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Viral Footer ── */}
        <View style={ss.viralFooter}>
          <View>
            <Text style={ss.viralPowered}>Powered by Trackshpr</Text>
            <Text style={ss.viralCta}>Track your own deliveries →</Text>
          </View>
          <Feather name="package" size={18} color={colors.primary} />
        </View>
      </ScrollView>

      {/* ── CTA Section (floated above bottom) ── */}
      {status !== "delivered" && (
        <View style={[ss.ctaSection, { paddingBottom: insets.bottom + 14 }]}>
          <Pressable
            onPress={handleCta}
            disabled={ctaBusy}
            style={({ pressed }) => [
              { opacity: pressed || ctaBusy ? 0.72 : 1 },
            ]}
          >
            <LinearGradient
              colors={
                status === "in_transit"
                  ? (gradients.success as [string, string])
                  : (gradients.primary as [string, string])
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={ss.ctaButton}
            >
              <Text style={ss.ctaText}>
                {status === "pending"
                  ? "I've Picked Up the Item"
                  : "Delivery Complete"}
              </Text>
            </LinearGradient>
          </Pressable>

          <Text style={ss.reportRow}>
            Having trouble?{" "}
            <Text style={ss.reportLink} onPress={openReport}>
              Report a problem
            </Text>
          </Text>
        </View>
      )}

      {/* ── Report Problem Bottom Sheet ── */}
      <Modal
        visible={reportOpen}
        transparent
        animationType="none"
        onRequestClose={closeReport}
      >
        <View style={ss.modalRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={closeReport} />
          <Animated.View
            style={[
              ss.sheet,
              sheetStyle,
              { paddingBottom: insets.bottom + 16 },
            ]}
          >
            {/* Handle */}
            <View style={ss.sheetHandle} />

            {/* Title */}
            <Text style={ss.sheetTitle}>Report a problem</Text>

            {/* Options */}
            <View style={ss.reportOptions}>
              {REPORT_OPTIONS.map((opt, i) => (
                <Pressable
                  key={i}
                  style={({ pressed }) => [
                    ss.reportOption,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={() => {
                    // TODO: submit report to Supabase
                    closeReport();
                  }}
                >
                  <View
                    style={[
                      ss.reportIconContainer,
                      { backgroundColor: opt.iconBg },
                    ]}
                  >
                    <Feather
                      name={opt.icon}
                      size={16}
                      color={colors.textPrimary}
                    />
                  </View>
                  <View style={ss.reportOptionBody}>
                    <Text style={ss.reportOptionTitle}>{opt.title}</Text>
                    <Text style={ss.reportOptionSub}>{opt.subtitle}</Text>
                  </View>
                </Pressable>
              ))}
            </View>

            {/* Cancel */}
            <Pressable
              style={({ pressed }) => [
                ss.cancelBtn,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={closeReport}
            >
              <Text style={ss.cancelBtnText}>Cancel</Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
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
    paddingHorizontal: layout.screenPaddingH,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextCol: {
    gap: 1,
  },
  headerBrand: {
    fontSize: 15,
    fontFamily: font.sans.bold,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 10,
    fontFamily: font.sans.regular,
    color: colors.textMuted,
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: 16,
    gap: 12,
  },

  // Hero card
  heroCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.card,
    padding: 16,
    boxShadow: "0 1px 8px rgba(48, 41, 80, 0.05)",
    gap: 8,
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pill: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
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
    backgroundColor: colors.primary,
  },
  orderId: {
    fontSize: 10,
    fontFamily: font.mono.regular,
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
  itemName: {
    fontSize: 17,
    fontFamily: font.sans.bold,
    color: colors.textPrimary,
    letterSpacing: -0.34,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 3,
  },
  pinIcon: {
    marginTop: 1,
  },
  addressText: {
    fontSize: 12,
    fontFamily: font.sans.regular,
    color: colors.textMuted,
    flex: 1,
    lineHeight: 17,
  },

  // Progress steps
  stepsOuter: {
    marginTop: 10,
    position: "relative",
    paddingTop: 10,
  },
  progressTrackBg: {
    position: "absolute",
    top: 20,
    left: "10%",
    right: "10%",
    height: 2,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 1,
  },
  progressTrackFill: {
    position: "absolute",
    top: 20,
    left: "10%",
    height: 2,
    borderRadius: 1,
  },
  stepsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  stepItem: {
    alignItems: "center",
    gap: 5,
    flex: 1,
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
  },
  stepDotDone: {
    backgroundColor: colors.successBg,
    borderColor: colors.success,
  },
  stepDotNow: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  stepDotPending: {
    backgroundColor: colors.surfaceCard,
    borderColor: colors.surfaceContainer,
  },
  stepCheckText: {
    fontSize: 10,
    color: colors.success,
    fontFamily: font.sans.bold,
  },
  stepNumText: {
    fontSize: 9,
    fontFamily: font.sans.bold,
  },
  stepLabel: {
    fontSize: 9,
    fontFamily: font.sans.semiBold,
    textAlign: "center",
  },

  // Detail card
  detailCard: {
    backgroundColor: colors.surfaceCard,
    borderRadius: radius.xl,
    overflow: "hidden",
    boxShadow: "0 1px 8px rgba(48, 41, 80, 0.05)",
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
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceContainer,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: font.sans.regular,
    color: colors.textMuted,
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontFamily: font.sans.semiBold,
    color: colors.textPrimary,
    textAlign: "right",
    flexShrink: 1,
    marginLeft: 8,
  },
  detailValueAmount: {
    fontSize: 15,
    fontFamily: font.mono.medium,
    color: colors.success,
  },

  // Timeline
  timelineSection: {
    gap: 0,
  },
  timelineTitle: {
    fontSize: 12,
    fontFamily: font.sans.bold,
    color: colors.textPrimary,
    marginBottom: 10,
    letterSpacing: -0.12,
  },
  eventRow: {
    flexDirection: "row",
    gap: 10,
    minHeight: 36,
  },
  eventSpineCol: {
    alignItems: "center",
    width: 22,
  },
  eventDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  eventDotCheck: {
    fontSize: 10,
    color: colors.success,
    fontFamily: font.sans.bold,
  },
  eventDotInner: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  eventConnector: {
    width: 1.5,
    flex: 1,
    backgroundColor: colors.surfaceContainer,
    marginTop: 2,
    marginBottom: 2,
  },
  eventBody: {
    flex: 1,
    paddingBottom: 14,
    gap: 2,
    paddingTop: 2,
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

  // Viral footer
  viralFooter: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: 14,
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
    marginBottom: 2,
  },
  viralCta: {
    fontSize: 12,
    fontFamily: font.sans.bold,
    color: colors.primary,
    letterSpacing: -0.12,
  },

  // CTA section
  ctaSection: {
    backgroundColor: colors.surfaceCard,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: layout.screenPaddingH,
    paddingTop: 14,
    gap: 10,
  },
  ctaButton: {
    borderRadius: radius.full,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    fontSize: 15,
    fontFamily: font.sans.bold,
    color: colors.white,
    letterSpacing: -0.15,
  },
  reportRow: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: font.sans.regular,
    color: colors.textMuted,
    alignSelf: "center",
  },
  reportLink: {
    fontSize: 12,
    fontFamily: font.sans.semiBold,
    color: colors.error,
    textDecorationLine: "underline",
    textDecorationStyle: "dotted",
  },

  // Report bottom sheet
  modalRoot: {
    flex: 1,
    backgroundColor: "rgba(48, 41, 80, 0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surfaceCard,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: 16,
    paddingTop: 12,
    boxShadow: "0 -4px 20px rgba(48, 41, 80, 0.08)",
    gap: 14,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceContainer,
    alignSelf: "center",
    marginBottom: 2,
  },
  sheetTitle: {
    fontSize: 17,
    fontFamily: font.sans.bold,
    color: colors.textPrimary,
    letterSpacing: -0.34,
  },
  reportOptions: {
    gap: 8,
  },
  reportOption: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 14,
    gap: 12,
  },
  reportIconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  reportOptionBody: {
    flex: 1,
    gap: 2,
  },
  reportOptionTitle: {
    fontSize: 13,
    fontFamily: font.sans.semiBold,
    color: colors.textPrimary,
    letterSpacing: -0.13,
  },
  reportOptionSub: {
    fontSize: 11,
    fontFamily: font.sans.regular,
    color: colors.textMuted,
    lineHeight: 15,
  },
  cancelBtn: {
    backgroundColor: colors.surfaceContainer,
    borderRadius: radius.full,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: font.sans.semiBold,
    color: colors.textSecondary,
    letterSpacing: -0.14,
  },
});
