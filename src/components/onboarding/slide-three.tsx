/**
 * Slide 3 — "Your Evidence Trail"
 * Dark hero with animated delivery timeline and green "Let's go" CTA.
 */
import {
  colors,
  font,
  gradients,
  layout,
  onboardingColors,
  radius,
  shadows,
  type as t,
} from "@/src/constants/tokens";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { SlideProps } from "./types";

// ── Data ─────────────────────────────────────────────────────────────────────

type TimelineStatus = "done" | "active" | "pending";

interface TimelineItem {
  status: TimelineStatus;
  icon: string;
  label: string;
  meta: string;
  tag?: { label: string; variant: "proof" | "live" };
}

const TIMELINE: TimelineItem[] = [
  {
    status: "done",
    icon: "✓",
    label: "Order Created",
    meta: "Today · 11:02 AM",
    tag: { label: "📸 Item photo saved", variant: "proof" },
  },
  {
    status: "done",
    icon: "✓",
    label: "Rider Picked Up",
    meta: "Today · 11:34 AM · Yaba, Lagos",
    tag: { label: "📍 GPS logged", variant: "proof" },
  },
  {
    status: "active",
    icon: "🚴",
    label: "In Transit",
    meta: "Now · En route to Lekki",
    tag: { label: "● Live updating", variant: "live" },
  },
  {
    status: "pending",
    icon: "○",
    label: "Delivered",
    meta: "Waiting...",
  },
  {
    status: "pending",
    icon: "○",
    label: "Confirmed by Customer",
    meta: "Waiting...",
  },
];

const ITEM_DELAYS = [100, 300, 500, 700, 850];

// ── Helpers ───────────────────────────────────────────────────────────────────

function dotColors(status: TimelineStatus): { bg: string; border?: string } {
  if (status === "done")
    return {
      bg: onboardingColors.tlDotDoneBg,
      border: onboardingColors.tlDotDoneBorder,
    };
  if (status === "pending")
    return {
      bg: onboardingColors.tlDotPendingBg,
      border: onboardingColors.tlDotPendingBorder,
    };
  return { bg: "transparent" };
}

function labelColor(status: TimelineStatus) {
  if (status === "done") return onboardingColors.tlLabelDone;
  if (status === "active") return onboardingColors.tlLabelActive;
  return onboardingColors.tlLabelPending;
}

function metaColor(status: TimelineStatus) {
  if (status === "done") return onboardingColors.tlMetaDone;
  if (status === "active") return onboardingColors.tlMetaActive;
  return onboardingColors.tlMetaPending;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TimelineDot({ status }: { status: TimelineStatus }) {
  const dc = dotColors(status);

  if (status === "active") {
    return (
      <LinearGradient
        colors={gradients.primary as unknown as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.dot, { ...shadows.fab }]}
      >
        <Text style={{ fontSize: 12 }}>🚴</Text>
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.dot,
        {
          backgroundColor: dc.bg,
          borderWidth: dc.border ? 1.5 : 0,
          borderColor: dc.border,
          alignItems: "center",
          justifyContent: "center",
        },
      ]}
    >
      <Text
        style={{
          fontSize: status === "done" ? 11 : 10,
          color: onboardingColors.tlLabelDone,
        }}
      >
        {status === "done" ? "✓" : "○"}
      </Text>
    </View>
  );
}

function TagBadge({ tag }: { tag: NonNullable<TimelineItem["tag"]> }) {
  const bg =
    tag.variant === "proof"
      ? onboardingColors.tlProofTagBg
      : onboardingColors.tlLiveTagBg;
  const text =
    tag.variant === "proof"
      ? onboardingColors.tlProofTagText
      : onboardingColors.tlLiveTagText;
  const border =
    tag.variant === "proof"
      ? onboardingColors.tlProofTagBorder
      : onboardingColors.tlLiveTagBorder;

  return (
    <View
      style={{
        alignSelf: "flex-start",
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 4,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: radius.full,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: border,
      }}
    >
      <Text
        style={[
          t.capsSm,
          {
            color: text,
            textTransform: "none",
            fontSize: 10,
            letterSpacing: 0,
          },
        ]}
      >
        {tag.label}
      </Text>
    </View>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SlideThree({ isActive }: SlideProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const t0 = useSharedValue(0);
  const t1 = useSharedValue(0);
  const t2 = useSharedValue(0);
  const t3 = useSharedValue(0);
  const t4 = useSharedValue(0);
  const content = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      [t0, t1, t2, t3, t4].forEach((sv, i) => {
        sv.value = withDelay(ITEM_DELAYS[i], withTiming(1, { duration: 400 }));
      });
      content.value = withDelay(200, withTiming(1, { duration: 350 }));
    } else {
      [t0, t1, t2, t3, t4, content].forEach((sv) => {
        sv.value = 0;
      });
    }
  }, [isActive]);

  const i0 = useAnimatedStyle(() => ({
    opacity: t0.value,
    transform: [
      {
        translateX: interpolate(
          t0.value,
          [0, 1],
          [-12, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));
  const i1 = useAnimatedStyle(() => ({
    opacity: t1.value,
    transform: [
      {
        translateX: interpolate(
          t1.value,
          [0, 1],
          [-12, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));
  const i2 = useAnimatedStyle(() => ({
    opacity: t2.value,
    transform: [
      {
        translateX: interpolate(
          t2.value,
          [0, 1],
          [-12, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));
  const i3 = useAnimatedStyle(() => ({
    opacity: t3.value,
    transform: [
      {
        translateX: interpolate(
          t3.value,
          [0, 1],
          [-12, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));
  const i4 = useAnimatedStyle(() => ({
    opacity: t4.value,
    transform: [
      {
        translateX: interpolate(
          t4.value,
          [0, 1],
          [-12, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const contentAnim = useAnimatedStyle(() => ({
    opacity: content.value,
    transform: [
      {
        translateY: interpolate(
          content.value,
          [0, 1],
          [20, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const itemAnims = [i0, i1, i2, i3, i4];

  return (
    <View style={{ width, height, backgroundColor: onboardingColors.darkBg }}>
      <LinearGradient
        colors={[onboardingColors.darkBgS3GradTop, onboardingColors.darkBg]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={["rgba(0, 135, 58, 0.12)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.7 }}
        style={[StyleSheet.absoluteFillObject, { height: height * 0.55 }]}
      />

      <View
        style={{
          position: "absolute",
          top: insets.top + 55,
          left: 0,
          right: 0,
          height: height * 0.5,
          paddingHorizontal: 28,
          justifyContent: "center",
        }}
      >
        {TIMELINE.map((item, i) => (
          <Animated.View
            key={item.label}
            style={[{ flexDirection: "row", gap: 16 }, itemAnims[i]]}
          >
            <View style={{ alignItems: "center", width: 28, flexShrink: 0 }}>
              <TimelineDot status={item.status} />
              {i < TIMELINE.length - 1 && (
                <View
                  style={{
                    width: 1.5,
                    flex: 1,
                    minHeight: 18,
                    marginVertical: 2,
                    backgroundColor:
                      item.status === "done"
                        ? onboardingColors.tlLineDone
                        : onboardingColors.tlLineDark,
                  }}
                />
              )}
            </View>

            <View
              style={{
                flex: 1,
                paddingBottom: i < TIMELINE.length - 1 ? 14 : 0,
              }}
            >
              <Text style={[t.labelSm, { color: labelColor(item.status) }]}>
                {item.label}
              </Text>
              <Text
                style={{
                  fontFamily: font.mono.regular,
                  fontSize: 11,
                  marginTop: 2,
                  color: metaColor(item.status),
                }}
              >
                {item.meta}
              </Text>
              {item.tag && <TagBadge tag={item.tag} />}
            </View>
          </Animated.View>
        ))}
      </View>

      <LinearGradient
        colors={["transparent", onboardingColors.darkBg]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: height * 0.44,
          zIndex: 5,
        }}
        pointerEvents="none"
      />

      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            paddingHorizontal: layout.screenPaddingH + 6,
            paddingBottom: insets.bottom + 92,
            zIndex: 10,
          },
          contentAnim,
        ]}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            alignSelf: "flex-start",
            gap: 6,
            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: radius.full,
            backgroundColor: onboardingColors.greenTagBg,
            borderWidth: 1,
            borderColor: onboardingColors.greenTagBorder,
            marginBottom: 12,
          }}
        >
          <View
            style={{
              width: 5,
              height: 5,
              borderRadius: radius.full,
              backgroundColor: onboardingColors.greenTagText,
            }}
          />
          <Text style={[t.capsSm, { color: onboardingColors.greenTagText }]}>
            Your Evidence Trail
          </Text>
        </View>

        <Text
          style={{
            fontSize: 26,
            fontWeight: "700",
            fontFamily: "DMSans_700Bold",
            letterSpacing: -0.78,
            lineHeight: 31,
            color: colors.white,
            marginBottom: 10,
          }}
        >
          Every delivery.{"\n"}Timestamped.{" "}
          <Text style={{ color: onboardingColors.accentGreen }}>Provable.</Text>
        </Text>

        <Text
          style={[
            t.bodyMd,
            {
              color: onboardingColors.subDark,
              lineHeight: 22,
            },
          ]}
        >
          GPS pings, photo uploads, and status events build an unbreakable
          record. Win every dispute.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    zIndex: 2,
  },
});
