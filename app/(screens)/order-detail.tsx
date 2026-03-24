/**
 * Order Detail screen — shows order status hero, progress steps, map (in_transit),
 * action buttons, order details, magic links, photo strip, and delivery timeline.
 * DS §8.1, §8.4, §8.8 — Feather icons, DM Sans / DM Mono fonts.
 * TODO: replace DUMMY_ORDERS with real Supabase query by id.
 */
import { font, layout, radius } from "@/src/constants/tokens";
import { useTheme } from "@/src/stores/themeStore";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Dummy data — TODO: replace with real Supabase query ──────────────────────
const DUMMY_ORDERS = [
  {
    id: "1",
    orderId: "TRK-2847",
    item: "Adire Maxi Dress × 2",
    customer: "Amara Obi",
    customerPhone: "0801 234 5678",
    address: "14 Admiralty Way, Lekki Phase 1",
    rider: "Kunle Adeyemi",
    riderPhone: "0803 456 7890",
    amount: 35000,
    status: "in_transit" as const,
    riderToken: "a1b2c3d4",
    customerToken: "e5f6g7h8",
    createdAt: "10:58 AM",
    pickedUpAt: "11:34 AM",
    pickedUpLocation: "Yaba, Lagos",
    failureReason: null as string | null,
    deliveredAt: null as string | null,
    failedAt: null as string | null,
    elapsedLabel: "12m ago",
  },
  {
    id: "2",
    orderId: "TRK-2831",
    item: "Beaded Necklace Set",
    customer: "Chisom Eze",
    customerPhone: "0812 111 2233",
    address: "5 Bode Thomas, Surulere",
    rider: "Emeka Musa",
    riderPhone: "0812 345 6789",
    amount: 18500,
    status: "delivered" as const,
    riderToken: "b2c3d4e5",
    customerToken: "f6g7h8i9",
    createdAt: "10:48 AM",
    pickedUpAt: "11:02 AM",
    deliveredAt: "12:26 PM",
    failureReason: null,
    failedAt: null,
    pickedUpLocation: "Yaba, Lagos",
    elapsedLabel: "1h 24m total",
  },
  {
    id: "3",
    orderId: "TRK-2819",
    item: "Silk Scarf (Red)",
    customer: "Bisi Adeyemi",
    customerPhone: "0705 432 1098",
    address: "10 Allen Ave, Ikeja",
    rider: "Taiwo James",
    riderPhone: "0701 234 5678",
    amount: 22000,
    status: "failed" as const,
    riderToken: "c3d4e5f6",
    customerToken: "g7h8i9j0",
    createdAt: "9:14 AM",
    pickedUpAt: "9:48 AM",
    failedAt: "10:55 AM",
    failureReason: "Customer not available",
    deliveredAt: null,
    pickedUpLocation: "Yaba, Lagos",
    elapsedLabel: "3h ago",
  },
];

type Order = (typeof DUMMY_ORDERS)[0];

// ── Helpers ──────────────────────────────────────────────────────────────────
function callPhone(phone: string) {
  Linking.openURL("tel:" + phone.replace(/\s/g, ""));
}

function copyLink(url: string) {
  Share.share({ message: url });
}

function formatAmount(n: number) {
  return "₦" + n.toLocaleString("en-NG");
}

// ── Status Pill ──────────────────────────────────────────────────────────────
function StatusPill({
  label,
  fg,
  bg,
}: {
  label: string;
  fg: string;
  bg: string;
}) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <View style={[styles.pillDot, { backgroundColor: fg }]} />
      <Text style={[styles.pillText, { color: fg }]}>{label}</Text>
    </View>
  );
}

// ── Progress Steps ────────────────────────────────────────────────────────────
type StepState = "done" | "active" | "pending";

interface Step {
  label: string;
  state: StepState;
  icon: string;
}

function ProgressSteps({
  steps,
  lineColor,
  lineWidth,
}: {
  steps: Step[];
  lineColor: string;
  lineWidth: `${number}%`;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.progressContainer}>
      {/* Background track */}
      <View
        style={[
          styles.progressTrackBg,
          { backgroundColor: colors.surfaceContainer },
        ]}
      />
      {/* Filled track */}
      <View
        style={[
          styles.progressTrackFill,
          { backgroundColor: lineColor, width: lineWidth },
        ]}
      />
      {steps.map((step, i) => {
        const isDone = step.state === "done";
        const isActive = step.state === "active";
        return (
          <View key={i} style={styles.progressStep}>
            <View
              style={[
                styles.progressDot,
                isDone
                  ? {
                      backgroundColor: colors.success,
                      borderColor: colors.success,
                    }
                  : isActive
                    ? {
                        backgroundColor: colors.primarySoft,
                        borderColor: colors.primary,
                      }
                    : {
                        backgroundColor: colors.surfaceCard,
                        borderColor: colors.surfaceContainer,
                      },
              ]}
            >
              <Text
                style={[
                  styles.progressDotText,
                  isDone
                    ? { color: colors.white }
                    : isActive
                      ? { color: colors.primary }
                      : { color: colors.textMuted },
                ]}
              >
                {isDone ? "✓" : step.icon}
              </Text>
            </View>
            <Text
              style={[
                styles.progressLabel,
                isDone
                  ? {
                      color: colors.success,
                      fontFamily: font.sans.bold,
                      fontWeight: "600",
                    }
                  : isActive
                    ? {
                        color: colors.primary,
                        fontFamily: font.sans.bold,
                        fontWeight: "600",
                      }
                    : {
                        color: colors.textMuted,
                        fontFamily: font.sans.regular,
                      },
              ]}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

// ── Detail Row ────────────────────────────────────────────────────────────────
function DetailRow({
  label,
  value,
  valueStyle,
  mono,
  separator,
}: {
  label: string;
  value: string;
  valueStyle?: object;
  mono?: boolean;
  separator?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <>
      <View style={styles.detailRow}>
        <Text style={[styles.detailLabel, { color: colors.textMuted }]}>
          {label}
        </Text>
        <Text
          style={[
            mono ? styles.detailValueMono : styles.detailValue,
            { color: colors.textPrimary },
            valueStyle,
          ]}
        >
          {value}
        </Text>
      </View>
      {separator && (
        <View
          style={[
            styles.detailSep,
            { backgroundColor: colors.surfaceContainer },
          ]}
        />
      )}
    </>
  );
}

// ── Timeline Item ─────────────────────────────────────────────────────────────
type TLState = "done" | "active" | "error";
type TagType = "gps" | "photo" | null;

function TimelineItem({
  state,
  event,
  meta,
  tagType,
  tagLabel,
  hasLine,
  lineColor,
}: {
  state: TLState;
  event: string;
  meta: string;
  tagType?: TagType;
  tagLabel?: string;
  hasLine?: boolean;
  lineColor?: string;
}) {
  const { colors } = useTheme();
  const isDone = state === "done";
  const isError = state === "error";

  return (
    <View style={styles.tlItem}>
      {/* Spine */}
      <View style={styles.tlSpine}>
        <View
          style={[
            styles.tlDot,
            isDone
              ? {
                  backgroundColor: colors.successBg,
                  borderColor: colors.success,
                }
              : isError
                ? { backgroundColor: colors.errorBg, borderColor: colors.error }
                : {
                    backgroundColor: colors.primarySoft,
                    borderColor: colors.primary,
                  },
          ]}
        >
          {isDone ? (
            <Feather name="check" size={11} color={colors.success} />
          ) : isError ? (
            <Feather name="x" size={11} color={colors.error} />
          ) : (
            <Feather name="truck" size={11} color={colors.primary} />
          )}
        </View>
        {hasLine && (
          <View
            style={[
              styles.tlLine,
              { backgroundColor: lineColor ?? colors.surfaceContainer },
            ]}
          />
        )}
      </View>

      {/* Body */}
      <View style={styles.tlBody}>
        <Text
          style={[
            styles.tlEvent,
            { color: colors.textPrimary },
            isError && { color: colors.error },
          ]}
        >
          {event}
        </Text>
        <Text style={[styles.tlMeta, { color: colors.textMuted }]}>{meta}</Text>
        {tagType && tagLabel && (
          <View
            style={[
              styles.tlTag,
              tagType === "gps"
                ? { backgroundColor: colors.infoBg }
                : { backgroundColor: colors.warningBg },
            ]}
          >
            <Text
              style={[
                styles.tlTagText,
                tagType === "gps"
                  ? { color: colors.info }
                  : { color: colors.warning },
              ]}
            >
              {tagLabel}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ── Action Button ─────────────────────────────────────────────────────────────
function ActionBtn({
  icon,
  label,
  bg,
  fg,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  bg: string;
  fg: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.actionBtn, { backgroundColor: bg }]}
      onPress={onPress}
      android_ripple={{ color: fg, borderless: false }}
    >
      <Feather name={icon} size={16} color={fg} />
      <Text style={[styles.actionBtnLabel, { color: fg }]}>{label}</Text>
    </Pressable>
  );
}

// ── Map Placeholder (fallback if react-native-maps unavailable) ──────────────
function MapSection({ riderName }: { riderName: string }) {
  const { colors, isDark } = useTheme();
  // Try to import MapView — if not available, show fallback
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const {
      default: MapView,
      Marker,
      PROVIDER_DEFAULT,
    } = require("react-native-maps");
    return (
      <View
        style={[
          styles.mapContainer,
          { backgroundColor: colors.surfaceContainer },
        ]}
      >
        <MapView
          style={styles.mapView}
          provider={PROVIDER_DEFAULT}
          initialRegion={{
            latitude: 6.455,
            longitude: 3.3841,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={{ latitude: 6.455, longitude: 3.3841 }}
            title={`Rider: ${riderName}`}
          />
        </MapView>
        <View
          style={[styles.mapLabel, { backgroundColor: colors.surfaceCard }]}
        >
          <Text style={[styles.mapLabelText, { color: colors.textMuted }]}>
            Last known location
          </Text>
        </View>
      </View>
    );
  } catch {
    return (
      <View
        style={[
          styles.mapContainer,
          styles.mapFallback,
          { backgroundColor: colors.surfaceContainer },
        ]}
      >
        <View style={styles.mapFallbackRow}>
          <Feather name="map-pin" size={12} color={colors.textMuted} />
          <Text style={[styles.mapFallbackText, { color: colors.textMuted }]}>
            Map loading...
          </Text>
        </View>
      </View>
    );
  }
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function OrderDetailScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const order: Order = DUMMY_ORDERS.find((o) => o.id === id) ?? DUMMY_ORDERS[0];

  const isTransit = order.status === "in_transit";
  const isDelivered = order.status === "delivered";
  const isFailed = order.status === "failed";

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
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      };

  // ── Status hero config ───────────────────────────────────────────────────
  const heroBg = isTransit
    ? colors.surfaceCard
    : isDelivered
      ? colors.successBg
      : colors.errorBg;

  // ── Progress steps config ────────────────────────────────────────────────
  const progressSteps: Step[] = isTransit
    ? [
        { label: "Confirmed", state: "done", icon: "1" },
        { label: "Picked Up", state: "done", icon: "2" },
        { label: "Transit", state: "active", icon: "3" },
        { label: "Delivered", state: "pending", icon: "4" },
      ]
    : isDelivered
      ? [
          { label: "Confirmed", state: "done", icon: "1" },
          { label: "Picked Up", state: "done", icon: "2" },
          { label: "Transit", state: "done", icon: "3" },
          { label: "Delivered", state: "done", icon: "4" },
        ]
      : [
          { label: "Confirmed", state: "done", icon: "1" },
          { label: "Picked Up", state: "done", icon: "2" },
          { label: "Failed", state: "active", icon: "!" },
          { label: "Delivered", state: "pending", icon: "4" },
        ];

  const progressLineColor = isDelivered ? colors.success : colors.primary;
  const progressLineWidth = isTransit ? "66%" : isDelivered ? "100%" : "44%";

  return (
    <View style={[styles.root, { backgroundColor: colors.surface }]}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Inline Header ───────────────────────────────────────────── */}
        <View style={styles.header}>
          <Pressable
            style={[
              styles.headerBtn,
              { backgroundColor: colors.surfaceCard },
              cardShadow,
            ]}
            onPress={() => router.back()}
            hitSlop={8}
          >
            <Feather name="arrow-left" size={18} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            Order #{order.orderId}
          </Text>
          <Pressable
            style={[
              styles.headerBtn,
              { backgroundColor: colors.surfaceCard },
              cardShadow,
            ]}
            hitSlop={8}
          >
            <Text style={[styles.headerMore, { color: colors.textPrimary }]}>
              ⋯
            </Text>
          </Pressable>
        </View>

        {/* ── Status Hero Card ─────────────────────────────────────────── */}
        <View
          style={[styles.heroCard, { backgroundColor: heroBg }, cardShadow]}
        >
          {/* Status row */}
          <View style={styles.heroStatusRow}>
            {isTransit && (
              <StatusPill
                label="In Transit"
                fg={colors.info}
                bg={colors.infoBg}
              />
            )}
            {isDelivered && (
              <StatusPill
                label="Delivered"
                fg={colors.success}
                bg={colors.successBg}
              />
            )}
            {isFailed && (
              <StatusPill
                label="Failed"
                fg={colors.error}
                bg={colors.errorBg}
              />
            )}
            <Text
              style={[
                styles.heroElapsed,
                isDelivered
                  ? { color: colors.success }
                  : isFailed
                    ? { color: colors.error }
                    : { color: colors.textMuted },
              ]}
            >
              {order.elapsedLabel}
            </Text>
          </View>

          {/* Item name */}
          <Text style={[styles.heroItemName, { color: colors.textPrimary }]}>
            {order.item}
          </Text>

          {/* Address */}
          <Text style={[styles.heroAddress, { color: colors.textMuted }]}>
            {order.address}
          </Text>

          {/* Progress steps */}
          <ProgressSteps
            steps={progressSteps}
            lineColor={progressLineColor}
            lineWidth={progressLineWidth}
          />

          {/* Failed: failure reason box */}
          {isFailed && order.failureReason && (
            <View
              style={[styles.failureBox, { backgroundColor: colors.errorBg }]}
            >
              <Feather
                name="alert-triangle"
                size={14}
                color={colors.error}
                style={styles.failureIcon}
              />
              <View style={styles.failureBody}>
                <Text style={[styles.failureTitle, { color: colors.error }]}>
                  {order.failureReason}
                </Text>
                <Text
                  style={[styles.failureSub, { color: colors.textSecondary }]}
                >
                  Rider reported customer unreachable. Package returned to
                  sender.
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Failed: Retry CTA ────────────────────────────────────────── */}
        {isFailed && (
          <View
            style={[
              styles.retryShadowWrap,
              { backgroundColor: colors.warning, shadowColor: colors.warning },
            ]}
          >
            <Pressable
              style={styles.retryPressable}
              android_ripple={{
                color: "rgba(255,255,255,0.2)",
                borderless: false,
              }}
            >
              <LinearGradient
                colors={[colors.warning, "#E09112"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.retryGradient}
              >
                <View style={styles.retryContent}>
                  <Feather name="rotate-cw" size={14} color={colors.white} />
                  <Text style={[styles.retryText, { color: colors.white }]}>
                    Retry Delivery
                  </Text>
                </View>
              </LinearGradient>
            </Pressable>
          </View>
        )}

        {/* ── Action Buttons ───────────────────────────────────────────── */}
        <View style={styles.actionRow}>
          {isTransit && (
            <>
              <ActionBtn
                icon="link"
                label="Copy rider link"
                bg={colors.primarySoft}
                fg={colors.primary}
                onPress={() =>
                  copyLink("https://trk.sh/rider/" + order.riderToken)
                }
              />
              <ActionBtn
                icon="send"
                label="Share tracking"
                bg={colors.infoBg}
                fg={colors.info}
                onPress={() =>
                  Share.share({
                    message: "https://trk.sh/track/" + order.customerToken,
                  })
                }
              />
              <ActionBtn
                icon="phone"
                label="Call rider"
                bg={colors.successBg}
                fg={colors.success}
                onPress={() => callPhone(order.riderPhone)}
              />
              <ActionBtn
                icon="phone"
                label="Call customer"
                bg={colors.warningBg}
                fg={colors.warning}
                onPress={() => callPhone(order.customerPhone)}
              />
            </>
          )}
          {isDelivered && (
            <>
              <ActionBtn
                icon="file-text"
                label="Share receipt"
                bg={colors.infoBg}
                fg={colors.info}
                onPress={() =>
                  Share.share({ message: "https://trk.sh/receipt/" + order.id })
                }
              />
              <ActionBtn
                icon="refresh-cw"
                label="Retry order"
                bg={colors.primarySoft}
                fg={colors.primary}
                onPress={() => {}}
              />
              <ActionBtn
                icon="phone"
                label="Call customer"
                bg={colors.successBg}
                fg={colors.success}
                onPress={() => callPhone(order.customerPhone)}
              />
            </>
          )}
          {isFailed && (
            <>
              <ActionBtn
                icon="phone"
                label="Call customer"
                bg={colors.successBg}
                fg={colors.success}
                onPress={() => callPhone(order.customerPhone)}
              />
              <ActionBtn
                icon="phone"
                label="Call rider"
                bg={colors.successBg}
                fg={colors.success}
                onPress={() => callPhone(order.riderPhone)}
              />
              <ActionBtn
                icon="link"
                label="Rider link"
                bg={colors.primarySoft}
                fg={colors.primary}
                onPress={() =>
                  copyLink("https://trk.sh/rider/" + order.riderToken)
                }
              />
            </>
          )}
        </View>

        {/* ── Map (in_transit only) ────────────────────────────────────── */}
        {isTransit && (
          <>
            <MapSection riderName={order.rider} />
          </>
        )}

        {/* ── Order Details Card ───────────────────────────────────────── */}
        <View
          style={[
            styles.detailsCard,
            { backgroundColor: colors.surfaceCard },
            cardShadow,
          ]}
        >
          {isTransit && (
            <>
              <DetailRow label="Customer" value={order.customer} separator />
              <DetailRow
                label="Phone"
                value={order.customerPhone}
                mono
                separator
              />
              <DetailRow
                label="Delivery address"
                value={order.address}
                separator
              />
              <DetailRow label="Rider" value={order.rider} separator />
              <DetailRow
                label="Rider phone"
                value={order.riderPhone}
                mono
                separator
              />
              <DetailRow
                label="Amount to collect"
                value={formatAmount(order.amount)}
                mono
                valueStyle={{
                  color: colors.success,
                  fontSize: 16,
                  fontFamily: font.mono.medium,
                }}
              />
            </>
          )}
          {isDelivered && (
            <>
              <DetailRow label="Customer" value={order.customer} separator />
              <DetailRow label="Rider" value={order.rider} separator />
              <DetailRow
                label="Picked up"
                value={order.pickedUpAt}
                mono
                valueStyle={{ color: colors.success }}
                separator
              />
              <DetailRow
                label="Delivered"
                value={order.deliveredAt ?? "—"}
                mono
                valueStyle={{ color: colors.success }}
                separator
              />
              <DetailRow
                label="Amount collected"
                value={formatAmount(order.amount)}
                mono
                valueStyle={{ color: colors.success }}
              />
            </>
          )}
          {isFailed && (
            <>
              <DetailRow label="Customer" value={order.customer} separator />
              <DetailRow
                label="Phone"
                value={order.customerPhone}
                mono
                separator
              />
              <DetailRow label="Rider" value={order.rider} separator />
              <DetailRow
                label="Amount uncollected"
                value={formatAmount(order.amount)}
                mono
                valueStyle={{ color: colors.error }}
              />
            </>
          )}
        </View>

        {/* ── Magic Links (in_transit + failed) ───────────────────────── */}
        {(isTransit || isFailed) && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
              Magic Links
            </Text>
            <View
              style={[
                styles.magicCard,
                { backgroundColor: colors.surfaceCard },
                cardShadow,
              ]}
            >
              {/* Rider row */}
              <View style={styles.magicRow}>
                <View
                  style={[
                    styles.magicIcon,
                    { backgroundColor: colors.primarySoft },
                  ]}
                >
                  <Feather name="truck" size={14} color={colors.primary} />
                </View>
                <View style={styles.magicBody}>
                  <Text
                    style={[
                      styles.magicRowLabel,
                      { color: colors.textPrimary },
                    ]}
                  >
                    Rider link
                  </Text>
                  <Text
                    style={[styles.magicUrl, { color: colors.textMuted }]}
                    numberOfLines={1}
                  >
                    trk.sh/rider/{order.riderToken}
                  </Text>
                </View>
                <Pressable
                  style={[
                    styles.copyBtn,
                    { backgroundColor: colors.primarySoft },
                  ]}
                  onPress={() =>
                    copyLink("https://trk.sh/rider/" + order.riderToken)
                  }
                >
                  <Text style={[styles.copyBtnText, { color: colors.primary }]}>
                    Copy
                  </Text>
                </Pressable>
              </View>

              {/* Separator */}
              <View
                style={[
                  styles.detailSep,
                  { backgroundColor: colors.surfaceContainer },
                ]}
              />

              {/* Customer row */}
              <View style={styles.magicRow}>
                <View
                  style={[
                    styles.magicIcon,
                    { backgroundColor: colors.successBg },
                  ]}
                >
                  <Feather name="user" size={14} color={colors.success} />
                </View>
                <View style={styles.magicBody}>
                  <Text
                    style={[
                      styles.magicRowLabel,
                      { color: colors.textPrimary },
                    ]}
                  >
                    Customer tracking link
                  </Text>
                  <Text
                    style={[styles.magicUrl, { color: colors.textMuted }]}
                    numberOfLines={1}
                  >
                    trk.sh/track/{order.customerToken}
                  </Text>
                </View>
                <Pressable
                  style={[
                    styles.copyBtn,
                    { backgroundColor: colors.primarySoft },
                  ]}
                  onPress={() =>
                    copyLink("https://trk.sh/track/" + order.customerToken)
                  }
                >
                  <Text style={[styles.copyBtnText, { color: colors.primary }]}>
                    Copy
                  </Text>
                </Pressable>
              </View>
            </View>
          </>
        )}

        {/* ── Photo Strip (in_transit only) ───────────────────────────── */}
        {isTransit && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
              Item Photos
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoStrip}
            >
              <View
                style={[
                  styles.photoThumb,
                  { backgroundColor: colors.surfaceContainer },
                ]}
              >
                <Feather name="package" size={22} color={colors.textMuted} />
              </View>
              <View
                style={[
                  styles.photoThumb,
                  { backgroundColor: colors.surfaceContainer },
                ]}
              >
                <Feather
                  name="shopping-bag"
                  size={22}
                  color={colors.textMuted}
                />
              </View>
              <View
                style={[
                  styles.photoThumbAdd,
                  { backgroundColor: colors.primarySoft },
                ]}
              >
                <Text style={[styles.photoAdd, { color: colors.primary }]}>
                  +
                </Text>
              </View>
            </ScrollView>
          </>
        )}

        {/* ── Timeline ─────────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>
          {isDelivered ? "Delivery timeline" : "Timeline"}
        </Text>
        <View style={styles.timeline}>
          {isTransit && (
            <>
              <TimelineItem
                state="done"
                event="Order created"
                meta="Today · 10:58 AM"
                tagType="photo"
                tagLabel="Item photo saved"
                hasLine
                lineColor={colors.successBg}
              />
              <TimelineItem
                state="done"
                event="Rider picked up"
                meta="Today · 11:34 AM"
                tagType="gps"
                tagLabel="GPS: Yaba, Lagos"
                hasLine
                lineColor={colors.surfaceContainer}
              />
              <TimelineItem
                state="active"
                event="In transit"
                meta="Now · En route to Lekki"
                hasLine={false}
              />
            </>
          )}
          {isDelivered && (
            <>
              <TimelineItem
                state="done"
                event="Order created"
                meta="Today · 10:48 AM"
                hasLine
                lineColor={colors.successBg}
              />
              <TimelineItem
                state="done"
                event="Rider picked up"
                meta="Today · 11:02 AM"
                tagType="gps"
                tagLabel="GPS: Yaba, Lagos"
                hasLine
                lineColor={colors.successBg}
              />
              <TimelineItem
                state="done"
                event="In transit"
                meta="11:02 AM → 12:26 PM"
                hasLine
                lineColor={colors.successBg}
              />
              <TimelineItem
                state="done"
                event="Delivered"
                meta="Today · 12:26 PM"
                tagType="gps"
                tagLabel="GPS: Surulere"
                hasLine={false}
              />
            </>
          )}
          {isFailed && (
            <>
              <TimelineItem
                state="done"
                event="Order created"
                meta="Today · 9:14 AM"
                hasLine
                lineColor={colors.successBg}
              />
              <TimelineItem
                state="done"
                event="Rider picked up"
                meta="Today · 9:48 AM"
                hasLine
                lineColor={colors.successBg}
              />
              <TimelineItem
                state="error"
                event="Delivery failed"
                meta={`Today · 10:55 AM · ${order.failureReason ?? "Unknown reason"}`}
                hasLine={false}
              />
            </>
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
    justifyContent: "space-between",
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: 14,
  },
  headerBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.34,
  },
  headerMore: {
    fontSize: 18,
    lineHeight: 20,
  },

  // Hero card
  heroCard: {
    marginHorizontal: layout.screenPaddingH,
    marginBottom: 14,
    borderRadius: radius.card,
    padding: layout.cardPadding,
  },
  heroStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  heroElapsed: {
    fontSize: 10,
    fontFamily: font.mono.regular,
  },
  heroItemName: {
    fontSize: 18,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: -0.36,
    marginBottom: 4,
  },
  heroAddress: {
    fontSize: 12,
    fontFamily: font.sans.regular,
    marginBottom: 14,
  },

  // Failure reason
  failureBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 12,
    padding: 10,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  failureIcon: { marginTop: 1 },
  failureBody: { flex: 1 },
  failureTitle: {
    fontSize: 12,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    marginBottom: 2,
  },
  failureSub: {
    fontSize: 11,
    fontFamily: font.sans.regular,
    lineHeight: 15.4,
  },

  // Progress steps
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    marginBottom: 8,
  },
  progressTrackBg: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    height: 2,
    zIndex: 0,
  },
  progressTrackFill: {
    position: "absolute",
    top: 10,
    left: 10,
    height: 2,
    zIndex: 1,
    borderRadius: 2,
  },
  progressStep: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    zIndex: 2,
  },
  progressDot: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  progressDotText: {
    fontSize: 9,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
  progressLabel: {
    fontSize: 9,
    textAlign: "center",
    fontWeight: "500",
  },

  // Retry CTA
  retryShadowWrap: {
    marginHorizontal: layout.screenPaddingH,
    marginBottom: 14,
    borderRadius: radius.full,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  retryPressable: {
    borderRadius: radius.full,
    overflow: "hidden",
  },
  retryGradient: {
    paddingVertical: 14,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  retryText: {
    fontSize: 14,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
  retryContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  // Action buttons row
  actionRow: {
    flexDirection: "row",
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: 14,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    flexDirection: "column",
    alignItems: "center",
    gap: 5,
  },
  actionBtnLabel: {
    fontSize: 12,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    textAlign: "center",
  },

  // Map
  mapContainer: {
    marginHorizontal: layout.screenPaddingH,
    marginBottom: 14,
    borderRadius: 16,
    overflow: "hidden",
    height: 130,
    position: "relative",
  },
  mapView: { flex: 1 },
  mapFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  mapFallbackText: {
    fontSize: 14,
    fontFamily: font.sans.regular,
  },
  mapFallbackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  mapLabel: {
    position: "absolute",
    bottom: 8,
    right: 8,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  mapLabelText: {
    fontSize: 9,
    fontFamily: font.sans.regular,
  },

  // Details card
  detailsCard: {
    marginHorizontal: layout.screenPaddingH,
    marginBottom: 14,
    borderRadius: radius.xl,
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 10,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: font.sans.regular,
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  detailValueMono: {
    fontSize: 13,
    fontFamily: font.mono.regular,
    flex: 1,
    textAlign: "right",
  },
  detailSep: {
    height: 1,
  },

  // Section label
  sectionLabel: {
    fontSize: 10,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.1,
    textTransform: "uppercase",
    paddingHorizontal: layout.screenPaddingH,
    marginBottom: 10,
  },

  // Magic links card
  magicCard: {
    marginHorizontal: layout.screenPaddingH,
    marginBottom: 14,
    borderRadius: 16,
    padding: 12,
    paddingHorizontal: 14,
  },
  magicRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 4,
  },
  magicIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  magicBody: { flex: 1, minWidth: 0 },
  magicRowLabel: {
    fontSize: 12,
    fontFamily: font.sans.semiBold,
    fontWeight: "600",
    marginBottom: 2,
  },
  magicUrl: {
    fontSize: 10,
    fontFamily: font.mono.regular,
    maxWidth: 160,
  },
  copyBtn: {
    borderRadius: radius.full,
    paddingVertical: 5,
    paddingHorizontal: 12,
    flexShrink: 0,
  },
  copyBtnText: {
    fontSize: 11,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },

  // Photo strip
  photoStrip: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: 14,
  },
  photoThumb: {
    width: 72,
    height: 72,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  photoThumbAdd: {
    width: 72,
    height: 72,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(70,71,211,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoAdd: {
    fontSize: 20,
    fontFamily: font.sans.regular,
  },

  // Timeline
  timeline: {
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: 20,
  },
  tlItem: {
    flexDirection: "row",
    gap: 12,
  },
  tlSpine: {
    width: 24,
    alignItems: "center",
  },
  tlDot: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  tlDotText: {
    fontSize: 10,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },
  tlLine: {
    width: 1.5,
    height: 16,
    marginTop: 2,
  },
  tlBody: {
    flex: 1,
    paddingBottom: 14,
  },
  tlEvent: {
    fontSize: 12,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    marginBottom: 2,
  },
  tlMeta: {
    fontSize: 10,
    fontFamily: font.mono.regular,
  },
  tlTag: {
    alignSelf: "flex-start",
    borderRadius: radius.full,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginTop: 4,
  },
  tlTagText: {
    fontSize: 9,
    fontFamily: font.sans.bold,
    fontWeight: "700",
  },

  // Status pill
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: radius.full,
    gap: 4,
  },
  pillDot: { width: 5, height: 5, borderRadius: radius.full },
  pillText: {
    fontSize: 10,
    fontFamily: font.sans.bold,
    fontWeight: "700",
    letterSpacing: 0.2,
    textTransform: "uppercase",
  },
});
