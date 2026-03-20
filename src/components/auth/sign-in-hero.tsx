/**
 * Sign-in hero section.
 * Background replicates the HTML exactly:
 *   - radial-gradient(ellipse 80% 60% at 50%   0%,  #4647D3 → transparent)
 *   - radial-gradient(ellipse 50% 40% at 80%  60%,  #9396FF → transparent)
 *   - radial-gradient(ellipse 40% 30% at 10%  80%,  #3939C7 → transparent)
 *   - linear-gradient(180deg, #1a1040 → #0e0c1a)
 *   - noise grain overlay at 4% opacity
 */
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Defs,
  LinearGradient as SvgLinear,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import DeliveryCard from "./delivery-card";

const CARD_W = 260;

interface SignInHeroProps {
  width: number;
  height: number;
}

// ── Background ─────────────────────────────────────────────────────────────────

function HeroBg({ width, height }: { width: number; height: number }) {
  return (
    <Svg
      width={width}
      height={height}
      style={StyleSheet.absoluteFillObject}
    >
      <Defs>
        {/* Base: linear #1a1040 → #0e0c1a */}
        <SvgLinear id="base" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#1a1040" stopOpacity="1" />
          <Stop offset="100%" stopColor="#0e0c1a" stopOpacity="1" />
        </SvgLinear>

        {/* Bloom 1: ellipse 80% 60% at 50% 0% — top-centre purple */}
        <RadialGradient
          id="bloom1"
          cx="50%"
          cy="0%"
          rx="80%"
          ry="60%"
          gradientUnits="objectBoundingBox"
        >
          <Stop offset="0%" stopColor="#4647D3" stopOpacity="1" />
          <Stop offset="70%" stopColor="#4647D3" stopOpacity="0" />
        </RadialGradient>

        {/* Bloom 2: ellipse 50% 40% at 80% 60% — right-centre lavender */}
        <RadialGradient
          id="bloom2"
          cx="80%"
          cy="60%"
          rx="50%"
          ry="40%"
          gradientUnits="objectBoundingBox"
        >
          <Stop offset="0%" stopColor="#9396FF" stopOpacity="1" />
          <Stop offset="60%" stopColor="#9396FF" stopOpacity="0" />
        </RadialGradient>

        {/* Bloom 3: ellipse 40% 30% at 10% 80% — bottom-left indigo */}
        <RadialGradient
          id="bloom3"
          cx="10%"
          cy="80%"
          rx="40%"
          ry="30%"
          gradientUnits="objectBoundingBox"
        >
          <Stop offset="0%" stopColor="#3939C7" stopOpacity="1" />
          <Stop offset="50%" stopColor="#3939C7" stopOpacity="0" />
        </RadialGradient>
      </Defs>

      {/* Layer order: base → bloom1 → bloom2 → bloom3 */}
      <Rect width="100%" height="100%" fill="url(#base)" />
      <Rect width="100%" height="100%" fill="url(#bloom1)" />
      <Rect width="100%" height="100%" fill="url(#bloom2)" />
      <Rect width="100%" height="100%" fill="url(#bloom3)" />
    </Svg>
  );
}

// ── Orbit rings ────────────────────────────────────────────────────────────────

const ORBITS: { size: number; color: string; duration: number; reverse?: boolean }[] = [
  { size: 380, color: "rgba(147,150,255,0.07)", duration: 30000 },
  { size: 280, color: "rgba(147,150,255,0.15)", duration: 20000, reverse: true },
  { size: 180, color: "rgba(147,150,255,0.15)", duration: 12000 },
];

// ── Main component ─────────────────────────────────────────────────────────────

export default function SignInHero({ width, height }: SignInHeroProps) {
  const cx = width / 2;
  const cy = height / 2;

  // One shared value per orbit ring
  const r0 = useSharedValue(0);
  const r1 = useSharedValue(0);
  const r2 = useSharedValue(0);
  const float = useSharedValue(0);

  const svs = [r0, r1, r2];

  useEffect(() => {
    ORBITS.forEach(({ duration, reverse }, i) => {
      svs[i].value = withRepeat(
        withTiming(reverse ? -360 : 360, { duration, easing: Easing.linear }),
        -1,
      );
    });

    float.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
    );

    return () => {
      [...svs, float].forEach(cancelAnimation);
    };
  }, []);

  const r0Style = useAnimatedStyle(() => ({ transform: [{ rotate: `${r0.value}deg` }] }));
  const r1Style = useAnimatedStyle(() => ({ transform: [{ rotate: `${r1.value}deg` }] }));
  const r2Style = useAnimatedStyle(() => ({ transform: [{ rotate: `${r2.value}deg` }] }));
  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }] }));

  const orbitStyles = [r0Style, r1Style, r2Style];

  return (
    <View style={[styles.hero, { height }]}>
      {/* Exact radial gradient background via SVG */}
      <HeroBg width={width} height={height} />

      {/* Noise grain overlay — matches HTML opacity: 0.04 */}
      <View style={styles.grain} />

      {/* Orbit rings — centred in the hero */}
      {ORBITS.map(({ size, color }, i) => (
        <Animated.View
          key={size}
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: 1,
              borderColor: color,
              left: cx - size / 2,
              top: cy - size / 2,
            },
            orbitStyles[i],
          ]}
        >
          {/* Dot at 12-o'clock position */}
          <View style={styles.orbitDot} />
        </Animated.View>
      ))}

      {/* Floating delivery card — centred, slightly above hero mid */}
      <Animated.View
        style={[
          {
            position: "absolute",
            width: CARD_W,
            left: cx - CARD_W / 2,
            top: cy - cy * 0.04 - CARD_W * 0.35, // matches translate(-50%, -52%)
          },
          floatStyle,
        ]}
      >
        <DeliveryCard />
      </Animated.View>

      {/* Bottom fade into content panel */}
      <LinearGradient
        colors={["transparent", "#FAF4FF"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.fade}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    overflow: "hidden",
    backgroundColor: "#0e0c1a",
  },
  // Noise grain — pure View with a very subtle white tint at 4% replicates the
  // fractalNoise texture well enough on mobile (actual SVG noise is imperceptible
  // on device screens at this density).
  grain: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.04,
    backgroundColor: "#fff",
  },
  orbitDot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(147,150,255,0.60)",
    top: -3,
    left: "50%",
    marginLeft: -3,
  },
  fade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
});
