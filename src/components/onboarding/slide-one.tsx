/**
 * Slide 1 — "The Problem"
 * Dark hero with animated chat bubble scene.
 */
import {
  colors,
  font,
  layout,
  onboardingColors,
  radius,
  type as t,
} from "@/src/constants/tokens";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { SlideProps } from "./types";

// ── Data ─────────────────────────────────────────────────────────────────────

type BubbleVariant = "customer" | "seller" | "stressed";

interface Bubble {
  side: "left" | "right";
  variant: BubbleVariant;
  text: string;
  time: string;
}

const BUBBLES: Bubble[] = [
  {
    side: "left",
    variant: "customer",
    text: "Hi, my order has not arrived yet. Any update?",
    time: "2:14 PM",
  },
  {
    side: "right",
    variant: "seller",
    text: "I am checking with the rider now.",
    time: "2:17 PM",
  },
  {
    side: "left",
    variant: "stressed",
    text: "I already paid N35,000 and still have no update.",
    time: "2:31 PM",
  },
  {
    side: "right",
    variant: "seller",
    text: "I cannot reach the rider right now. Sorry about this.",
    time: "2:44 PM",
  },
  {
    side: "left",
    variant: "stressed",
    text: "Please cancel this. I cannot keep waiting.",
    time: "3:02 PM",
  },
];

const BUBBLE_DELAYS = [100, 250, 400, 550, 700];
const STAMP_DELAY = 900;

// ── Sub-components ────────────────────────────────────────────────────────────

function BubbleView({ bubble }: { bubble: Bubble }) {
  const isSeller = bubble.variant === "seller";
  const isStressed = bubble.variant === "stressed";

  if (isSeller) {
    return (
      <View style={{ maxWidth: "75%" }}>
        <LinearGradient
          colors={[
            onboardingColors.bubbleSellerGradStart,
            onboardingColors.bubbleSellerGradEnd,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.bubble,
            { borderRadius: 18, borderBottomRightRadius: radius.sm },
          ]}
        >
          <Text style={[t.bodySm, { color: colors.white, lineHeight: 18 }]}>
            {bubble.text}
          </Text>
          <Text
            style={[
              {
                fontFamily: font.mono.regular,
                fontSize: 10,
                marginTop: 3,
                color: onboardingColors.bubbleTimeText,
              },
            ]}
          >
            {bubble.time}
          </Text>
        </LinearGradient>
      </View>
    );
  }

  const bgColor = isStressed
    ? onboardingColors.bubbleStressedBg
    : onboardingColors.bubbleCustomerBg;
  const borderColor = isStressed
    ? onboardingColors.bubbleStressedBorder
    : onboardingColors.bubbleCustomerBorder;
  const textColor = isStressed
    ? onboardingColors.bubbleStressedText
    : colors.white;

  return (
    <View
      style={[
        styles.bubble,
        {
          backgroundColor: bgColor,
          borderWidth: 1,
          borderColor,
          borderRadius: 18,
          borderBottomLeftRadius: radius.sm,
          maxWidth: "75%",
        },
      ]}
    >
      <Text style={[t.bodySm, { color: textColor, lineHeight: 18 }]}>
        {bubble.text}
      </Text>
      <Text
        style={[
          {
            fontFamily: font.mono.regular,
            fontSize: 10,
            marginTop: 3,
            color: onboardingColors.bubbleTimeText,
          },
        ]}
      >
        {bubble.time}
      </Text>
    </View>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SlideOne({ isActive }: SlideProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const b0 = useSharedValue(0);
  const b1 = useSharedValue(0);
  const b2 = useSharedValue(0);
  const b3 = useSharedValue(0);
  const b4 = useSharedValue(0);
  const bStamp = useSharedValue(0);
  const bContent = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      const svs = [b0, b1, b2, b3, b4];
      svs.forEach((sv, i) => {
        sv.value = withDelay(
          BUBBLE_DELAYS[i],
          withTiming(1, { duration: 400 }),
        );
      });
      bStamp.value = withDelay(
        STAMP_DELAY,
        withSpring(1, { damping: 10, stiffness: 200 }),
      );
      bContent.value = withDelay(200, withTiming(1, { duration: 350 }));
    } else {
      [b0, b1, b2, b3, b4, bStamp, bContent].forEach((sv) => {
        sv.value = 0;
      });
    }
  }, [b0, b1, b2, b3, b4, bContent, bStamp, isActive]);

  const a0 = useAnimatedStyle(() => ({
    opacity: b0.value,
    transform: [
      {
        translateY: interpolate(b0.value, [0, 1], [10, 0], Extrapolation.CLAMP),
      },
    ],
  }));
  const a1 = useAnimatedStyle(() => ({
    opacity: b1.value,
    transform: [
      {
        translateY: interpolate(b1.value, [0, 1], [10, 0], Extrapolation.CLAMP),
      },
    ],
  }));
  const a2 = useAnimatedStyle(() => ({
    opacity: b2.value,
    transform: [
      {
        translateY: interpolate(b2.value, [0, 1], [10, 0], Extrapolation.CLAMP),
      },
    ],
  }));
  const a3 = useAnimatedStyle(() => ({
    opacity: b3.value,
    transform: [
      {
        translateY: interpolate(b3.value, [0, 1], [10, 0], Extrapolation.CLAMP),
      },
    ],
  }));
  const a4 = useAnimatedStyle(() => ({
    opacity: b4.value,
    transform: [
      {
        translateY: interpolate(b4.value, [0, 1], [10, 0], Extrapolation.CLAMP),
      },
    ],
  }));

  const stampAnim = useAnimatedStyle(() => ({
    opacity: bStamp.value,
    transform: [
      {
        scale: interpolate(bStamp.value, [0, 1], [0.3, 1], Extrapolation.CLAMP),
      },
      {
        rotate: `${interpolate(bStamp.value, [0, 1], [-20, 0], Extrapolation.CLAMP)}deg`,
      },
    ],
  }));

  const contentAnim = useAnimatedStyle(() => ({
    opacity: bContent.value,
    transform: [
      {
        translateY: interpolate(
          bContent.value,
          [0, 1],
          [20, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const animStyles = [a0, a1, a2, a3, a4];

  return (
    <View style={{ width, height, backgroundColor: onboardingColors.darkBg }}>
      <LinearGradient
        colors={[onboardingColors.darkBgGradientTop, onboardingColors.darkBg]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={["rgba(70, 71, 211, 0.45)", "transparent"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
        style={[StyleSheet.absoluteFillObject, { height: height * 0.6 }]}
      />

      <View
        style={{
          position: "absolute",
          top: insets.top + 60,
          left: 0,
          right: 0,
          height: height * 0.48,
          paddingHorizontal: 20,
          gap: 10,
          justifyContent: "center",
        }}
      >
        {BUBBLES.map((bubble, i) => (
          <Animated.View
            key={i}
            style={[
              {
                flexDirection: "row",
                justifyContent:
                  bubble.side === "left" ? "flex-start" : "flex-end",
              },
              animStyles[i],
            ]}
          >
            <BubbleView bubble={bubble} />
          </Animated.View>
        ))}

        <Animated.View
          style={[
            {
              position: "absolute",
              bottom: 12,
              right: 28,
              width: 52,
              height: 52,
              borderRadius: radius.full,
              backgroundColor: "rgba(220, 38, 38, 0.15)",
              borderWidth: 2,
              borderColor: "rgba(220, 38, 38, 0.40)",
              alignItems: "center",
              justifyContent: "center",
            },
            stampAnim,
          ]}
        >
          <Feather name="alert-triangle" size={20} color="#FCA5A5" />
        </Animated.View>
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
          height: height * 0.45,
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
            backgroundColor: onboardingColors.darkTagBg,
            borderWidth: 1,
            borderColor: onboardingColors.darkTagBorder,
            marginBottom: 12,
          }}
        >
          <View
            style={{
              width: 5,
              height: 5,
              borderRadius: radius.full,
              backgroundColor: onboardingColors.darkTagText,
            }}
          />
          <Text style={[t.capsSm, { color: onboardingColors.darkTagText }]}>
            The Problem
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
          No delivery updates{"\n"}means lost{" "}
          <Text style={{ color: onboardingColors.accentPurple }}>trust</Text>
        </Text>

        <Text
          style={[
            t.bodyMd,
            { color: onboardingColors.subDark, lineHeight: 22 },
          ]}
        >
          Customers should not have to chase updates. Trackshpr gives real-time
          visibility from dispatch to delivery.
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    padding: 10,
    paddingHorizontal: 14,
  },
});
