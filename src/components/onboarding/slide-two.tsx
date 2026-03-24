/**
 * Slide 2 — "How It Works"
 * Light surface with animated actor cards showing the 3-actor flow.
 */
import {
  colors,
  font,
  layout,
  radius,
  shadows,
  type as t,
} from "@/src/constants/tokens";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { Text, useWindowDimensions, View } from "react-native";
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

interface Actor {
  icon: React.ComponentProps<typeof Feather>["name"];
  title: string;
  meta: string;
  statusLabel: string;
  iconBg: string;
  iconFg: string;
  statusBg: string;
  statusFg: string;
}

const ACTORS: Actor[] = [
  {
    icon: "briefcase",
    title: "Seller creates order",
    meta: "Item, customer, rider assigned",
    statusLabel: "Created",
    iconBg: colors.primarySoft,
    iconFg: colors.primary,
    statusBg: colors.infoBg,
    statusFg: colors.info,
  },
  {
    icon: "truck",
    title: "Rider in transit",
    meta: "Live location updates shared",
    statusLabel: "Transit",
    iconBg: colors.warningBg,
    iconFg: colors.warning,
    statusBg: colors.warningBg,
    statusFg: colors.warning,
  },
  {
    icon: "check-circle",
    title: "Customer sees delivered",
    meta: "Proof and timeline visible",
    statusLabel: "Done",
    iconBg: colors.successBg,
    iconFg: colors.success,
    statusBg: colors.successBg,
    statusFg: colors.success,
  },
];

const CARD_DELAYS = [100, 250, 400];
const CONN_DELAY = 550;

// ── Sub-components ────────────────────────────────────────────────────────────

function ActorCard({ actor }: { actor: Actor }) {
  return (
    <View
      style={{
        backgroundColor: colors.surfaceCard,
        borderRadius: radius.xl,
        padding: layout.cardPadding,
        paddingHorizontal: 14,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        ...shadows.card,
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: radius.lg,
          backgroundColor: actor.iconBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather name={actor.icon} size={16} color={actor.iconFg} />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 13,
            fontFamily: font.sans.bold,
            fontWeight: "700",
            letterSpacing: -0.13,
            color: colors.textPrimary,
            marginBottom: 2,
          }}
        >
          {actor.title}
        </Text>
        <Text
          style={{
            fontSize: 11,
            fontFamily: font.sans.regular,
            color: colors.textMuted,
          }}
        >
          {actor.meta}
        </Text>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 9,
          paddingVertical: 3,
          borderRadius: radius.full,
          backgroundColor: actor.statusBg,
        }}
      >
        <View
          style={{
            width: 5,
            height: 5,
            borderRadius: radius.full,
            backgroundColor: actor.statusFg,
          }}
        />
        <Text
          style={{
            fontSize: 10,
            fontFamily: font.sans.bold,
            fontWeight: "700",
            letterSpacing: 0.2,
            textTransform: "uppercase",
            color: actor.statusFg,
          }}
        >
          {actor.statusLabel}
        </Text>
      </View>
    </View>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SlideTwo({ isActive }: SlideProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const c0 = useSharedValue(0);
  const c1 = useSharedValue(0);
  const c2 = useSharedValue(0);
  const conn = useSharedValue(0);
  const content = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      [c0, c1, c2].forEach((sv, i) => {
        sv.value = withDelay(CARD_DELAYS[i], withTiming(1, { duration: 400 }));
      });
      conn.value = withDelay(CONN_DELAY, withTiming(1, { duration: 300 }));
      content.value = withDelay(200, withTiming(1, { duration: 350 }));
    } else {
      [c0, c1, c2, conn, content].forEach((sv) => {
        sv.value = 0;
      });
    }
  }, [isActive]);

  const a0 = useAnimatedStyle(() => ({
    opacity: c0.value,
    transform: [
      {
        translateX: interpolate(
          c0.value,
          [0, 1],
          [-16, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));
  const a1 = useAnimatedStyle(() => ({
    opacity: c1.value,
    transform: [
      {
        translateX: interpolate(
          c1.value,
          [0, 1],
          [-16, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));
  const a2 = useAnimatedStyle(() => ({
    opacity: c2.value,
    transform: [
      {
        translateX: interpolate(
          c2.value,
          [0, 1],
          [-16, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));
  const connAnim = useAnimatedStyle(() => ({ opacity: conn.value }));
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

  const cardAnims = [a0, a1, a2];

  return (
    <View style={{ width, height, backgroundColor: colors.surface }}>
      <View
        style={{
          position: "absolute",
          top: insets.top + 50,
          left: 0,
          right: 0,
          height: height * 0.5,
          paddingHorizontal: 20,
          justifyContent: "center",
        }}
      >
        {ACTORS.map((actor, i) => (
          <View key={`${actor.statusLabel}-${i}`}>
            <Animated.View style={cardAnims[i]}>
              <ActorCard actor={actor} />
            </Animated.View>

            {i < ACTORS.length - 1 && (
              <Animated.View
                style={[
                  {
                    alignItems: "center",
                    height: 12,
                    justifyContent: "center",
                  },
                  connAnim,
                ]}
              >
                <LinearGradient
                  colors={[colors.surfaceContainer, colors.primarySoft]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={{ width: 2, height: 12, borderRadius: 2 }}
                />
              </Animated.View>
            )}
          </View>
        ))}
      </View>

      {/* Thin fade — matches design's 100px s2-fade */}
      <LinearGradient
        colors={["transparent", colors.surface]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: "absolute",
          bottom: 120,
          left: 0,
          right: 0,
          height: 120,
          zIndex: 5,
        }}
        pointerEvents="none"
      />
      {/* Solid surface block under the fade so content bg is clean */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 120,
          backgroundColor: colors.surface,
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
            backgroundColor: colors.primarySoft,
            marginBottom: 12,
          }}
        >
          <View
            style={{
              width: 5,
              height: 5,
              borderRadius: radius.full,
              backgroundColor: colors.primary,
            }}
          />
          <Text style={[t.capsSm, { color: colors.primary }]}>
            How It Works
          </Text>
        </View>

        <Text
          style={{
            fontSize: 26,
            fontWeight: "700",
            fontFamily: "DMSans_700Bold",
            letterSpacing: -0.78,
            lineHeight: 31,
            color: colors.textPrimary,
            marginBottom: 10,
          }}
        >
          Three actors.{"\n"}
          <Text style={{ color: colors.primary }}>One smooth flow.</Text>
        </Text>

        <Text style={[t.bodyMd, { color: colors.textMuted, lineHeight: 22 }]}>
          Same card language as your dashboard: clear status, clear owner, clear
          next step.
        </Text>
      </Animated.View>
    </View>
  );
}
