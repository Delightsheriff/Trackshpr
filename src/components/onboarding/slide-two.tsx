/**
 * Slide 2 — "How It Works"
 * Light surface with animated actor cards showing the 3-actor flow.
 */
import {
  colors,
  layout,
  radius,
  shadows,
  type as t,
} from "@/src/constants/tokens";
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
  emoji: string;
  name: string;
  desc: string;
  badgeLabel: string;
  iconBg: string;
  badgeBg: string;
  badgeText: string;
}

const ACTORS: Actor[] = [
  {
    emoji: "🏪",
    name: "You — the Seller",
    desc: "Create a delivery in under 60 seconds",
    badgeLabel: "App",
    iconBg: colors.primarySoft,
    badgeBg: colors.primarySoft,
    badgeText: colors.primary,
  },
  {
    emoji: "🚴",
    name: "Your Rider",
    desc: "Gets a WhatsApp link — no app needed",
    badgeLabel: "Link",
    iconBg: colors.warningBg,
    badgeBg: colors.warningBg,
    badgeText: colors.warning,
  },
  {
    emoji: "👤",
    name: "Your Customer",
    desc: "Tracks live — stops messaging you",
    badgeLabel: "Tracks",
    iconBg: colors.successBg,
    badgeBg: colors.successBg,
    badgeText: colors.success,
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
        borderRadius: radius.card,
        padding: layout.cardPadding,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        ...shadows.actorCard,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 16,
          backgroundColor: actor.iconBg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 22 }}>{actor.emoji}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={[t.labelMd, { color: colors.textPrimary, marginBottom: 2 }]}
        >
          {actor.name}
        </Text>
        <Text style={[t.bodySm, { color: colors.textMuted, lineHeight: 17 }]}>
          {actor.desc}
        </Text>
      </View>

      <View
        style={{
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: radius.full,
          backgroundColor: actor.badgeBg,
        }}
      >
        <Text style={[t.labelXs, { color: actor.badgeText }]}>
          {actor.badgeLabel}
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
          <View key={actor.name}>
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

      <LinearGradient
        colors={["transparent", colors.surface]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: height * 0.42,
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
          Seller creates. Rider taps. Customer tracks. Two magic links do
          everything.
        </Text>
      </Animated.View>
    </View>
  );
}
