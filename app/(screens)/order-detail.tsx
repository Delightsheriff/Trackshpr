/**
 * Order Detail screen — shows order status hero, progress steps, map (in_transit),
 * action buttons, order details, magic links, photo strip, and delivery timeline.
 * DS §8.1, §8.4, §8.8 — Feather icons, DM Sans / DM Mono fonts.
 * TODO: replace DUMMY_ORDERS_DETAIL with real Supabase query by id.
 */
import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Share } from "react-native";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/src/stores/themeStore";
import { layout, radius, font } from "@/src/constants/tokens";

// Components
import { StatusPill } from "@/src/components/home/status-pill";
import { Order, DUMMY_ORDERS_DETAIL } from "@/src/components/orders/order-types";
import { ProgressSteps, Step } from "@/src/components/orders/progress-steps";
import { DetailRow } from "@/src/components/orders/detail-row";
import { TimelineItem } from "@/src/components/orders/timeline-item";
import { ActionBtn } from "@/src/components/orders/action-btn";
import { MapSection } from "@/src/components/orders/map-section";
import { MagicLinkCard } from "@/src/components/orders/magic-link-card";

import { callPhone, copyLink, formatAmount } from "@/src/utils/helpers";

export default function OrderDetailScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const order: Order =
    DUMMY_ORDERS_DETAIL.find((o) => o.id === id) ?? DUMMY_ORDERS_DETAIL[0];

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

  const heroBg = isTransit
    ? colors.surfaceCard
    : isDelivered
      ? colors.successBg
      : colors.errorBg;

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

        <View
          style={[styles.heroCard, { backgroundColor: heroBg }, cardShadow]}
        >
          <View style={styles.heroStatusRow}>
            {isTransit && <StatusPill status="in_transit" />}
            {isDelivered && <StatusPill status="delivered" />}
            {isFailed && <StatusPill status="failed" />}
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

          <Text style={[styles.heroItemName, { color: colors.textPrimary }]}>
            {order.item}
          </Text>

          <Text style={[styles.heroAddress, { color: colors.textMuted }]}>
            {order.address}
          </Text>

          <ProgressSteps
            steps={progressSteps}
            lineColor={progressLineColor}
            lineWidth={progressLineWidth}
          />

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

        {isTransit && (
          <>
            <MapSection riderName={order.rider} />
          </>
        )}

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

        {(isTransit || isFailed) && <MagicLinkCard order={order} />}

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

  // Action buttons row (container)
  actionRow: {
    flexDirection: "row",
    paddingHorizontal: layout.screenPaddingH,
    paddingBottom: 14,
    gap: 8,
  },

  // Details card
  detailsCard: {
    marginHorizontal: layout.screenPaddingH,
    marginBottom: 14,
    borderRadius: radius.xl,
    paddingVertical: 4,
    paddingHorizontal: 16,
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
});
